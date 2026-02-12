# Subscription System - Modular Feature Control

A comprehensive, reusable subscription and feature control system for React applications. This modular system allows you to easily implement subscription-based feature access, limits, and upgrade prompts in any React project.

## 🚀 Features

- **Subscription Management**: Complete subscription plan handling with different tiers
- **Feature Control**: Granular control over feature access based on subscription plans
- **Usage Limits**: Track and enforce usage limits for different features
- **Route Protection**: Protect routes based on subscription features
- **Responsive Components**: Mobile-first, responsive UI components
- **Demo Mode**: Built-in demo mode for testing without backend
- **Modular Design**: Easy to integrate into any React project
- **TypeScript Support**: Full TypeScript support (optional)

## 📦 Structure

```
src/lib/subscription-system/
├── components/           # React components
│   ├── FeatureControls.jsx
│   └── FeatureProtectedRoute.jsx
├── hooks/               # React hooks
│   └── useSubscription.js
├── utils/               # Utility functions
│   ├── featureControl.js
│   ├── planDefaults.js
│   └── config.js
├── services/            # API services
│   └── SubscriptionAPI.js
├── demo/               # Demo components
│   └── SubscriptionDemo.jsx
├── types/              # TypeScript types
│   └── subscription.js
├── index.js           # Main exports
└── package.json       # Package configuration
```

## 🔧 Installation

### From This Project
Copy the entire `src/lib/subscription-system` directory to your project.

### Basic Setup
```bash
# Install required dependencies
npm install react react-dom react-router-dom axios
```

## 🚀 Quick Start

### 1. Setup Provider
```jsx
import { SubscriptionProvider, FeatureProtectedRoute } from './lib/subscription-system';

function App() {
  return (
    <SubscriptionProvider
      initialPlan="basic"
      onPlanChange={(newPlan, oldPlan) => {
        console.log(`Plan changed from ${oldPlan} to ${newPlan}`);
      }}
    >
      <Router>
        <Routes>
          <Route path="/subscription-demo" element={<SubscriptionDemo />} />
          
          {/* Protected routes */}
          <Route path="/premium-feature" element={
            <FeatureProtectedRoute requiredFeature="premium">
              <PremiumFeature />
            </FeatureProtectedRoute>
          } />
        </Routes>
      </Router>
    </SubscriptionProvider>
  );
}
```

### 2. Use Feature Controls
```jsx
import { useSubscription, FeatureButton, FeatureCard } from './lib/subscription-system';

function Dashboard() {
  const { hasFeature, updateSubscription } = useSubscription();

  return (
    <div>
      <h1>Dashboard</h1>
      
      {/* Feature-controlled button */}
      <FeatureButton
        feature="customers"
        onClick={() => console.log('Add customer')}
        className="btn btn-primary"
      >
        Add Customer
      </FeatureButton>

      {/* Feature-controlled card */}
      <FeatureCard feature="reports" title="Advanced Reports">
        <p>Generate advanced business reports</p>
      </FeatureCard>
    </div>
  );
}
```

### 3. Check Features Programmatically
```jsx
import { useSubscription } from './lib/subscription-system';

function MyComponent() {
  const { hasFeature, getFeatureValue, checkLimit } = useSubscription();

  const handleAddCustomer = () => {
    if (!hasFeature('customers')) {
      alert('Customer management not available in your plan');
      return;
    }

    const limitCheck = checkLimit('customers', customerCount);
    if (!limitCheck.withinLimit) {
      alert(`Customer limit reached (${limitCheck.limit})`);
      return;
    }

    // Proceed with adding customer
    addCustomer();
  };

  return (
    <button onClick={handleAddCustomer}>
      Add Customer
    </button>
  );
}
```

## 📖 Components

### FeatureButton
Button that's disabled when feature is not available.

```jsx
<FeatureButton
  feature="customers"
  onClick={() => handleClick()}
  className="btn btn-primary"
>
  Add Customer
</FeatureButton>
```

### FeatureCard
Card that shows upgrade prompt when feature is not available.

```jsx
<FeatureCard
  feature="reports"
  title="Advanced Reports"
  showUpgrade={true}
>
  <ReportsContent />
</FeatureCard>
```

### LimitGuard
Prevents actions when limits are reached.

```jsx
<LimitGuard
  feature="customers"
  currentCount={customerCount}
  fallback={<UpgradePrompt />}
>
  <AddCustomerForm />
</LimitGuard>
```

### RouteGuard
Protects content based on route access.

```jsx
<RouteGuard route="/premium-feature">
  <PremiumContent />
</RouteGuard>
```

### FeatureProtectedRoute
React Router route protection.

```jsx
<Route path="/premium" element={
  <FeatureProtectedRoute requiredFeature="premium">
    <PremiumPage />
  </FeatureProtectedRoute>
} />
```

## 🔧 Configuration

### Plan Configuration
```javascript
// utils/planDefaults.js
export const DEFAULT_PLAN_FEATURES = {
  basic: {
    name: 'Basic Plan',
    price: 29,
    features: {
      customers: { enabled: true, limit: 100 },
      reports: { enabled: false, limit: 0 },
      // ... more features
    }
  },
  professional: {
    name: 'Professional Plan',
    price: 99,
    features: {
      customers: { enabled: true, limit: 1000 },
      reports: { enabled: true, limit: 10 },
      // ... more features
    }
  }
};
```

### Route Mapping
```javascript
// utils/planDefaults.js
export const DEFAULT_ROUTE_MAPPING = {
  '/customers': 'customers',
  '/reports': 'reports',
  '/premium-feature': 'premium'
};
```

## 🌐 API Integration

### Setup API Service
```jsx
import { SubscriptionAPI } from './lib/subscription-system';

// Create API service
const apiService = new SubscriptionAPI();

// Set custom headers (optional)
apiService.setHeadersFunction(() => ({
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
}));

// Use in provider
<SubscriptionProvider apiService={apiService}>
  <App />
</SubscriptionProvider>
```

### API Methods
```javascript
// Get user subscription
const subscription = await apiService.getUserSubscription();

// Update feature usage
await apiService.updateFeatureUsage('customers', 1);

// Change subscription
await apiService.changeSubscription('professional');
```

## 🎨 Styling

The system uses Bootstrap classes by default, but can be customized:

```jsx
<FeatureButton
  feature="customers"
  className="custom-btn custom-btn-primary"
>
  Custom Styled Button
</FeatureButton>
```

## 🧪 Demo Mode

The system includes a demo mode for testing:

```jsx
<SubscriptionProvider
  initialPlan="basic"
  demoMode={true}
>
  <App />
</SubscriptionProvider>
```

## 🔍 Error Handling

```jsx
<SubscriptionProvider
  onError={(error) => {
    console.error('Subscription error:', error);
    // Handle error (e.g., show notification)
  }}
>
  <App />
</SubscriptionProvider>
```

## 🧩 Extending the System

### Adding New Features
1. Update `utils/planDefaults.js` with new features
2. Add route mappings if needed
3. Use in components with existing controls

### Custom Components
```jsx
import { useSubscription } from './lib/subscription-system';

function CustomFeatureComponent({ feature, children }) {
  const { hasFeature } = useSubscription();
  
  if (!hasFeature(feature)) {
    return <div>Feature not available</div>;
  }
  
  return children;
}
```

## 📱 Mobile Responsive

All components are mobile-first and responsive:

```jsx
<FeatureButton
  feature="customers"
  className="btn btn-primary btn-lg w-100"
>
  <i className="fas fa-user-plus me-2"></i>
  <span className="d-none d-sm-inline">Add Customer</span>
  <span className="d-inline d-sm-none">Add</span>
</FeatureButton>
```

## 🚀 Migration from Legacy System

### 1. Update Imports
```jsx
// Old
import { useSubscription } from '../Context/SubscriptionContext';
import { FeatureButton } from '../components/FeatureControls';

// New
import { useSubscription, FeatureButton } from './lib/subscription-system';
```

### 2. Update Provider
```jsx
// Old
import SubscriptionProvider from './Context/SubscriptionContext';

// New
import { SubscriptionProvider } from './lib/subscription-system';
```

### 3. Update Route Protection
```jsx
// Old
import FeatureProtectedRoute from './utils/FeatureProtectedRoute';

// New
import { FeatureProtectedRoute } from './lib/subscription-system';
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🔗 Related Projects

- [ChefMate POS](https://github.com/your-org/chefmate) - Main POS system
- [Subscription Backend](https://github.com/your-org/subscription-backend) - Backend API

## 🆘 Support

For support, please open an issue in the repository or contact the development team.

---

**Made with ❤️ for developers who want flexible subscription systems**
