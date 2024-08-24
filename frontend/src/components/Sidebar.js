import React, { useState, useMemo, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useWebSocket } from '../contexts/WebSocketContext';
import '../Sidebar.css';

const SearchBar = React.memo(({ onChange }) => (
  <input 
    type="text" 
    placeholder="Search users and bots" 
    onChange={(e) => onChange(e.target.value)}
    className="search-bar"
    aria-label="Search users and bots"
  />
));

const UserList = React.memo(({ users, onUserClick, onProfileClick }) => {
  return (
    <div className="users-section" role="region" aria-labelledby="users-heading">
      <h3 id="users-heading">Users and Bots</h3>
      {users.length > 0 ? (
        <ul>
          {users.map(user => (
            <li 
              key={user._id || `user-${user.username || 'unknown'}`} 
              className={`user-item ${user.isOnline ? 'online' : 'offline'}`}
            >
              <img 
                src={user.profilePicture || '/default-avatar.png'} 
                alt={`${user.username}'s avatar`}
                className="user-avatar clickable"
                onClick={() => onProfileClick(user)}
              />
              <span 
                className="username clickable"
                onClick={() => onUserClick(user)}
                onKeyPress={(e) => e.key === 'Enter' && onUserClick(user)}
                role="button"
                tabIndex="0"
              >
                {user.username || user.name || 'Unknown user'}
              </span>
              {user.isBot && <span className="bot-indicator"> (Bot)</span>}
            </li>
          ))}
        </ul>
      ) : (
        <div className="empty-state">No users available</div>
      )}
    </div>
  );
});

const Sidebar = React.memo(({
  users = [], 
  bots = [], 
  onUserClick = () => {}, 
  onProfileClick = () => {}, 
  onlineUsers: propOnlineUsers = [], 
  botsLoading = false, 
  collapsed = false 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [onlineUsers, setOnlineUsers] = useState(propOnlineUsers);
  const { socket } = useWebSocket();

  useEffect(() => {
    if (socket) {
      const handleInitialOnlineUsers = (initialOnlineUsers) => {
        console.log('Received initial online users:', initialOnlineUsers);
        setOnlineUsers(initialOnlineUsers);
      };

      const handleUserStatusUpdate = ({ userId, status }) => {
        console.log(`User ${userId} status updated to ${status}`);
        setOnlineUsers(prev => 
          status === 'online' 
            ? [...new Set([...prev, userId])]
            : prev.filter(id => id !== userId)
        );
      };

      socket.on('initialOnlineUsers', handleInitialOnlineUsers);
      socket.on('userStatusUpdate', handleUserStatusUpdate);

      socket.emit('getInitialOnlineUsers');

      return () => {
        socket.off('initialOnlineUsers', handleInitialOnlineUsers);
        socket.off('userStatusUpdate', handleUserStatusUpdate);
      };
    }
  }, [socket]);

  const filteredUsers = useMemo(() => {
    console.log('Filtering users and bots:', { users, bots, onlineUsers });
    const userMap = new Map();
  
    // Process bots first
    (bots || []).forEach(bot => {
      const botId = bot._id || bot.id;
      userMap.set(botId, {
        ...bot,
        isBot: true,
        isOnline: true,
        _id: botId,
        username: bot.name || bot.username // Ensure bots have a username
      });
    });
  
    // Then process users, not overwriting bots
    (users || []).forEach(user => {
      if (!userMap.has(user._id)) {
        userMap.set(user._id, {
          ...user,
          isBot: false,
          isOnline: onlineUsers.includes(user._id),
          _id: user._id
        });
      }
    });
  
    const allUsers = Array.from(userMap.values());
  
    console.log('All users before filtering:', allUsers);
  
    const filteredAndSortedUsers = allUsers
      .filter(user => 
        (user.username || user.name || '').toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => {
        if (a.isBot && !b.isBot) return -1;
        if (!a.isBot && b.isBot) return 1;
        if (a.isOnline && !b.isOnline) return -1;
        if (!a.isOnline && b.isOnline) return 1;
        return (a.username || a.name || '').localeCompare(b.username || b.name || '');
      });
  
    console.log('Filtered and sorted users:', filteredAndSortedUsers);
    return filteredAndSortedUsers;
  }, [users, bots, searchTerm, onlineUsers]);
  
  return (
    <div className={`sidebar ${collapsed ? 'sidebar--collapsed' : ''}`}>
      {!collapsed && (
        <>
          <SearchBar onChange={setSearchTerm} />
          {botsLoading ? (
            <div className="loading-state">Loading bots...</div>
          ) : (
            <UserList 
              users={filteredUsers} 
              onUserClick={onUserClick}
              onProfileClick={onProfileClick}
            />
          )}
        </>
      )}
      {collapsed && (
        <div className="sidebar__collapsed-content">
          <div className="sidebar__collapsed-icon">☰</div>
          {/* You can add more icons or a user count here */}
        </div>
      )}
    </div>
  );
});

Sidebar.propTypes = {
  users: PropTypes.array,
  bots: PropTypes.array,
  onUserClick: PropTypes.func,
  onProfileClick: PropTypes.func,
  onlineUsers: PropTypes.array,
  botsLoading: PropTypes.bool,
  collapsed: PropTypes.bool.isRequired,
};

export default Sidebar;