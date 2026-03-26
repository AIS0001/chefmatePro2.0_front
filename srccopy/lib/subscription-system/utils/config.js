// Configuration file for the subscription system
// This allows customization for different projects

export default class SubscriptionConfig {
  static defaultConfig = {
    // API endpoints
    baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3001',
    endpoints: {
      subscription: '/api/subscription',
      features: '/api/features',
      plans: '/api/plans',
      usage: '/api/usage'
    },
    
    // Storage options
    storage: {
      type: 'localStorage', // 'localStorage', 'sessionStorage', 'memory'
      keys: {
        currentPlan: 'currentPlan',
        features: 'features',
        demoMode: 'demoMode'
      }
    },
    
    // Demo mode settings
    demo: {
      enabled: true,
      defaultPlan: 'basic',
      allowPlanSwitching: true
    },
    
    // UI customization
    ui: {
      themes: {
        primary: '#007bff',
        success: '#28a745',
        warning: '#ffc107',
        danger: '#dc3545',
        info: '#17a2b8'
      },
      upgradeModal: {
        title: 'Upgrade Required',
        message: 'This feature requires a higher subscription plan.',
        buttonText: 'Upgrade Now'
      },
      limitReached: {
        title: 'Limit Reached',
        message: 'You have reached your plan limit.',
        buttonText: 'Upgrade Plan'
      }
    },
    
    // Default plan structure
    planStructure: {
      basic: {
        name: 'Basic',
        price: 0,
        features: {}
      },
      professional: {
        name: 'Professional',
        price: 29,
        features: {}
      },
      business: {
        name: 'Business',
        price: 79,
        features: {}
      },
      enterprise: {
        name: 'Enterprise',
        price: 199,
        features: {}
      }
    },
    
    // Error handling
    errors: {
      retryAttempts: 3,
      retryDelay: 1000,
      fallbackToDemo: true
    }
  };
  
  static config = { ...this.defaultConfig };
  
  static configure(userConfig) {
    this.config = {
      ...this.defaultConfig,
      ...userConfig,
      endpoints: {
        ...this.defaultConfig.endpoints,
        ...userConfig.endpoints
      },
      storage: {
        ...this.defaultConfig.storage,
        ...userConfig.storage
      },
      ui: {
        ...this.defaultConfig.ui,
        ...userConfig.ui
      }
    };
  }
  
  static get(key) {
    return this.config[key];
  }
  
  static set(key, value) {
    this.config[key] = value;
  }
  
  static reset() {
    this.config = { ...this.defaultConfig };
  }
}
