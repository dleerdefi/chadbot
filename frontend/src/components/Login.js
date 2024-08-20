import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getAuth, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, sendPasswordResetEmail } from 'firebase/auth';
import axios from '../axiosConfig';
import { useAuth } from '../contexts/AuthContext';
import '../Login.css'; // Ensure your CSS file is correctly imported

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [resetMessage, setResetMessage] = useState('');
  const navigate = useNavigate();
  const { setUser, refreshToken } = useAuth();
  const auth = getAuth();

  const handleError = (error) => {
    console.error('Login error:', error);
    if (error.response) {
      setError(error.response.data.error || 'An error occurred during login');
    } else if (error.request) {
      setError('No response received from the server. Please try again.');
    } else {
      setError('An unexpected error occurred. Please try again.');
    }
  };

  const updateUserAndNavigate = (userData) => {
    setUser(userData);
    setTimeout(() => navigate('/app'), 100);
  };

  const handleEmailPasswordSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      await refreshToken();
      const token = await user.getIdToken();
      
      const response = await axios.post(`${API_URL}/login`, { email }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      updateUserAndNavigate(response.data);
    } catch (error) {
      handleError(error);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      await refreshToken();
      const token = await user.getIdToken();

      const response = await axios.post(`${API_URL}/login`, { email: user.email }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      updateUserAndNavigate(response.data);
    } catch (error) {
      handleError(error);
    }
  };

  const handleForgotPassword = async () => {
    setError(null);
    setResetMessage('');
    if (!email) {
      setError('Please enter your email to reset the password.');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      setResetMessage('Password reset email sent! Check your inbox.');
    } catch (error) {
      handleError(error);
    }
  };

  return (
    <div className="login-container">
      <form onSubmit={handleEmailPasswordSubmit} className="login-form">
        <h2>Login</h2>
        {error && <p className="login-error">{error}</p>}
        {resetMessage && <p className="login-reset-message">{resetMessage}</p>}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="login-input"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="login-input"
        />
        <button type="submit" className="login-button">Login</button>
        <button type="button" onClick={handleForgotPassword} className="forgot-password-button">
          Forgot Password?
        </button>
        <div className="login-divider"><span>OR</span></div>
        <button type="button" onClick={handleGoogleSignIn} className="google-sign-in-button">
          Sign in with Google
        </button>
        <div className="login-divider"><span>Don't have an account?</span></div>
        <Link to="/register" className="register-link">Create Account</Link>
      </form>
    </div>
  );
};

export default Login;