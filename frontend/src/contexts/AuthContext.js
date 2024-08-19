import React, { createContext, useState, useContext, useEffect } from 'react';
import { auth } from '../firebase';
import axios from 'axios';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const token = await firebaseUser.getIdToken();
          const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/current_user`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          setUser({ ...response.data, token });
        } catch (error) {
          console.error('Error fetching user data:', error);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const refreshToken = async () => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      try {
        const newToken = await currentUser.getIdToken(true);
        setUser(prevUser => ({ ...prevUser, token: newToken }));
        return newToken;
      } catch (error) {
        console.error('Error refreshing token:', error);
        await logout();
        return null;
      }
    }
    return null;
  };

  const authenticatedRequest = async (url, options = {}) => {
    const token = await refreshToken(); // Get the latest token

    if (!token) {
      throw new Error('User is not authenticated');
    }

    const response = await axios({
      ...options,
      url: `${process.env.REACT_APP_API_URL}${url}`,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${token}`
      }
    });

    return response.data;
  };

  const login = async (email, password) => {
    try {
      const userCredential = await auth.signInWithEmailAndPassword(email, password);
      const token = await userCredential.user.getIdToken();
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/current_user`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setUser({ ...response.data, token });
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await auth.signOut();
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  const register = async (email, password, username) => {
    try {
      const userCredential = await auth.createUserWithEmailAndPassword(email, password);
      const token = await userCredential.user.getIdToken();
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/register`, 
        { email, username },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      setUser({ ...response.data, token });
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const value = {
    user,
    setUser,
    refreshToken,
    login,
    logout,
    register,
    loading,
    authenticatedRequest // New function added to the context
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

// Export refreshToken function directly
export const refreshTokenFn = auth.currentUser ? () => auth.currentUser.getIdToken(true) : null;
