// Test script to verify subscription system database integration
// This script will test the subscription functions with actual database data

import { fetchData } from './src/functions/fetchData.js';
import { fetchSubscriptionDataFromDB } from './src/Context/SubscriptionContext.js';

// Mock console for testing
const originalConsole = console;

// Test configuration
const TEST_USER_ID = 1;
const TEST_FEATURES = ['customers', 'pos', 'reports', 'inventory'];

// Test 1: Fetch subscription data from database
async function testFetchSubscriptionData() {
    console.log('\n=== Test 1: Fetching Subscription Data ===');
    
    try {
        // Test user subscription query
        const userSubscriptionQuery = `
            SELECT 
                us.id as subscription_id,
                us.user_id,
                us.plan_id,
                us.status,
                us.started_at,
                us.expires_at,
                us.payment_status,
                sp.plan_code,
                sp.plan_name,
                sp.price,
                sp.billing_cycle
            FROM user_subscriptions us
            JOIN subscription_plans sp ON us.plan_id = sp.id
            WHERE us.user_id = ? AND us.status = 'active'
            ORDER BY us.started_at DESC
            LIMIT 1
        `;
        
        const userSubscription = await fetchData(userSubscriptionQuery, [TEST_USER_ID]);
        console.log('User Subscription:', userSubscription);
        
        if (userSubscription && userSubscription.length > 0) {
            console.log('✅ User subscription found:', userSubscription[0].plan_name);
        } else {
            console.log('❌ No active subscription found for user');
        }
        
        // Test plan features query
        const planFeaturesQuery = `
            SELECT 
                pf.id,
                pf.plan_id,
                pf.feature_id,
                pf.is_enabled,
                pf.feature_level,
                pf.usage_limit,
                f.feature_code,
                f.feature_name,
                f.feature_category,
                f.description
            FROM plan_features pf
            JOIN features f ON pf.feature_id = f.id
            WHERE pf.plan_id = ? AND pf.is_enabled = TRUE
        `;
        
        const planFeatures = await fetchData(planFeaturesQuery, [userSubscription[0]?.plan_id || 2]);
        console.log('Plan Features Count:', planFeatures?.length || 0);
        
        if (planFeatures && planFeatures.length > 0) {
            console.log('✅ Plan features loaded successfully');
            console.log('Available features:', planFeatures.map(f => f.feature_code).join(', '));
        } else {
            console.log('❌ No plan features found');
        }
        
        return { userSubscription, planFeatures };
        
    } catch (error) {
        console.error('❌ Error in testFetchSubscriptionData:', error);
        return null;
    }
}

// Test 2: Check feature access
async function testFeatureAccess(planFeatures) {
    console.log('\n=== Test 2: Feature Access Testing ===');
    
    for (const featureCode of TEST_FEATURES) {
        const feature = planFeatures?.find(f => f.feature_code === featureCode);
        
        if (feature) {
            console.log(`✅ ${featureCode}: Enabled (${feature.feature_level})`);
            if (feature.usage_limit) {
                console.log(`   Usage limit: ${feature.usage_limit}`);
            }
        } else {
            console.log(`❌ ${featureCode}: Not available or disabled`);
        }
    }
}

// Test 3: Check feature usage
async function testFeatureUsage() {
    console.log('\n=== Test 3: Feature Usage Testing ===');
    
    try {
        const usageQuery = `
            SELECT 
                feature_code,
                current_usage,
                last_reset_at
            FROM feature_usage
            WHERE user_id = ?
        `;
        
        const featureUsage = await fetchData(usageQuery, [TEST_USER_ID]);
        console.log('Feature Usage Count:', featureUsage?.length || 0);
        
        if (featureUsage && featureUsage.length > 0) {
            console.log('✅ Feature usage data found');
            featureUsage.forEach(usage => {
                console.log(`   ${usage.feature_code}: ${usage.current_usage} uses`);
            });
        } else {
            console.log('❌ No feature usage data found');
        }
        
        return featureUsage;
        
    } catch (error) {
        console.error('❌ Error in testFeatureUsage:', error);
        return null;
    }
}

// Test 4: Test subscription plans
async function testSubscriptionPlans() {
    console.log('\n=== Test 4: Subscription Plans Testing ===');
    
    try {
        const plansQuery = `
            SELECT 
                id,
                plan_code,
                plan_name,
                price,
                billing_cycle,
                is_active,
                sort_order
            FROM subscription_plans
            WHERE is_active = TRUE
            ORDER BY sort_order
        `;
        
        const plans = await fetchData(plansQuery);
        console.log('Available Plans Count:', plans?.length || 0);
        
        if (plans && plans.length > 0) {
            console.log('✅ Subscription plans found');
            plans.forEach(plan => {
                console.log(`   ${plan.plan_name}: $${plan.price}/${plan.billing_cycle}`);
            });
        } else {
            console.log('❌ No subscription plans found');
        }
        
        return plans;
        
    } catch (error) {
        console.error('❌ Error in testSubscriptionPlans:', error);
        return null;
    }
}

// Test 5: Test database connection
async function testDatabaseConnection() {
    console.log('\n=== Test 5: Database Connection Testing ===');
    
    try {
        const testQuery = 'SELECT 1 as test_value';
        const result = await fetchData(testQuery);
        
        if (result && result.length > 0 && result[0].test_value === 1) {
            console.log('✅ Database connection successful');
            return true;
        } else {
            console.log('❌ Database connection failed');
            return false;
        }
        
    } catch (error) {
        console.error('❌ Database connection error:', error);
        return false;
    }
}

// Main test runner
async function runAllTests() {
    console.log('🚀 Starting Subscription System Tests...');
    console.log('=========================================');
    
    // Test database connection first
    const dbConnected = await testDatabaseConnection();
    if (!dbConnected) {
        console.log('❌ Database connection failed. Cannot proceed with tests.');
        return;
    }
    
    // Test subscription data fetching
    const subscriptionData = await testFetchSubscriptionData();
    
    // Test feature access
    if (subscriptionData && subscriptionData.planFeatures) {
        await testFeatureAccess(subscriptionData.planFeatures);
    }
    
    // Test feature usage
    await testFeatureUsage();
    
    // Test subscription plans
    await testSubscriptionPlans();
    
    console.log('\n=========================================');
    console.log('🏁 Subscription System Tests Complete!');
}

// Export for use in other files
export { 
    testFetchSubscriptionData,
    testFeatureAccess,
    testFeatureUsage,
    testSubscriptionPlans,
    testDatabaseConnection,
    runAllTests 
};

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    runAllTests().catch(console.error);
}
