// src/context/AuthContext.jsx
import { createContext, useState, useContext } from 'react';
import api from '../services/api'; 

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [isAuthenticated, setIsAuthenticated] = useState(!!token);

  const login = async (email, password) => {
    // CRITICAL: FastAPI OAuth2 expects form-data, NOT JSON!
    const formData = new URLSearchParams();
    formData.append('username', email); // OAuth2 strictly requires the key to be 'username'
    formData.append('password', password);

    const response = await api.post('/auth/login', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    
    const newToken = response.data.access_token;
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to make importing easier
export const useAuth = () => useContext(AuthContext);