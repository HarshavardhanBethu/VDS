import React, { createContext, useContext, useState, useEffect } from 'react';
import * as api from '../services/api.js';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('vdsUser');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('vdsToken') || null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token && !user) {
      api.getProfile()
        .then((res) => {
          if (res.success) {
            setUser(res.data);
            localStorage.setItem('vdsUser', JSON.stringify(res.data));
          }
        })
        .catch(() => {
          logout();
        });
    }
  }, [token]);

  const login = async (phoneOrEmail, password) => {
    setLoading(true);
    try {
      const res = await api.login({ phone: phoneOrEmail, password });
      if (res.success && res.token) {
        localStorage.setItem('vdsToken', res.token);
        localStorage.setItem('vdsUser', JSON.stringify(res.user));
        setToken(res.token);
        setUser(res.user);
        return res;
      }
      throw new Error(res.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const signup = async (userData) => {
    setLoading(true);
    try {
      const res = await api.signup(userData);
      if (res.success && res.token) {
        localStorage.setItem('vdsToken', res.token);
        localStorage.setItem('vdsUser', JSON.stringify(res.user));
        setToken(res.token);
        setUser(res.user);
        return res;
      }
      throw new Error(res.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('vdsToken');
    localStorage.removeItem('vdsUser');
    setToken(null);
    setUser(null);
  };

  const isAuthenticated = !!token && !!user;
  const isCustomer = user?.role === 'customer';
  const isShopkeeper = user?.role === 'shopkeeper';
  const isDelivery = user?.role === 'delivery_partner';
  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        signup,
        logout,
        isAuthenticated,
        isCustomer,
        isShopkeeper,
        isDelivery,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

