import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import Sidebar from './Sidebar';
import AccountSection from './AccountSection';
import UserProfileCard from './UserProfileCard';
import '../ChatWindow.css';

const API_URL = 'http://localhost:3000'; // Adjust this if your backend is on a different port

const ChatWindow = ({ user, setUser }) => {
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [bots, setBots] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [cardPosition, setCardPosition] = useState({});
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const fetchMessages = useCallback(async () => {
    if (!user || !user.token) {
      console.log('No user data or token available');
      setLoading(false);
      return;
    }

    try {
      console.log('Fetching messages...');
      const response = await axios.get(`${API_URL}/api/messages`, {
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });
      console.log('Messages fetched:', response.data);
      setMessages(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching messages:', error.response ? error.response.data : error.message);
      setError(`Failed to load messages. Error: ${error.response ? JSON.stringify(error.response.data) : error.message}`);
      setLoading(false);
    }
  }, [user]);

  const fetchUsers = useCallback(async () => {
    if (!user || !user.token) return;
    try {
      const response = await axios.get(`${API_URL}/api/users`, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  }, [user]);

  const fetchBots = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/api/bots`);
      setBots(response.data);
    } catch (error) {
      console.error('Error fetching bots:', error);
    }
  }, []);

  useEffect(() => {
    fetchMessages();
    fetchUsers();
    fetchBots();
  }, [fetchMessages, fetchUsers, fetchBots]);

  const sendMessage = async (event) => {
    event.preventDefault();
    if (!input.trim() || !user || !user.token) return;

    try {
      const response = await axios.post(`${API_URL}/api/messages`, {
        text: input,
      }, {
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });
      setMessages(prevMessages => [...prevMessages, ...response.data]);
      setInput('');
    } catch (error) {
      console.error('Error sending message:', error.response ? error.response.data : error.message);
      setError(`Failed to send message. Error: ${error.response ? JSON.stringify(error.response.data) : error.message}`);
    }
  };

  const handleUserClick = (clickedUser, event) => {
    event.stopPropagation(); // Prevent event from bubbling up
    if (selectedUser && selectedUser.name === clickedUser.name) {
      setSelectedUser(null);
    } else {
      setSelectedUser(clickedUser);
      setCardPosition({
        top: `${event.clientY}px`,
        left: `${event.clientX}px`
      });
    }
  };

  const closeProfileCard = () => {
    setSelectedUser(null);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectedUser && !event.target.closest('.user-profile-card')) {
        closeProfileCard();
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [selectedUser]);

  if (!user) {
    return <div>No user data available. Please try logging in again.</div>;
  }

  if (loading) {
    return <div>Loading messages...</div>;
  }

  return (
    <div className="chat-window">
      <Sidebar users={users} bots={bots} onUserClick={handleUserClick} />
      <div className="main-chat">
        <h1>Welcome, {user.username || user.email}!</h1>
        {error && <div style={{color: 'red'}}>{error}</div>}
        <div className="message-area">
          {messages.map((message, index) => (
            <div key={index} className="message">
              <img 
                src={message.user.profilePic || '/default-avatar.png'} 
                alt="Profile" 
                className="profile-pic clickable" 
                onClick={(e) => handleUserClick(message.user, e)}
              />
              <div className="message-content">
                <strong 
                  className="clickable" 
                  onClick={(e) => handleUserClick(message.user, e)}
                >
                  {message.user.name}
                </strong>: {message.text}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        <form onSubmit={sendMessage} className="message-input">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
          />
          <button type="submit">Send</button>
        </form>
      </div>
      <AccountSection user={user} setUser={setUser} />
      {selectedUser && (
        <UserProfileCard 
          user={selectedUser} 
          position={cardPosition}
          onClose={closeProfileCard} 
        />
      )}
    </div>
  );
};

export default ChatWindow;