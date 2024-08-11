import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ChatWindow from './components/ChatWindow';
import Login from './components/Login';
import Register from './components/Register';
import Account from './components/Account';
import ResetPassword from './components/ResetPassword';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import './App.css';

const API_URL = 'http://localhost:3000'; // Adjust this if your backend is on a different port

const App = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Get the Firebase ID token
          const idToken = await firebaseUser.getIdToken();
          
          // Fetch user data from your backend
          const response = await axios.get(`${API_URL}/api/current_user`, {
            headers: {
              'Authorization': `Bearer ${idToken}`
            }
          });
          setUser({ ...response.data, token: idToken });
        } catch (error) {
          console.error('Error fetching current user:', error);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/login" element={user ? <Navigate to="/app" /> : <Login setUser={setUser} />} />
          <Route path="/register" element={user ? <Navigate to="/app" /> : <Register setUser={setUser} />} />
          <Route path="/app" element={user ? <ChatWindow user={user} setUser={setUser} /> : <Navigate to="/login" />} />
          <Route path="/account" element={user ? <Account user={user} setUser={setUser} /> : <Navigate to="/login" />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/" element={<Navigate to={user ? "/app" : "/login"} />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;