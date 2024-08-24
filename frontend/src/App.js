import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ChatWindow from './components/ChatWindow';
import Login from './components/Login';
import Register from './components/Register';
import Account from './components/AccountSection';
import Sidebar from './components/Sidebar';
import ResetPassword from './components/ResetPassword';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import { AuthProvider } from './contexts/AuthContext';
import { WebSocketProvider } from './contexts/WebSocketContext';
import { debounce } from 'lodash';
import './App.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

const Loading = () => (
  <div className="loading">
    <div className="spinner"></div>
    <p>Loading...</p>
  </div>
);

const fetchWithRetry = async (url, options, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await axios(url, options);
    } catch (error) {
      if (error.response && error.response.status === 429) {
        const delay = Math.pow(2, i) * 1000; // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }
  throw new Error('Max retries reached');
};

const App = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [userBarCollapsed, setUserBarCollapsed] = useState(false);

  const refreshToken = useCallback(async () => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      try {
        const newToken = await currentUser.getIdToken(true);
        setUser(prevUser => ({ ...prevUser, token: newToken }));
        return newToken;
      } catch (error) {
        console.error('Error refreshing token:', error);
        setError('Failed to refresh authentication. Please log in again.');
        return null;
      }
    }
    return null;
  }, []);

  const fetchUserData = useCallback(async (token) => {
    try {
      const response = await fetchWithRetry(`${API_URL}/api/current_user`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setUser({ ...response.data, token });
      setError(null);
    } catch (error) {
      console.error('Error fetching current user:', error);
      setUser(null);
      setError('Failed to load user data. Please try logging in again.');
    }
  }, []);

  const debouncedFetchUserData = useCallback((token) => {
    const debouncedFetch = debounce((token) => {
      fetchUserData(token);
    }, 5000);
    debouncedFetch(token);
    return debouncedFetch.cancel;
  }, [fetchUserData]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        const token = await refreshToken();
        if (token) {
          debouncedFetchUserData(token);
        }
      } else {
        setUser(null);
        setError(null);
      }
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [refreshToken, debouncedFetchUserData]);

  if (loading) {
    return <Loading />;
  }
  
  return (
    <AuthProvider value={{ user, setUser, refreshToken, error, setError }}>
      <WebSocketProvider>
        <Router>
          <div className="App">
            {error && <div className="error-message">{error}</div>}
            <Routes>
              <Route path="/login" element={user ? <Navigate to="/app" /> : <Login />} />
              <Route path="/register" element={user ? <Navigate to="/app" /> : <Register />} />
              <Route path="/app" element={user ? 
                <div className="app-container">
                  <header className="header">
                    <img src="/path-to-header-image.jpg" alt="Header" className="header__image" />
                  </header>
                  <div className="main-content">
                    <Sidebar 
                      collapsed={sidebarCollapsed}
                      users={[]} // Pass your users data here
                      bots={[]} // Pass your bots data here
                      onUserClick={() => {}} // Implement this function
                      onProfileClick={() => {}} // Implement this function
                      onlineUsers={[]} // Pass your online users data here
                      botsLoading={false} // Set this based on your bots loading state
                    />
                    <button 
                      className="toggle-button toggle-button--sidebar" 
                      onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                    >
                      {sidebarCollapsed ? '>' : '<'}
                    </button>
                    
                    <ChatWindow />
                    
                    <button 
                      className="toggle-button toggle-button--userbar" 
                      onClick={() => setUserBarCollapsed(!userBarCollapsed)}
                    >
                      {userBarCollapsed ? '<' : '>'}
                    </button>
                    <Account 
                      user={user}
                      setUser={setUser}
                      collapsed={userBarCollapsed}
                    />
                  </div>
                </div>
                : <Navigate to="/login" />} 
              />
              <Route path="/account" element={user ? <Account user={user} setUser={setUser} /> : <Navigate to="/login" />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/" element={<Navigate to={user ? "/app" : "/login"} />} />
            </Routes>
          </div>
        </Router>
      </WebSocketProvider>
    </AuthProvider>
  );
};

export default App;