// 🚨 SUBSCRIPTION SYSTEM CONFIGURATION 🚨
// Set SUBSCRIPTION_ENABLED to false to disable all subscription restrictions

export const SUBSCRIPTION_CONFIG = {
  enabled: false, // Set to false to disable subscription system
  defaultPlan: 'enterprise', // Plan to use when disabled
  bypassAll: true, // Bypass all restrictions
  showUpgradePrompts: false, // Show upgrade prompts
  enforceUsageLimits: false, // Enforce usage limits
  showPlanComparison: false, // Show plan comparison
  allowFeatureAccess: true, // Allow access to all features
  
  // Debug settings
  debug: false, // Enable debug logging
  logFeatureAccess: false, // Log feature access attempts
  
  // Fallback settings
  fallbackToDemo: false, // Use demo data when database fails
  cacheSubscriptionData: false, // Cache subscription data
  
  // UI settings
  hidePricingPage: true, // Hide pricing/subscription pages
  hideUpgradeButtons: true, // Hide upgrade buttons
  hideFeatureLimits: true, // Hide feature limit displays
  hideUsageWarnings: true, // Hide usage warning messages
};

export const FEATURE_OVERRIDES = {
  // Override specific features (when subscription is disabled, all are true)
  customers: true,
  suppliers: true,
  tables: true,
  categories: true,
  paymentOptions: true,
  items: true,
  stockManagement: true,
  productManagement: true,
  stockReports: true,
  pos: true,
  advanceOrders: true,
  retailSales: true,
  vouchers: true,
  expenses: true,
  salesReports: true,
  itemWiseReports: true,
  customerReports: true,
  supplierReports: true,
  advanceOrderReports: true,
  lowStockReports: true,
  users: true,
  profileManagement: true,
  coreSettings: true,
  companyInfo: true,
  taxManagement: true,
  unitsManagement: true,
};

export const USAGE_LIMITS = {
  // When subscription is disabled, all limits are unlimited (-1)
  customers: -1,
  suppliers: -1,
  tables: -1,
  categories: -1,
  paymentOptions: -1,
  items: -1,
  users: -1,
  taxManagement: -1,
  unitsManagement: -1,
};

export default SUBSCRIPTION_CONFIG;
