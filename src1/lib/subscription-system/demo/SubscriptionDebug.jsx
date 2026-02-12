import React from 'react';
import { useSubscription } from '../hooks/useSubscription';

const SubscriptionDebug = () => {
  const { 
    currentPlan, 
    features, 
    hasFeature, 
    getFeatureValue, 
    canAccessRoute,
    updateSubscription 
  } = useSubscription();

  const testFeatures = ['customers', 'suppliers', 'pos', 'reports', 'users'];
  const testRoutes = [
    '/master/customers',
    '/master/suppliers', 
    '/sale/pos',
    '/reports/billhistory',
    '/users/newuser'
  ];

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Subscription System Debug</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>Current Plan: <span style={{ color: '#007bff' }}>{currentPlan}</span></h3>
        
        <div style={{ marginBottom: '10px' }}>
          <strong>Switch Plan:</strong>
          {['basic', 'professional', 'business', 'enterprise'].map(plan => (
            <button 
              key={plan}
              onClick={() => updateSubscription(plan)}
              style={{
                margin: '0 5px',
                padding: '5px 10px',
                backgroundColor: currentPlan === plan ? '#007bff' : '#f8f9fa',
                color: currentPlan === plan ? 'white' : 'black',
                border: '1px solid #ddd',
                borderRadius: '3px',
                cursor: 'pointer'
              }}
            >
              {plan}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div>
          <h3>Feature Access</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8f9fa' }}>
                <th style={{ padding: '8px', border: '1px solid #ddd' }}>Feature</th>
                <th style={{ padding: '8px', border: '1px solid #ddd' }}>Status</th>
                <th style={{ padding: '8px', border: '1px solid #ddd' }}>Limit</th>
              </tr>
            </thead>
            <tbody>
              {testFeatures.map(feature => (
                <tr key={feature}>
                  <td style={{ padding: '8px', border: '1px solid #ddd' }}>{feature}</td>
                  <td style={{ 
                    padding: '8px', 
                    border: '1px solid #ddd',
                    color: hasFeature(feature) ? '#28a745' : '#dc3545'
                  }}>
                    {hasFeature(feature) ? '✅ Enabled' : '❌ Disabled'}
                  </td>
                  <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                    {getFeatureValue(feature) === 'unlimited' ? '∞' : getFeatureValue(feature)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div>
          <h3>Route Access</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8f9fa' }}>
                <th style={{ padding: '8px', border: '1px solid #ddd' }}>Route</th>
                <th style={{ padding: '8px', border: '1px solid #ddd' }}>Access</th>
              </tr>
            </thead>
            <tbody>
              {testRoutes.map(route => (
                <tr key={route}>
                  <td style={{ padding: '8px', border: '1px solid #ddd' }}>{route}</td>
                  <td style={{ 
                    padding: '8px', 
                    border: '1px solid #ddd',
                    color: canAccessRoute(route) ? '#28a745' : '#dc3545'
                  }}>
                    {canAccessRoute(route) ? '✅ Allowed' : '❌ Blocked'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ marginTop: '20px' }}>
        <h3>Plan Features (Raw Data)</h3>
        <pre style={{ 
          backgroundColor: '#f8f9fa', 
          padding: '10px', 
          borderRadius: '5px',
          fontSize: '12px',
          overflow: 'auto'
        }}>
          {JSON.stringify(features[currentPlan], null, 2)}
        </pre>
      </div>
    </div>
  );
};

export default SubscriptionDebug;
