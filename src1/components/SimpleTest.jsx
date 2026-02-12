import React from 'react';
import { useSubscription } from '../Context/SubscriptionContext';

const SimpleTest = () => {
  const { currentPlan } = useSubscription();
  
  return (
    <div>
      <h1>Simple Test</h1>
      <p>Current Plan: {currentPlan}</p>
    </div>
  );
};

export default SimpleTest;
