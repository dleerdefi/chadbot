import React, { useState } from 'react';
import socketIOClient from "socket.io-client";
import axios from 'axios';

const MessageInput = () => {
  const [message, setMessage] = useState('');
  const socket = socketIOClient("http://localhost:5000");

  const sendMessage = async () => {
    const userMessage = { user: 'User', text: message };
    console.log('Sending message:', userMessage); // Add this log
    socket.emit('message', userMessage);

    if (message.startsWith('@')) {
      const [botName, ...botMessage] = message.split(' ');
      try {
        const botResponse = await axios.post('http://localhost:5000/api/chat/ai-response', { text: botMessage.join(' ') });
        const aiMessage = { user: botName.substring(1), text: botResponse.data.response };
        console.log('Sending bot message:', aiMessage); // Add this log
        socket.emit('message', aiMessage);
      } catch (error) {
        console.error('Error sending message to AI:', error);
      }
    }

    setMessage('');
  };

  return (
    <div className="message-input">
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyPress={(e) => { if (e.key === 'Enter') sendMessage(); }}
      />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
};

export default MessageInput;
