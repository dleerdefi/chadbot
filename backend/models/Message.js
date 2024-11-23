const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
	{
		content: {
			type: String,
			required: true,
			trim: true,
		},
		sender: {
			type: mongoose.Schema.Types.ObjectId,
			required: true,
			refPath: "senderType",
		},
		senderType: {
			type: String,
			enum: ["User", "Bot"],
			required: true,
		},
		room: {
			type: String,
			required: true,
		},
		isGlobal: {
			type: Boolean,
			required: true,
			default: true,
		},
	},
	{ timestamps: true }
);

const Message = mongoose.model("Message", messageSchema);

module.exports = Message;
