require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const { setupFirebase } = require("./config/firebase");
const errorMiddleware = require("./middlewares/errorMiddleware");
const initializeCloudinary = require("./config/cloudinary");
const userRoutes = require("./routes/userRoute");
const authRoutes = require("./routes/authRoute");
const botRoutes = require("./routes/botRoute");
const messageRoutes = require("./routes/messageRoute");

const createApp = (io) => {
	const app = express();

	// service initilization
	setupFirebase();
	initializeCloudinary();

	// Middleware
	app.use(express.json());
	app.use(
		cors({
			origin: process.env.FRONTEND_URL || "http://localhost:5000",
			credentials: true,
		})
	);

	// Attach io to req object
	if (io) {
		app.use((req, res, next) => {
			req.io = io;
			next();
		});
	}

	// Define routes
	app.use("/api", userRoutes);
	app.use("/api", authRoutes);
	app.use("/api", messageRoutes);
	app.use("/api", botRoutes);

	if (process.env.NODE_ENV === "production") {
		app.use(express.static(path.join(__dirname, "../frontend/dist")));
		app.get("*", (_, res) => {
			res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
		});
	}

	// error middleware
	app.use(errorMiddleware);

	return app;
};

module.exports = createApp;
