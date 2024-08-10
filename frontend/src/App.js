import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import ChatWindow from './components/ChatWindow';
import UserBar from './components/UserBar';
import Account from './components/Account';

const App = () => {
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [bots, setBots] = useState(['RossJeffereies', 'JohnSinn', 'AustenSummers']);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const socket = io('http://localhost:5000');

    socket.on('message', message => {
      setMessages(messages => [...messages, message]);
    });

    socket.on('users', users => {
      setUsers(users);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <div className="app">
      <div className="chat-container">
        <ChatWindow messages={messages} />
        <UserBar users={users} bots={bots} />
        <Account user={user} />
      </div>
    </div>
  );
};

export default App;
