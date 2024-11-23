const Bot = require("../models/Bot");
const Message = require("../models/Message");
const User = require("../models/User");
const { checkMessageRateLimit, getRemainingLimit } = require("../services/rateLimiter");
const authenticateSocket = require("./authenticateSocket");
const cacheManager = require("../services/cacheManager");
const { handleBotInteraction } = require("../services/botService");
const checkBotMention = require("../utils/checkBotMention");
const onlineUsers = new Set();
const userSessions = new Map(); // Map to track user sessions
const sessionTimers = {}; // Object to manage inactivity timers
let botsList = [];
let usersList = [];

const loadBots = async () => {
	botsList = await Bot.find();
	usersList = await User.find();
};

const getBotsAndUsers = () => {
	const onlineUsersList = [];
	const offlineUsersList = [];
	
	const botsWithStatus = botsList.map((bot) => ({
		...bot.toObject(),
		status: "online",
	}));

	for (const user of usersList) {
		const userWithStatus = {
			...user.toObject(),
			status: onlineUsers.has(user.id) ? "online" : "offline",
		};
		if (userWithStatus.status === "online") {
			onlineUsersList.push(userWithStatus);
		} else {
			offlineUsersList.push(userWithStatus);
		}
	}

	const combinedList = [...botsWithStatus, ...onlineUsersList, ...offlineUsersList];

	return combinedList;
};

const socketHandlers = async (io) => {
	io.use(authenticateSocket);
	await loadBots();

	io.on("connection", (socket) => {
		console.log(socket.user.username, " connected");

		const userId = socket.userId;
		if (!userId) {
			console.error("User ID missing in socket connection.");
			socket.disconnect();
			return;
		}

		// Add user to online users
		if (!onlineUsers.has(userId)) {
			onlineUsers.add(userId);
			io.emit("updateUser", {
				user: { ...socket.user.toObject(), status: "online" },
			});

			socket.broadcast.emit("updateUser", {
				alert: { type: "success", text: `${socket.user.username} is online` },
			});

			loadBots().then(() => {
				io.emit("updateBotsAndUsers", { data: getBotsAndUsers() });
			});
		}

		// Handle initial bots and users request
		socket.on("getInitialBotsAndUsers", () => {
			const combinedList = getBotsAndUsers();
			socket.emit("initialBotsAndUsersList", combinedList);
		});

		// Handle initial messages request
		socket.on("getInitialMessages", async () => {
			try {
				const messages = await Message.find()
					.sort({ createdAt: 1 })
					.limit(50)
					.populate({
						path: "sender",
						refPath: "senderType", // Explicitly specify the refPath
					})
					.exec();

				const updatedMessages = messages.map((message) => {
					// Determine the sender's status based on onlineUsers or if the sender is a bot
					const senderStatus =
						onlineUsers.has(message.sender.id) || message.sender.isBot
							? "online"
							: "offline";

					// Return the message with the sender's status
					return {
						...message.toObject(),
						sender: {
							...message.sender.toObject(),
							status: senderStatus,
						},
					};
				});

				socket.emit("initialMessages", updatedMessages);
			} catch (error) {
				console.error("Error fetching initial messages:", error);
				socket.emit("error", { message: "Failed to fetch initial messages" });
			}
		});

		// Handle chat messages
		socket.on("chatMessage", async (data) => {
			try {
				if (socket.user.isBanned) {
					socket.emit("error", { message: "You are banned and cannot send messages." });
					return;
				}

				const isWithinLimit = await checkMessageRateLimit(userId);

				if (!isWithinLimit) {
					const remaining = await getRemainingLimit(userId);
					socket.emit("error", {
						message: "Rate limit exceeded. Please wait before sending more messages.",
						remainingMessages: remaining,
					});
					return;
				}

				const message = new Message({
					sender: userId,
					senderType: "User",
					content: data.text,
					room: data.room,
					isGlobal: !data.text.startsWith("@"),
				});

				await message.save();

				io.emit("message", {
					...message.toObject(),
					sender: { ...socket.user.toObject(), status: "online" },
				});

				// Update context cache with user's message
				await cacheManager.updateContextCache(userId, data.room, {
					role: "user",
					content: data.text,
				});

				// Reset inactivity timer
				resetSessionTimer(userId, data.room);

				// Handle bot mentions
				const { status, bot } = checkBotMention(data.text, botsList);

				if (status) {
					try {
						io.emit("botTyping", { botName: bot.username, isTyping: true });

						// Retrieve context messages
						const cachedContext = await cacheManager.getContextCache(userId, data.room);

						// Call bot interaction with context messages
						const botResponse = await handleBotInteraction(
							bot,
							data.text,
							data.room,
							cachedContext.messages
						);

						io.emit("botTyping", { botName: bot.username, isTyping: false });

						if (botResponse) {
							io.emit("message", botResponse);

							// Update context cache with bot's response
							await cacheManager.updateContextCache(userId, data.room, {
								role: "assistant",
								content: botResponse.content,
							});

							// Reset inactivity timer
							resetSessionTimer(userId, data.room);
						}
					} catch (error) {
						console.error("Error handling bot interaction:", error);
						socket.emit("error", {
							message: `Error processing bot response`,
							details: error.message,
						});
					}
				}
			} catch (error) {
				console.error("Error handling chat message:", error);
				socket.emit("error", {
					message: "Error processing message",
					details: error.message,
				});
			}
		});

		// When a user disconnects, remove them from the online users
		socket.on("disconnect", async () => {
			console.log(socket.user.username, " disconnected");
			if (onlineUsers.has(userId)) {
				onlineUsers.delete(userId);

				socket.broadcast.emit("updateUser", {
					alert: { type: "error", text: `${socket.user.username} is offline` },
					user: { ...socket.user.toObject(), status: "offline" },
				});
			}
		});
	});

	// Error handling for WebSocket connection
	io.on("connect_error", (err) => {
		console.log(`connect_error due to ${err.message}`);
	});

	// Function to reset the inactivity timer
	function resetSessionTimer(userId, room) {
		const sessionKey = `${userId}:${room}`;

		// Store the current room for the user session
		userSessions.set(userId, room);

		// Clear existing timer if it exists
		if (sessionTimers[sessionKey]) {
			clearTimeout(sessionTimers[sessionKey]);
		}

		// Set new inactivity timer
		sessionTimers[sessionKey] = setTimeout(async () => {
			await endSession(userId, room);
			delete sessionTimers[sessionKey];
			userSessions.delete(userId);
		}, process.env.SESSION_TIMEOUT);
	}

	// Function to end a session
	async function endSession(userId, room) {
		try {
			const context = await cacheManager.getContextCache(userId, room);
			if (context && context.messages && context.messages.length > 0) {
				const summary = await summarizeSession(context.messages);

				// Store the summary in MongoDB
				await SessionSummary.create({
					user: userId,
					room,
					summary,
				});

				// Clear the context cache
				await cacheManager.clearContextCache(userId, room);

				console.log(`Session ended and summarized for user ${userId} in room ${room}`);
			}
		} catch (error) {
			console.error(`Error ending session for user ${userId} in room ${room}:`, error);
		}
	}
};

module.exports = socketHandlers;
