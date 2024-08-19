// models/User.js

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: { 
    type: String, 
    required: true, 
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']
  },
  username: { 
    type: String, 
    required: true,
    trim: true,
    minlength: 3,
    maxlength: 30,
    index: true  // Add this line
  },
  firebaseUid: { type: String, required: true, unique: true },
  googleId: { type: String },
  isAdmin: { type: Boolean, default: false },
  isBot: { type: Boolean, default: false },
  profilePic: { type: String },
  bio: { type: String, default: 'No bio available', trim: true, maxlength: 150 },  
  isBanned: { type: Boolean, default: false },
  active: { type: Boolean, default: true },
  roles: [{ type: String }]
}, { timestamps: true });

// Virtual for user's full name
userSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Method to check if user has a specific role
userSchema.methods.hasRole = function(role) {
  return this.roles.includes(role);
};

// Static method to find active users
userSchema.statics.findActive = function() {
  return this.find({ active: true });
};

// Middleware to log user creation
userSchema.post('save', function(doc, next) {
  console.log('New user created:', doc.email);
  next();
});

// Middleware to log user updates
userSchema.post('findOneAndUpdate', function(doc) {
  if (doc) {
    console.log('User updated:', doc.email);
  }
});

const User = mongoose.model('User', userSchema);

// Add error handling for duplicate key errors
User.on('index', function(err) {
  if (err) {
    console.error('User index error: ', err);
  }
});

module.exports = User;