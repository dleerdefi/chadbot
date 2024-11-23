const jwt = require("jsonwebtoken");
const User = require("../models/User");

const authenticateSocket = async (socket, next) => {
	try {
		const token = socket.handshake.query.token; // Example: pass token in query params
		if (!token) throw new Error("Authentication token is missing");

		const decoded = jwt.verify(token, process.env.JWT_SECRET);
		const user = await User.findById(decoded.id);
		if (!user) throw new Error("User not found");

		socket.userId = user.id;
		socket.user = user;
		next();
	} catch (error) {
		console.error("Socket authentication error:", error);
		next(new Error("Authentication error"));
	}
};

module.exports = authenticateSocket;
