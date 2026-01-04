// Test file to validate subscription system functionality
import { FeatureValidator } from './utils/featureControl';
import { DEFAULT_PLAN_FEATURES } from './utils/planDefaults';

// Test the subscription system
function testSubscriptionSystem() {
  console.log('🧪 Testing Subscription System...\n');
  
  // Test Basic Plan
  console.log('📋 Testing Basic Plan:');
  const basicValidator = new FeatureValidator('basic', DEFAULT_PLAN_FEATURES);
  
  console.log('✅ Has customers feature:', basicValidator.hasFeature('customers'));
  console.log('❌ Has suppliers feature:', basicValidator.hasFeature('suppliers'));
  console.log('📊 Customer limit:', basicValidator.getFeatureLimit('customers'));
  console.log('📊 Supplier limit:', basicValidator.getFeatureLimit('suppliers'));
  console.log('✅ Check customer limit (50/100):', basicValidator.checkLimit('customers', 50));
  console.log('❌ Check supplier limit (5/0):', basicValidator.checkLimit('suppliers', 5));
  console.log('🎯 Available features:', basicValidator.getAvailableFeatures());
  console.log('');
  
  // Test Professional Plan
  console.log('📋 Testing Professional Plan:');
  const proValidator = new FeatureValidator('professional', DEFAULT_PLAN_FEATURES);
  
  console.log('✅ Has customers feature:', proValidator.hasFeature('customers'));
  console.log('✅ Has suppliers feature:', proValidator.hasFeature('suppliers'));
  console.log('✅ Has reports feature:', proValidator.hasFeature('reports'));
  console.log('📊 Customer limit:', proValidator.getFeatureLimit('customers'));
  console.log('📊 Supplier limit:', proValidator.getFeatureLimit('suppliers'));
  console.log('✅ Check customer limit (50/1000):', proValidator.checkLimit('customers', 50));
  console.log('✅ Check supplier limit (5/100):', proValidator.checkLimit('suppliers', 5));
  console.log('🎯 Available features:', proValidator.getAvailableFeatures());
  console.log('');
  
  // Test Enterprise Plan
  console.log('📋 Testing Enterprise Plan:');
  const enterpriseValidator = new FeatureValidator('enterprise', DEFAULT_PLAN_FEATURES);
  
  console.log('✅ Has customers feature:', enterpriseValidator.hasFeature('customers'));
  console.log('✅ Has suppliers feature:', enterpriseValidator.hasFeature('suppliers'));
  console.log('✅ Has reports feature:', enterpriseValidator.hasFeature('reports'));
  console.log('📊 Customer limit:', enterpriseValidator.getFeatureLimit('customers'));
  console.log('📊 Supplier limit:', enterpriseValidator.getFeatureLimit('suppliers'));
  console.log('✅ Check customer limit (1000/-1):', enterpriseValidator.checkLimit('customers', 1000));
  console.log('✅ Check supplier limit (500/-1):', enterpriseValidator.checkLimit('suppliers', 500));
  console.log('🎯 Available features:', enterpriseValidator.getAvailableFeatures());
  console.log('');
  
  // Test feature values
  console.log('📋 Testing Feature Values:');
  console.log('Basic customer value:', basicValidator.getFeatureValue('customers'));
  console.log('Professional customer value:', proValidator.getFeatureValue('customers'));
  console.log('Enterprise customer value:', enterpriseValidator.getFeatureValue('customers'));
  console.log('');
  
  // Test plan comparison
  console.log('📋 Testing Plan Comparison:');
  const comparison = basicValidator.comparePlans('professional');
  console.log('Basic vs Professional comparison:', comparison);
  
  console.log('✅ All tests completed!\n');
}

// Test route mapping
function testRouteMapping() {
  console.log('🧪 Testing Route Mapping...\n');
  
  const validator = new FeatureValidator('basic', DEFAULT_PLAN_FEATURES);
  
  console.log('Can access /master/customers:', validator.canAccessRoute('/master/customers'));
  console.log('Can access /master/suppliers:', validator.canAccessRoute('/master/suppliers'));
  console.log('Can access /reports/billhistory:', validator.canAccessRoute('/reports/billhistory'));
  console.log('Can access /unknown/route:', validator.canAccessRoute('/unknown/route'));
  console.log('');
}

// Export for testing
export { testSubscriptionSystem, testRouteMapping };

// Run tests if this file is executed directly
if (typeof window !== 'undefined' && window.location) {
  // Browser environment
  console.log('🚀 Running Subscription System Tests in Browser...');
  testSubscriptionSystem();
  testRouteMapping();
} else if (typeof module !== 'undefined' && module.exports) {
  // Node.js environment
  console.log('🚀 Running Subscription System Tests in Node.js...');
  testSubscriptionSystem();
  testRouteMapping();
}
