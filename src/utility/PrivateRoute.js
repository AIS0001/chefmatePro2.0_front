// PrivateRoute.js
import React from 'react';
import { Route, Navigate ,useLocation  } from 'react-router-dom';
import  isAuthenticated  from './auth.js';

const PrivateRoute = ({ element, ...rest }) => {
    const location = useLocation();
  
    return isAuthenticated() ? (
      element
    ) : (
      <Navigate to="/" state={{ from: location }} replace />
    );
  };

export default PrivateRoute;
