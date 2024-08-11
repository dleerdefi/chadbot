import React from 'react';
import '../UserProfileCard.css';

const UserProfileCard = ({ user, position, onClose }) => {
  if (!user) return null;

  return (
    <div className="user-profile-card" style={position}>
      <button className="close-button" onClick={onClose}>×</button>
      <img src={user.profilePic || '/default-avatar.png'} alt="Profile" className="profile-pic" />
      <h3>{user.name}</h3>
      <p>{user.bio || 'No bio available'}</p>
    </div>
  );
};

export default UserProfileCard;