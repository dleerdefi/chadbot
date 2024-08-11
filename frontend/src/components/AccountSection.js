import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';

const API_URL = 'http://localhost:3000'; // Adjust this if your backend is on a different port

const AccountSection = ({ user, setUser }) => {
  const [username, setUsername] = useState(user.username || '');
  const [bio, setBio] = useState(user.bio || '');
  const [profilePic, setProfilePic] = useState(user.profilePic || '');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const updateProfile = async () => {
    try {
      const response = await axios.post(`${API_URL}/api/update-profile`, 
        { username, bio }, 
        {
          headers: { 'Authorization': `Bearer ${user.token}` }
        }
      );
      setUser(response.data.user);
      setSuccess('Profile updated successfully');
      setError('');
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Failed to update profile: ' + (error.response?.data?.error || error.message));
      setSuccess('');
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    const formData = new FormData();
    formData.append('profilePic', file);

    try {
      const response = await axios.post(`${API_URL}/api/upload-profile-pic`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${user.token}`
        }
      });
      setProfilePic(response.data.profilePicUrl);
      setUser({...user, profilePic: response.data.profilePicUrl});
      setSuccess('Profile picture uploaded successfully');
      setError('');
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      setError('Failed to upload profile picture: ' + (error.response?.data?.error || error.message));
      setSuccess('');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
      setError('Failed to log out');
    }
  };

  return (
    <div className="account-section">
      <h3>Account</h3>
      <img 
        src={profilePic || '/default-avatar.png'} 
        alt="Profile" 
        className="profile-pic"
        style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '50%' }}
      />
      <input type="file" onChange={handleFileUpload} accept="image/*" />
      <p>Email: {user.email}</p>
      <div>
        <label htmlFor="username">Username:</label>
        <input
          type="text"
          id="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
      </div>
      <div>
        <label htmlFor="bio">Bio:</label>
        <textarea
          id="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows="4"
          style={{ width: '100%', marginBottom: '10px' }}
        />
      </div>
      <button onClick={updateProfile}>Update Profile</button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {success && <p style={{ color: 'green' }}>{success}</p>}
      <button onClick={handleLogout} className="logout-button">Log Out</button>
    </div>
  );
};

export default AccountSection;