const checkBotMention = (text, botsList) => {
	const botMention = text.match(/@(\w+)/);
	if (botMention) {
		const bot = botsList.find((bot) => bot.username === botMention[1]);
		if (bot) {
			return { status: true, bot };
		} else {
			return { status: false, bot: null };
		}
	} else {
		return { status: false, bot: null };
	}
};

module.exports = checkBotMention;
