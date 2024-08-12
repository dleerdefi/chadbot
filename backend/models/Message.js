const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true },
  type: { type: String, enum: ['text', 'image', 'file'], default: 'text' },
  room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room' },
  isEdited: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now, immutable: true },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

messageSchema.index({ user: 1, createdAt: -1 });

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;