import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    const userName = localStorage.getItem('userName');
    const userRoles = localStorage.getItem('userRoles');

    if (token && userName) {
      setUser({
        token,
        name: userName,
        roles: userRoles ? JSON.parse(userRoles) : [],
      });
      api.setToken(token);
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const data = await api.login(email, password);
    const userData = {
      token: data.token,
      name: `${data.firstName} ${data.lastName}`,
      roles: data.roles || [],
    };

    localStorage.setItem('token', data.token);
    localStorage.setItem('userName', userData.name);
    localStorage.setItem('userRoles', JSON.stringify(userData.roles));

    api.setToken(data.token);
    setUser(userData);

    return data;
  };

  const register = async (firstName, lastName, email, password) => {
    const data = await api.register(firstName, lastName, email, password);
    const userData = {
      token: data.token,
      name: `${data.firstName} ${data.lastName}`,
      roles: data.roles || [],
    };

    localStorage.setItem('token', data.token);
    localStorage.setItem('userName', userData.name);
    localStorage.setItem('userRoles', JSON.stringify(userData.roles));

    api.setToken(data.token);
    setUser(userData);

    return data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userName');
    localStorage.removeItem('userRoles');
    api.setToken(null);
    setUser(null);
  };

  const isAdmin = () => {
    return user?.roles?.includes('Admin') || false;
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isAdmin, loading }}>
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
