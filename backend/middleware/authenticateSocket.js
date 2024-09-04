const firebaseAdmin = require("firebase-admin");
const User = require("../models/User"); // Update path to your User model

const authenticateSocket = async (socket, next) => {
	console.log("Authenticating socket connection...");
	try {
		const token = socket.handshake.auth.token || socket.handshake.query.token;
		if (!token) {
			console.log("No token provided");
			return next(new Error("Authentication error: No token provided"));
		}

		const decodedToken = await firebaseAdmin.auth().verifyIdToken(token);
		console.log(decodedToken, "token when socket auth");

		// Fetch the user from MongoDB using the uid from Firebase
		const user = await User.findOne({ firebaseUid: decodedToken.uid }); // Adjust based on your schema

		if (!user) {
			console.log("User not found");
			return next(new Error("Authentication error: User not found"));
		}

		socket.userId = user._id; // Set MongoDB user _id
		socket.user = user; // Optionally store the full user document
		next();
	} catch (error) {
		console.error("Authentication error:", error.message);
		next(new Error("Authentication error: " + error.message));
	}
};

module.exports = authenticateSocket;
