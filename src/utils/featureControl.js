// Subscription Feature Control System
import { useState, useEffect } from 'react';

// Feature definitions based on subscription tiers
export const SUBSCRIPTION_FEATURES = {
  basic: {
    name: 'Basic',
    features: {
      // Dashboard & Analytics
      dashboard: true,
      analytics: 'basic',
      
      // Master Data Management
      customers: { enabled: true, limit: 100, analytics: false },
      suppliers: { enabled: false },
      tables: { enabled: true, limit: 10, analytics: false },
      categories: { enabled: true, limit: 20, analytics: false },
      paymentOptions: { enabled: true, limit: 2, methods: ['cash', 'card'] },
      
      // Inventory Management
      items: { enabled: true, limit: 100, bulkImport: false },
      stockManagement: { enabled: true, level: 'basic' },
      productManagement: { enabled: false },
      stockReports: { enabled: true, level: 'basic' },
      
      // Sales & POS
      pos: { enabled: true, level: 'basic' },
      advanceOrders: { enabled: false },
      retailSales: { enabled: true, level: 'basic' },
      
      // Financial Management
      vouchers: { enabled: false },
      expenses: { enabled: false },
      
      // Reporting
      salesReports: { enabled: true, period: 30, export: false },
      itemWiseReports: { enabled: false },
      customerReports: { enabled: true, level: 'basic' },
      supplierReports: { enabled: false },
      advanceOrderReports: { enabled: false },
      lowStockReports: { enabled: false },
      
      // User Management
      users: { enabled: true, limit: 1, customRoles: false },
      profileManagement: { enabled: true, level: 'basic' },
      
      // System Settings
      coreSettings: { enabled: true, level: 'basic' },
      companyInfo: { enabled: true, level: 'basic' },
      taxManagement: { enabled: true, limit: 2, customRules: false },
      unitsManagement: { enabled: true, limit: 10, customUnits: false },
      
      // Technical
      locations: 1,
      apiAccess: false,
      support: 'email',
      dataBackup: 'basic',
      integrations: false,
      multiFactorAuth: false
    }
  },
  
  professional: {
    name: 'Professional',
    features: {
      // Dashboard & Analytics
      dashboard: true,
      analytics: 'advanced',
      
      // Master Data Management
      customers: { enabled: true, limit: 500, analytics: false },
      suppliers: { enabled: true, limit: 50, analytics: false },
      tables: { enabled: true, limit: 50, analytics: false },
      categories: { enabled: true, limit: 'unlimited', analytics: false },
      paymentOptions: { enabled: true, limit: 5, methods: ['cash', 'card', 'upi'] },
      
      // Inventory Management
      items: { enabled: true, limit: 500, bulkImport: false },
      stockManagement: { enabled: true, level: 'advanced' },
      productManagement: { enabled: true, level: 'basic' },
      stockReports: { enabled: true, level: 'advanced' },
      
      // Sales & POS
      pos: { enabled: true, level: 'full' },
      advanceOrders: { enabled: true, level: 'basic' },
      retailSales: { enabled: true, level: 'advanced' },
      
      // Financial Management
      vouchers: { enabled: true, level: 'basic' },
      expenses: { enabled: true, level: 'basic' },
      
      // Reporting
      salesReports: { enabled: true, period: 365, export: false },
      itemWiseReports: { enabled: true, level: 'basic' },
      customerReports: { enabled: true, level: 'advanced' },
      supplierReports: { enabled: true, level: 'basic' },
      advanceOrderReports: { enabled: true, level: 'basic' },
      lowStockReports: { enabled: true, level: 'basic' },
      
      // User Management
      users: { enabled: true, limit: 3, customRoles: false },
      profileManagement: { enabled: true, level: 'advanced' },
      
      // System Settings
      coreSettings: { enabled: true, level: 'advanced' },
      companyInfo: { enabled: true, level: 'advanced' },
      taxManagement: { enabled: true, limit: 'unlimited', customRules: false },
      unitsManagement: { enabled: true, limit: 'unlimited', customUnits: false },
      
      // Technical
      locations: 1,
      apiAccess: false,
      support: 'priority_email',
      dataBackup: 'advanced',
      integrations: 'basic',
      multiFactorAuth: true
    }
  },
  
  business: {
    name: 'Business',
    features: {
      // Dashboard & Analytics
      dashboard: true,
      analytics: 'advanced',
      
      // Master Data Management
      customers: { enabled: true, limit: 'unlimited', analytics: false },
      suppliers: { enabled: true, limit: 'unlimited', analytics: false },
      tables: { enabled: true, limit: 'unlimited', analytics: false },
      categories: { enabled: true, limit: 'unlimited', analytics: false },
      paymentOptions: { enabled: true, limit: 'unlimited', methods: 'all' },
      
      // Inventory Management
      items: { enabled: true, limit: 'unlimited', bulkImport: false },
      stockManagement: { enabled: true, level: 'advanced' },
      productManagement: { enabled: true, level: 'advanced' },
      stockReports: { enabled: true, level: 'advanced' },
      
      // Sales & POS
      pos: { enabled: true, level: 'full' },
      advanceOrders: { enabled: true, level: 'advanced' },
      retailSales: { enabled: true, level: 'advanced' },
      
      // Financial Management
      vouchers: { enabled: true, level: 'advanced' },
      expenses: { enabled: true, level: 'advanced' },
      
      // Reporting
      salesReports: { enabled: true, period: 'unlimited', export: true },
      itemWiseReports: { enabled: true, level: 'advanced' },
      customerReports: { enabled: true, level: 'advanced' },
      supplierReports: { enabled: true, level: 'advanced' },
      advanceOrderReports: { enabled: true, level: 'advanced' },
      lowStockReports: { enabled: true, level: 'advanced' },
      
      // User Management
      users: { enabled: true, limit: 10, customRoles: true },
      profileManagement: { enabled: true, level: 'advanced' },
      
      // System Settings
      coreSettings: { enabled: true, level: 'advanced' },
      companyInfo: { enabled: true, level: 'advanced' },
      taxManagement: { enabled: true, limit: 'unlimited', customRules: false },
      unitsManagement: { enabled: true, limit: 'unlimited', customUnits: true },
      
      // Technical
      locations: 3,
      apiAccess: 'basic',
      support: 'phone_email',
      dataBackup: 'advanced',
      integrations: 'advanced',
      multiFactorAuth: true
    }
  },
  
  enterprise: {
    name: 'Enterprise',
    features: {
      // Dashboard & Analytics
      dashboard: true,
      analytics: 'enterprise',
      
      // Master Data Management
      customers: { enabled: true, limit: 'unlimited', analytics: true },
      suppliers: { enabled: true, limit: 'unlimited', analytics: true },
      tables: { enabled: true, limit: 'unlimited', analytics: true },
      categories: { enabled: true, limit: 'unlimited', analytics: true },
      paymentOptions: { enabled: true, limit: 'unlimited', methods: 'all', customGateway: true },
      
      // Inventory Management
      items: { enabled: true, limit: 'unlimited', bulkImport: true },
      stockManagement: { enabled: true, level: 'enterprise' },
      productManagement: { enabled: true, level: 'enterprise' },
      stockReports: { enabled: true, level: 'enterprise' },
      
      // Sales & POS
      pos: { enabled: true, level: 'enterprise' },
      advanceOrders: { enabled: true, level: 'enterprise' },
      retailSales: { enabled: true, level: 'enterprise' },
      
      // Financial Management
      vouchers: { enabled: true, level: 'enterprise' },
      expenses: { enabled: true, level: 'enterprise' },
      
      // Reporting
      salesReports: { enabled: true, period: 'unlimited', export: true, custom: true },
      itemWiseReports: { enabled: true, level: 'enterprise' },
      customerReports: { enabled: true, level: 'enterprise' },
      supplierReports: { enabled: true, level: 'enterprise' },
      advanceOrderReports: { enabled: true, level: 'enterprise' },
      lowStockReports: { enabled: true, level: 'enterprise' },
      
      // User Management
      users: { enabled: true, limit: 'unlimited', customRoles: true },
      profileManagement: { enabled: true, level: 'enterprise' },
      
      // System Settings
      coreSettings: { enabled: true, level: 'enterprise' },
      companyInfo: { enabled: true, level: 'enterprise' },
      taxManagement: { enabled: true, limit: 'unlimited', customRules: true },
      unitsManagement: { enabled: true, limit: 'unlimited', customUnits: true },
      
      // Technical
      locations: 'unlimited',
      apiAccess: 'full',
      support: '24x7',
      dataBackup: 'enterprise',
      integrations: 'enterprise',
      multiFactorAuth: true,
      whiteLabel: true
    }
  }
};

// Feature Access Control Hook
export const useFeatureControl = () => {
  const [currentPlan, setCurrentPlan] = useState('basic');
  const [features, setFeatures] = useState(SUBSCRIPTION_FEATURES.basic.features);

  useEffect(() => {
    // Get current plan from localStorage or API
    const savedPlan = localStorage.getItem('subscriptionPlan') || 'basic';
    setCurrentPlan(savedPlan);
    setFeatures(SUBSCRIPTION_FEATURES[savedPlan].features);
  }, []);

  const updatePlan = (newPlan) => {
    setCurrentPlan(newPlan);
    setFeatures(SUBSCRIPTION_FEATURES[newPlan].features);
    localStorage.setItem('subscriptionPlan', newPlan);
  };

  const hasFeature = (featurePath) => {
    const pathArray = featurePath.split('.');
    let current = features;
    
    for (const path of pathArray) {
      if (current[path] === undefined) return false;
      current = current[path];
    }
    
    return current !== false;
  };

  const getFeatureValue = (featurePath) => {
    const pathArray = featurePath.split('.');
    let current = features;
    
    for (const path of pathArray) {
      if (current[path] === undefined) return null;
      current = current[path];
    }
    
    return current;
  };

  const canAccessRoute = (route) => {
    const routeFeatureMap = {
      // Master routes
      '/master/customers': 'customers.enabled',
      '/master/newcustomer': 'customers.enabled',
      '/master/suppliers': 'suppliers.enabled',
      '/master/newsupplier': 'suppliers.enabled',
      '/master/table': 'tables.enabled',
      '/master/newtable': 'tables.enabled',
      '/master/categories': 'categories.enabled',
      '/master/newcategory': 'categories.enabled',
      '/master/subcategories': 'categories.enabled',
      '/master/newsubcategory': 'categories.enabled',
      '/master/paymentoptions': 'paymentOptions.enabled',
      
      // Inventory routes
      '/inventory/newitem': 'items.enabled',
      '/inventory/edititem': 'items.enabled',
      '/inventory/newstock': 'stockManagement.enabled',
      '/inventory/editstock': 'stockManagement.enabled',
      '/inventory/newproduct': 'productManagement.enabled',
      '/inventory/editproduct': 'productManagement.enabled',
      '/inventory/stockreports': 'stockReports.enabled',
      
      // Sales routes
      '/sale/pos': 'pos.enabled',
      '/sale/posgst': 'pos.enabled',
      '/sale/advanceorder': 'advanceOrders.enabled',
      '/sale/advanceordergstt': 'advanceOrders.enabled',
      '/sale/newsale': 'retailSales.enabled',
      '/sale/editsale': 'retailSales.enabled',
      
      // Financial routes
      '/vouchers/recieptvoucher': 'vouchers.enabled',
      '/vouchers/paymentvoucher': 'vouchers.enabled',
      '/vouchers/newvoucher': 'vouchers.enabled',
      '/vouchers/editvoucher': 'vouchers.enabled',
      '/expenses/suppliersexpenses': 'expenses.enabled',
      '/expenses/newexpense': 'expenses.enabled',
      '/expenses/editexpense': 'expenses.enabled',
      
      // Reports routes
      '/reports/billhistory': 'salesReports.enabled',
      '/reports/billhistorygst': 'salesReports.enabled',
      '/reports/itemwisesale': 'itemWiseReports.enabled',
      '/reports/itemwisesalegst': 'itemWiseReports.enabled',
      '/reports/saleledger': 'customerReports.enabled',
      '/reports/supplierledger': 'supplierReports.enabled',
      '/reports/advanceorderreport': 'advanceOrderReports.enabled',
      '/reports/advanceorderreportgst': 'advanceOrderReports.enabled',
      '/reports/lowstockitems': 'lowStockReports.enabled',
      
      // User routes
      '/users/newuser': 'users.enabled',
      '/users/edituser': 'users.enabled',
      '/users/editprofile': 'profileManagement.enabled',
      
      // Settings routes
      '/setting/coresetting': 'coreSettings.enabled',
      '/setting/companyinfo': 'companyInfo.enabled',
      '/setting/taxes': 'taxManagement.enabled',
      '/setting/newtax': 'taxManagement.enabled',
      '/setting/units': 'unitsManagement.enabled',
      '/setting/newunit': 'unitsManagement.enabled'
    };

    const featurePath = routeFeatureMap[route];
    if (!featurePath) return true; // Allow access to unmapped routes
    
    return hasFeature(featurePath);
  };

  const checkLimit = (featurePath, currentCount) => {
    const featureConfig = getFeatureValue(featurePath);
    if (!featureConfig) return false;
    
    const limit = featureConfig.limit || featureConfig;
    if (limit === 'unlimited') return true;
    if (typeof limit === 'number') return currentCount < limit;
    return false;
  };

  return {
    currentPlan,
    features,
    updatePlan,
    hasFeature,
    getFeatureValue,
    canAccessRoute,
    checkLimit,
    planName: SUBSCRIPTION_FEATURES[currentPlan].name
  };
};

// Feature Control Component
export const FeatureGuard = ({ feature, children, fallback = null, showUpgrade = true }) => {
  const { hasFeature, currentPlan } = useFeatureControl();
  
  if (!hasFeature(feature)) {
    if (showUpgrade) {
      return (
        <div className="feature-upgrade-prompt">
          <div className="alert alert-warning">
            <h5>Feature Not Available</h5>
            <p>This feature is not available in your current {currentPlan} plan.</p>
            <a href="/subscription" className="btn btn-primary btn-sm">
              Upgrade Plan
            </a>
          </div>
        </div>
      );
    }
    return fallback;
  }
  
  return children;
};

// Route Guard Component
export const RouteGuard = ({ route, children, fallback = null }) => {
  const { canAccessRoute, currentPlan } = useFeatureControl();
  
  if (!canAccessRoute(route)) {
    if (fallback) return fallback;
    
    return (
      <div className="route-access-denied">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-md-6">
              <div className="card">
                <div className="card-body text-center">
                  <i className="zmdi zmdi-lock zmdi-hc-3x text-warning mb-3"></i>
                  <h3>Access Restricted</h3>
                  <p>This feature is not available in your current {currentPlan} plan.</p>
                  <a href="/subscription" className="btn btn-primary">
                    Upgrade Your Plan
                  </a>
                  <a href="/dashboard" className="btn btn-secondary ml-2">
                    Go to Dashboard
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return children;
};

// Limit Check Component
export const LimitGuard = ({ feature, currentCount, children, fallback = null }) => {
  const { checkLimit, getFeatureValue, currentPlan } = useFeatureControl();
  
  if (!checkLimit(feature, currentCount)) {
    const limit = getFeatureValue(feature);
    
    if (fallback) return fallback;
    
    return (
      <div className="limit-exceeded-prompt">
        <div className="alert alert-danger">
          <h5>Limit Exceeded</h5>
          <p>You have reached the limit of {limit} for this feature in your {currentPlan} plan.</p>
          <a href="/subscription" className="btn btn-primary btn-sm">
            Upgrade Plan
          </a>
        </div>
      </div>
    );
  }
  
  return children;
};

export default { 
  useFeatureControl, 
  FeatureGuard, 
  RouteGuard, 
  LimitGuard, 
  SUBSCRIPTION_FEATURES 
};
