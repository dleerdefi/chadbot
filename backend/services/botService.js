const path = require("path");
const { spawn } = require("child_process");
const Message = require("../models/Message");
const Bot = require("../models/Bot");

const handleBotInteraction = async (bot, message, room, contextMessages) => {
	const botPrompt = message.replace(new RegExp(`@${bot.username}`, "i"), "").trim();

	// const scriptName =
	// 	{
	// 		basic: "basic_agent.py",
	// 		dev: "swe_agent.py",
	// 		qc: "qc_agent.py",
	// 	}[bot.botType] || "basic_agent.py";

	const scriptName = "basic_agent.py";

	return new Promise((resolve, reject) => {
		const pythonProcess = spawn("python", [
			path.join(__dirname, "..", "scripts", scriptName),
			botPrompt,
			JSON.stringify(bot.username), // Pass the bot data
			JSON.stringify(contextMessages || []), // Pass the context messages
		]);

		let responseData = "";

		pythonProcess.stdout.on("data", (data) => {
			responseData += data.toString();
		});

		pythonProcess.stderr.on("data", (data) => {
			console.error(`Python Error: ${data}`);
		});

		pythonProcess.on("close", async (code) => {
			if (code !== 0) {
				reject(new Error(`Failed to get response from ${scriptName}`));
				return;
			}

			try {
				const { response } = JSON.parse(responseData);

				const botMessage = await Message.create({
					sender: bot.id,
					senderType: "Bot",
					content: response,
					room: room,
					isGlobal: true,
				});

				resolve({
					...botMessage.toObject(),
					sender: { ...bot.toObject(), status: "online" },
				});
			} catch (error) {
				reject(error);
			}
		});
	});
};

module.exports = { handleBotInteraction };
