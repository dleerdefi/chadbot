const catchAsyncErrors = require("../middlewares/catchAsyncErrors");
const ErrorHandler = require("../utils/errorHandler");
const Message = require("../models/Message");
const Bot = require("../models/Bot");
const User = require("../models/User");
const mongoose = require("mongoose");
const transformGrowthData = require("../utils/transformGrowthData");

// delete message by admin
exports.deleteMessageByAdmin = catchAsyncErrors(async (req, res, next) => {
	const id = req.params.id;

	if (!mongoose.Types.ObjectId.isValid(id)) {
		return next(new ErrorHandler("Invalid message ID", 400));
	}

	const message = await Message.findById(id);
	if (!message) return next(new ErrorHandler("Message not found", 404));

	await Message.findByIdAndDelete(id);

	req.io.emit("deleteMessage", {
		messageId: id,
	});

	// Respond with success
	res.status(200).json({
		success: true,
		message: "Message Deleted",
	});
});

// get dashboard data by admin
exports.getDashboardAnalytics = catchAsyncErrors(async (req, res, next) => {
	const { type = "overall" } = req.query;

	const getDateRange = (type) => {
		const now = new Date();
		switch (type) {
			case "yearly":
				return {
					start: new Date(now.getFullYear(), 0, 1),
					end: now,
				};
			case "monthly":
				return {
					start: new Date(now.getFullYear(), now.getMonth(), 1),
					end: now,
				};
			case "weekly": {
				const currentDay = now.getDay();
				const startOfWeek = new Date(now);
				const endOfWeek = new Date(now);

				const daysToSubtract = currentDay === 0 ? 6 : currentDay - 1;

				startOfWeek.setDate(now.getDate() - daysToSubtract);
				startOfWeek.setHours(0, 0, 0, 0);

				endOfWeek.setDate(startOfWeek.getDate() + 6);
				endOfWeek.setHours(23, 59, 59, 999);

				return { start: startOfWeek, end: endOfWeek };
			}

			default:
				return {
					start: new Date(0),
					end: now,
				};
		}
	};

	const { start, end } = getDateRange(type);

	// Aggregation for overall metrics
	const overallMetrics = await Promise.all([
		User.countDocuments(),
		Bot.countDocuments(),
		Message.countDocuments(),
	]);

	//user and bot growth analytics aggregate
	const userGrowthPipeline = [
		{
			$match: {
				createdAt: { $gte: start, $lte: end },
			},
		},
		{
			$group: {
				_id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
				count: { $sum: 1 },
			},
		},
		{ $sort: { _id: 1 } },
	];

	const botGrowthPipeline = [
		{
			$match: {
				createdAt: { $gte: start, $lte: end },
			},
		},
		{
			$group: {
				_id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
				count: { $sum: 1 },
			},
		},
		{ $sort: { _id: 1 } },
	];

	const botGrowth = await Bot.aggregate(botGrowthPipeline);
	const userGrowth = await User.aggregate(userGrowthPipeline);

	const transformedUserGrowth = transformGrowthData(userGrowth, type, "registered");
	const transformedBotGrowth = transformGrowthData(botGrowth, type, "created");

	// Recent Users
	const recentUsers = await User.find({
		createdAt: { $gte: start, $lte: end },
	}).sort({ createdAt: -1 });

	// Recent Bots
	const recentBots = await Bot.find({
		createdAt: { $gte: start, $lte: end },
	}).sort({ createdAt: -1 });

	// Message activity by sender type
	const messageActivityPipeline = [
		{
			$match: {
				createdAt: { $gte: start, $lte: end },
			},
		},
		{
			$group: {
				_id: "$senderType",
				count: { $sum: 1 },
			},
		},
	];

	const messageActivity = await Message.aggregate(messageActivityPipeline);

	// User role distribution
	const userRoleDistribution = (
		await User.aggregate([
			{
				$group: {
					_id: "$isAdmin",
					count: { $sum: 1 },
				},
			},
		])
	).map(({ _id, count }) => ({
		role: _id ? "Admin" : "User",
		label: _id ? `Admin(${count})` : `User(${count})`,
		count,
	}));

	// Bot role distribution
	const botTypeDistribution = (
		await Bot.aggregate([
			{
				$group: {
					_id: "$botType",
					count: { $sum: 1 },
				},
			},
		])
	).map(({ _id, count }) => ({
		type: _id === "basic" ? "Basic" : _id === "dev" ? "Dev" : _id === "qc" ? "QC" : "Others",
		label:
			_id === "basic"
				? `Basic(${count})`
				: _id === "dev"
				? `Dev(${count})`
				: _id === "qc"
				? `QC(${count})`
				: `Others(${count})`,

		count,
	}));

	res.status(200).json({
		totalUsers: overallMetrics[0],
		totalBots: overallMetrics[1],
		totalMessages: overallMetrics[2],
		userGrowth: transformedUserGrowth,
		botGrowth: transformedBotGrowth,
		recentUsers,
		recentBots,
		messageActivity,
		userRoleDistribution,
		botTypeDistribution,
		analytics: {
			timeframe: type,
			startDate: start,
			endDate: end,
		},
	});
});
