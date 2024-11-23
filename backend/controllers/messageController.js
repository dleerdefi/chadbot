const catchAsyncErrors = require("../middlewares/catchAsyncErrors");
const ErrorHandler = require("../utils/errorHandler");
const Message = require("../models/Message");
const mongoose = require("mongoose");

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
