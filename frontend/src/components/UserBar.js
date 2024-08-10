import React from 'react';

const UserBar = ({ users, bots }) => (
  <div className="user-bar">
    <h3>Online Users</h3>
    <ul>
      {users.map((user, index) => (
        <li key={index}>{user}</li>
      ))}
    </ul>
    <h3>Bots</h3>
    <ul>
      {bots.map((bot, index) => (
        <li key={index}>{bot}</li>
      ))}
    </ul>
  </div>
);

export default UserBar;
