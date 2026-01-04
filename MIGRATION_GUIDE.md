# Migration Guide: From Legacy to Modular Subscription System

This guide helps you migrate from the legacy subscription system to the new modular structure that can be reused across projects.

## 📋 Overview

The new modular subscription system provides the same functionality as the legacy system but with:
- Better organization and modularity
- Easier reuse in other projects
- Improved maintainability
- Enhanced documentation

## 🚀 Quick Migration Steps

### Step 1: Update Provider Import
```jsx
// ❌ Old way
import SubscriptionProvider from './Context/SubscriptionContext';

// ✅ New way
import { SubscriptionProvider } from './lib/subscription-system';
```

### Step 2: Update Component Imports
```jsx
// ❌ Old way
import { useSubscription } from '../Context/SubscriptionContext';
import { FeatureButton, FeatureCard } from '../components/FeatureControls';
import FeatureProtectedRoute from '../utils/FeatureProtectedRoute';
import featureControlApi from '../services/featureControlApi';

// ✅ New way
import { 
  useSubscription, 
  FeatureButton, 
  FeatureCard, 
  FeatureProtectedRoute, 
  SubscriptionAPI 
} from './lib/subscription-system';
```

### Step 3: Update Demo Page Import
```jsx
// ❌ Old way
import FeatureControlDemo from './components/FeatureControlDemo';

// ✅ New way
import { SubscriptionDemo } from './lib/subscription-system';
import Layout from './layout/Layout';

// Usage
<SubscriptionDemo Layout={Layout} />
```

### Step 4: Update API Service Usage
```jsx
// ❌ Old way
import featureControlApi from '../services/featureControlApi';

// ✅ New way
import { SubscriptionAPI } from './lib/subscription-system';
import { getHeaders } from './utility/getHeader';

const apiService = new SubscriptionAPI();
apiService.setHeadersFunction(getHeaders);
```

## 🔧 Detailed Migration

### App.js Changes
```jsx
// ❌ Old App.js
import SubscriptionProvider from './Context/SubscriptionContext';
import FeatureProtectedRoute from './utils/FeatureProtectedRoute';
import FeatureControlDemo from './components/FeatureControlDemo';

function App() {
  return (
    <SubscriptionProvider>
      <Router>
        <Routes>
          <Route path="/demo" element={<FeatureControlDemo />} />
          <Route path="/protected" element={
            <FeatureProtectedRoute route="/protected">
              <ProtectedPage />
            </FeatureProtectedRoute>
          } />
        </Routes>
      </Router>
    </SubscriptionProvider>
  );
}
```

```jsx
// ✅ New App.js
import { SubscriptionProvider, FeatureProtectedRoute, SubscriptionDemo } from './lib/subscription-system';
import Layout from './layout/Layout';

function App() {
  return (
    <SubscriptionProvider>
      <Router>
        <Routes>
          <Route path="/demo" element={<SubscriptionDemo Layout={Layout} />} />
          <Route path="/protected" element={
            <FeatureProtectedRoute route="/protected">
              <ProtectedPage />
            </FeatureProtectedRoute>
          } />
        </Routes>
      </Router>
    </SubscriptionProvider>
  );
}
```

### Component Changes
```jsx
// ❌ Old component
import React from 'react';
import { useSubscription } from '../Context/SubscriptionContext';
import { FeatureButton, FeatureCard } from '../components/FeatureControls';

function MyComponent() {
  const { hasFeature } = useSubscription();
  
  return (
    <div>
      <FeatureButton feature="customers">Add Customer</FeatureButton>
      <FeatureCard feature="reports">Reports Content</FeatureCard>
    </div>
  );
}
```

```jsx
// ✅ New component
import React from 'react';
import { useSubscription, FeatureButton, FeatureCard } from './lib/subscription-system';

function MyComponent() {
  const { hasFeature } = useSubscription();
  
  return (
    <div>
      <FeatureButton feature="customers">Add Customer</FeatureButton>
      <FeatureCard feature="reports">Reports Content</FeatureCard>
    </div>
  );
}
```

### API Service Changes
```jsx
// ❌ Old service usage
import featureControlApi, { fetchFeatureData } from '../services/featureControlApi';

// Usage
const subscription = await featureControlApi.getUserSubscription();
const featureData = await fetchFeatureData();
```

```jsx
// ✅ New service usage
import { SubscriptionAPI } from './lib/subscription-system';
import { getHeaders } from './utility/getHeader';

const apiService = new SubscriptionAPI();
apiService.setHeadersFunction(getHeaders);

// Usage
const subscription = await apiService.getUserSubscription();
const featureData = await apiService.fetchFeatureData();
```

## 🗂️ File Structure Changes

### Old Structure
```
src/
├── Context/
│   └── SubscriptionContext.js
├── components/
│   ├── FeatureControls.jsx
│   └── FeatureControlDemo.jsx
├── utils/
│   └── FeatureProtectedRoute.js
└── services/
    └── featureControlApi.js
```

### New Structure
```
src/
├── lib/
│   └── subscription-system/
│       ├── components/
│       │   ├── FeatureControls.jsx
│       │   └── FeatureProtectedRoute.jsx
│       ├── hooks/
│       │   └── useSubscription.js
│       ├── services/
│       │   └── SubscriptionAPI.js
│       ├── demo/
│       │   └── SubscriptionDemo.jsx
│       ├── utils/
│       │   ├── featureControl.js
│       │   ├── planDefaults.js
│       │   └── config.js
│       └── index.js
└── [other app files]
```

## 🔍 What's New

### Enhanced Components
- **LimitGuard**: New component for limit-based protection
- **RouteGuard**: New component for route-based protection
- **FeatureInput**: Enhanced input component with feature control
- **FeatureTooltip**: New tooltip component for better UX

### Better Organization
- All utilities moved to `utils/` directory
- Cleaner separation of concerns
- Better TypeScript support

### Improved Demo
- More responsive design
- Better mobile experience
- Enhanced feature demonstrations

## 🔄 Reusing in Other Projects

### Step 1: Copy the Module
```bash
cp -r src/lib/subscription-system /path/to/new/project/src/lib/
```

### Step 2: Install Dependencies
```bash
npm install react react-dom react-router-dom axios
```

### Step 3: Configure for New Project
```jsx
// In new project's App.js
import { SubscriptionProvider, FeatureProtectedRoute } from './lib/subscription-system';
import { getHeaders } from './utils/headers'; // Your project's headers

function App() {
  const apiService = new SubscriptionAPI();
  apiService.setHeadersFunction(getHeaders);

  return (
    <SubscriptionProvider
      apiService={apiService}
      initialPlan="basic"
      onPlanChange={(newPlan) => {
        // Handle plan changes
      }}
    >
      {/* Your app content */}
    </SubscriptionProvider>
  );
}
```

### Step 4: Customize Plans and Features
```jsx
// Update utils/planDefaults.js for your project
export const DEFAULT_PLAN_FEATURES = {
  basic: {
    name: 'Basic Plan',
    features: {
      // Your project's features
      userManagement: { enabled: true, limit: 10 },
      projects: { enabled: true, limit: 5 },
      // ...
    }
  },
  // ... other plans
};
```

## 🧪 Testing the Migration

### 1. Verify Imports
Make sure all imports are working:
```jsx
import { 
  SubscriptionProvider, 
  useSubscription, 
  FeatureButton 
} from './lib/subscription-system';
```

### 2. Test Feature Controls
```jsx
function TestComponent() {
  const { hasFeature, currentPlan } = useSubscription();
  
  return (
    <div>
      <p>Current Plan: {currentPlan}</p>
      <p>Has Customers: {hasFeature('customers') ? 'Yes' : 'No'}</p>
      <FeatureButton feature="customers">Test Button</FeatureButton>
    </div>
  );
}
```

### 3. Test Demo Page
Navigate to `/demo` or `/subscription-demo` to test the demo page.

## 🚨 Common Issues

### Import Errors
```javascript
// ❌ Wrong
import FeatureControls from './lib/subscription-system/components/FeatureControls';

// ✅ Correct
import { FeatureButton } from './lib/subscription-system';
```

### Provider Not Found
```javascript
// ❌ Component used outside provider
function MyComponent() {
  const { hasFeature } = useSubscription(); // Error!
}

// ✅ Wrap with provider
<SubscriptionProvider>
  <MyComponent />
</SubscriptionProvider>
```

### Missing Dependencies
```bash
# Install missing dependencies
npm install react-router-dom axios
```

## 📚 Next Steps

1. **Test thoroughly**: Verify all features work as expected
2. **Update documentation**: Update your project's documentation
3. **Clean up**: Remove old files after migration is complete
4. **Optimize**: Customize the system for your specific needs

## 🆘 Troubleshooting

### Build Errors
1. Check all imports are correct
2. Verify dependencies are installed
3. Ensure React Router is properly configured

### Runtime Errors
1. Check console for specific errors
2. Verify provider is wrapping your app
3. Test in demo mode first

### Feature Not Working
1. Check feature configuration in `planDefaults.js`
2. Verify current plan has the feature
3. Check route mapping if using route protection

## 🎯 Benefits of Migration

- **Modularity**: Easy to reuse in other projects
- **Maintainability**: Better organized code
- **Scalability**: Easy to add new features
- **Documentation**: Better documented system
- **Testing**: Easier to test individual components

---

**🎉 Congratulations! You've successfully migrated to the modular subscription system!**
