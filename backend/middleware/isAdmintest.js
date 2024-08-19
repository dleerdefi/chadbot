const config = require('../config');
const User = require('../models/User');
const redis = require('redis');
const { promisify } = require('util');

let client;
let getAsync;

const ADMIN_CACHE_DURATION = process.env.ADMIN_CACHE_DURATION || 3600;

const initializeRedis = async () => {
  if (!client) {
    client = redis.createClient(config.redisUrl);
    getAsync = promisify(client.get).bind(client);

    client.on('error', (error) => console.error('Redis error:', error));
    client.on('end', () => {
      console.log('Redis connection closed');
      client = null;
      getAsync = null;
    });

    await new Promise((resolve) => client.on('connect', resolve));
  }
};

const isRedisAvailable = () => client && client.isOpen;

const isAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      console.log('Access attempt without user object');
      return res.status(403).json({ success: false, error: 'Access denied. Authentication required.' });
    }

    let isAdminValue;
    const cacheKey = `user:${req.user.uid}:isAdmin`;

    try {
      await initializeRedis();
      if (isRedisAvailable()) {
        const cachedValue = await getAsync(cacheKey);
        isAdminValue = cachedValue ? JSON.parse(cachedValue) : null;
      }
    } catch (redisError) {
      console.error('Redis error, falling back to database:', redisError);
    }

    if (isAdminValue === null) {
      const user = await User.findOne({ firebaseUid: req.user.uid });
      isAdminValue = user && user[config.adminField] ? true : false;

      if (isRedisAvailable()) {
        try {
          await client.set(cacheKey, JSON.stringify(isAdminValue), 'EX', ADMIN_CACHE_DURATION);
        } catch (cacheError) {
          console.error('Error caching admin status:', cacheError);
        }
      }
    }

    if (isAdminValue) {
      console.log(`Admin access granted to user ${req.user.uid}`);
      return next();
    } else {
      console.log(`Non-admin access attempt by user ${req.user.uid}`);
      return res.status(403).json({ success: false, error: 'Access denied. Admin privileges required.' });
    }
  } catch (error) {
    console.error('Error in isAdmin middleware:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

module.exports = isAdmin;