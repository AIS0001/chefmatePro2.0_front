// Main export file for the subscription system
// This file exports all components, hooks, and utilities

// Context Provider
export { default as SubscriptionProvider, useSubscription } from './hooks/useSubscription';

// Components
export {
  FeatureButton,
  FeatureCard,
  FeatureBadge,
  LimitDisplay,
  FeatureProgressBar,
  PlanBadge,
  FeatureTooltip,
  FeatureInput,
  LimitGuard,
  RouteGuard
} from './components/FeatureControls';

export { default as FeatureProtectedRoute } from './components/FeatureProtectedRoute';
export { default as UpgradePrompt } from './components/UpgradePrompt';
export { default as SubscriptionDemo } from './demo/SubscriptionDemo';

// Utilities
export * from './utils/featureControl';
export * from './utils/planDefaults';

// Services
export { default as SubscriptionAPI } from './services/SubscriptionAPI';

// Types (if using TypeScript)
export * from './types/subscription';

// Configuration
export { default as SubscriptionConfig } from './utils/config';
