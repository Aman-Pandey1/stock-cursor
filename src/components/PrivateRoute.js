// components/PrivateRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';

const PrivateRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem('token'); // or any login flag
  return isAuthenticated ? children : <Navigate to="/" />;
};

export default PrivateRoute;
