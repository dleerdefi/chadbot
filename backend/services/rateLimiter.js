const Redis = require("ioredis");

const redisRateLimitClient = new Redis({
	host: process.env.REDIS_RATE_LIMIT_HOST,
	port: process.env.REDIS_RATE_LIMIT_PORT,
	password: process.env.REDIS_RATE_LIMIT_PASSWORD,
});

const checkMessageRateLimit = async (userId) => {
	const key = `ws_message_rate_limit:${userId}`;
	try {
		const current = await redisRateLimitClient.incr(key);

		if (current === 1) {
			await redisRateLimitClient.expire(key, parseInt(process.env.TIME_WINDOW) / 1000);
		}
		return current <= parseInt(process.env.MESSAGE_LIMIT);
	} catch (error) {
		console.error(`Error checking message rate limit for user ${userId}:`, error);
		return false;
	}
};

const checkChatbotRateLimit = async (userId, isPremiumUser = false) => {
	const limit = isPremiumUser
		? parseInt(process.env.PREMIUM_CHATBOT_LIMIT)
		: parseInt(process.env.CHATBOT_LIMIT);
	const key = `chatbot_rate_limit:${userId}`;

	try {
		const current = await redisRateLimitClient.incr(key);
		if (current === 1) {
			await redisRateLimitClient.expire(
				key,
				parseInt(process.env.CHATBOT_TIME_WINDOW) / 1000
			);
		}
		return current <= limit;
	} catch (error) {
		console.error(`Error checking chatbot rate limit for user ${userId}:`, error);
		return false;
	}
};

const getRemainingLimit = async (userId) => {
	const key = `ws_message_rate_limit:${userId}`;
	try {
		const current = await redisRateLimitClient.get(key);
		const remaining = parseInt(process.env.MESSAGE_LIMIT) - (current ? parseInt(current) : 0);
		return remaining > 0 ? remaining : 0;
	} catch (error) {
		console.error(`Error getting remaining message limit for user ${userId}:`, error);
		return 0;
	}
};

module.exports = {
	checkMessageRateLimit,
	checkChatbotRateLimit,
	getRemainingLimit,
};
