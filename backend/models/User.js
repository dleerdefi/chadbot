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
    maxlength: 30
  },
  password: { type: String },
  firebaseUid: { type: String },
  googleId: { type: String },
  isAdmin: { type: Boolean, default: false },
  isBot: { type: Boolean, default: false },
  profilePic: { type: String },
  bio: { type: String },
  isBanned: { type: Boolean, default: false },
  active: { type: Boolean, default: true },
  roles: [{ type: String }]
}, { timestamps: true });

// Password hashing middleware
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

userSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

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

module.exports = mongoose.model('User', userSchema);