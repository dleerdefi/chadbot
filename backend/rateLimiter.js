const Redis = require('ioredis');
require('dotenv').config(); // No need to specify the path if it's .env

const redisClient = new Redis(process.env.REDIS_URL);

const MESSAGE_LIMIT = 5; // messages
const TIME_WINDOW = 60 * 1000; // 1 minute in milliseconds

const checkMessageRateLimit = async (userId) => {
  const key = `ws_message_rate_limit:${userId}`;
  const current = await redisClient.incr(key);
  if (current === 1) {
    await redisClient.expire(key, TIME_WINDOW / 1000); // Set expiry in seconds
  }
  return current <= MESSAGE_LIMIT;
};

// For AI chatbot (if you're still using HTTP for this)
const CHATBOT_LIMIT = 5; // requests
const CHATBOT_TIME_WINDOW = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

const checkChatbotRateLimit = async (userId) => {
  const key = `chatbot_rate_limit:${userId}`;
  const current = await redisClient.incr(key);
  if (current === 1) {
    await redisClient.expire(key, CHATBOT_TIME_WINDOW / 1000);
  }
  return current <= CHATBOT_LIMIT;
};

module.exports = { 
  checkMessageRateLimit,
  checkChatbotRateLimit
};