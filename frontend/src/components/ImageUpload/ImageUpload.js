import React, { useState } from 'react';
import axios from '../axiosConfig';
import { useAuth } from '../../contexts/AuthContext';

const ImageUpload = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const { logout } = useAuth(); 

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    handleFile(file);
  };

  const handleFile = (file) => {
    if (file && file.type.startsWith('image/')) {
      if (file.size > 5 * 1024 * 1024) {
        setError('File is too large. Maximum size is 5MB.');
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setError(null);
    } else {
      setError('Please select an image file.');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setIsLoading(true);
    setError(null);
    const formData = new FormData();
    formData.append('profilePic', selectedFile);

    try {
      const response = await axios.post('/api/upload-profile-pic', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        }
      });
      console.log('File uploaded:', response.data);
      // Here you might want to update the user's profile picture in your app's state
      // For example: updateUserProfilePic(response.data.profilePicUrl);
    } catch (error) {
      console.error('Error uploading file:', error);
      if (error.response) {
        if (error.response.status === 401) {
          setError('Authentication failed. Please log in again.');
          // You might want to redirect to login page or show a login prompt
          // logout(); // Uncomment this if you want to log out the user automatically
        } else {
          setError(error.response.data.error || 'Failed to upload image. Please try again.');
        }
      } else if (error.request) {
        setError('No response received from the server. Please try again.');
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  };

  return (
    <div>
      <div 
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{ 
          border: `2px dashed ${isDragging ? 'blue' : 'gray'}`,
          padding: '20px',
          textAlign: 'center'
        }}
      >
        Drag and drop an image here or click to select
        <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
      </div>
      {previewUrl && <img src={previewUrl} alt="Preview" style={{ maxWidth: '200px' }} />}
      <button onClick={handleUpload} disabled={!selectedFile || isLoading}>
        {isLoading ? 'Uploading...' : 'Upload'}
      </button>
      {isLoading && <progress value={uploadProgress} max="100" />}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
};

export default ImageUpload;