import React from 'react';
import { Route, Navigate, useLocation } from 'react-router-dom';
import { isAuthenticated,isTokenExpired } from './auth';

const PrivateRoute = ({ element, ...rest }) => {
    const location = useLocation();
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');

    // Check if the token is expired or not present
    if (!token || isTokenExpired(token)) {
      return <Navigate to="/" state={{ from: location }} replace />
    }
    return element;
   
};

export default PrivateRoute;
