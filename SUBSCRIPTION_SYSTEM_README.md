# ChefMate Subscription System Database Integration

## Overview
The ChefMate subscription system has been completely refactored to use real-time database data instead of hardcoded sample data. This integration provides a robust, scalable subscription management system with comprehensive feature access control.

## Database Schema

### Core Tables

#### 1. `subscription_plans`
Stores available subscription plans with pricing and billing information.
```sql
CREATE TABLE subscription_plans (
    id INT PRIMARY KEY AUTO_INCREMENT,
    plan_code VARCHAR(50) UNIQUE NOT NULL,
    plan_name VARCHAR(100) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    billing_cycle ENUM('monthly', 'yearly') NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### 2. `features`
Defines all available features in the system.
```sql
CREATE TABLE features (
    id INT PRIMARY KEY AUTO_INCREMENT,
    feature_code VARCHAR(50) UNIQUE NOT NULL,
    feature_name VARCHAR(100) NOT NULL,
    feature_category VARCHAR(50) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### 3. `plan_features`
Links subscription plans with available features and their configurations.
```sql
CREATE TABLE plan_features (
    id INT PRIMARY KEY AUTO_INCREMENT,
    plan_id INT NOT NULL,
    feature_id INT NOT NULL,
    is_enabled BOOLEAN DEFAULT TRUE,
    feature_level ENUM('basic', 'advanced', 'enterprise') DEFAULT 'basic',
    usage_limit INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (plan_id) REFERENCES subscription_plans(id),
    FOREIGN KEY (feature_id) REFERENCES features(id),
    UNIQUE KEY unique_plan_feature (plan_id, feature_id)
);
```

#### 4. `user_subscriptions`
Tracks user subscription status and details.
```sql
CREATE TABLE user_subscriptions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    plan_id INT NOT NULL,
    status ENUM('active', 'cancelled', 'expired', 'pending') DEFAULT 'pending',
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NULL,
    payment_status ENUM('paid', 'pending', 'failed') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (plan_id) REFERENCES subscription_plans(id),
    INDEX idx_user_status (user_id, status),
    INDEX idx_expires_at (expires_at)
);
```

#### 5. `feature_usage`
Tracks individual feature usage for each user.
```sql
CREATE TABLE feature_usage (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    feature_code VARCHAR(50) NOT NULL,
    current_usage INT DEFAULT 0,
    last_reset_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_feature (user_id, feature_code),
    INDEX idx_user_feature (user_id, feature_code)
);
```

## File Structure

### Updated Files

1. **`src/Context/SubscriptionContext.js`**
   - Main subscription context provider
   - Integrated with database via fetchData function
   - Handles subscription state management
   - Provides fallback mechanisms

2. **`src/lib/subscription-system/hooks/useSubscription.js`**
   - Advanced subscription hook
   - Database-integrated feature management
   - Real-time subscription status checking
   - Comprehensive error handling

3. **`src/views/dashboard/dashboard.jsx`**
   - Enhanced Financial Intelligence section
   - Improved data processing for subscription analytics
   - Better error handling and debugging

### Database Integration Files

4. **`db/subscription_data_insert.sql`**
   - Sample data insertion script
   - Provides realistic subscription data
   - Includes all subscription plans and features

5. **`test_subscription_system.js`**
   - Comprehensive testing script
   - Validates database integration
   - Tests all subscription functions

## Key Features

### 1. Real-time Database Integration
- All subscription data fetched from database
- No hardcoded sample data
- Dynamic feature access control
- Real-time usage tracking

### 2. Comprehensive Feature Management
- **Master Data**: customers, suppliers, tables, categories, paymentOptions
- **Inventory**: inventory, items, stockManagement, productManagement
- **Sales**: pos, advanceOrders, retailSales
- **Reporting**: reports, salesReports, itemWiseReports, customerReports, supplierReports
- **System**: users, customization, multiLocation, gst

### 3. Multi-tier Fallback System
```javascript
Database → API → LocalStorage → Demo Mode
```

### 4. Usage Tracking
- Real-time feature usage monitoring
- Usage limits enforcement
- Automatic usage reset cycles
- Detailed usage analytics

## Implementation Details

### Database Query Functions

#### `fetchSubscriptionDataFromDB(userId)`
Fetches complete subscription data including:
- Active user subscription
- Plan details and features
- Feature usage statistics
- Available upgrades

#### `getAvailablePlans()`
Retrieves all active subscription plans with:
- Plan details and pricing
- Feature comparisons
- Availability status
- Sort ordering

#### `getFeatureUsage(userId, featureCode)`
Gets current usage for specific feature:
- Current usage count
- Usage limits
- Last reset timestamp
- Usage history

#### `updateFeatureUsage(userId, featureCode, increment)`
Updates feature usage with:
- Atomic increment operations
- Limit validation
- Error handling
- Usage tracking

### Error Handling

The system implements comprehensive error handling:

1. **Database Errors**: Fallback to cached data or demo mode
2. **Network Errors**: Retry mechanisms with exponential backoff
3. **API Errors**: Graceful degradation with user notifications
4. **Validation Errors**: Clear error messages and recovery suggestions

## Setup Instructions

### 1. Database Setup
```sql
-- Run the database schema creation
source db/cloudnet_chefmate.sql

-- Insert sample subscription data
source db/subscription_data_insert.sql
```

### 2. Environment Configuration
Ensure your API endpoints are configured to handle subscription queries:
- Update `src/api/api.js` with subscription endpoints
- Configure database connection parameters
- Set up proper authentication headers

### 3. Testing
```bash
# Run the subscription system tests
node test_subscription_system.js

# Or import and run specific tests
import { runAllTests } from './test_subscription_system.js';
runAllTests();
```

## Usage Examples

### Basic Subscription Check
```javascript
import { useSubscription } from './src/lib/subscription-system/hooks/useSubscription';

function MyComponent() {
    const { 
        subscription, 
        hasFeature, 
        getFeatureUsage, 
        updateFeatureUsage 
    } = useSubscription();
    
    const canAccessReports = hasFeature('reports');
    const currentUsage = getFeatureUsage('customers');
    
    return (
        <div>
            {canAccessReports && <ReportsSection />}
            <div>Customer Usage: {currentUsage}/500</div>
        </div>
    );
}
```

### Feature Usage Tracking
```javascript
import { useSubscription } from './src/lib/subscription-system/hooks/useSubscription';

function AddCustomerForm() {
    const { updateFeatureUsage, hasFeature } = useSubscription();
    
    const handleAddCustomer = async (customerData) => {
        if (!hasFeature('customers')) {
            alert('Customer management not available in your plan');
            return;
        }
        
        // Add customer logic
        await addCustomerToDatabase(customerData);
        
        // Update usage
        await updateFeatureUsage('customers', 1);
    };
    
    return <CustomerForm onSubmit={handleAddCustomer} />;
}
```

## Monitoring and Analytics

### Subscription Analytics
The dashboard now includes real-time subscription analytics:
- Active subscriptions by plan
- Feature usage patterns
- Revenue tracking
- User engagement metrics

### Usage Monitoring
- Real-time usage tracking
- Usage limit alerts
- Feature adoption analytics
- Performance metrics

## Troubleshooting

### Common Issues

1. **Database Connection Issues**
   - Check database configuration
   - Verify API endpoint availability
   - Test database connectivity

2. **Feature Access Problems**
   - Verify subscription status
   - Check plan-feature mappings
   - Validate user permissions

3. **Usage Tracking Issues**
   - Check feature usage table
   - Verify usage limit calculations
   - Monitor usage reset cycles

### Debug Mode
Enable debug logging:
```javascript
localStorage.setItem('subscription_debug', 'true');
```

## Future Enhancements

### Planned Features
1. **Subscription Analytics Dashboard**
2. **Advanced Usage Reporting**
3. **Automated Billing Integration**
4. **Multi-tenant Support**
5. **Real-time Notifications**

### Performance Optimizations
1. **Query Optimization**
2. **Caching Strategies**
3. **Background Sync**
4. **Lazy Loading**

## Support

For issues or questions:
1. Check the console for debug logs
2. Run the test script to validate setup
3. Review database table contents
4. Check API endpoint responses

---

*This documentation covers the complete database integration of the ChefMate subscription system. The system now uses real-time database data instead of hardcoded sample data, providing a robust foundation for production use.*
