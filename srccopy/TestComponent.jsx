// Simple test to verify imports work
import React from 'react';
import { FeatureButton, FeatureCard, FeatureBadge } from './components/FeatureControls';
import { useSubscription } from './Context/SubscriptionContext';

const TestComponent = () => {
  const { currentPlan } = useSubscription();
  
  return (
    <div>
      <h1>Test Component</h1>
      <p>Current Plan: {currentPlan}</p>
      <FeatureButton feature="customers">Test Button</FeatureButton>
    </div>
  );
};

export default TestComponent;
