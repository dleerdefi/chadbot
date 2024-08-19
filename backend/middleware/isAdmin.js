const config = require('../config');
const User = require('../models/User');
const redis = require('redis');
const { promisify } = require('util');

let client;
let getAsync;

const initializeRedis = async () => {
  if (!client) {
    client = redis.createClient(config.redisUrl);
    getAsync = promisify(client.get).bind(client);

    client.on('error', (error) => {
      console.error('Redis error:', error);
    });

    client.on('end', () => {
      console.log('Redis connection closed');
      client = null;
      getAsync = null;
    });

    await new Promise((resolve) => client.on('connect', resolve));
  }
};

const isAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      console.log('Access attempt without user object');
      return res.status(403).json({ error: 'Access denied. Authentication required.' });
    }

    let isAdminValue;
    const cacheKey = `user:${req.user.uid}:isAdmin`;

    try {
      await initializeRedis();
      if (client && client.isOpen) {
        isAdminValue = await getAsync(cacheKey);
      }
    } catch (redisError) {
      console.error('Redis error, falling back to database:', redisError);
    }

    if (isAdminValue === null || isAdminValue === undefined) {
      // If not in cache or Redis is unavailable, check database
      const user = await User.findOne({ firebaseUid: req.user.uid });
      isAdminValue = user && user[config.adminField] ? 'true' : 'false';

      // Try to cache the result if Redis is available
      if (client && client.isOpen) {
        try {
          await client.set(cacheKey, isAdminValue, 'EX', 3600); // Cache for 1 hour
        } catch (cacheError) {
          console.error('Error caching admin status:', cacheError);
        }
      }
    }

    if (isAdminValue === 'true') {
      console.log(`Admin access granted to user ${req.user.uid}`);
      return next();
    } else {
      console.log(`Non-admin access attempt by user ${req.user.uid}`);
      return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    }
  } catch (error) {
    console.error('Error in isAdmin middleware:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = isAdmin;