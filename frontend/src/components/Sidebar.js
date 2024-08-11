// src/components/Sidebar.js
import React from 'react';

const Sidebar = ({ users, bots }) => {
  return (
    <div className="sidebar">
      <div className="bots-section">
        <h3>AI Chatbots</h3>
        {bots.map(bot => (
          <div key={bot.name} className="bot-item online">{bot.name}</div>
        ))}
      </div>
      <div className="users-section">
        <h3>Users</h3>
        <div className="online-users">
          {users.filter(user => user.online).map(user => (
            <div key={user.id} className="user-item online">{user.username}</div>
          ))}
        </div>
        <div className="offline-users">
          {users.filter(user => !user.online).map(user => (
            <div key={user.id} className="user-item offline">{user.username}</div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;