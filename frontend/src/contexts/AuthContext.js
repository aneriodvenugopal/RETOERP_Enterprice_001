import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { authService } from '../services';
import notificationService from "../services/notificationService";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load user and token from localStorage on mount
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (phone, otp) => {
    try {
      const data = await authService.verifyOTP(phone, otp);
      setToken(data.access_token);
      setUser(data.user);
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('user_id', data.user.id);
      
      // Initialize Firebase notifications after successful login
      if (data.user && data.user.id) {
        setTimeout(() => {
          notificationService.initialize(data.user.id);
        }, 2000); // Wait 2 seconds after login
      }
      
      return data;
    } catch (error) {
      throw error;
    }
  };

  const loginWithPassword = async (token, user) => {
    try {
      setToken(token);
      setUser(user);
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('user_id', user.id);
      
      // Initialize Firebase notifications after successful login
      if (user && user.id) {
        setTimeout(() => {
          notificationService.initialize(user.id);
        }, 2000);
      }
      
      return { access_token: token, user };
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    authService.logout();
  };

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    isAuthenticated: !!token,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
