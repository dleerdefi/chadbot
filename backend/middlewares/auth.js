const jwt = require("jsonwebtoken");
const ErrorHandler = require("../utils/errorHandler");
const User = require("../models/User");
const catchAsyncErrors = require("./catchAsyncErrors");

const authenticated = catchAsyncErrors(async (req, res, next) => {
	const authHeader = req.headers.authorization;

	if (!authHeader || !authHeader.startsWith("Bearer ")) {
		return next(new ErrorHandler("Authorization token missing", 401));
	}

	const token = authHeader.split("Bearer ")[1];

	if (!token || token === "" || token === "null") {
		return next(new ErrorHandler("Unauthorized", 401));
	}

	// Verify JWT
	const decoded = jwt.verify(token, process.env.JWT_SECRET);

	// Find the user by ID from the decoded token payload
	const user = await User.findById(decoded.id);

	if (!user) {
		return next(new ErrorHandler("User not found", 404));
	}

	// Attach user to the request for access in later middleware/routes
	req.user = user;

	next();
});

// Middleware to check if user is an admin
const isAdmin = (req, res, next) => {
	// Check if the user exists and has admin privileges
	if (!req.user || !req.user.isAdmin) {
		return next(new ErrorHandler("Access denied: Admins only", 403));
	}

	next();
};

module.exports = { authenticated, isAdmin };
