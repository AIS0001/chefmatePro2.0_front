# Subscription System Usage Guide

## Overview
The modular subscription system allows you to restrict and manage features based on subscription tiers. This guide explains how to implement feature controls in your components using the new modular structure.

## Installation and Setup

### 1. Import the Subscription System
```jsx
import { 
  SubscriptionProvider, 
  useSubscription, 
  FeatureButton, 
  FeatureCard, 
  LimitDisplay, 
  FeatureProgressBar,
  RouteGuard,
  LimitGuard,
  FeatureProtectedRoute,
  SubscriptionAPI 
} from './lib/subscription-system';
```

### 2. Setup the Provider
```jsx
// App.js
import { SubscriptionProvider, FeatureProtectedRoute } from './lib/subscription-system';
import { getHeaders } from './utility/getHeader'; // Your custom headers function

function App() {
  // Optional: Create API service instance
  const apiService = new SubscriptionAPI();
  apiService.setHeadersFunction(getHeaders);

  return (
    <SubscriptionProvider
      apiService={apiService}
      initialPlan="basic"
      onPlanChange={(newPlan, oldPlan) => {
        console.log(`Plan changed from ${oldPlan} to ${newPlan}`);
      }}
      onError={(error) => {
        console.error('Subscription error:', error);
      }}
    >
      <Router>
        <Routes>
          {/* Your routes */}
        </Routes>
      </Router>
    </SubscriptionProvider>
  );
}
```

### 3. Use Feature Control Hook
```jsx
const { 
  currentPlan, 
  hasFeature, 
  getFeatureValue, 
  canAccessRoute, 
  checkLimit,
  updateSubscription 
} = useSubscription();
```

## Feature Control Components

### 1. RouteGuard
Protects entire routes/pages from unauthorized access.

```jsx
<RouteGuard route="/master/suppliers">
  <YourPageContent />
</RouteGuard>
```

### 2. FeatureButton
Buttons that are disabled/hidden based on feature access.

```jsx
<FeatureButton
  feature="suppliers"
  onClick={() => handleAddSupplier()}
  className="btn btn-primary"
>
  Add Supplier
</FeatureButton>
```

### 3. FeatureCard
Cards that show upgrade prompts when features are not available.

```jsx
<FeatureCard
  feature="suppliers"
  title="Supplier Management"
  description="Manage your suppliers"
  className="card-view"
>
  <YourCardContent />
</FeatureCard>
```

### 4. LimitGuard
Prevents actions when limits are reached.

```jsx
<LimitGuard
  feature="suppliers.limit"
  currentCount={supplierCount}
  fallback={<UpgradePrompt />}
>
  <AddSupplierForm />
</LimitGuard>
```

### 5. LimitDisplay
Shows current usage vs limits.

```jsx
<LimitDisplay 
  feature="suppliers.limit" 
  currentCount={supplierCount} 
  className="badge badge-info" 
/>
```

### 6. FeatureProgressBar
Visual progress bar for limits.

```jsx
<FeatureProgressBar 
  feature="suppliers.limit" 
  currentCount={supplierCount} 
  className="progress" 
/>
```

## Feature Paths

### Master Data Features
- `customers` - Customer management
- `suppliers` - Supplier management  
- `tables` - Table management
- `categories` - Category management
- `paymentOptions` - Payment options

### Inventory Features
- `items` - Item management
- `stockManagement` - Stock tracking
- `productManagement` - Product variants
- `stockReports` - Stock reports

### Sales Features
- `pos` - POS system
- `advanceOrders` - Advance orders
- `retailSales` - Retail sales

### Financial Features
- `vouchers` - Voucher system
- `expenses` - Expense tracking

### Reporting Features
- `salesReports` - Sales reports
- `itemWiseReports` - Item-wise reports
- `customerReports` - Customer reports
- `supplierReports` - Supplier reports
- `advanceOrderReports` - Advance order reports
- `lowStockReports` - Low stock reports

### System Features
- `users` - User management
- `profileManagement` - Profile management
- `coreSettings` - Core settings
- `companyInfo` - Company information
- `taxManagement` - Tax management
- `unitsManagement` - Units management

## Subscription Plans

### Basic Plan
- Limited features with low limits
- No advanced features
- Basic support

### Professional Plan  
- Most features unlocked
- Higher limits
- Advanced features available

### Business Plan
- All features unlocked
- Unlimited or very high limits
- Advanced reporting and analytics

### Enterprise Plan
- All features + custom features
- Unlimited everything
- Custom integrations and support

## Usage Examples

### 1. Protecting a Page
```jsx
export default function SuppliersPage() {
  return (
    <RouteGuard route="/master/suppliers">
      <Layout>
        <Header title="Suppliers" />
        <YourPageContent />
      </Layout>
    </RouteGuard>
  );
}
```

### 2. Feature-Controlled Button
```jsx
const handleAddSupplier = () => {
  if (checkLimit('suppliers.limit', supplierCount)) {
    // Proceed with adding supplier
  }
};

return (
  <FeatureButton
    feature="suppliers"
    onClick={handleAddSupplier}
    disabled={!checkLimit('suppliers.limit', supplierCount)}
    className="btn btn-primary"
  >
    Add New Supplier
  </FeatureButton>
);
```

### 3. Limit-Controlled Form
```jsx
<LimitGuard
  feature="suppliers.limit"
  currentCount={supplierCount}
  fallback={
    <div className="alert alert-warning">
      <h6>Limit Reached</h6>
      <p>You've reached your supplier limit. Upgrade to add more.</p>
      <Link to="/subscription" className="btn btn-primary">Upgrade</Link>
    </div>
  }
>
  <AddSupplierForm />
</LimitGuard>
```

### 4. Feature Status Display
```jsx
<div className="feature-status">
  <h6>Current Usage</h6>
  <div className="mb-2">
    Suppliers: <LimitDisplay feature="suppliers.limit" currentCount={supplierCount} />
  </div>
  <FeatureProgressBar feature="suppliers.limit" currentCount={supplierCount} />
</div>
```

### 5. Conditional Rendering
```jsx
{hasFeature('suppliers') && (
  <div className="supplier-section">
    <h5>Supplier Management</h5>
    <SupplierList />
  </div>
)}

{!hasFeature('suppliers') && (
  <div className="upgrade-prompt">
    <h6>Supplier Management</h6>
    <p>This feature is not available in your current plan.</p>
    <Link to="/subscription" className="btn btn-primary">Upgrade Plan</Link>
  </div>
)}
```

## Best Practices

### 1. Always Check Features
- Check feature availability before rendering components
- Show upgrade prompts instead of hiding features completely
- Provide clear feedback about plan limitations

### 2. Graceful Degradation
- Provide fallback content when features are not available
- Show informative messages about what's needed to unlock features
- Don't break the UI when features are disabled

### 3. Consistent UX
- Use consistent messaging across all feature controls
- Show plan information prominently
- Make upgrade paths clear and accessible

### 4. Performance
- Use feature checks efficiently
- Cache feature values where possible
- Avoid unnecessary re-renders

### 5. Testing
- Test all plan levels thoroughly
- Verify limit enforcement works correctly
- Test upgrade/downgrade scenarios

## Error Handling

### 1. Missing Features
```jsx
if (!hasFeature('suppliers')) {
  return (
    <div className="alert alert-warning">
      <h6>Feature Not Available</h6>
      <p>Supplier management is not available in your current plan.</p>
      <Link to="/subscription" className="btn btn-primary">Upgrade Plan</Link>
    </div>
  );
}
```

### 2. Limit Exceeded
```jsx
if (!checkLimit('suppliers.limit', supplierCount)) {
  return (
    <div className="alert alert-danger">
      <h6>Limit Exceeded</h6>
      <p>You've reached your supplier limit ({getFeatureValue('suppliers.limit')}).</p>
      <Link to="/subscription" className="btn btn-primary">Upgrade Plan</Link>
    </div>
  );
}
```

### 3. Network Errors
```jsx
try {
  const result = await addSupplier(data);
  // Handle success
} catch (error) {
  if (error.code === 'LIMIT_EXCEEDED') {
    toast.error('Supplier limit reached. Please upgrade your plan.');
  } else {
    toast.error('Error adding supplier. Please try again.');
  }
}
```

## Integration with Backend

### 1. API Validation
Ensure your backend also validates feature access:
```javascript
// Backend validation example
if (!user.hasFeature('suppliers')) {
  return res.status(403).json({ error: 'Feature not available in your plan' });
}

if (!user.checkLimit('suppliers.limit', currentCount)) {
  return res.status(403).json({ error: 'Supplier limit exceeded' });
}
```

### 2. Database Schema
Store subscription data in your database:
```sql
CREATE TABLE user_subscriptions (
  id INT PRIMARY KEY,
  user_id INT,
  plan_type VARCHAR(50),
  features JSON,
  limits JSON,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

## Troubleshooting

### Common Issues
1. **Feature not working**: Check if feature path is correct
2. **Limits not enforcing**: Verify limit check implementation
3. **UI not updating**: Ensure component re-renders on plan changes
4. **Route protection failing**: Check route path mapping

### Debug Tools
1. Use the Feature Control Demo page at `/feature-demo`
2. Check browser console for feature control logs
3. Use React DevTools to inspect subscription context
4. Test different plan levels manually

This system provides comprehensive feature control while maintaining a good user experience and clear upgrade paths.
