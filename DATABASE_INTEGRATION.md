# Database Integration for Feature Control System

This document explains how to integrate the ChefMate POS feature control system with a database to dynamically manage subscription plans and feature access.

## Database Schema Overview

The feature control system uses 5 main tables:

### 1. `subscription_plans`
Stores available subscription plans with pricing and metadata.

### 2. `features`
Defines all available features in the system with categories and descriptions.

### 3. `plan_features`
Links subscription plans to features with specific configurations (limits, levels, etc.).

### 4. `user_subscriptions`
Tracks which users have which subscription plans and their status.

### 5. `feature_usage`
Tracks current usage of features for each user to enforce limits.

## Setup Instructions

### 1. Database Setup
```sql
-- Run the complete schema file
mysql -u username -p database_name < db/feature_control_schema.sql
```

### 2. Backend Setup
```bash
# Install required dependencies
npm install mysql2 express cors dotenv

# Create database connection
# Update your database configuration in backend/config/database.js
```

### 3. Frontend Setup
```bash
# Make sure you have axios installed
npm install axios react-toastify

# Update your API base URL in .env
REACT_APP_API_URL=http://localhost:3001
```

## API Endpoints

### Authentication Required
All endpoints require authentication. Include JWT token in Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

### Available Endpoints

#### 1. Get User Subscription
```
GET /api/feature-control/subscription
```
Returns current user's subscription plan and status.

#### 2. Get User Features
```
GET /api/feature-control/features
```
Returns all features available to the user based on their subscription.

#### 3. Check Feature Access
```
GET /api/feature-control/features/:featureCode/access
```
Check if user has access to a specific feature.

#### 4. Update Feature Usage
```
POST /api/feature-control/features/:featureCode/usage
Body: { increment: 1 }
```
Increment usage count for a feature (enforces limits).

#### 5. Get Feature Usage
```
GET /api/feature-control/features/:featureCode/usage
```
Get current usage statistics for a feature.

#### 6. Get Subscription Plans
```
GET /api/feature-control/plans
```
Get all available subscription plans.

#### 7. Get Plan Comparison
```
GET /api/feature-control/plans/comparison
```
Get detailed comparison of all plans and their features.

#### 8. Change Subscription
```
POST /api/feature-control/subscription/change
Body: { planCode: "professional" }
```
Change user's subscription plan.

## Frontend Integration

### 1. Update Context Provider
The `SubscriptionContext` now automatically fetches data from the database and falls back to localStorage for offline/demo mode.

### 2. Using the API
```jsx
import { useSubscription } from '../Context/SubscriptionContext';
import featureControlAPI from '../services/featureControlApi';

function MyComponent() {
  const { hasFeature, getFeatureValue, checkLimit } = useSubscription();
  
  // Check if user has access to suppliers
  const canAccessSuppliers = hasFeature('suppliers');
  
  // Get supplier limit
  const supplierLimit = getFeatureValue('suppliers.limit');
  
  // Check if user can add more suppliers
  const canAddSupplier = checkLimit('suppliers.limit', currentSupplierCount);
  
  return (
    <div>
      {canAccessSuppliers ? (
        <SupplierManagement />
      ) : (
        <UpgradePrompt feature="suppliers" />
      )}
    </div>
  );
}
```

### 3. Real-time Usage Updates
When users perform actions that consume features, update the usage:

```jsx
const handleAddSupplier = async (supplierData) => {
  try {
    // First check if user has access
    const access = await featureControlAPI.checkFeatureAccess('suppliers');
    
    if (!access.data.hasAccess) {
      toast.error('You don\'t have access to this feature');
      return;
    }
    
    // Add the supplier
    const result = await addSupplier(supplierData);
    
    if (result.success) {
      // Update usage count
      await featureControlAPI.updateFeatureUsage('suppliers', 1);
      toast.success('Supplier added successfully!');
    }
  } catch (error) {
    toast.error('Failed to add supplier');
  }
};
```

## Backend Route Protection

Protect your backend routes with feature access checks:

```javascript
const { checkFeatureAccess } = require('./routes/featureControl');

// Protect supplier routes
router.get('/suppliers', checkFeatureAccess('suppliers'), (req, res) => {
  // Only accessible if user has supplier feature
  res.json({ suppliers: [] });
});

router.post('/suppliers', checkFeatureAccess('suppliers'), async (req, res) => {
  // Check usage limit before adding
  const access = await featureService.checkFeatureAccess(req.user.id, 'suppliers');
  
  if (access.usageStatus === 'limit_exceeded') {
    return res.status(403).json({
      success: false,
      message: 'Supplier limit exceeded'
    });
  }
  
  // Add supplier logic here
  
  // Update usage count
  await featureService.updateFeatureUsage(req.user.id, 'suppliers', 1);
  
  res.json({ success: true });
});
```

## Database Queries

### Common Queries

#### 1. Get User's Current Plan
```sql
SELECT sp.plan_code, sp.plan_name, us.status
FROM user_subscriptions us
JOIN subscription_plans sp ON us.plan_id = sp.id
WHERE us.user_id = ? AND us.status = 'active'
ORDER BY us.started_at DESC
LIMIT 1;
```

#### 2. Check Feature Access
```sql
SELECT pf.is_enabled, pf.usage_limit, COALESCE(fu.current_usage, 0) as current_usage
FROM user_subscriptions us
JOIN plan_features pf ON us.plan_id = pf.plan_id
JOIN features f ON pf.feature_id = f.id
LEFT JOIN feature_usage fu ON us.user_id = fu.user_id AND f.feature_code = fu.feature_code
WHERE us.user_id = ? AND f.feature_code = ? AND us.status = 'active';
```

#### 3. Update Feature Usage
```sql
INSERT INTO feature_usage (user_id, feature_code, current_usage)
VALUES (?, ?, ?)
ON DUPLICATE KEY UPDATE 
    current_usage = current_usage + VALUES(current_usage),
    updated_at = CURRENT_TIMESTAMP;
```

## Testing

### 1. Test Database Setup
```sql
-- Create test users with different plans
INSERT INTO user_subscriptions (user_id, plan_id, status) VALUES
(1, 1, 'active'), -- Basic plan
(2, 2, 'active'), -- Professional plan
(3, 3, 'active'), -- Business plan
(4, 4, 'active'); -- Enterprise plan

-- Test feature usage
INSERT INTO feature_usage (user_id, feature_code, current_usage) VALUES
(1, 'customers', 95), -- Near limit
(1, 'items', 50),
(2, 'customers', 250),
(2, 'suppliers', 25);
```

### 2. Test API Endpoints
```bash
# Get user features
curl -H "Authorization: Bearer <token>" \
  http://localhost:3001/api/feature-control/features

# Check specific feature
curl -H "Authorization: Bearer <token>" \
  http://localhost:3001/api/feature-control/features/suppliers/access

# Update usage
curl -X POST \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"increment": 1}' \
  http://localhost:3001/api/feature-control/features/suppliers/usage
```

## Error Handling

### Common Errors and Solutions

#### 1. Database Connection Issues
```javascript
// Add connection retry logic
const connectWithRetry = async () => {
  try {
    await database.getConnection();
    console.log('Database connected successfully');
  } catch (error) {
    console.error('Database connection failed, retrying...', error);
    setTimeout(connectWithRetry, 5000);
  }
};
```

#### 2. Feature Access Denied
```javascript
// Handle 403 responses in frontend
axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 403) {
      toast.error('Feature not available in your current plan');
      // Redirect to subscription page
      window.location.href = '/subscription';
    }
    return Promise.reject(error);
  }
);
```

#### 3. Usage Limit Exceeded
```javascript
// Handle limit exceeded errors
const handleLimitExceeded = (error) => {
  if (error.response?.data?.reason === 'Usage limit exceeded') {
    toast.error(`You've reached your limit. Upgrade to continue.`);
    // Show upgrade modal
    showUpgradeModal();
  }
};
```

## Performance Optimization

### 1. Database Indexing
```sql
-- Add indexes for better performance
CREATE INDEX idx_user_subscriptions_user_status ON user_subscriptions(user_id, status);
CREATE INDEX idx_feature_usage_user_feature ON feature_usage(user_id, feature_code);
CREATE INDEX idx_plan_features_plan_feature ON plan_features(plan_id, feature_id);
```

### 2. Caching
```javascript
// Add Redis caching for frequently accessed data
const redis = require('redis');
const client = redis.createClient();

const getCachedUserFeatures = async (userId) => {
  const cacheKey = `user_features:${userId}`;
  const cached = await client.get(cacheKey);
  
  if (cached) {
    return JSON.parse(cached);
  }
  
  const features = await featureService.getUserFeatures(userId);
  await client.setex(cacheKey, 300, JSON.stringify(features)); // Cache for 5 minutes
  
  return features;
};
```

### 3. Database Connection Pooling
```javascript
// Use connection pooling
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool;
```

## Security Considerations

### 1. Input Validation
```javascript
const { body, validationResult } = require('express-validator');

router.post('/features/:featureCode/usage', [
  body('increment').isInt({ min: 1, max: 100 }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  // Continue with processing
});
```

### 2. Rate Limiting
```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/feature-control', limiter);
```

### 3. SQL Injection Prevention
```javascript
// Always use parameterized queries
const [rows] = await db.execute(
  'SELECT * FROM users WHERE id = ? AND status = ?',
  [userId, 'active']
);
```

## Monitoring and Analytics

### 1. Feature Usage Analytics
```sql
-- Track popular features
SELECT f.feature_name, COUNT(*) as usage_count, AVG(fu.current_usage) as avg_usage
FROM feature_usage fu
JOIN features f ON fu.feature_code = f.feature_code
GROUP BY f.feature_code
ORDER BY usage_count DESC;
```

### 2. Plan Conversion Tracking
```sql
-- Track plan upgrades
SELECT 
    old_plan.plan_name as from_plan,
    new_plan.plan_name as to_plan,
    COUNT(*) as conversion_count
FROM user_subscriptions us1
JOIN user_subscriptions us2 ON us1.user_id = us2.user_id
JOIN subscription_plans old_plan ON us1.plan_id = old_plan.id
JOIN subscription_plans new_plan ON us2.plan_id = new_plan.id
WHERE us1.status = 'cancelled' 
AND us2.status = 'active'
AND us2.started_at > us1.started_at
GROUP BY old_plan.id, new_plan.id;
```

This comprehensive database integration provides a robust foundation for managing subscription-based feature access in your ChefMate POS system.
