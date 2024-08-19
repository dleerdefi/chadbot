// src/axiosConfig.js

import axios from 'axios';
import { getAuth } from 'firebase/auth';

const instance = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
});

// Add a single request interceptor to attach the Firebase ID token to every request
instance.interceptors.request.use(
  async (config) => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      
      if (user) {
        const idToken = await user.getIdToken(true);
        config.headers['Authorization'] = `Bearer ${idToken}`;
        console.log('Firebase ID token attached to request');
      } else {
        console.log('No Firebase user found');
      }
    } catch (error) {
      console.error('Error getting Firebase ID token:', error);
    }
    
    return config;
  },
  (error) => {
    console.error('Error in request interceptor:', error);
    return Promise.reject(error);
  }
);

// Response interceptor (optional, for handling token expiration)
instance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const auth = getAuth();
        await auth.currentUser.getIdToken(true);  // Force token refresh
        return instance(originalRequest);
      } catch (refreshError) {
        console.error('Error refreshing token:', refreshError);
        // Handle refresh failure (e.g., redirect to login)
      }
    }
    return Promise.reject(error);
  }
);

export default instance;