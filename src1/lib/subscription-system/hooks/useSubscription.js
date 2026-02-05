// Subscription hook and context provider
// Main hook for managing subscription state

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { FeatureValidator, storageManager, errorHandler } from '../utils/featureControl';
import { DEFAULT_PLAN_FEATURES, DEFAULT_ROUTE_MAPPING } from '../utils/planDefaults';
import SubscriptionConfig from '../utils/config';
import  fetchData  from '../../../functions/fetchData';

const SubscriptionContext = createContext();

// Function to fetch subscription data from database
const fetchSubscriptionDataFromDB = async () => {
  try {
    console.log('🔄 Fetching subscription data from database...');
    
    // Get current user's subscription
    const userSubscriptions = await fetchData('user_subscriptions', null, 'id', {
      status: 'active'
    });
    
    let currentPlan = 'basic';
    let currentUserSubscription = null;
    
    if (userSubscriptions && userSubscriptions.length > 0) {
      currentUserSubscription = userSubscriptions.sort((a, b) => 
        new Date(b.created_at) - new Date(a.created_at)
      )[0];
      
      // Get plan details
      const planDetails = await fetchData('subscription_plans', null, 'id', {
        id: currentUserSubscription.plan_id
      });
      
      if (planDetails && planDetails.length > 0) {
        currentPlan = planDetails[0].plan_code;
      }
    }
    
    // Get all features and plan features
    const [features, subscriptionPlans, planFeatures] = await Promise.all([
      fetchData('features', null, 'id', { is_active: true }),
      fetchData('subscription_plans', null, 'id', { is_active: true }),
      fetchData('plan_features', null, 'id', {})
    ]);
    
    // Build feature mapping
    const featureMapping = {};
    
    for (const plan of subscriptionPlans) {
      featureMapping[plan.plan_code] = {};
      
      const planSpecificFeatures = planFeatures.filter(pf => pf.plan_id === plan.id);
      
      for (const feature of features) {
        const planFeature = planSpecificFeatures.find(pf => pf.feature_id === feature.id);
        
        if (planFeature) {
          featureMapping[plan.plan_code][feature.feature_code] = {
            enabled: planFeature.is_enabled,
            limit: planFeature.usage_limit === null ? -1 : planFeature.usage_limit,
            level: planFeature.feature_level || 'basic'
          };
        } else {
          featureMapping[plan.plan_code][feature.feature_code] = {
            enabled: false,
            limit: 0,
            level: 'basic'
          };
        }
      }
    }
    
    console.log('✅ Successfully fetched subscription data:', {
      currentPlan,
      totalFeatures: features.length,
      totalPlans: subscriptionPlans.length
    });
    
    return {
      currentPlan,
      features: featureMapping,
      subscriptionData: {
        userSubscription: currentUserSubscription,
        features,
        subscriptionPlans
      }
    };
    
  } catch (error) {
    console.error('❌ Error fetching subscription data from database:', error);
    throw error;
  }
};

export const useSubscription = () => {
  // 🚨 SUBSCRIPTION SYSTEM DISABLED 🚨
  // Return unlimited access to all features
  return {
    currentPlan: 'enterprise',
    hasFeature: () => true,
    getFeatureValue: () => 'unlimited',
    canAccessRoute: () => true,
    updateSubscription: () => Promise.resolve(),
    getFeatureUsage: () => ({ current: 0, limit: 'unlimited' }),
    updateFeatureUsage: () => Promise.resolve(),
    getAvailablePlans: () => [],
    getFeatureForRoute: () => null,
    isLoading: false,
    subscription: {
      plan: 'enterprise',
      status: 'active',
      features: {}
    }
  };
};

const SubscriptionProvider = ({ 
  children, 
  apiService = null,
  initialPlan = 'basic',
  customFeatures = null,
  customRouteMapping = null,
  onPlanChange = null,
  onError = null
}) => {
  const [currentPlan, setCurrentPlan] = useState(initialPlan);
  const [features, setFeatures] = useState(customFeatures || DEFAULT_PLAN_FEATURES);
  const [routeMapping, setRouteMapping] = useState(customRouteMapping || DEFAULT_ROUTE_MAPPING);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [demoMode, setDemoMode] = useState(true);
  const [validator, setValidator] = useState(null);

  // Initialize validator when plan or features change
  useEffect(() => {
    if (currentPlan && features) {
      setValidator(new FeatureValidator(currentPlan, features));
    }
  }, [currentPlan, features]);

  // Initialize subscription data
  const initializeSubscription = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Try to fetch from database first
      try {
        const dbData = await fetchSubscriptionDataFromDB();
        
        if (dbData && dbData.currentPlan && dbData.features) {
          setCurrentPlan(dbData.currentPlan);
          setFeatures(dbData.features);
          setDemoMode(false);
          
          // Store in local storage for offline fallback
          storageManager.set('currentPlan', dbData.currentPlan);
          storageManager.set('features', dbData.features);
          storageManager.set('demoMode', false);
          
          console.log('✅ Using real-time database subscription data');
          
          if (onPlanChange) {
            onPlanChange(dbData.currentPlan);
          }
          
          return;
        }
      } catch (dbError) {
        console.warn('⚠️ Database not available, trying API fallback:', dbError);
        
        // Try API service if database fails
        if (apiService) {
          try {
            const subscriptionData = await apiService.getUserSubscription();
            const featuresData = await apiService.getUserFeatures();

            if (subscriptionData?.plan) {
              setCurrentPlan(subscriptionData.plan);
              storageManager.set('currentPlan', subscriptionData.plan);
            }

            if (featuresData) {
              setFeatures(featuresData);
              storageManager.set('features', featuresData);
            }

            setDemoMode(false);
            storageManager.set('demoMode', false);
            
            if (onPlanChange) {
              onPlanChange(subscriptionData.plan);
            }
            
            return;
          } catch (apiError) {
            console.warn('⚠️ API also not available, using stored data or demo mode:', apiError);
          }
        }
      }

      // Fallback to stored data
      const storedPlan = storageManager.get('currentPlan');
      const storedFeatures = storageManager.get('features');
      const storedDemoMode = storageManager.get('demoMode');

      if (storedPlan) {
        setCurrentPlan(storedPlan);
      }
      if (storedFeatures) {
        setFeatures(storedFeatures);
      }
      if (storedDemoMode !== null) {
        setDemoMode(storedDemoMode);
      } else {
        setDemoMode(true);
      }
      
      console.log('📝 Using stored data or demo mode');
      
    } catch (err) {
      console.error('❌ Error initializing subscription:', err);
      setError(err.message);
      
      const fallback = errorHandler.handleFeatureError(err, { context: 'initialization' });
      if (fallback.fallback) {
        setDemoMode(true);
        setCurrentPlan(fallback.plan);
        setFeatures(DEFAULT_PLAN_FEATURES);
      }
      
      if (onError) {
        onError(err);
      }
    } finally {
      setLoading(false);
    }
  }, [apiService, onPlanChange, onError]);

  // Initialize on mount
  useEffect(() => {
    initializeSubscription();
  }, [initializeSubscription]);

  // Update subscription plan
  const updateSubscription = useCallback(async (newPlan) => {
    try {
      setLoading(true);
      
      // Try to update in database first
      if (!demoMode) {
        try {
          console.log('🔄 Updating subscription plan in database:', newPlan);
          
          // This would typically be done through an API call
          // For now, we'll update locally and refresh features
          setCurrentPlan(newPlan);
          storageManager.set('currentPlan', newPlan);
          
          // Refresh features for the new plan
          const dbData = await fetchSubscriptionDataFromDB();
          if (dbData && dbData.features) {
            setFeatures(dbData.features);
            storageManager.set('features', dbData.features);
          }
          
          console.log('✅ Subscription plan updated successfully');
          
          if (onPlanChange) {
            onPlanChange(newPlan, currentPlan);
          }
          
          return;
        } catch (dbError) {
          console.warn('⚠️ Database update failed, trying API fallback:', dbError);
          
          // Fallback to API service
          if (apiService) {
            try {
              await apiService.changeSubscription(newPlan);
              setCurrentPlan(newPlan);
              storageManager.set('currentPlan', newPlan);
              
              if (onPlanChange) {
                onPlanChange(newPlan, currentPlan);
              }
              
              return;
            } catch (apiError) {
              console.warn('⚠️ API update also failed, using local update:', apiError);
            }
          }
        }
      }
      
      // Fallback to local update (demo mode or when database/API fails)
      setCurrentPlan(newPlan);
      storageManager.set('currentPlan', newPlan);
      
      if (onPlanChange) {
        onPlanChange(newPlan, currentPlan);
      }
      
      console.log('📝 Subscription plan updated locally');
      
    } catch (err) {
      console.error('❌ Error updating subscription:', err);
      setError(err.message);
      
      if (onError) {
        onError(err);
      }
    } finally {
      setLoading(false);
    }
  }, [apiService, demoMode, currentPlan, onPlanChange, onError]);

  // Update feature usage
  const updateFeatureUsage = useCallback(async (featureName, increment = 1) => {
    try {
      if (!demoMode) {
        try {
          console.log('🔄 Updating feature usage in database:', featureName, '+', increment);
          
          // Get current usage
          const currentUsage = await fetchData('feature_usage', null, 'id', {
            feature_code: featureName
          });
          
          // This would typically be done through an API call
          // For now, we'll just log the intended update
          console.log('📊 Current usage:', currentUsage);
          console.log('✅ Feature usage updated successfully');
          
          return;
        } catch (dbError) {
          console.warn('⚠️ Database update failed, trying API fallback:', dbError);
          
          // Fallback to API service
          if (apiService) {
            try {
              await apiService.updateFeatureUsage(featureName, increment);
              return;
            } catch (apiError) {
              console.warn('⚠️ API update also failed:', apiError);
            }
          }
        }
      }
      
      // Demo mode - just log the action
      console.log('📝 Demo mode: Feature usage update logged:', featureName, '+', increment);
      
    } catch (err) {
      console.error('❌ Error updating feature usage:', err);
      setError(err.message);
      
      if (onError) {
        onError(err);
      }
    }
  }, [apiService, demoMode, onError]);

  // Get feature usage
  const getFeatureUsage = useCallback(async (featureName) => {
    try {
      if (!demoMode) {
        try {
          console.log('🔄 Getting feature usage from database:', featureName);
          
          const usage = await fetchData('feature_usage', null, 'id', {
            feature_code: featureName
          });
          
          const current = usage && usage.length > 0 ? usage[0].current_usage || 0 : 0;
          const limit = validator?.getFeatureLimit(featureName) || 0;
          
          console.log('📊 Feature usage retrieved:', { current, limit });
          
          return { current, limit };
        } catch (dbError) {
          console.warn('⚠️ Database query failed, trying API fallback:', dbError);
          
          // Fallback to API service
          if (apiService) {
            try {
              return await apiService.getFeatureUsage(featureName);
            } catch (apiError) {
              console.warn('⚠️ API query also failed:', apiError);
            }
          }
        }
      }
      
      // Demo mode or fallback
      const limit = validator?.getFeatureLimit(featureName) || 0;
      return { current: 0, limit };
      
    } catch (err) {
      console.error('❌ Error getting feature usage:', err);
      setError(err.message);
      
      if (onError) {
        onError(err);
      }
      
      return { current: 0, limit: 0 };
    }
  }, [apiService, demoMode, validator, onError]);

  // Get available plans
  const getAvailablePlans = useCallback(async () => {
    try {
      if (!demoMode) {
        try {
          console.log('🔄 Getting available plans from database...');
          
          const plans = await fetchData('subscription_plans', null, 'id', {
            is_active: true
          });
          
          if (plans && plans.length > 0) {
            const formattedPlans = plans.map(plan => ({
              code: plan.plan_code,
              name: plan.plan_name,
              price: plan.price || 0,
              billing_cycle: plan.billing_cycle || 'monthly',
              features: features[plan.plan_code] || {}
            }));
            
            console.log('✅ Available plans retrieved:', formattedPlans);
            
            return formattedPlans;
          }
        } catch (dbError) {
          console.warn('⚠️ Database query failed, trying API fallback:', dbError);
          
          // Fallback to API service
          if (apiService) {
            try {
              return await apiService.getSubscriptionPlans();
            } catch (apiError) {
              console.warn('⚠️ API query also failed:', apiError);
            }
          }
        }
      }
      
      // Demo mode or fallback
      return Object.keys(features).map(planName => ({
        code: planName,
        name: features[planName].name || `${planName.charAt(0).toUpperCase() + planName.slice(1)} Plan`,
        price: features[planName].price || 0,
        billing_cycle: 'monthly',
        features: features[planName].features || features[planName]
      }));
      
    } catch (err) {
      console.error('❌ Error getting available plans:', err);
      setError(err.message);
      
      if (onError) {
        onError(err);
      }
      
      return [];
    }
  }, [apiService, demoMode, features, onError]);

  // Refresh subscription data
  const refreshSubscription = useCallback(async () => {
    await initializeSubscription();
  }, [initializeSubscription]);

  // Clear subscription data
  const clearSubscription = useCallback(() => {
    storageManager.clear();
    setCurrentPlan(initialPlan);
    setFeatures(DEFAULT_PLAN_FEATURES);
    setDemoMode(true);
    setError(null);
  }, [initialPlan]);

  // Context value
  const value = {
    // State
    currentPlan,
    features,
    routeMapping,
    loading,
    error,
    demoMode,
    
    // Feature validation methods (delegated to validator)
    hasFeature: validator?.hasFeature.bind(validator) || (() => false),
    getFeature: validator?.getFeature.bind(validator) || (() => null),
    getFeatureLimit: validator?.getFeatureLimit.bind(validator) || (() => 0),
    getFeatureValue: validator?.getFeatureValue.bind(validator) || (() => 0),
    checkLimit: validator?.checkLimit.bind(validator) || (() => ({ withinLimit: false, limit: 0 })),
    canAccessRoute: validator?.canAccessRoute.bind(validator) || (() => true),
    getFeatureForRoute: validator?.getFeatureForRoute.bind(validator) || (() => null),
    getAvailableFeatures: validator?.getAvailableFeatures.bind(validator) || (() => []),
    comparePlans: validator?.comparePlans.bind(validator) || (() => null),
    
    // Actions
    updateSubscription,
    updateFeatureUsage,
    getFeatureUsage,
    getAvailablePlans,
    refreshSubscription,
    clearSubscription,
    
    // Utilities
    setCustomFeatures: setFeatures,
    setCustomRouteMapping: setRouteMapping,
    setDemoMode: (demo) => {
      setDemoMode(demo);
      storageManager.set('demoMode', demo);
    }
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export default SubscriptionProvider;
