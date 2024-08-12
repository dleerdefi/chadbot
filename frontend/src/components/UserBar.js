import React, { useState } from 'react';
import PropTypes from 'prop-types';
import './UserBar.css';

const UserBar = ({ users, bots, onUserClick, onBotClick }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const filteredBots = bots.filter(bot => 
    bot.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="user-bar">
      <input 
        type="text" 
        placeholder="Search users and bots" 
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <h3>Online Users</h3>
      {filteredUsers.length > 0 ? (
        <ul>
          {filteredUsers.map((user) => (
            <li key={user.id} onClick={() => onUserClick(user)} className={user.status}>
              <span className="status-indicator"></span>
              {user.name}
            </li>
          ))}
        </ul>
      ) : (
        <p>No users online</p>
      )}
      <h3>Bots</h3>
      {filteredBots.length > 0 ? (
        <ul>
          {filteredBots.map((bot) => (
            <li key={bot.id} onClick={() => onBotClick(bot)}>
              {bot.name}
            </li>
          ))}
        </ul>
      ) : (
        <p>No bots available</p>
      )}
    </div>
  );
};

UserBar.propTypes = {
  users: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    status: PropTypes.string.isRequired
  })).isRequired,
  bots: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired
  })).isRequired,
  onUserClick: PropTypes.func,
  onBotClick: PropTypes.func
};

export default UserBar;