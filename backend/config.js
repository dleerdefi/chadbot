// config.js
const path = require('path');

module.exports = {
  // File upload configurations
  uploadDir: path.join(__dirname, 'uploads'),
  maxFileSize: 5 * 1024 * 1024, // 5MB

  // Database configurations
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/your-database-name',

  // Redis configurations
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  redisCacheExpiry: 3600, // 1 hour in seconds

  // JWT configurations
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
  jwtExpiresIn: '1d', // 1 day

  // Admin configurations
  adminField: 'isAdmin', // The field in the User model that determines admin status

  // API configurations
  apiBaseUrl: process.env.BACKEND_URL || 'http://localhost:3000',

  // Email configurations
  emailService: process.env.EMAIL_SERVICE || 'gmail',
  emailUser: process.env.EMAIL_USER,
  emailPass: process.env.EMAIL_PASS,

  // OpenAI configurations
  openaiApiKey: process.env.OPENAI_API_KEY,

  // Environment
  nodeEnv: process.env.NODE_ENV || 'development',

  // Server configurations
  port: process.env.PORT || 3000,

  // Logging configurations
  logLevel: process.env.LOG_LEVEL || 'info',

  // CORS configurations
  corsOrigin: process.env.FRONTEND_URL || 'http://localhost:5000',

  // Session configurations
  sessionSecret: process.env.SESSION_SECRET || 'your-session-secret',

  // Rate limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
  },

  // Firebase configurations
  firebaseConfig: {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID,
    measurementId: process.env.FIREBASE_MEASUREMENT_ID
  },

  // Chat configurations
  maxMessageLength: 1000, // Maximum length of a chat message

  // User configurations
  maxUsernameLength: 30,
  minPasswordLength: 8,

  // File upload allowed types
  allowedFileTypes: ['image/jpeg', 'image/png', 'image/gif']
};