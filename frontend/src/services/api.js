// src/services/api.js
import axios from 'axios';

// Create a centralized instance pointing to our FastAPI server
const api = axios.create({
  baseURL: 'http://127.0.0.1:8000',
});

// Intercept outgoing requests to attach the JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;