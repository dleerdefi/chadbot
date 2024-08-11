const express = require('express');
const router = express.Router();
const { ChatBot } = require('../models/ChatBot'); // Adjust this according to your models

router.post('/api/messages', async (req, res) => {
    const { message } = req.body;

    try {
        // Logic to handle message and get AI response
        const response = await ChatBot.getResponse(message); // Adjust this according to your AI logic
        res.json({ text: response });
    } catch (error) {
        console.error('Error handling message:', error);
        res.status(500).send('Internal Server Error');
    }
});

module.exports = router;
