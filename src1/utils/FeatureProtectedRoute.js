import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSubscription } from '../Context/SubscriptionContext';

// Enhanced Private Route with Feature Control
const FeatureProtectedRoute = ({ 
  children, 
  requiredFeature, 
  route, 
  fallback = null,
  redirectTo = '/subscription' 
}) => {
  const { hasFeature, canAccessRoute } = useSubscription();
  
  // Check if user has required feature
  if (requiredFeature && !hasFeature(requiredFeature)) {
    return fallback || <Navigate to={redirectTo} replace />;
  }
  
  // Check if user can access the route
  if (route && !canAccessRoute(route)) {
    return fallback || <Navigate to={redirectTo} replace />;
  }
  
  return children;
};

export default FeatureProtectedRoute;
