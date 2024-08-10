const express = require('express');
const axios = require('axios');
const Message = require('../models/Message');

const router = express.Router();
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

router.get('/messages', async (req, res) => {
  const messages = await Message.find().sort({ timestamp: -1 }).limit(50);
  res.json(messages.reverse());
});

router.post('/ai-response', async (req, res) => {
  const { text } = req.body;
  try {
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-4',
      messages: [{ role: 'user', content: text }],
      max_tokens: 150,
    }, {
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
    });

    res.json({ response: response.data.choices[0].message.content.trim() });
  } catch (error) {
    console.error('Error interacting with OpenAI:', error.response ? error.response.data : error.message);
    res.status(500).send('Error interacting with OpenAI');
  }
});

module.exports = router;
