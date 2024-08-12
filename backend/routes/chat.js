const express = require('express');
const { body, validationResult } = require('express-validator');
const rateLimit = require("express-rate-limit");
const router = express.Router();
const { ChatBot } = require('../models/ChatBot');
const Message = require('../models/Message');
const authenticateUser = require('../middleware/authenticateUser');
const logger = require('../utils/logger');
const isAdmin = require('../middleware/isAdmin'); // Adjust path as needed

const messageLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});

router.post('/api/messages', authenticateUser, messageLimiter, [
  body('message').notEmpty().trim().escape(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { message } = req.body;
    const userId = req.user.id;

    logger.info(`User ${userId} sent message: ${message}`);

    const newMessage = new Message({
      user: userId,
      text: message,
    });
    await newMessage.save();

    const response = await ChatBot.getResponse(message);

    const botMessage = new Message({
      user: 'bot', // You might want to use a specific bot user ID here
      text: response,
    });
    await botMessage.save();

    res.json({ 
      userMessage: newMessage,
      botResponse: botMessage
    });
  } catch (error) {
    logger.error('Error handling message:', error);
    res.status(500).json({ error: 'An error occurred while processing your message' });
  }
});

router.delete('/api/messages/:id', isAdmin, async (req, res) => {
  try {
    const messageId = req.params.id;
    console.log('Attempting to delete message with ID:', messageId);
    const deletedMessage = await Message.findByIdAndDelete(messageId);
    if (!deletedMessage) {
      console.log('Message not found:', messageId);
      return res.status(404).json({ error: 'Message not found' });
    }
    console.log('Message deleted successfully:', messageId);
    res.status(200).json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

module.exports = router;