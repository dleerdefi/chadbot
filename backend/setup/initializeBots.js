require("dotenv").config();
const cloudinary = require("cloudinary").v2;
const path = require("path");
const fs = require("fs").promises;
const Bot = require("../models/Bot");
const bots = require("./bots");
const connectDb = require("../config/connectDb");

// Cloudinary configuration
cloudinary.config({
	cloud_name: process.env.CLOUDINARY_NAME,
	api_key: process.env.CLOUDINARY_API_KEY,
	api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadImageToCloudinary = async (imagePath) => {
	try {
		const result = await cloudinary.uploader.upload(imagePath, {
			folder: "/chadbot/bots",
			crop: "scale",
		});
		return { url: result.secure_url, public_id: result.public_id };
	} catch (error) {
		console.error("Cloudinary upload error:", error);
		throw new Error("Failed to upload image to Cloudinary");
	}
};

const initializeBots = async () => {
	if (process.env.NODE_ENV !== "production") {
		await connectDb();
	}

	for (const botData of bots) {
		try {
			const existingBot = await Bot.findOne({ username: botData.username });
			if (existingBot) {
				console.log(`Bot ${botData.username} already exists.`);
				continue;
			}

			const profilePicturePath = path.join(__dirname, botData.profilePicture);
			const { url, public_id } = await uploadImageToCloudinary(profilePicturePath);

			const newBot = await Bot.create({
				...botData,
				profilePic: { url, public_id },
			});

			console.log(`Bot ${newBot.username} added successfully.`);
		} catch (error) {
			console.error(`Failed to add bot ${botData.username}:`, error);
			throw error;
		}
	}

	console.log("Bot initialization complete.");
};

if (process.env.NODE_ENV !== "production") {
	initializeBots()
		.then(() => {
			process.exit(0);
		})
		.catch((error) => {
			console.error("Bots setup script encountered an error:", error);
			process.exit(1);
		});
}

module.exports = initializeBots;
