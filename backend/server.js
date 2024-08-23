const path = require("path");
const express = require("express");
const session = require("express-session");
const mongoose = require("mongoose");
const cors = require("cors");
const admin = require("firebase-admin");
const { checkMessageRateLimit, getRemainingLimit } = require("./rateLimiter");
const User = require("./models/User");
const Message = require("./models/Message");
const isAdmin = require("./middleware/isAdmin");
const bots = require("./bots");
const http = require("http");
const socketIo = require("socket.io");
const authenticateSocket = require("./middleware/authenticateSocket");
const { spawn } = require("child_process");
const redis = require("redis");
const nodemailer = require("nodemailer");
const { upload } = require("./uploadConfig");

// Environment variables
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGO_URI;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5000";
const REDIS_URL = process.env.REDIS_URL;

const onlineUsers = new Set();
const botUsers = new Set();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
	cors: {
		origin: FRONTEND_URL,
		methods: ["GET", "POST"],
		allowedHeaders: ["Content-Type", "Authorization"],
		credentials: true,
	},
});

// Create a map of lowercase bot names to their full names
const botNameMap = bots.reduce((map, bot) => {
	map[bot.username.toLowerCase()] = bot.username;
	return map;
}, {});

const botNames = bots.map((bot) => bot.username);

// const botNames = ['RossJeffries', 'JohnSinn', 'NeilStrauss', 'Mystery', /* any other bot names */];

// Redis client setup
const redisClient = redis.createClient({ url: REDIS_URL });
redisClient.on("error", (err) => console.error("Redis error:", err));

const maxRequestsPerDay = 10; // Define the limit here

app.use(
	cors({
		origin: FRONTEND_URL || "http://localhost:5000",
		credentials: true,
	})
);
app.use(express.json());
app.use(express.static(path.join(__dirname, "../frontend/build")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use((req, res, next) => {
	res.setHeader(
		"Content-Security-Policy",
		"script-src 'self' 'unsafe-inline' https://apis.google.com; frame-src 'self' https://accounts.google.com;"
	);
	next();
});

app.use(
	session({
		secret: process.env.JWT_SECRET,
		resave: false,
		saveUninitialized: true,
	})
);

const globalMessageCache = [];
const MAX_GLOBAL_MESSAGES = 50;

function addToGlobalCache(message) {
	globalMessageCache.push({
		user: message.user.username,
		text: message.text,
	});
	if (globalMessageCache.length > MAX_GLOBAL_MESSAGES) {
		globalMessageCache.shift();
	}
}

async function connectToMongoDB() {
	try {
		await mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
		console.log("MongoDB connected successfully");
		await initializeBotUsers();
	} catch (err) {
		console.error("MongoDB connection error:", err);
		process.exit(1);
	}
}

async function initializeBotUsers() {
	try {
		const bots = await User.find({ isBot: true });
		bots.forEach((bot) => {
			botUsers.add(bot._id.toString());
			onlineUsers.add(bot._id.toString());
		});
		console.log("Bot users initialized:", Array.from(botUsers));
	} catch (error) {
		console.error("Error initializing bot users:", error);
	}
}

if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
	const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
	admin.initializeApp({
		credential: admin.credential.cert(serviceAccount),
	});
} else {
	console.warn("Firebase Admin SDK is not configured. Some features may not work.");
}

const transporter = nodemailer.createTransport({
	service: "Gmail",
	auth: {
		user: process.env.EMAIL,
		pass: process.env.EMAIL_PASSWORD,
	},
});

const sendVerificationEmail = (email, verificationLink) => {
	const mailOptions = {
		from: process.env.EMAIL,
		to: email,
		subject: "Email Verification",
		text: `Click the link to verify your email: ${verificationLink}`,
	};

	transporter.sendMail(mailOptions, (error, info) => {
		if (error) {
			console.error("Error sending email:", error);
		} else {
			console.log("Email sent:", info.response);
		}
	});
};

const tokenCache = new Map();

const authenticateFirebaseToken = async (req, res, next) => {
	console.log("Authenticating Firebase token");
	const { authorization } = req.headers;

	if (!authorization || !authorization.startsWith("Bearer ")) {
		console.log("No token provided");
		return res.status(401).json({ error: "Unauthorized: No token provided" });
	}

	const token = authorization.split("Bearer ")[1];

	try {
		let decodedToken;
		if (tokenCache.has(token)) {
			decodedToken = tokenCache.get(token);
		} else {
			console.log("Verifying token...");
			decodedToken = await admin.auth().verifyIdToken(token);
			tokenCache.set(token, decodedToken);
			setTimeout(() => tokenCache.delete(token), 3600000); // Cache for 1 hour
		}

		console.log("Token verified successfully");
		req.user = decodedToken;

		// Fetch user from MongoDB
		const user = await User.findOne({ firebaseUid: decodedToken.uid });
		if (user) {
			req.user = { ...req.user, ...user.toObject() };
		}

		next();
	} catch (error) {
		console.error("Token verification failed:", error);
		if (error.code === "auth/id-token-expired") {
			return res.status(401).json({ error: "Token expired", code: "TOKEN_EXPIRED" });
		}
		res.status(401).json({ error: "Unauthorized: Invalid token", details: error.message });
	}
};

// WebSocket handling
io.use(authenticateSocket);

const userSockets = new Map(); // Map to store user socket connections by firebaseUid

io.on("connection", (socket) => {
	console.log("New client connected");

	// Store the user's socket ID when they connect
	const userId = socket.userId; // Assuming you set this during authentication
	if (userId && !botUsers.has(userId)) {
		userSockets.set(userId, socket.id);
		onlineUsers.add(userId);
		io.emit("userStatusUpdate", { userId, status: "online" });
	}

	// Handle request for initial online users
	socket.on("getInitialOnlineUsers", async () => {
		try {
			const allOnlineUsers = new Set([...onlineUsers, ...botUsers]);
			socket.emit("initialOnlineUsers", Array.from(allOnlineUsers));
			console.log("Sent initial online users:", Array.from(allOnlineUsers));
		} catch (error) {
			console.error("Error fetching initial online users:", error);
			socket.emit("error", { message: "Failed to fetch online users" });
		}
	});

	socket.on("getInitialMessages", async () => {
		try {
			const messages = await Message.find()
				.sort({ createdAt: -1 })
				.limit(50)
				.populate("user", "username profilePic");

			const formattedMessages = messages.map((message) => ({
				id: message._id.toString(),
				text: message.text,
				user: message.user
					? {
							_id: message.user._id.toString(),
							name: message.user.username,
							profilePic: message.user.profilePic,
					  }
					: null,
				createdAt: message.createdAt,
			}));

			socket.emit("initialMessages", formattedMessages);
		} catch (error) {
			console.error("Error fetching initial messages:", error);
			socket.emit("error", { message: "Failed to fetch initial messages" });
		}
	});

	socket.on("chatMessage", async (data) => {
		try {
			const user = await User.findOne({ firebaseUid: socket.userId });
			if (!user) {
				socket.emit("error", { message: "User not found" });
				return;
			}

			if (user.isBanned) {
				socket.emit("error", { message: "You are banned and cannot send messages." });
				return;
			}

			const isWithinLimit = await checkMessageRateLimit(socket.userId);
			if (!isWithinLimit) {
				const remaining = await getRemainingLimit(socket.userId);
				socket.emit("error", {
					message: "Rate limit exceeded. Please wait before sending more messages.",
					remainingMessages: remaining,
				});
				return;
			}

			const message = new Message({
				user: user._id,
				text: data.text,
				room: data.room,
				isGlobal: !data.text.startsWith("@"),
			});

			await message.save();

			const formattedMessage = {
				id: message._id.toString(),
				text: message.text,
				user: {
					_id: user._id.toString(),
					name: user.username,
					profilePic: user.profilePic,
				},
				createdAt: message.createdAt,
				room: message.room,
			};

			io.emit("message", formattedMessage);

			// Bot handling code
			const botMention = data.text.match(/@(\w+)/);
			if (botMention) {
				const mentionedName = botMention[1];
				const botName = botNameMap[mentionedName.toLowerCase()];

				if (botName) {
					io.emit("botTyping", { botName: botName, isTyping: true });

					const botPrompt = data.text
						.replace(new RegExp(`@${botMention[1]}`, "i"), "")
						.trim();

					const pythonProcess = spawn("python", [
						path.join(__dirname, "rag_service.py"),
						botPrompt,
						botName,
					]);

					let responseData = "";

					pythonProcess.stdout.on("data", (data) => {
						responseData += data.toString();
					});

					pythonProcess.stderr.on("data", (data) => {
						console.error(`Python Error: ${data}`);
					});

					pythonProcess.on("close", async (code) => {
						io.emit("botTyping", { botName: botName, isTyping: false });

						if (code !== 0) {
							console.error("Failed to get response from RAG service");
							socket.emit("error", {
								message: "Failed to get response from RAG service",
							});
							return;
						}
						try {
							const { response } = JSON.parse(responseData);

							let botUser = await User.findOne({ username: botName });
							if (!botUser) {
								botUser = new User({
									username: botName,
									email: `${botName.toLowerCase()}@example.com`,
									isBot: true,
									firebaseUid: `bot_${botName.toLowerCase()}`,
								});
								await botUser.save();
							}

							const botMessage = new Message({
								user: botUser._id,
								text: response,
								room: data.room,
							});
							await botMessage.save();

							const formattedBotMessage = {
								id: botMessage._id.toString(),
								text: botMessage.text,
								user: {
									_id: botUser._id.toString(),
									name: botUser.username,
									profilePic: "/default-bot-avatar.png",
									isBot: true,
								},
								createdAt: botMessage.createdAt,
								room: botMessage.room,
							};

							io.emit("message", formattedBotMessage);
						} catch (error) {
							console.error("Error parsing RAG service response:", error);
							console.error("Raw response data:", responseData);
							socket.emit("error", {
								message: "Error processing bot response",
								details: error.message,
							});
						}
					});
				}
			}
		} catch (error) {
			console.error("Error handling chat message:", error);
			socket.emit("error", { message: "Error processing message", details: error.message });
		}
	});

	socket.on("disconnect", () => {
		console.log("Client disconnected");
		if (userId) {
			onlineUsers.delete(userId);
			userSockets.delete(userId);
			io.emit("userStatusUpdate", { userId, status: "offline" });
		}
	});
});

// Error handling for WebSocket
io.on("connect_error", (err) => {
	console.log(`connect_error due to ${err.message}`);
});

app.post("/register", async (req, res) => {
	const { email, username, password } = req.body;
	console.log("Received registration request for:", email);
	try {
		let user = await User.findOne({ email });
		console.log("Existing user in MongoDB:", user);
		if (user) {
			return res.status(400).json({ error: "User already exists" });
		}

		const userRecord = await admin.auth().createUser({
			email,
			password,
			emailVerified: false,
		});
		console.log("User created in Firebase:", userRecord.uid);

		user = new User({
			email,
			username,
			firebaseUid: userRecord.uid,
		});
		const savedUser = await user.save();
		console.log("User saved to MongoDB:", savedUser);

		const verificationLink = await admin.auth().generateEmailVerificationLink(email);
		sendVerificationEmail(email, verificationLink);

		res.status(201).json({
			message: "User registered. Please check your email to verify your account.",
		});
	} catch (err) {
		console.error("Registration error:", err);
		res.status(500).json({ error: "Error registering user", details: err.message });
	}
});

app.post("/login", async (req, res) => {
	const { email } = req.body;
	console.log("Received login request for:", email);
	try {
		let user = await User.findOne({ email });
		console.log("User found in MongoDB:", user);
		if (!user) {
			console.log("User not found in MongoDB, checking Firebase");
			const firebaseUser = await admin.auth().getUserByEmail(email);
			if (firebaseUser) {
				console.log("User found in Firebase, creating in MongoDB");
				user = new User({
					email,
					firebaseUid: firebaseUser.uid,
					username: email.split("@")[0],
				});
				const savedUser = await user.save();
				console.log("User created in MongoDB during login:", savedUser);
			} else {
				console.log("User not found in Firebase");
				return res.status(404).json({ error: "User not found" });
			}
		}
		res.json(user);
	} catch (error) {
		console.error("Login error:", error);
		res.status(500).json({ error: "Error logging in", details: error.message });
	}
});

app.post("/api/ban-user-by-username", authenticateFirebaseToken, isAdmin, async (req, res) => {
	const { username } = req.body;
	try {
		const user = await User.findOneAndUpdate(
			{ username: username },
			{ isBanned: true },
			{ new: true }
		);
		if (!user) {
			return res.status(404).json({ success: false, message: "User not found" });
		}

		// Delete all messages from the banned user
		await Message.deleteMany({ user: user._id });

		// Emit system message
		io.emit("systemMessage", {
			text: `User ${username} has been banned by an admin. All their messages have been removed.`,
		});

		// Emit userBanned event
		io.to(user.firebaseUid).emit("userBanned", { userId: user._id, username: user.username });

		res.json({
			success: true,
			message: `User ${username} has been banned and their messages have been deleted`,
			user,
		});
	} catch (error) {
		console.error("Error banning user:", error);
		res.status(500).json({
			success: false,
			message: "Failed to ban user",
			error: error.message,
		});
	}
});

app.delete("/api/messages/:id", authenticateFirebaseToken, isAdmin, async (req, res) => {
	const messageId = req.params.id;
	if (!mongoose.Types.ObjectId.isValid(messageId)) {
		return res.status(400).json({ error: "Invalid message ID" });
	}

	try {
		const deletedMessage = await Message.findByIdAndDelete(messageId);
		if (!deletedMessage) {
			return res.status(404).json({ error: "Message not found" });
		}

		// Emit deletion event to all clients
		io.emit("messageDeleted", messageId);

		res.status(200).json({ message: "Message deleted successfully" });
	} catch (error) {
		console.error("Error deleting message:", error);
		res.status(500).json({ error: "Failed to delete message" });
	}
});

app.delete("/api/delete-account", authenticateFirebaseToken, async (req, res) => {
	try {
		const firebaseUid = req.user.uid;

		// Find the user in MongoDB using the Firebase UID
		const user = await User.findOne({ firebaseUid: firebaseUid });

		if (!user) {
			return res.status(404).json({ error: "User not found" });
		}

		// Delete user's messages using the MongoDB _id
		await Message.deleteMany({ user: user._id });

		// Delete user from MongoDB
		await User.findByIdAndDelete(user._id);

		// Delete user from Firebase
		await admin.auth().deleteUser(firebaseUid);

		res.json({ message: "Account deleted successfully" });
	} catch (error) {
		console.error("Error deleting account:", error);
		res.status(500).json({ error: "Failed to delete account", details: error.message });
	}
});

app.get("/logout", (req, res) => {
	req.session.destroy((err) => {
		if (err) {
			return res.status(500).json({ error: "Could not log out, please try again" });
		}
		res.redirect("/");
	});
});

app.get("/", (req, res) => {
	res.send("Welcome to the Chatbot Application");
});

app.get("/api/user/:id", authenticateFirebaseToken, isAdmin, async (req, res) => {
	try {
		const user = await User.findById(req.params.id);
		if (!user) {
			return res.status(404).json({ message: "User not found" });
		}
		res.json(user);
	} catch (error) {
		res.status(500).json({ message: "Error fetching user", error: error.message });
	}
});

app.get("/api/all-users", authenticateFirebaseToken, async (req, res) => {
	try {
		let users;
		if (req.user.isAdmin) {
			// Admins get full user details
			users = await User.find({}, "-password");
		} else {
			// Standard users get limited user details, including bio
			users = await User.find({}, "username profilePic isOnline bio email");
		}
		console.log("Fetched users:", users); // Add this line for debugging
		res.json(users);
	} catch (error) {
		console.error("Error fetching users:", error);
		res.status(500).json({ error: "Failed to fetch users", details: error.message });
	}
});

app.get("/api/bots", (req, res) => {
	console.log("Received request for bots");
	console.log("Bots:", bots); // This will help you see what 'bots' contains
	res.json(
		bots.map((bot) => ({
			name: bot.username,
			profilePic: bot.profilePic || "/default-bot-avatar.png",
			bio: bot.bio || bot.personality.split("\n")[1].trim() || "I am a chatbot.",
		}))
	);
});

app.get("/api/messages", authenticateFirebaseToken, async (req, res) => {
	console.log("Received request for messages");
	try {
		console.log("Fetching messages from database...");
		const messages = await Message.find()
			.sort({ createdAt: -1 })
			.limit(50)
			.populate("user", "username profilePic");
		console.log(`Found ${messages.length} messages`);
		res.json(
			messages.map((message) => ({
				id: message._id,
				text: message.text,
				user: {
					name: message.user ? message.user.username : "Unknown User",
					profilePic: message.user ? message.user.profilePic : "/default-avatar.png",
				},
				createdAt: message.createdAt,
			}))
		);
	} catch (error) {
		console.error("Error fetching messages:", error);
		res.status(500).json({ error: "Failed to fetch messages", details: error.message });
	}
});

app.get("/api/current_user", authenticateFirebaseToken, async (req, res) => {
	try {
		let user = await User.findOne({ firebaseUid: req.user.uid });
		if (user) {
			if (!user.username) {
				user.username = `User_${user._id.toString().slice(-5)}`;
				await user.save();
			}
			res.json(user);
		} else {
			user = new User({
				email: req.user.email,
				firebaseUid: req.user.uid,
				username: `User_${new mongoose.Types.ObjectId().toString().slice(-5)}`,
			});
			await user.save();
			res.json(user);
		}
	} catch (error) {
		res.status(500).json({ error: "Error fetching user", details: error.message });
	}
});

// Apply apiLimiter to a general API route
// app.get('/api/some-route', apiLimiter, (req, res) => {
// route handler
//});

// New RAG-based chat endpoint
app.post("/api/chat", authenticateFirebaseToken, async (req, res) => {
	const { message, botName } = req.body;

	try {
		const pythonProcess = spawn("python", [
			path.join(__dirname, "rag_service.py"),
			message,
			botName,
		]);

		let responseData = "";

		pythonProcess.stdout.on("data", (data) => {
			responseData += data.toString();
		});

		pythonProcess.stderr.on("data", (data) => {
			console.error(`Python Error: ${data}`);
		});

		pythonProcess.on("close", (code) => {
			if (code !== 0) {
				return res.status(500).json({ error: "Failed to get response from RAG service" });
			}
			try {
				const { response } = JSON.parse(responseData);
				res.json({ response });
			} catch (error) {
				res.status(500).json({ error: "Failed to parse response from RAG service" });
			}
		});
	} catch (error) {
		console.error("Error in chatbot route:", error);
		res.status(500).json({ error: "Internal server error" });
	}
});

app.post("/api/update-profile", authenticateFirebaseToken, async (req, res) => {
	const { username, bio } = req.body;
	try {
		console.log("Received update request:", req.body);
		const user = await User.findOneAndUpdate(
			{ firebaseUid: req.user.uid },
			{ username, bio },
			{ new: true }
		);
		if (user) {
			console.log("Updated user:", user);
			res.json({ message: "Profile updated successfully", user });
		} else {
			res.status(404).json({ error: "User not found" });
		}
	} catch (error) {
		console.error("Error updating profile:", error);
		res.status(500).json({ error: "Error updating profile", details: error.message });
	}
});

app.post(
	"/api/upload-profile-pic",
	authenticateFirebaseToken,
	upload.single("profilePic"),
	async (req, res) => {
		try {
			if (!req.file) {
				return res.status(400).json({ error: "No file uploaded" });
			}
			const user = await User.findOneAndUpdate(
				{ firebaseUid: req.user.uid },
				{ profilePic: `/uploads/${req.file.filename}` },
				{ new: true }
			);
			if (user) {
				res.json({
					message: "Profile picture uploaded successfully",
					profilePicUrl: user.profilePic,
				});
			} else {
				res.status(404).json({ error: "User not found" });
			}
		} catch (error) {
			console.error("Error uploading profile picture:", error);
			res.status(500).json({
				error: "Error uploading profile picture",
				details: error.message,
			});
		}
	}
);

const getBotResponse = async (botName, prompt) => {
	try {
		const bot = bots.find((b) => b.username.toLowerCase() === botName.toLowerCase());
		if (!bot) {
			throw new Error("Bot not found");
		}

		console.log(`Generating response for ${botName} with prompt: ${prompt}`);
		const response = await getRAGResponse(prompt, botName, bot.personality);

		console.log("Bot response:", response);
		return response;
	} catch (error) {
		console.error("Error generating bot response:", error.message);
		return "Sorry, I am unable to respond at the moment.";
	}
};

app.post("/api/messages", authenticateFirebaseToken, async (req, res) => {
	const { text } = req.body;
	console.log("Received message:", text);
	try {
		const isWithinLimit = await checkMessageRateLimit(req.user.uid);
		if (!isWithinLimit) {
			return res
				.status(429)
				.json({ error: "Rate limit exceeded. Please wait before sending more messages." });
		}

		const message = new Message({
			user: req.user._id, // Changed from user._id to req.user._id
			text: text,
		});

		await message.save();

		const botName = bots.find((bot) =>
			text.toLowerCase().includes(`@${bot.username.toLowerCase()}`)
		)?.username;
		console.log("Detected bot:", botName);

		if (botName) {
			io.emit("botTyping", { botName: botName, isTyping: true });
			console.log(`Message directed at bot: ${botName}`);
			const botPrompt = text.replace(new RegExp(`@${botName}`, "i"), "").trim();
			console.log("Bot prompt:", botPrompt);
			const botResponse = await getBotResponse(botName, botPrompt);
			console.log("Bot response:", botResponse);

			let botUser = await User.findOne({
				$or: [
					{ username: botName },
					{ username: botName.toLowerCase() },
					{ email: `${botName.toLowerCase()}@example.com` },
				],
			});
			if (!botUser) {
				botUser = new User({
					username: botName,
					email: `${botName.toLowerCase()}@example.com`,
					isBot: true,
					firebaseUid: `bot_${botName.toLowerCase()}`,
				});
				await botUser.save();
			}

			const botMessage = new Message({ user: botUser._id, text: botResponse });
			await botMessage.save();

			io.emit("botTyping", { botName: botName, isTyping: false });

			res.json([
				{
					id: message._id,
					text: message.text,
					user: { name: req.user.username, profilePic: req.user.profilePic }, // Changed from user to req.user
					createdAt: message.createdAt,
				},
				{
					id: botMessage._id,
					text: botMessage.text,
					user: { name: botUser.username, profilePic: "/default-bot-avatar.png" },
					createdAt: botMessage.createdAt,
				},
			]);
		} else {
			res.json([
				{
					id: message._id,
					text: message.text,
					user: { name: req.user.username, profilePic: req.user.profilePic }, // Changed from user to req.user
					createdAt: message.createdAt,
				},
			]);
		}

		// Emit the new message to all connected clients
		io.emit("message", {
			id: message._id,
			text: message.text,
			user: {
				_id: req.user._id,
				name: req.user.username,
				profilePic: req.user.profilePic,
			},
			createdAt: message.createdAt,
			room: message.room,
		});
	} catch (error) {
		console.error("Error posting message:", error);
		res.status(500).json({ error: "Error posting message", details: error.message });
	}
});

app.post("/api/make-admin", authenticateFirebaseToken, isAdmin, async (req, res) => {
	const { userId } = req.body;
	try {
		const user = await User.findByIdAndUpdate(userId, { isAdmin: true }, { new: true });
		res.json({ message: "User is now an admin", user });
	} catch (error) {
		res.status(500).json({ error: "Failed to update user", details: error.message });
	}
});

app.post("/api/ban-user", authenticateFirebaseToken, isAdmin, async (req, res) => {
	const { userId } = req.body;
	console.log("Attempting to ban user with ID:", userId);

	try {
		console.log("Searching for user in database...");
		const user = await User.findById(userId);
		console.log("User found:", user);
		if (!user) {
			console.log("User not found in database");
			return res.status(404).json({ success: false, message: "User not found" });
		}
		user.isBanned = true;
		await user.save();
		console.log("User banned successfully:", user);
		res.json({ success: true, message: "User has been banned", user });
	} catch (error) {
		console.error("Error in ban-user route:", error);
		res.status(500).json({
			success: false,
			message: "Failed to ban user",
			error: error.message,
		});
	}
});

app.post("/api/ban-user-by-username", authenticateFirebaseToken, isAdmin, async (req, res) => {
	const { username } = req.body;
	try {
		const user = await User.findOneAndUpdate(
			{ username: username },
			{ isBanned: true },
			{ new: true }
		);
		if (!user) {
			return res.status(404).json({ success: false, message: "User not found" });
		}
		io.emit("systemMessage", { text: `User ${username} has been banned by an admin.` });
		res.json({ success: true, message: `User ${username} has been banned`, user });
	} catch (error) {
		console.error("Error banning user:", error);
		res.status(500).json({
			success: false,
			message: "Failed to ban user",
			error: error.message,
		});
	}
});

app.post("/api/unban-user-by-username", authenticateFirebaseToken, isAdmin, async (req, res) => {
	const { username } = req.body;
	try {
		const user = await User.findOneAndUpdate(
			{ username: username },
			{ isBanned: false },
			{ new: true }
		);
		if (!user) {
			return res.status(404).json({ success: false, message: "User not found" });
		}
		io.emit("systemMessage", { text: `User ${username} has been unbanned by an admin.` });
		io.emit("userUnbanned", { userId: user._id, username: user.username });
		res.json({ success: true, message: `User ${username} has been unbanned`, user });
	} catch (error) {
		console.error("Error unbanning user:", error);
		res.status(500).json({
			success: false,
			message: "Failed to unban user",
			error: error.message,
		});
	}
});

app.get("*", (req, res) => {
	res.sendFile(path.join(__dirname, "../frontend/build/index.html"));
});

const setupRAG = async (botNames) => {
	return new Promise((resolve, reject) => {
		const pythonProcess = spawn("python", [
			path.join(__dirname, "rag_service.py"),
			JSON.stringify(botNames), // Pass botNames as a JSON string
		]);

		let responseData = "";

		pythonProcess.stdout.on("data", (data) => {
			responseData += data.toString();
		});

		pythonProcess.stderr.on("data", (data) => {
			console.error(`Python Error: ${data}`);
		});

		pythonProcess.on("close", (code) => {
			if (code !== 0) {
				reject(new Error("Failed to setup RAG service"));
			} else {
				try {
					const response = JSON.parse(responseData);
					resolve(response);
				} catch (error) {
					reject(new Error("Failed to parse response from RAG service"));
				}
			}
		});
	});
};

const startServer = async () => {
	try {
		console.log("Starting RAG setup...");
		await setupRAG(botNames);
		console.log("RAG setup completed successfully");

		await connectToMongoDB();

		if (REDIS_URL) {
			await redisClient.connect();
		} else {
			console.warn("REDIS_URL not provided. Running without Redis.");
		}

		server.listen(PORT, () => {
			console.log(`Server is running on port ${PORT}`);
			console.log(`Frontend URL: ${FRONTEND_URL}`);
		});
	} catch (error) {
		console.error("Failed to start server:", error);
		process.exit(1);
	}
};

startServer();
