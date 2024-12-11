const { admin } = require("../config/firebase");
const catchAsyncErrors = require("../middlewares/catchAsyncErrors");
const User = require("../models/User");
const ErrorHandler = require("../utils/errorHandler");
const getDataUri = require("../utils/getDataUri.js");
const cloudinary = require("cloudinary").v2;
const Message = require("../models/Message");
const mongoose = require("mongoose");

exports.getCurrentUser = catchAsyncErrors(async (req, res, next) => {
	const user = await User.findById(req.user.id);

	if (!user) {
		return next(new ErrorHandler("User not found", 404));
	}

	res.status(200).json({ success: true, user });
});

// Update Profile
exports.updateProfile = catchAsyncErrors(async (req, res, next) => {
	const { username, bio } = req.body;
	const userId = req.user.id;

	// Update user data
	const updatedUser = await User.findByIdAndUpdate(
		userId,
		{ username, bio },
		{ new: true, runValidators: true }
	);

	if (!updatedUser) {
		return next(new ErrorHandler("User not found", 404));
	}

	const userSocket = Array.from(req.io.sockets.sockets.values()).find(
		(socket) => socket.userId === req.user.id
	);

	if (userSocket) {
		userSocket.user = updatedUser;
	}

	req.io.emit("updateUser", {
		user: { ...updatedUser.toObject(), status: "online" },
	});

	res.status(200).json({
		success: true,
		user: updatedUser,
	});
});

exports.uploadProfilePic = catchAsyncErrors(async (req, res, next) => {
	if (!req.file) {
		return next(new ErrorHandler("Please upload an image", 400));
	}

	const pictureUri = getDataUri(req.file);

	const myCloud = await cloudinary.uploader.upload(pictureUri.content, {
		folder: "/chadbot/profilePic",
		crop: "scale",
	});

	if (req.user.profilePic && req.user.profilePic.public_id) {
		await cloudinary.uploader.destroy(req.user.profilePic.public_id);
	}

	req.user.profilePic.public_id = myCloud.public_id;
	req.user.profilePic.url = myCloud.secure_url;
	await req.user.save();

	const userSocket = Array.from(req.io.sockets.sockets.values()).find(
		(socket) => socket.userId === req.user.id
	);

	if (userSocket) {
		userSocket.user = req.user;
	}

	req.io.emit("updateUser", {
		user: { ...req.user.toObject(), status: "online" },
	});

	res.status(200).json({
		success: true,
		message: "Profile picture uploaded successfully",
		user: req.user,
	});
});

// delete user data
exports.deleteAccount = catchAsyncErrors(async (req, res, next) => {
	const user = req.user;

	if (user.profilePic && user.profilePic.public_id) {
		await cloudinary.uploader.destroy(user.profilePic.public_id);
	}

	await Message.deleteMany({ sender: user._id, senderType: "User" });
	await User.findByIdAndDelete(user.id);
	await admin.auth().deleteUser(user.firebaseUID);

	req.io.emit("deleteUser", {
		user,
	});

	// Respond with success
	res.status(200).json({
		success: true,
		message: "User account and related data deleted successfully, including Firebase data",
	});
});

// ban user by admin
exports.banAccountByAdmin = catchAsyncErrors(async (req, res, next) => {
	const id = req.params.id;

	if (!mongoose.Types.ObjectId.isValid(id)) {
		return next(new ErrorHandler("Invalid user ID", 400));
	}

	const user = await User.findById(id);
	if (!user) return next(new ErrorHandler("User not found", 404));

	if (user.isAdmin) {
		return next(new ErrorHandler("You can't ban an admin", 403));
	}

	if (user.isBanned) {
		return next(new ErrorHandler("User already banned", 400));
	}

	user.isBanned = true;
	await user.save();

	const bannedUserSocket = Array.from(req.io.sockets.sockets.values()).find(
		(socket) => socket.userId === id
	);

	if (bannedUserSocket) {
		bannedUserSocket.user = user;

		// Notify the banned user
		bannedUserSocket.emit("updateUser", {
			alert: { type: "error", text: "Your account has been banned" },
		});
	}

	req.io.emit("banUser", {
		user,
	});

	// Respond with success
	res.status(200).json({
		success: true,
		message: "User account Banned",
		user,
	});
});

// unban user by admin
exports.unBanAccountByAdmin = catchAsyncErrors(async (req, res, next) => {
	const id = req.params.id;

	if (!mongoose.Types.ObjectId.isValid(id)) {
		return next(new ErrorHandler("Invalid user ID", 400));
	}

	const user = await User.findById(id);
	if (!user) return next(new ErrorHandler("User not found", 404));

	if (user.isAdmin) {
		return next(new ErrorHandler("You can't unban an admin", 403));
	}

	if (!user.isBanned) {
		return next(new ErrorHandler("User wasn't banned", 400));
	}

	user.isBanned = false;
	await user.save();

	const bannedUserSocket = Array.from(req.io.sockets.sockets.values()).find(
		(socket) => socket.userId === id
	);

	if (bannedUserSocket) {
		bannedUserSocket.user = user;

		// Notify the banned user
		bannedUserSocket.emit("updateUser", {
			alert: { type: "success", text: "Your account has been unBanned" },
		});
	}

	req.io.emit("unBanUser", {
		user,
	});

	// Respond with success
	res.status(200).json({
		success: true,
		message: "User account Unbanned",
		user,
	});
});

exports.deleteAccountByAdmin = catchAsyncErrors(async (req, res, next) => {
	const id = req.params.id;

	if (!mongoose.Types.ObjectId.isValid(id)) {
		return next(new ErrorHandler("Invalid user ID", 400));
	}

	const user = await User.findById(id);
	if (!user) return next(new ErrorHandler("User not found", 404));

	if (user.isAdmin) {
		return next(new ErrorHandler("You can't delete an admin", 403));
	}

	if (user.profilePic && user.profilePic.public_id) {
		await cloudinary.uploader.destroy(user.profilePic.public_id);
	}

	await Message.deleteMany({ sender: user._id, senderType: "User" });
	await User.findByIdAndDelete(user.id);
	await admin.auth().deleteUser(user.firebaseUID);

	req.io.emit("deleteUser", {
		user,
	});

	// Respond with success
	res.status(200).json({
		success: true,
		message: "User account and related data deleted successfully, including Firebase data",
	});
});

// Get all users by admin with pagination
exports.getAllUsers = catchAsyncErrors(async (req, res, next) => {
	// Parse page and limit from query params, with defaults
	const page = parseInt(req.query.page, 10) || 1; // Default page is 1
	const limit = parseInt(req.query.limit, 10) || 10; // Default limit is 10

	// Calculate the starting index for pagination
	const skip = (page - 1) * limit;

	// Fetch users with pagination
	const totalUsers = await User.countDocuments(); // Get the total number of users
	const users = await User.find().skip(skip).limit(limit).sort({ createdAt: -1 }); // Optional: Sort by creation date

	// Calculate the total number of pages
	const totalPages = Math.ceil(totalUsers / limit);

	// Respond with paginated results
	res.status(200).json({
		success: true,
		users,
		currentPage: page,
		totalPages,
		totalUsers,
	});
});
