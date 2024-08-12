const config = require('../config');
const User = require('../models/User');
const redis = require('redis');
const { promisify } = require('util');

let client;
let getAsync;
let setAsync;

const initializeRedis = async () => {
  if (!client) {
    client = redis.createClient(config.redisUrl);
    getAsync = promisify(client.get).bind(client);
    setAsync = promisify(client.set).bind(client);

    client.on('error', (error) => {
      console.error('Redis error:', error);
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
    const cacheKey = `user:${req.user.id}:isAdmin`;

    try {
      await initializeRedis();
      isAdminValue = await getAsync(cacheKey);
    } catch (redisError) {
      console.error('Redis error, falling back to database:', redisError);
      // Fall back to database check
      const user = await User.findById(req.user.id);
      isAdminValue = user && user[config.adminField] ? 'true' : 'false';
    }

    if (isAdminValue === 'true') {
      console.log(`Admin access granted to user ${req.user.id}`);
      return next();
    } else {
      console.log(`Non-admin access attempt by user ${req.user.id}`);
      return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    }
  } catch (error) {
    console.error('Error in isAdmin middleware:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = isAdmin;