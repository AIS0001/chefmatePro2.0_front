// Default plan configurations
// This can be customized for different projects

export const DEFAULT_PLAN_FEATURES = {
  'basic': {
    name: 'Basic Plan',
    price: 0,
    features: {
      // Core features
      dashboard: { enabled: true, level: 'basic' },
      analytics: { enabled: true, level: 'basic' },
      
      // Data management
      customers: { enabled: true, limit: 100 },
      suppliers: { enabled: false, limit: 0 },
      inventory: { enabled: true, limit: 50 },
      
      // Business features
      pos: { enabled: true, limit: 1 },
      reports: { enabled: false, limit: 0 },
      users: { enabled: false, limit: 1 },
      
      // Advanced features
      multiLocation: { enabled: false, limit: 0 },
      customization: { enabled: false, limit: 0 },
      integrations: { enabled: false, limit: 0 }
    }
  },
  
  'professional': {
    name: 'Professional Plan',
    price: 29,
    features: {
      // Core features
      dashboard: { enabled: true, level: 'advanced' },
      analytics: { enabled: true, level: 'advanced' },
      
      // Data management
      customers: { enabled: true, limit: 1000 },
      suppliers: { enabled: true, limit: 100 },
      inventory: { enabled: true, limit: 500 },
      
      // Business features
      pos: { enabled: true, limit: 3 },
      reports: { enabled: true, limit: 10 },
      users: { enabled: true, limit: 5 },
      
      // Advanced features
      multiLocation: { enabled: false, limit: 0 },
      customization: { enabled: true, limit: 5 },
      integrations: { enabled: true, limit: 3 }
    }
  },
  
  'business': {
    name: 'Business Plan',
    price: 79,
    features: {
      // Core features
      dashboard: { enabled: true, level: 'premium' },
      analytics: { enabled: true, level: 'premium' },
      
      // Data management
      customers: { enabled: true, limit: 10000 },
      suppliers: { enabled: true, limit: 1000 },
      inventory: { enabled: true, limit: 5000 },
      
      // Business features
      pos: { enabled: true, limit: 10 },
      reports: { enabled: true, limit: 50 },
      users: { enabled: true, limit: 25 },
      
      // Advanced features
      multiLocation: { enabled: true, limit: 5 },
      customization: { enabled: true, limit: 20 },
      integrations: { enabled: true, limit: 10 }
    }
  },
  
  'enterprise': {
    name: 'Enterprise Plan',
    price: 199,
    features: {
      // Core features
      dashboard: { enabled: true, level: 'enterprise' },
      analytics: { enabled: true, level: 'enterprise' },
      
      // Data management
      customers: { enabled: true, limit: -1 }, // Unlimited
      suppliers: { enabled: true, limit: -1 },
      inventory: { enabled: true, limit: -1 },
      
      // Business features
      pos: { enabled: true, limit: -1 },
      reports: { enabled: true, limit: -1 },
      users: { enabled: true, limit: -1 },
      
      // Advanced features
      multiLocation: { enabled: true, limit: -1 },
      customization: { enabled: true, limit: -1 },
      integrations: { enabled: true, limit: -1 }
    }
  }
};

export const DEFAULT_ROUTE_MAPPING = {
  // Customer routes
  '/customers': 'customers',
  '/customers/new': 'customers',
  '/customers/edit': 'customers',
  '/master/customers': 'customers',
  '/master/newcustomer': 'customers',
  
  // Supplier routes
  '/suppliers': 'suppliers',
  '/suppliers/new': 'suppliers',
  '/suppliers/edit': 'suppliers',
  '/master/suppliers': 'suppliers',
  '/master/newsupplier': 'suppliers',
  
  // Inventory routes
  '/inventory': 'inventory',
  '/inventory/items': 'inventory',
  '/inventory/newitem': 'inventory',
  '/inventory/stock': 'inventory',
  '/inventory/newstock': 'inventory',
  
  // POS routes
  '/pos': 'pos',
  '/sale/pos': 'pos',
  '/sale/newsale': 'pos',
  
  // Reports routes
  '/reports': 'reports',
  '/reports/sales': 'reports',
  '/reports/customers': 'reports',
  '/reports/inventory': 'reports',
  '/reports/billhistory': 'reports',
  
  // User management routes
  '/users': 'users',
  '/users/new': 'users',
  '/users/newuser': 'users',
  '/users/edit': 'users',
  
  // Settings routes
  '/settings': 'customization',
  '/settings/company': 'customization',
  '/settings/core': 'customization'
};

export const FEATURE_CATEGORIES = {
  'Core': ['dashboard', 'analytics'],
  'Data Management': ['customers', 'suppliers', 'inventory'],
  'Business Operations': ['pos', 'reports', 'users'],
  'Advanced Features': ['multiLocation', 'customization', 'integrations']
};

export const PLAN_COMPARISON = {
  features: [
    {
      name: 'Dashboard Access',
      basic: 'Basic',
      professional: 'Advanced',
      business: 'Premium',
      enterprise: 'Enterprise'
    },
    {
      name: 'Customer Management',
      basic: '100 customers',
      professional: '1,000 customers',
      business: '10,000 customers',
      enterprise: 'Unlimited'
    },
    {
      name: 'Supplier Management',
      basic: 'Not included',
      professional: '100 suppliers',
      business: '1,000 suppliers',
      enterprise: 'Unlimited'
    },
    {
      name: 'POS Terminals',
      basic: '1 terminal',
      professional: '3 terminals',
      business: '10 terminals',
      enterprise: 'Unlimited'
    },
    {
      name: 'Reports',
      basic: 'Basic reports',
      professional: '10 custom reports',
      business: '50 custom reports',
      enterprise: 'Unlimited'
    },
    {
      name: 'Users',
      basic: '1 user',
      professional: '5 users',
      business: '25 users',
      enterprise: 'Unlimited'
    },
    {
      name: 'Multi-Location',
      basic: false,
      professional: false,
      business: '5 locations',
      enterprise: 'Unlimited'
    },
    {
      name: 'Customization',
      basic: false,
      professional: 'Limited',
      business: 'Advanced',
      enterprise: 'Full'
    },
    {
      name: 'Integrations',
      basic: false,
      professional: '3 integrations',
      business: '10 integrations',
      enterprise: 'Unlimited'
    }
  ]
};

// Helper functions
export const getPlanFeature = (planName, featureName) => {
  const plan = DEFAULT_PLAN_FEATURES[planName];
  return plan?.features?.[featureName] || null;
};

export const isPlanFeatureEnabled = (planName, featureName) => {
  const feature = getPlanFeature(planName, featureName);
  return feature?.enabled || false;
};

export const getPlanFeatureLimit = (planName, featureName) => {
  const feature = getPlanFeature(planName, featureName);
  return feature?.limit || 0;
};

export const getFeatureForRoute = (route) => {
  return DEFAULT_ROUTE_MAPPING[route] || null;
};

export const getAllPlans = () => {
  return Object.keys(DEFAULT_PLAN_FEATURES);
};

export const getPlanInfo = (planName) => {
  return DEFAULT_PLAN_FEATURES[planName] || null;
};

export const isUnlimited = (limit) => {
  return limit === -1;
};

export const formatLimit = (limit) => {
  return isUnlimited(limit) ? 'Unlimited' : limit.toString();
};
