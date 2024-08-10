import React, { useState, useEffect } from 'react';
import socketIOClient from "socket.io-client";

const ChatWindow = () => {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const socket = socketIOClient("http://localhost:5000");
    socket.on('message', (message) => {
      console.log('Message received from server:', message); // Add this log
      setMessages((prevMessages) => [...prevMessages, message]);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <div className="chat-window">
      {messages.map((message, index) => (
        <div key={index} className="message">
          <strong>{message.user}:</strong> {message.text}
        </div>
      ))}
    </div>
  );
};

export default ChatWindow;
