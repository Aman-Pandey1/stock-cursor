import axios from 'axios';

const API = axios.create({ 
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Request interceptor
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response interceptor
API.interceptors.response.use(
  (response) => {
    // Standardize successful responses
    if (response.data && typeof response.data.success === 'undefined') {
      response.data.success = true;
    }
    return response;
  },
  (error) => {
    // Standardize error responses
    if (error.response) {
      error.response.data = error.response.data || {};
      error.response.data.success = false;
      
      if (error.response.status === 401) {
        // Handle unauthorized access
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

export default API;