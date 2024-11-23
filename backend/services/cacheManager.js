const Redis = require("ioredis");

class CacheManager {
	constructor() {
		if (!CacheManager.instance) {
			this.redisClient = new Redis({
				host: process.env.REDIS_RATE_LIMIT_HOST,
				port: process.env.REDIS_RATE_LIMIT_PORT,
				password: process.env.REDIS_RATE_LIMIT_PASSWORD,
				db: parseInt(process.env.REDIS_CACHE_INDEX),
			});

			this.redisClient.on("error", (err) => {
				console.error("Redis error:", err);
			});

			CacheManager.instance = this;
		}

		return CacheManager.instance;
	}

	async updateContextCache(userId, sessionId, message) {
		const cacheKey = `context:${userId}:${sessionId}`;
		try {
			const pipeline = this.redisClient.pipeline();
			pipeline.get(cacheKey);
			pipeline.ttl(cacheKey);

			const results = await pipeline.exec();

			const [getErr, cachedContextResult] = results[0];
			const [ttlErr, ttl] = results[1];

			if (getErr || ttlErr) {
				throw new Error(`Redis pipeline errors: ${getErr}, ${ttlErr}`);
			}


			let cachedContext = cachedContextResult
				? JSON.parse(cachedContextResult)
				: { messages: [] };

			cachedContext.messages.push(message);
			cachedContext.messages = cachedContext.messages.slice(
				-parseInt(process.env.MAX_CONTEXT_MESSAGES, 10)
			);

			await this.redisClient.setex(
				cacheKey,
				ttl > 0 ? ttl : parseInt(process.env.REDIS_CACHE_CONTEXT_EXPIRY, 10),
				JSON.stringify(cachedContext)
			);
		} catch (error) {
			console.error(
				`Error updating Redis context cache for user ${userId}, session ${sessionId}:`,
				error
			);
			throw error;
		}
	}

	async getContextCache(userId, sessionId) {
		const cacheKey = `context:${userId}:${sessionId}`;
		try {
			const cachedContext = await this.redisClient.get(cacheKey);
			return cachedContext ? JSON.parse(cachedContext) : { messages: [] };
		} catch (error) {
			console.error(
				`Error retrieving Redis context cache for user ${userId}, session ${sessionId}:`,
				error
			);
			return { messages: [] };
		}
	}

	async clearContextCache(userId, sessionId) {
		const cacheKey = `context:${userId}:${sessionId}`;
		try {
			await this.redisClient.del(cacheKey);
			console.log(`Context cache cleared for user ${userId}, session ${sessionId}`);
		} catch (error) {
			console.error(
				`Error clearing Redis context cache for user ${userId}, session ${sessionId}:`,
				error
			);
		}
	}

	// Method to get admin status from cache
	async getAdminStatus(userId) {
		const cacheKey = `user:${userId}:isAdmin`;
		try {
			const isAdmin = await this.redisClient.get(cacheKey);
			return isAdmin === "true";
		} catch (error) {
			console.error(`Error retrieving admin status for user ${userId}:`, error);
			return null;
		}
	}

	// Method to set admin status in cache
	async setAdminStatus(userId, isAdmin, expiryInSeconds = 3600) {
		const cacheKey = `user:${userId}:isAdmin`;
		try {
			await this.redisClient.setex(cacheKey, expiryInSeconds, isAdmin ? "true" : "false");
		} catch (error) {
			console.error(`Error setting admin status for user ${userId}:`, error);
		}
	}
}

const instance = new CacheManager();
Object.freeze(instance);

module.exports = instance;
