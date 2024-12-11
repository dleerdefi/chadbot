const catchAsyncErrors = require("../middlewares/catchAsyncErrors");
const Bot = require("../models/Bot");
const ErrorHandler = require("../utils/errorHandler");
const getDataUri = require("../utils/getDataUri.js");
const cloudinary = require("cloudinary").v2;
const Message = require("../models/Message");
const mongoose = require("mongoose");
const { loadBots } = require("../sockets/socketHandlers");

exports.getAllBots = catchAsyncErrors(async (req, res, next) => {
	// Parse page and limit from query params, with defaults
	const page = parseInt(req.query.page, 10) || 1; // Default page is 1
	const limit = parseInt(req.query.limit, 10) || 10; // Default limit is 10

	// Calculate the starting index for pagination
	const skip = (page - 1) * limit;

	// Fetch users with pagination
	const totalBots = await Bot.countDocuments(); // Get the total number of users
	const bots = await Bot.find().skip(skip).limit(limit).sort({ createdAt: -1 }); // Optional: Sort by creation date

	// Calculate the total number of pages
	const totalPages = Math.ceil(totalBots / limit);

	// Respond with paginated results
	res.status(200).json({
		success: true,
		bots,
		currentPage: page,
		totalPages,
		totalBots,
	});
});

exports.getBotDetails = catchAsyncErrors(async (req, res, next) => {
	if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
		return next(new ErrorHandler("Invalid bot ID", 400));
	}

	const bot = await Bot.findById(req.params.id);

	if (!bot) {
		return next(new ErrorHandler("Bot not found", 404));
	}

	res.status(200).json({
		success: true,
		bot,
	});
});

exports.createNewBot = catchAsyncErrors(async (req, res, next) => {
	const { username, botRole, botType, bio, botPersonality } = req.body;

	if (
		!username ||
		typeof username !== "string" ||
		username.trim().length === 0 ||
		/\s/.test(username.trim())
	) {
		return next(new ErrorHandler("Please provide a valid username", 400));
	}

	if (!botRole || typeof botRole !== "string" || botRole.trim().length === 0) {
		return next(new ErrorHandler("Please provide a valid bot role", 400));
	}

	if (!botType || typeof botType !== "string" || botType.trim().length === 0) {
		return next(new ErrorHandler("Please provide a valid bot type", 400));
	}

	if (!bio || typeof bio !== "string" || bio.trim().length === 0) {
		return next(new ErrorHandler("Please provide a valid bio", 400));
	}

	if (
		!botPersonality ||
		typeof botPersonality !== "string" ||
		botPersonality.trim().length === 0
	) {
		return next(new ErrorHandler("Please provide a valid bot personality", 400));
	}

	let profilePic = null;

	// Handle profile picture upload if provided
	if (req.file) {
		const pictureUri = getDataUri(req.file);

		const myCloud = await cloudinary.uploader.upload(pictureUri.content, {
			folder: "/chadbot/bots",
			crop: "scale",
		});

		profilePic = {
			url: myCloud.secure_url,
			public_id: myCloud.public_id,
		};
	}

	// Build the bot object dynamically
	const botData = {
		username,
		botRole,
		botPersonality,
		bio,
		botType,
	};

	// Add profilePic field only if it exists
	if (profilePic) {
		botData.profilePic = profilePic;
	}

	// Create the bot in the database
	const bot = await Bot.create(botData);

	// websocket here
	await loadBots();
	req.io.emit("createBot", {
		bot: {
			...bot.toObject(),
			status: "online",
		},
	});

	res.status(200).json({ success: true, message: "Bot Created successfully", bot });
});

exports.updateBot = catchAsyncErrors(async (req, res, next) => {
	const { username, bio, botRole, botType, botPersonality } = req.body;

	// Validate fields if provided
	if (
		(username && (typeof username !== "string" || username.trim().length === 0)) ||
		/\s/.test(username.trim())
	) {
		return next(new ErrorHandler("Please provide a valid username", 400));
	}

	if (bio && (typeof bio !== "string" || bio.trim().length === 0)) {
		return next(new ErrorHandler("Please provide a valid bio", 400));
	}

	if (botRole && (typeof botRole !== "string" || botRole.trim().length === 0)) {
		return next(new ErrorHandler("Please provide a valid bot role", 400));
	}

	if (botType && (typeof botType !== "string" || botType.trim().length === 0)) {
		return next(new ErrorHandler("Please provide a valid bot type", 400));
	}

	if (
		botPersonality &&
		(typeof botPersonality !== "string" || botPersonality.trim().length === 0)
	) {
		return next(new ErrorHandler("Please provide a valid bot personality", 400));
	}

	if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
		return next(new ErrorHandler("Invalid bot ID", 400));
	}

	// Find the bot to update
	const bot = await Bot.findById(req.params.id);
	if (!bot) {
		return next(new ErrorHandler("Bot not found", 404));
	}

	// Update profile picture if a file is uploaded
	let profilePic = bot.profilePic;

	if (req.file) {
		const pictureUri = getDataUri(req.file);

		// Upload the new picture to Cloudinary
		const myCloud = await cloudinary.uploader.upload(pictureUri.content, {
			folder: "/chadbot/bots",
			crop: "scale",
		});

		// Delete the old profile picture from Cloudinary if it exists
		if (bot.profilePic?.public_id) {
			await cloudinary.uploader.destroy(bot.profilePic.public_id);
		}

		profilePic = {
			url: myCloud.secure_url,
			public_id: myCloud.public_id,
		};
	}

	// Apply updates to the bot
	const updatedBot = await Bot.findByIdAndUpdate(
		req.params.id,
		{
			$set: {
				username,
				bio,
				botRole,
				botType,
				botPersonality,
				profilePic,
			},
		},
		{
			new: true,
			runValidators: true,
		}
	);

	// websocket here
	await loadBots();
	req.io.emit("updateBot", {
		bot: {
			...updatedBot.toObject(),
			status: "online",
		},
	});

	res.status(200).json({
		success: true,
		message: "Profile updated successfully",
		bot: updatedBot,
	});
});

exports.deleteBot = catchAsyncErrors(async (req, res, next) => {
	if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
		return next(new ErrorHandler("Invalid bot ID", 400));
	}

	// Find the bot to update
	const bot = await Bot.findById(req.params.id);
	if (!bot) {
		return next(new ErrorHandler("Bot not found", 404));
	}

	if (bot.profilePic && bot.profilePic.public_id) {
		await cloudinary.uploader.destroy(bot.profilePic.public_id);
	}

	await Message.deleteMany({ sender: bot._id, senderType: "Bot" });
	await Bot.findByIdAndDelete(bot.id);

	// websocket here
	await loadBots();
	req.io.emit("deleteBot", {
		bot,
	});

	// Respond with success
	res.status(200).json({
		success: true,
		message: "Bot deleted",
	});
});
