import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { isAuthenticated, isTokenExpired } from './auth';

const PrivateRoute = ({ children }) => {
  const location = useLocation();
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');

  if (!token || isTokenExpired(token)) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return children;
};

export default PrivateRoute;
