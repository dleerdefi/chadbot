// server.js
const http = require("http");
const socketIo = require("socket.io");
const createApp = require("./app");
const connectDb = require("./config/connectDb");
const socketHandlers = require("./sockets/socketHandlers");
const initializeBots = require("./setup/initializeBots");

(async () => {
	try {
		// Database connection
		await connectDb();
		console.log("Database connected successfully");

		// Create HTTP server without app first
		const server = http.createServer();

		// Socket.io setup
		const io = socketIo(server, {
			cors: {
				origin: process.env.FRONTEND_URL || "http://localhost:5000",
				methods: ["GET", "POST"],
				allowedHeaders: ["Content-Type", "Authorization"],
				credentials: true,
			},
		});

		// Create app with io instance
		const app = createApp(io);

		// Attach app to server
		server.on("request", app);

		// run socket
		await socketHandlers(io);

		// upload bots in production server
		if (process.env.NODE_ENV === "production") {
			await initializeBots();
		}

		// Start server
		const PORT = process.env.PORT || 5000;
		server.listen(PORT, () => {
			console.log(`Server running on port ${PORT}`);
		});
	} catch (error) {
		console.error("Database connection failed:", error);
		process.exit(1);
	}
})();
