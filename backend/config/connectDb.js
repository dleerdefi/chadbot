const mongoose = require("mongoose");

const connectDb = async () => {
	try {
		await mongoose.connect(process.env.MONGO_URI, {
			useNewUrlParser: true,
			useUnifiedTopology: true,
			connectTimeoutMS: 60000,
			serverSelectionTimeoutMS: 60000,
			socketTimeoutMS: 60000,
		});

		console.log("MongoDB connected successfully");
	} catch (err) {
		console.error("MongoDB connection error:", err);
		process.exit(1);
	}
};

module.exports = connectDb;
