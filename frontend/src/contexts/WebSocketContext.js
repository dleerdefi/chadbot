import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';

const WebSocketContext = createContext();

export const useWebSocket = () => useContext(WebSocketContext);

export const WebSocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    if (user && user.token) {
      console.log('Attempting to connect WebSocket');
      const newSocket = io(process.env.REACT_APP_API_URL || 'http://localhost:3000', {
        auth: { token: user.token },
        query: { token: user.token }, // Include this as a fallback
        transports: ['websocket']
      });

      newSocket.on('connect', () => {
        console.log('WebSocket connected successfully');
        setSocket(newSocket);
      });

      newSocket.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error);
      });

      newSocket.on('disconnect', (reason) => {
        console.log(`WebSocket disconnected: ${reason}`);
        setSocket(null);
      });

      newSocket.on('message', (message) => {
        setMessages(prevMessages => [...prevMessages, message]);
      });

      return () => {
        if (newSocket) {
          console.log('Cleaning up WebSocket connection');
          newSocket.disconnect();
        }
      };
    }
  }, [user]);

  const sendMessage = useCallback((message) => {
    if (socket) {
      console.log('Sending message:', message);
      socket.emit('chatMessage', message);
    } else {
      console.error('Cannot send message: WebSocket is not connected');
    }
  }, [socket]);

  const updateMessages = useCallback((updater) => {
    setMessages(updater);
  }, []);

  const contextValue = {
    socket,
    messages,
    sendMessage,
    updateMessages,
  };

  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  );
};