const { admin } = require("../config/firebase");
const catchAsyncErrors = require("../middlewares/catchAsyncErrors");
const User = require("../models/User");
const ErrorHandler = require("../utils/errorHandler");
const jwt = require("jsonwebtoken");

// register
exports.register = catchAsyncErrors(async (req, res, next) => {
	const { username, photoURL: url } = req.body;
	const firebaseToken = req.headers.authorization.split("Bearer ")[1];

	if (!firebaseToken) {
		return next(new ErrorHandler("Firebase Token not found", 404));
	}

	if (!username) {
		return next(new ErrorHandler("Username required", 400));
	}

	// Verify Firebase token
	const decodedToken = await admin.auth().verifyIdToken(firebaseToken);

	// Create user in MongoDB
	const user = await User.create({
		email: decodedToken.email,
		firebaseUID: decodedToken.uid,
		username,
		profilePic: {
			url,
		},
	});

	// Generate JWT
	const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, {
		expiresIn: "7d",
	});

	res.status(201).json({
		success: true,
		token,
		user,
	});
});

// login
exports.login = catchAsyncErrors(async (req, res, next) => {
	const firebaseToken = req.headers.authorization.split("Bearer ")[1];

	if (!firebaseToken) {
		return next(new ErrorHandler("Firebase Token not found", 404));
	}

	// Verify Firebase token
	const decodedToken = await admin.auth().verifyIdToken(firebaseToken);

	const user = await User.findOne({ firebaseUID: decodedToken.uid });

	if (!user) {
		return next(new ErrorHandler("User not found", 404));
	}

	// Generate JWT
	const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, {
		expiresIn: "7d",
	});

	res.json({ token });
});

// google login
exports.googleLogin = catchAsyncErrors(async (req, res, next) => {
	const { photoURL: url } = req.body;
	const firebaseToken = req.headers.authorization.split("Bearer ")[1];

	if (!firebaseToken) {
		return next(new ErrorHandler("Firebase Token not found", 404));
	}

	// Verify Firebase token
	const decodedToken = await admin.auth().verifyIdToken(firebaseToken);

	// Check if user exists in MongoDB
	let user = await User.findOne({ firebaseUID: decodedToken.uid });

	// Create a new user if they don't already exist
	if (!user) {
		user = await User.create({
			email: decodedToken.email,
			firebaseUID: decodedToken.uid,
			username: decodedToken.name || decodedToken.email.split("@")[0],
			profilePic: { url },
		});
	}

	// Generate JWT for session management
	const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, {
		expiresIn: "7d",
	});

	res.status(200).json({
		success: true,
		token,
		user,
	});
});

// Refresh JWT
exports.refreshToken = catchAsyncErrors(async (req, res, next) => {
	const firebaseToken = req.headers.authorization.split("Bearer ")[1];

	if (!firebaseToken) {
		return next(new ErrorHandler("Firebase Token not found", 404));
	}

	// Verify Firebase token
	const decodedToken = await admin.auth().verifyIdToken(firebaseToken);

	// Check if user exists in MongoDB
	const user = await User.findOne({ firebaseUID: decodedToken.uid });

	if (!user) {
		return next(new ErrorHandler("User not found", 404));
	}

	// Generate a new JWT
	const newJWTToken = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, {
		expiresIn: "7d",
	});

	// Send new JWT back to client
	res.status(200).json({ token: newJWTToken });
});
