import React from 'react';
import { useSubscription } from '../hooks/useSubscription';
import { FeatureButton, FeatureCard } from '../components/FeatureControls';

const SubscriptionTest = () => {
  const { 
    currentPlan, 
    hasFeature, 
    getFeatureValue, 
    canAccessRoute, 
    updateSubscription,
    features
  } = useSubscription();

  const testFeatures = [
    { name: 'customers', route: '/master/customers' },
    { name: 'suppliers', route: '/master/suppliers' },
    { name: 'pos', route: '/sale/pos' },
    { name: 'reports', route: '/reports/billhistory' },
    { name: 'users', route: '/users/newuser' }
  ];

  const planOptions = ['basic', 'professional', 'business', 'enterprise'];

  return (
    <div className="container-fluid py-4">
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h3>Subscription System Test</h3>
              <p className="mb-0">Current Plan: <span className="badge bg-primary">{currentPlan}</span></p>
            </div>
            <div className="card-body">
              
              {/* Plan Switcher */}
              <div className="mb-4">
                <h5>Switch Plan (Demo)</h5>
                <div className="btn-group" role="group">
                  {planOptions.map(plan => (
                    <button
                      key={plan}
                      type="button"
                      className={`btn ${currentPlan === plan ? 'btn-primary' : 'btn-outline-primary'}`}
                      onClick={() => updateSubscription(plan)}
                    >
                      {plan}
                    </button>
                  ))}
                </div>
              </div>

              {/* Feature Testing */}
              <div className="mb-4">
                <h5>Feature Access Test</h5>
                <div className="row">
                  {testFeatures.map(({ name, route }) => (
                    <div key={name} className="col-md-6 col-lg-4 mb-3">
                      <div className="card">
                        <div className="card-body">
                          <h6>{name}</h6>
                          <p className="small text-muted">Route: {route}</p>
                          <div className="d-flex justify-content-between align-items-center">
                            <span className={`badge ${hasFeature(name) ? 'bg-success' : 'bg-danger'}`}>
                              {hasFeature(name) ? 'Available' : 'Locked'}
                            </span>
                            <span className="text-muted">
                              {getFeatureValue(name) === 'unlimited' ? '∞' : getFeatureValue(name)}
                            </span>
                          </div>
                          <div className="mt-2">
                            <span className={`badge ${canAccessRoute(route) ? 'bg-success' : 'bg-danger'}`}>
                              Route: {canAccessRoute(route) ? 'Accessible' : 'Blocked'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Feature Controls Test */}
              <div className="mb-4">
                <h5>Feature Controls Test</h5>
                <div className="row">
                  <div className="col-md-4">
                    <FeatureButton
                      feature="customers"
                      onClick={() => alert('Customer feature clicked')}
                      className="btn btn-primary w-100"
                    >
                      Customer Management
                    </FeatureButton>
                  </div>
                  <div className="col-md-4">
                    <FeatureButton
                      feature="suppliers"
                      onClick={() => alert('Supplier feature clicked')}
                      className="btn btn-success w-100"
                    >
                      Supplier Management
                    </FeatureButton>
                  </div>
                  <div className="col-md-4">
                    <FeatureButton
                      feature="reports"
                      onClick={() => alert('Reports feature clicked')}
                      className="btn btn-info w-100"
                    >
                      Reports
                    </FeatureButton>
                  </div>
                </div>
              </div>

              {/* Feature Cards Test */}
              <div className="mb-4">
                <h5>Feature Cards Test</h5>
                <div className="row">
                  <div className="col-md-6">
                    <FeatureCard feature="customers" className="card border-primary">
                      <div className="card-body">
                        <h6>Customer Management</h6>
                        <p>Manage your customers efficiently</p>
                      </div>
                    </FeatureCard>
                  </div>
                  <div className="col-md-6">
                    <FeatureCard feature="suppliers" className="card border-success">
                      <div className="card-body">
                        <h6>Supplier Management</h6>
                        <p>Track supplier information</p>
                      </div>
                    </FeatureCard>
                  </div>
                </div>
              </div>

              {/* Plan Features Debug */}
              <div className="mb-4">
                <h5>Plan Features Debug</h5>
                <div className="card">
                  <div className="card-body">
                    <pre>{JSON.stringify(features[currentPlan], null, 2)}</pre>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionTest;
