import React, { memo, useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import '../UserProfileCard.css';

const UserProfileCard = memo(({ user, position, onClose }) => {
  const [cardPosition, setCardPosition] = useState(position);

  useEffect(() => {
    console.log('User data received in UserProfileCard:', user); // Debugging: Check user data
    const card = document.querySelector('.user-profile-card');
    if (card) {
      const rect = card.getBoundingClientRect();
      const newPosition = { ...position };

      if (rect.right > window.innerWidth) {
        newPosition.left = `${window.innerWidth - rect.width}px`;
      }
      if (rect.bottom > window.innerHeight) {
        newPosition.top = `${window.innerHeight - rect.height}px`;
      }

      setCardPosition(newPosition);
    }
  }, [position, user]); // Added user to dependencies to re-run on user change

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (event.target.closest('.user-profile-card') === null) {
        onClose();
      }
    };

    const handleEscapeKey = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscapeKey);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [onClose]);

  const handleImageError = useCallback((e) => {
    e.target.onerror = null; 
    e.target.src = '/default-avatar.png';
  }, []);

  const handleClose = useCallback((e) => {
    e.stopPropagation();
    onClose();
  }, [onClose]);

  if (!user || typeof user !== 'object') {
    console.error('Invalid user data provided to UserProfileCard:', user);
    return null;
  }

  const username = user.username || user.name || user.email || 'Anonymous User';
  const bio = user.bio || 'No bio available';
  const profilePic = user.profilePic || user.profilePicture || user.avatar;
  const isBotUser = user.isBot || user.type === 'bot';

  const getImageUrl = (pic) => {
    if (!pic) return '/default-avatar.png';
    return pic.startsWith('http') ? pic : `${process.env.REACT_APP_API_URL || ''}${pic}`;
  };

  return (
    <div className="user-profile-card" style={cardPosition} role="dialog" aria-labelledby="user-profile-title">
      <button className="close-button" onClick={handleClose} aria-label="Close profile card">×</button>
      <img 
        src={getImageUrl(profilePic)}
        alt={`${username}'s profile`} 
        className="profile-pic" 
        onError={handleImageError}
      />
      <h3 id="user-profile-title">{username}</h3>
      {user.isAdmin && <span className="admin-badge" title="Admin" aria-label="Admin user">👑</span>}
      {isBotUser && <span className="bot-badge" title="Bot" aria-label="Bot user">🤖</span>}
      <p>{bio}</p>
    </div>
  );
});

UserProfileCard.propTypes = {
  user: PropTypes.shape({
    username: PropTypes.string,
    name: PropTypes.string,
    email: PropTypes.string,
    profilePic: PropTypes.string,
    profilePicture: PropTypes.string,
    avatar: PropTypes.string,
    isAdmin: PropTypes.bool,
    isBot: PropTypes.bool,
    type: PropTypes.string,
    bio: PropTypes.string
  }).isRequired,
  position: PropTypes.shape({
    top: PropTypes.string,
    left: PropTypes.string
  }).isRequired,
  onClose: PropTypes.func.isRequired
};

UserProfileCard.displayName = 'UserProfileCard';

export default UserProfileCard;
