import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSubscription } from '../hooks/useSubscription';
import UpgradePrompt from './UpgradePrompt';

// Enhanced Private Route with Feature Control
const FeatureProtectedRoute = ({ 
  children, 
  requiredFeature, 
  route, 
  fallback = null,
  redirectTo = '/subscription',
  showUpgradePrompt = true 
}) => {
  const { hasFeature, canAccessRoute, getFeatureForRoute } = useSubscription();
  
  // Check if user has required feature
  if (requiredFeature && !hasFeature(requiredFeature)) {
    if (showUpgradePrompt) {
      return <UpgradePrompt featureName={requiredFeature} />;
    }
    return fallback || <Navigate to={redirectTo} replace />;
  }
  
  // Check if user can access the route
  if (route && !canAccessRoute(route)) {
    if (showUpgradePrompt) {
      const featureName = getFeatureForRoute(route);
      return <UpgradePrompt featureName={featureName} />;
    }
    return fallback || <Navigate to={redirectTo} replace />;
  }
  
  return children;
};

export default FeatureProtectedRoute;
