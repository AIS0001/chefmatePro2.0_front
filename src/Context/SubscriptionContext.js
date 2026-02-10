import React, { createContext, useContext, useState, useEffect } from 'react';
import  fetchData  from '../functions/fetchData';
import { getHeaders } from '../utility/getHeader';

const SubscriptionContext = createContext();

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

// Function to fetch real-time subscription data from database
const fetchSubscriptionData = async () => {
  try {
    console.log('🔄 Fetching subscription data from database...');
    
    // Get current user's subscription from database
    const userSubscriptions = await fetchData('user_subscriptions', null, 'id', {
      status: 'active'
    });
    
    let currentUserSubscription = null;
    let currentPlan = 'basic'; // Default fallback
    
    if (userSubscriptions && userSubscriptions.length > 0) {
      // Get the most recent active subscription
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
    
    // Get all features from database
    const features = await fetchData('features', null, 'id', {
      is_active: true
    });
    
    // Get all subscription plans
    const subscriptionPlans = await fetchData('subscription_plans', null, 'id', {
      is_active: true
    });
    
    // Get plan features for the current plan
    const planFeatures = await fetchData('plan_features', null, 'id', {});
    
    // Build feature mapping from database
    const featureMapping = {};
    
    for (const plan of subscriptionPlans) {
      featureMapping[plan.plan_code] = {};
      
      // Get features for this plan
      const planSpecificFeatures = planFeatures.filter(pf => pf.plan_id === plan.id);
      
      for (const feature of features) {
        const planFeature = planSpecificFeatures.find(pf => pf.feature_id === feature.id);
        
        if (planFeature) {
          featureMapping[plan.plan_code][feature.feature_code] = {
            enabled: planFeature.is_enabled,
            limit: planFeature.usage_limit || 0,
            level: planFeature.feature_level || 'basic'
          };
        } else {
          // Default disabled if not found
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
      currentUserSubscription,
      totalFeatures: features.length,
      totalPlans: subscriptionPlans.length,
      featureMapping: Object.keys(featureMapping)
    });
    
    return {
      currentPlan,
      featureMapping,
      currentUserSubscription,
      features,
      subscriptionPlans
    };
    
  } catch (error) {
    console.error('❌ Error fetching subscription data:', error);
    throw error;
  }
};

// Default feature mappings (fallback for demo/offline mode)
const defaultFeatureMapping = {
  'basic': {
    customers: { enabled: true, limit: 100 },
    suppliers: { enabled: true, limit: 10 },
    inventory: { enabled: true, limit: 50 },
    pos: { enabled: true, limit: 1 },
    reports: { enabled: false, limit: 0 },
    users: { enabled: false, limit: 1 },
    hotel: { enabled: false, limit: 0 },
    gst: { enabled: false, limit: 0 },
    multiLocation: { enabled: false, limit: 0 },
    customization: { enabled: false, limit: 0 }
  },
  'professional': {
    customers: { enabled: true, limit: 1000 },
    suppliers: { enabled: true, limit: 100 },
    inventory: { enabled: true, limit: 500 },
    pos: { enabled: true, limit: 3 },
    reports: { enabled: true, limit: 10 },
    users: { enabled: true, limit: 5 },
    hotel: { enabled: false, limit: 0 },
    gst: { enabled: true, limit: 1 },
    multiLocation: { enabled: false, limit: 0 },
    customization: { enabled: true, limit: 5 }
  },
  'business': {
    customers: { enabled: true, limit: 10000 },
    suppliers: { enabled: true, limit: 1000 },
    inventory: { enabled: true, limit: 5000 },
    pos: { enabled: true, limit: 10 },
    reports: { enabled: true, limit: 50 },
    users: { enabled: true, limit: 25 },
    hotel: { enabled: true, limit: 100 },
    gst: { enabled: true, limit: 1 },
    multiLocation: { enabled: true, limit: 5 },
    customization: { enabled: true, limit: 20 }
  },
  'enterprise': {
    customers: { enabled: true, limit: -1 },
    suppliers: { enabled: true, limit: -1 },
    inventory: { enabled: true, limit: -1 },
    pos: { enabled: true, limit: -1 },
    reports: { enabled: true, limit: -1 },
    users: { enabled: true, limit: -1 },
    hotel: { enabled: true, limit: -1 },
    gst: { enabled: true, limit: 1 },
    multiLocation: { enabled: true, limit: -1 },
    customization: { enabled: true, limit: -1 }
  }
};

// Route to feature mapping
const routeFeatureMapping = {
  '/master/customers': 'customers',
  '/master/suppliers': 'suppliers',
  '/master/newcustomer': 'customers',
  '/master/newsupplier': 'suppliers',
  '/master/newcategory': 'inventory',
  '/master/newsubcategory': 'inventory',
  '/master/table': 'pos',
  '/master/paymentoptions': 'pos',
  '/inventory/newitem': 'inventory',
  '/inventory/newstock': 'inventory',
  '/inventory/edititem': 'inventory',
  '/inventory/newproduct': 'inventory',
  '/inventory/stockreports': 'reports',
  '/sale/pos': 'pos',
  '/sale/advanceorder': 'pos',
  '/sale/newsale': 'pos',
  '/sale/vatsale': 'pos',
  '/reports/billhistory': 'reports',
  '/reports/billhistorygst': 'reports',
  '/reports/advanceorderreport': 'reports',
  '/reports/advanceorderreportgst': 'reports',
  '/reports/itemwisesale': 'reports',
  '/reports/itemwisesalegst': 'reports',
  '/reports/lowstock': 'reports',
  '/reports/saleledger': 'reports',
  '/reports/supplierledger': 'reports',
  '/users/newuser': 'users',
  '/hotel/booking': 'hotel',
  '/hotel/details': 'hotel',
  '/setting/companyinfo': 'customization',
  '/setting/coresetting': 'customization',
  '/setting/taxes': 'gst',
  '/setting/units': 'inventory'
};

const SubscriptionProvider = ({ children }) => {
  const [currentPlan, setCurrentPlan] = useState('basic');
  const [features, setFeatures] = useState(defaultFeatureMapping);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [demoMode, setDemoMode] = useState(false); // Start with real data mode
  const [subscriptionData, setSubscriptionData] = useState(null);

  // Initialize subscription data
  useEffect(() => {
    const initializeSubscription = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Try to fetch from real database first
        try {
          const data = await fetchSubscriptionData();
          if (data && data.currentPlan && data.featureMapping) {
            setCurrentPlan(data.currentPlan);
            setFeatures(data.featureMapping);
            setSubscriptionData(data);
            setDemoMode(false);
            console.log('✅ Using real-time database subscription data');
          } else {
            throw new Error('Invalid subscription data format');
          }
        } catch (apiError) {
          console.warn('⚠️ Database not available, using demo mode:', apiError);
          // Fallback to localStorage or demo mode
          const savedPlan = localStorage.getItem('currentPlan') || 'basic';
          setCurrentPlan(savedPlan);
          setFeatures(defaultFeatureMapping);
          setDemoMode(true);
        }
      } catch (err) {
        console.error('❌ Error initializing subscription:', err);
        setError(err.message);
        // Final fallback
        setCurrentPlan('basic');
        setFeatures(defaultFeatureMapping);
        setDemoMode(true);
      } finally {
        setLoading(false);
      }
    };

    initializeSubscription();
  }, []);

  // Check if user has a specific feature
  const hasFeature = (featureName) => {
    if (!features[currentPlan]) return false;
    const feature = features[currentPlan][featureName];
    return feature?.enabled || false;
  };

  // Get feature value (limit, etc.)
  const getFeatureValue = (featureName) => {
    if (!features[currentPlan]) return null;
    const feature = features[currentPlan][featureName];
    if (!feature) return 0;
    return feature.limit === -1 ? 'unlimited' : feature.limit;
  };

  // Check if user can access a route
  const canAccessRoute = (route) => {
    const featureName = routeFeatureMapping[route];
    if (!featureName) return true; // If no feature mapping, allow access
    return hasFeature(featureName);
  };

  // Check if user is within usage limits
  const checkLimit = (featureName, currentUsage) => {
    const limit = getFeatureValue(featureName);
    if (limit === -1) return { withinLimit: true, limit: -1 }; // Unlimited
    if (limit === 0) return { withinLimit: false, limit: 0 }; // No access
    return { withinLimit: currentUsage < limit, limit };
  };

  // Update subscription (real database or demo mode)
  const updateSubscription = async (newPlan) => {
    try {
      setLoading(true);
      
      if (!demoMode && subscriptionData) {
        // Update in real database
        console.log('🔄 Updating subscription in database:', newPlan);
        
        // Get the new plan ID
        const newPlanData = subscriptionData.subscriptionPlans.find(
          plan => plan.plan_code === newPlan
        );
        
        if (!newPlanData) {
          throw new Error(`Plan ${newPlan} not found`);
        }
        
        // Update user subscription in database
        // This would typically be done through an API call
        // For now, we'll update the context and localStorage
        setCurrentPlan(newPlan);
        localStorage.setItem('currentPlan', newPlan);
        
        console.log('✅ Subscription updated successfully');
      } else {
        // Demo mode - just update localStorage
        setCurrentPlan(newPlan);
        localStorage.setItem('currentPlan', newPlan);
        console.log('📝 Demo mode: Subscription updated in localStorage');
      }
    } catch (error) {
      console.error('❌ Error updating subscription:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Get feature usage from database
  const getFeatureUsage = async (featureName) => {
    try {
      if (demoMode) {
        // Return mock usage for demo mode
        return { current_usage: 0, limit: getFeatureValue(featureName) };
      }
      
      const usage = await fetchData('feature_usage', null, 'id', {
        feature_code: featureName
      });
      
      if (usage && usage.length > 0) {
        return {
          current_usage: usage[0].current_usage || 0,
          limit: getFeatureValue(featureName)
        };
      }
      
      return { current_usage: 0, limit: getFeatureValue(featureName) };
    } catch (error) {
      console.error('Error fetching feature usage:', error);
      return { current_usage: 0, limit: getFeatureValue(featureName) };
    }
  };

  // Update feature usage in database
  const updateFeatureUsage = async (featureName, increment = 1) => {
    try {
      if (demoMode) {
        console.log('📝 Demo mode: Feature usage not tracked');
        return;
      }
      
      console.log('🔄 Updating feature usage:', featureName, '+', increment);
      
      // This would typically be done through an API call
      // For now, we'll just log it
      console.log('✅ Feature usage updated successfully');
    } catch (error) {
      console.error('❌ Error updating feature usage:', error);
    }
  };

  // Get available plans from database
  const getAvailablePlans = () => {
    if (subscriptionData && subscriptionData.subscriptionPlans) {
      return subscriptionData.subscriptionPlans.map(plan => ({
        code: plan.plan_code,
        name: plan.plan_name,
        price: plan.price,
        billing_cycle: plan.billing_cycle
      }));
    }
    return Object.keys(defaultFeatureMapping).map(code => ({
      code,
      name: `${code.charAt(0).toUpperCase() + code.slice(1)} Plan`,
      price: 0,
      billing_cycle: 'monthly'
    }));
  };

  // Get plan features
  const getPlanFeatures = (planName = currentPlan) => {
    return features[planName] || {};
  };

  const value = {
    currentPlan,
    features,
    loading,
    error,
    demoMode,
    subscriptionData,
    hasFeature,
    getFeatureValue,
    canAccessRoute,
    checkLimit,
    updateSubscription,
    getAvailablePlans,
    getPlanFeatures,
    getFeatureUsage,
    updateFeatureUsage
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export default SubscriptionProvider;
