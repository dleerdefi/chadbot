import React, { memo, useCallback } from 'react';
import PropTypes from 'prop-types';
import '../UserProfileCard.css';

const UserProfileCard = memo(({ user, position, onClose }) => {
  const handleImageError = useCallback((e) => {
    e.target.onerror = null; 
    e.target.src = '/default-avatar.png';
  }, []);

  const handleClose = useCallback((e) => {
    e.stopPropagation();
    onClose();
  }, [onClose]);

  if (!user) {
    console.error('No user data provided to UserProfileCard');
    return null;
  }

  return (
    <div className="user-profile-card" style={position}>
      <button className="close-button" onClick={handleClose}>×</button>
      <img 
        src={user.profilePic ? `${process.env.REACT_APP_API_URL}${user.profilePic}` : '/default-avatar.png'} 
        alt={`${user.username}'s profile`} 
        className="profile-pic" 
        onError={handleImageError}
      />
      <h3>{user.username || 'Anonymous User'}</h3>
      {user.isAdmin && <span className="admin-badge" title="Admin">👑</span>}
      <p>{user.bio || 'No bio available'}</p>
    </div>
  );
});

UserProfileCard.propTypes = {
  user: PropTypes.shape({
    username: PropTypes.string,
    profilePic: PropTypes.string,
    isAdmin: PropTypes.bool,
    bio: PropTypes.string
  }),
  position: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired
};

UserProfileCard.displayName = 'UserProfileCard';

export default UserProfileCard;