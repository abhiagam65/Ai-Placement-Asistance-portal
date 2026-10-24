import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [profile, setProfile] = useState(() => {
    try {
      const stored = localStorage.getItem('profile');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  // Synchronize user profile on initial load
  useEffect(() => {
    const fetchCurrentUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await api.get('/auth/me');
        if (res.success) {
          setUser(res.user);
          setProfile(res.profile);
          localStorage.setItem('user', JSON.stringify(res.user));
          if (res.profile) localStorage.setItem('profile', JSON.stringify(res.profile));
        }
      } catch (err) {
        console.warn('Session expired or token invalid. Logging out.');
        logout();
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentUser();
  }, [token]);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.success && res.token) {
      localStorage.setItem('token', res.token);
      localStorage.setItem('user', JSON.stringify(res.user));
      if (res.profile) localStorage.setItem('profile', JSON.stringify(res.profile));

      setToken(res.token);
      setUser(res.user);
      setProfile(res.profile);
      return res;
    }
    throw new Error(res.message || 'Login failed');
  };

  const register = async (userData) => {
    const res = await api.post('/auth/register', userData);
    if (res.success && res.token) {
      localStorage.setItem('token', res.token);
      localStorage.setItem('user', JSON.stringify(res.user));
      if (res.profile) localStorage.setItem('profile', JSON.stringify(res.profile));

      setToken(res.token);
      setUser(res.user);
      setProfile(res.profile);
      return res;
    }
    throw new Error(res.message || 'Registration failed');
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('profile');
    setToken(null);
    setUser(null);
    setProfile(null);
  };

  const updateProfileData = async (data) => {
    const res = await api.put('/auth/profile', data);
    if (res.success) {
      setUser(res.user);
      setProfile(res.profile);
      localStorage.setItem('user', JSON.stringify(res.user));
      if (res.profile) localStorage.setItem('profile', JSON.stringify(res.profile));
      return res;
    }
    throw new Error(res.message || 'Profile update failed');
  };

  const value = {
    user,
    profile,
    token,
    loading,
    isAuthenticated: Boolean(token && user),
    isAdmin: user?.role === 'admin',
    isStudent: user?.role === 'student',
    login,
    register,
    logout,
    updateProfileData
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
