const mongoose = require("mongoose");

const botSchema = new mongoose.Schema(
	{
		username: {
			type: String,
			required: true,
			trim: true,
			minlength: 3,
			maxlength: 30,
			unique: true,
		},
		botRole: {
			type: String,
			required: true,
			trim: true,
		},
		bio: {
			type: String,
			required: true,
			default: "No bio available",
			trim: true,
			maxlength: 150,
		},
		profilePic: {
			public_id: String,
			url: String,
		},
		botPersonality: {
			type: String,
			required: true,
			trim: true,
		},
		isBot: {
			type: Boolean,
			required: true,
			default: true,
		},
		botType: {
			type: String,
			required: true,
			enum: ["basic", "dev", "qc"],
		},
	},
	{ timestamps: true }
);

const Bot = mongoose.model("Bot", botSchema);

module.exports = Bot;
