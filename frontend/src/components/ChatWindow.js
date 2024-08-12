import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import moment from 'moment';
import Sidebar from './Sidebar';
import AccountSection from './AccountSection';
import UserProfileCard from './UserProfileCard';
import AutocompleteInput from './AutocompleteInput';
import '../ChatWindow.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000'; // Adjust as needed

const ChatWindow = ({ user, setUser }) => {
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [bots, setBots] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [cardPosition, setCardPosition] = useState({});
  const messagesEndRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

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
      setMessages(response.data.reverse()); // Reverse the order of messages
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

  const fetchAllUsers = useCallback(async () => {
    if (!user || !user.token) return;
    try {
      const response = await axios.get(`${API_URL}/api/all-users`, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      setAllUsers(response.data);
    } catch (error) {
      console.error('Error fetching all users:', error);
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
    fetchAllUsers();
    fetchBots();
  }, [fetchMessages, fetchUsers, fetchAllUsers, fetchBots]);

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
      if (response.data && Array.isArray(response.data)) {
        setMessages(prevMessages => [...prevMessages, ...response.data]);
      } else {
        console.error('Unexpected response format:', response.data);
      }
      setInput('');
    } catch (error) {
      console.error('Error sending message:', error.response ? error.response.data : error.message);
      setError(`Failed to send message. Error: ${error.response ? JSON.stringify(error.response.data) : error.message}`);
    }
  };
  
  const handleUserClick = useCallback((clickedUser, event) => {
    event.stopPropagation(); // Prevent event from bubbling up
    setSelectedUser(prevSelectedUser => 
      prevSelectedUser && prevSelectedUser.name === clickedUser.name ? null : clickedUser
    );
    setCardPosition({
      top: `${event.clientY}px`,
      left: `${event.clientX}px`
    });
  }, []);

  const closeProfileCard = useCallback(() => {
    setSelectedUser(null);
  }, []);

  const handleDeleteMessage = useCallback(async (messageId) => {
    try {
      console.log('Deleting message with ID:', messageId); // Add this line for debugging
      const response = await axios.delete(`${API_URL}/api/messages/${messageId}`, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      console.log('Delete response:', `${API_URL}/api/messages/${messageId}`);
      if (response.status === 200) {
        setMessages(prevMessages => prevMessages.filter(msg => msg.id !== messageId));
      } else {
        throw new Error('Failed to delete message');
      }
    } catch (error) {
      console.error('Error deleting message:', error);
      setError('Failed to delete message. Please try again.');
    }
  }, [user, setMessages, setError]);

  const handleBanUser = useCallback(async (userId) => {
    try {
      await axios.post(`${API_URL}/api/ban-user`, { userId }, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      // Immediately update the user's status in the state
      setUsers(prevUsers => prevUsers.map(u => 
        u._id === userId ? { ...u, isBanned: true } : u
      ));
      // Optional: Fetch users to ensure sync with server
      fetchUsers();
    } catch (error) {
      console.error('Error banning user:', error);
      setError('Failed to ban user. Please try again.');
    }
  }, [user, fetchUsers, setUsers, setError]);

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
  }, [selectedUser, closeProfileCard]);

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
          {messages.map((message) => (
            <div key={message.id} className="message">
              <img 
                src={(message.user && message.user.profilePic) ? `${API_URL}${message.user.profilePic}` : '/default-avatar.png'}
                alt="Profile" 
                className="profile-pic clickable" 
                onClick={(e) => message.user && handleUserClick(message.user, e)}
              />
              <div className="message-content">
                <strong 
                  className="clickable" 
                  onClick={(e) => message.user && handleUserClick(message.user, e)}
                >
                  {message.user ? message.user.name : 'Unknown User'}
                </strong>: {message.text}
                <span className="timestamp">
                  {moment(message.createdAt).format('MMMM Do YYYY, h:mm:ss a')}
                </span>
                {user.isAdmin && (
                  <div className="admin-controls">
                   <button onClick={() => handleDeleteMessage(message.id)}>Delete</button>
                   <button 
                      onClick={() => message.user && handleBanUser(message.user._id)}
                      disabled={message.user && message.user.isBanned}
                    >
                     {message.user && message.user.isBanned ? 'Banned' : 'Ban User'}
                   </button>
                 </div>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        <form onSubmit={sendMessage} className="message-input">
          <AutocompleteInput
            value={input}
            onChange={setInput}
            onSubmit={sendMessage}
            users={allUsers}
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