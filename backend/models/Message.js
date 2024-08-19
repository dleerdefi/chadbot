const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true },
  type: { type: String, enum: ['text', 'image', 'file'], default: 'text' },
  room: { type: String, required: true },
  isEdited: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false },
  status: { type: String, enum: ['sent', 'delivered', 'read'], default: 'sent' },
  replyTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
  createdAt: { type: Date, default: Date.now, immutable: true },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

messageSchema.index({ user: 1, createdAt: -1 });
messageSchema.index({ room: 1, createdAt: -1 });

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;