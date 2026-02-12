// TypeScript type definitions for the subscription system
// This file provides type definitions for better IDE support and type checking

/**
 * Available subscription plan types
 */
export const PLAN_TYPES = {
  BASIC: 'basic',
  PROFESSIONAL: 'professional',
  BUSINESS: 'business',
  ENTERPRISE: 'enterprise'
};

/**
 * Feature configuration structure
 */
export const FEATURE_CONFIG = {
  ENABLED: 'enabled',
  DISABLED: 'disabled',
  LIMITED: 'limited',
  UNLIMITED: 'unlimited'
};

/**
 * Subscription plan structure
 * @typedef {Object} SubscriptionPlan
 * @property {string} name - Display name of the plan
 * @property {number} price - Monthly price
 * @property {Object} features - Feature configuration
 */

/**
 * Feature definition structure
 * @typedef {Object} Feature
 * @property {boolean} enabled - Whether the feature is enabled
 * @property {number|string} limit - Feature limit (number or 'unlimited')
 * @property {string} description - Feature description
 */

/**
 * Limit check result
 * @typedef {Object} LimitCheckResult
 * @property {boolean} withinLimit - Whether current usage is within limit
 * @property {number|string} limit - The limit value
 * @property {number} current - Current usage
 * @property {number} remaining - Remaining usage
 */

/**
 * Subscription context value structure
 * @typedef {Object} SubscriptionContextValue
 * @property {string} currentPlan - Current subscription plan
 * @property {Object} features - Available features
 * @property {Object} routeMapping - Route to feature mapping
 * @property {boolean} loading - Loading state
 * @property {string|null} error - Error message
 * @property {boolean} demoMode - Demo mode flag
 * @property {Function} hasFeature - Check if feature is available
 * @property {Function} getFeature - Get feature configuration
 * @property {Function} getFeatureLimit - Get feature limit
 * @property {Function} getFeatureValue - Get feature value
 * @property {Function} checkLimit - Check usage limit
 * @property {Function} canAccessRoute - Check route access
 * @property {Function} updateSubscription - Update subscription plan
 * @property {Function} updateFeatureUsage - Update feature usage
 */

/**
 * API service configuration
 * @typedef {Object} APIConfig
 * @property {string} baseURL - Base API URL
 * @property {Function} getHeaders - Headers function
 * @property {number} timeout - Request timeout
 */

/**
 * Feature control component props
 * @typedef {Object} FeatureControlProps
 * @property {string} feature - Feature name to check
 * @property {string} className - CSS class names
 * @property {ReactNode} children - Child components
 * @property {Function} onClick - Click handler
 * @property {boolean} disabled - Disabled state
 */

/**
 * Route protection props
 * @typedef {Object} RouteProtectionProps
 * @property {string} route - Route to protect
 * @property {string} requiredFeature - Required feature
 * @property {ReactNode} children - Child components
 * @property {ReactNode} fallback - Fallback component
 * @property {string} redirectTo - Redirect URL
 */

// Export common constants for use in components
export const SUBSCRIPTION_EVENTS = {
  PLAN_CHANGED: 'plan_changed',
  FEATURE_UPDATED: 'feature_updated',
  LIMIT_REACHED: 'limit_reached',
  USAGE_UPDATED: 'usage_updated'
};

export const ERROR_TYPES = {
  NETWORK_ERROR: 'network_error',
  AUTHORIZATION_ERROR: 'authorization_error',
  LIMIT_EXCEEDED: 'limit_exceeded',
  FEATURE_NOT_AVAILABLE: 'feature_not_available',
  PLAN_NOT_FOUND: 'plan_not_found'
};

export const DEFAULT_LIMITS = {
  BASIC: {
    customers: 100,
    suppliers: 10,
    items: 50,
    users: 1
  },
  PROFESSIONAL: {
    customers: 1000,
    suppliers: 100,
    items: 500,
    users: 5
  },
  BUSINESS: {
    customers: 10000,
    suppliers: 1000,
    items: 5000,
    users: 25
  },
  ENTERPRISE: {
    customers: -1,
    suppliers: -1,
    items: -1,
    users: -1
  }
};

// Helper functions for type checking
export const isValidPlan = (plan) => Object.values(PLAN_TYPES).includes(plan);
export const isValidFeature = (feature, planFeatures) => planFeatures && planFeatures[feature];

// Default export for convenience
export default {
  PLAN_TYPES,
  FEATURE_CONFIG,
  SUBSCRIPTION_EVENTS,
  ERROR_TYPES,
  DEFAULT_LIMITS,
  isValidPlan,
  isValidFeature
};
