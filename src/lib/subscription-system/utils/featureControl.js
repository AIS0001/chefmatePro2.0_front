// Feature control utilities
// Reusable functions for feature checking and validation

import { DEFAULT_ROUTE_MAPPING, getPlanFeature, isUnlimited } from './planDefaults';
import SubscriptionConfig from './config';

export class FeatureValidator {
  constructor(currentPlan, features) {
    this.currentPlan = currentPlan;
    this.features = features;
  }

  // Check if a feature is enabled
  hasFeature(featureName) {
    if (!this.features || !this.currentPlan) return false;
    const planData = this.features[this.currentPlan];
    if (!planData) return false;
    
    // Support both direct feature access and nested features
    const planFeatures = planData.features || planData;
    const feature = planFeatures[featureName];
    return feature?.enabled || false;
  }

  // Get feature configuration
  getFeature(featureName) {
    if (!this.features || !this.currentPlan) return null;
    const planData = this.features[this.currentPlan];
    if (!planData) return null;
    
    // Support both direct feature access and nested features
    const planFeatures = planData.features || planData;
    return planFeatures[featureName] || null;
  }

  // Get feature limit
  getFeatureLimit(featureName) {
    const feature = this.getFeature(featureName);
    return feature?.limit || 0;
  }

  // Get feature value (limit formatted)
  getFeatureValue(featureName) {
    const limit = this.getFeatureLimit(featureName);
    return isUnlimited(limit) ? 'unlimited' : limit;
  }

  // Check if within usage limit
  checkLimit(featureName, currentUsage) {
    const limit = this.getFeatureLimit(featureName);
    
    if (isUnlimited(limit)) {
      return { withinLimit: true, limit: -1, remaining: -1 };
    }
    
    if (limit === 0) {
      return { withinLimit: false, limit: 0, remaining: 0 };
    }
    
    const withinLimit = currentUsage < limit;
    const remaining = Math.max(0, limit - currentUsage);
    
    return { withinLimit, limit, remaining };
  }

  // Check if user can access a route
  canAccessRoute(route) {
    const featureName = this.getFeatureForRoute(route);
    if (!featureName) return true; // No feature mapping means open access
    
    return this.hasFeature(featureName);
  }

  // Get feature name for route
  getFeatureForRoute(route) {
    const routeMapping = SubscriptionConfig.get('routeMapping') || DEFAULT_ROUTE_MAPPING;
    return routeMapping[route] || null;
  }

  // Get all available features for current plan
  getAvailableFeatures() {
    if (!this.features || !this.currentPlan) return [];
    const planData = this.features[this.currentPlan];
    if (!planData) return [];
    
    // Support both direct feature access and nested features
    const planFeatures = planData.features || planData;
    return Object.keys(planFeatures).filter(featureName => 
      planFeatures[featureName]?.enabled
    );
  }

  // Get plan comparison
  comparePlans(targetPlan) {
    if (!this.features || !targetPlan) return null;
    
    const currentPlanData = this.features[this.currentPlan] || {};
    const targetPlanData = this.features[targetPlan] || {};
    
    // Support both direct feature access and nested features
    const currentFeatures = currentPlanData.features || currentPlanData;
    const targetFeatures = targetPlanData.features || targetPlanData;
    
    const comparison = {
      upgrades: [],
      downgrades: [],
      unchanged: []
    };
    
    // Check all features in both plans
    const allFeatures = new Set([
      ...Object.keys(currentFeatures),
      ...Object.keys(targetFeatures)
    ]);
    
    allFeatures.forEach(featureName => {
      const currentFeature = currentFeatures[featureName];
      const targetFeature = targetFeatures[featureName];
      
      if (!currentFeature?.enabled && targetFeature?.enabled) {
        comparison.upgrades.push(featureName);
      } else if (currentFeature?.enabled && !targetFeature?.enabled) {
        comparison.downgrades.push(featureName);
      } else if (currentFeature?.enabled && targetFeature?.enabled) {
        // Check if limits increased
        const currentLimit = currentFeature.limit || 0;
        const targetLimit = targetFeature.limit || 0;
        
        if (targetLimit > currentLimit || (isUnlimited(targetLimit) && !isUnlimited(currentLimit))) {
          comparison.upgrades.push(featureName);
        } else if (currentLimit > targetLimit || (isUnlimited(currentLimit) && !isUnlimited(targetLimit))) {
          comparison.downgrades.push(featureName);
        } else {
          comparison.unchanged.push(featureName);
        }
      }
    });
    
    return comparison;
  }
}

// Storage utilities
export class StorageManager {
  constructor() {
    const config = SubscriptionConfig.get('storage');
    this.storageType = config?.type || 'localStorage';
    this.keys = config?.keys || {
      currentPlan: 'currentPlan',
      features: 'features',
      demoMode: 'demoMode'
    };
  }

  getStorage() {
    switch (this.storageType) {
      case 'sessionStorage':
        return sessionStorage;
      case 'memory':
        return this.memoryStorage;
      case 'localStorage':
      default:
        return localStorage;
    }
  }

  // Memory storage fallback
  memoryStorage = {
    data: {},
    setItem(key, value) {
      this.data[key] = value;
    },
    getItem(key) {
      return this.data[key] || null;
    },
    removeItem(key) {
      delete this.data[key];
    },
    clear() {
      this.data = {};
    }
  };

  set(key, value) {
    try {
      const storage = this.getStorage();
      const storageKey = this.keys[key] || key;
      storage.setItem(storageKey, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Storage set error:', error);
      return false;
    }
  }

  get(key) {
    try {
      const storage = this.getStorage();
      const storageKey = this.keys[key] || key;
      const value = storage.getItem(storageKey);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Storage get error:', error);
      return null;
    }
  }

  remove(key) {
    try {
      const storage = this.getStorage();
      const storageKey = this.keys[key] || key;
      storage.removeItem(storageKey);
      return true;
    } catch (error) {
      console.error('Storage remove error:', error);
      return false;
    }
  }

  clear() {
    try {
      const storage = this.getStorage();
      Object.values(this.keys).forEach(key => {
        storage.removeItem(key);
      });
      return true;
    } catch (error) {
      console.error('Storage clear error:', error);
      return false;
    }
  }
}

// Error handling utilities
export class ErrorHandler {
  static handleFeatureError(error, context = {}) {
    const config = SubscriptionConfig.get('errors');
    
    console.error('Feature control error:', error, context);
    
    // Log to external service if configured
    if (config?.logService) {
      config.logService.error('feature_control_error', {
        error: error.message,
        stack: error.stack,
        context
      });
    }
    
    // Return fallback behavior
    if (config?.fallbackToDemo) {
      return {
        fallback: true,
        demoMode: true,
        plan: config.demo?.defaultPlan || 'basic'
      };
    }
    
    return {
      fallback: false,
      error: error.message
    };
  }

  static async retryOperation(operation, maxRetries = 3, delay = 1000) {
    let lastError;
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        if (i < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError;
  }
}

// Validation utilities
export const validatePlanStructure = (planData) => {
  const errors = [];
  
  if (!planData || typeof planData !== 'object') {
    errors.push('Plan data must be an object');
    return errors;
  }
  
  Object.keys(planData).forEach(planName => {
    const plan = planData[planName];
    
    if (!plan.name) {
      errors.push(`Plan ${planName} missing name`);
    }
    
    if (!plan.features || typeof plan.features !== 'object') {
      errors.push(`Plan ${planName} missing or invalid features`);
    } else {
      Object.keys(plan.features).forEach(featureName => {
        const feature = plan.features[featureName];
        
        if (typeof feature.enabled !== 'boolean') {
          errors.push(`Plan ${planName}, feature ${featureName}: enabled must be boolean`);
        }
        
        if (feature.limit !== undefined && typeof feature.limit !== 'number') {
          errors.push(`Plan ${planName}, feature ${featureName}: limit must be number`);
        }
      });
    }
  });
  
  return errors;
};

export const validateRouteMapping = (routeMapping) => {
  const errors = [];
  
  if (!routeMapping || typeof routeMapping !== 'object') {
    errors.push('Route mapping must be an object');
    return errors;
  }
  
  Object.keys(routeMapping).forEach(route => {
    if (!route.startsWith('/')) {
      errors.push(`Route ${route} should start with /`);
    }
    
    if (typeof routeMapping[route] !== 'string') {
      errors.push(`Route ${route} should map to a string feature name`);
    }
  });
  
  return errors;
};

// Export instances
export const storageManager = new StorageManager();
export const errorHandler = ErrorHandler;
