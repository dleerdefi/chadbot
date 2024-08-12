import React, { useState } from 'react';
import PropTypes from 'prop-types';
// import './Sidebar.css';

const SearchBar = ({ onChange }) => (
  <input 
    type="text" 
    placeholder="Search bots and users" 
    onChange={(e) => onChange(e.target.value)}
    className="search-bar"
  />
);

const BotList = ({ bots, onBotClick }) => (
  <div className="bots-section">
    <h3>AI Chatbots</h3>
    {bots.length > 0 ? (
      bots.map(bot => (
        <div 
          key={bot.id || `bot-${bot.name}`} 
          className="bot-item online"
          onClick={() => onBotClick(bot)}
        >
          <span className="status-indicator"></span>
          {bot.name}
        </div>
      ))
    ) : (
      <div className="empty-state">No chatbots available</div>
    )}
  </div>
);

const UserList = ({ users, onUserClick }) => (
  <div className="users-section">
    <h3>Users</h3>
    {users.length > 0 ? (
      <>
        <div className="online-users">
          {users.filter(user => user.online).map(user => (
            <div 
              key={user.id || `user-${user.name}`} 
              className="user-item online"
              onClick={() => onUserClick(user)}
            >
              <span className="status-indicator"></span>
              {user.username || user.name}
            </div>
          ))}
        </div>
        <div className="offline-users">
          {users.filter(user => !user.online).map(user => (
            <div 
              key={user.id || `user-${user.name}`} 
              className="user-item offline"
              onClick={() => onUserClick(user)}
            >
              <span className="status-indicator"></span>
              {user.username || user.name}
            </div>
          ))}
        </div>
      </>
    ) : (
      <div className="empty-state">No users available</div>
    )}
  </div>
);

const Sidebar = ({ users, bots, onUserClick }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredBots = bots.filter(bot => 
    bot.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const filteredUsers = users.filter(user => 
    (user.username || user.name).toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="sidebar">
      <SearchBar onChange={setSearchTerm} />
      <BotList bots={filteredBots} onBotClick={onUserClick} />
      <UserList users={filteredUsers} onUserClick={onUserClick} />
    </div>
  );
};

Sidebar.propTypes = {
    users: PropTypes.arrayOf(PropTypes.shape({
      id: PropTypes.string,
      name: PropTypes.string,
      username: PropTypes.string,
      online: PropTypes.bool
    })).isRequired,
    bots: PropTypes.arrayOf(PropTypes.shape({
      id: PropTypes.string,
      name: PropTypes.string
    })).isRequired,
    onUserClick: PropTypes.func.isRequired
  };

export default Sidebar;