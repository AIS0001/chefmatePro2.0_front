import React, { useState, useEffect } from 'react';
import { useSubscription } from '../Context/SubscriptionContext';
import { Link } from 'react-router-dom';
import { FeatureButton, FeatureCard, FeatureBadge } from './FeatureControls';
import Layout from '../layout/Layout';

// Custom styles for mobile responsiveness
const mobileStyles = `
  .feature-demo-container {
    min-height: 100vh;
  }
  
  @media (max-width: 768px) {
    .page-title {
      font-size: 1.5rem !important;
      text-align: center;
    }
    
    .card-header h5 {
      font-size: 1rem !important;
    }
    
    .btn-group-vertical .btn {
      font-size: 0.9rem !important;
      margin-bottom: 0.5rem !important;
    }
    
    .badge {
      font-size: 0.8rem !important;
      padding: 0.5rem !important;
    }
    
    .progress {
      height: 8px !important;
    }
    
    .card-body {
      padding: 1rem !important;
    }
    
    .breadcrumb {
      font-size: 0.85rem !important;
      justify-content: center !important;
    }
    
    .feature-card {
      margin-bottom: 1rem !important;
    }
    
    .btn-lg {
      font-size: 0.95rem !important;
      padding: 0.75rem 1rem !important;
    }
  }
  
  @media (max-width: 576px) {
    .page-title {
      font-size: 1.25rem !important;
    }
    
    .btn-lg {
      font-size: 0.9rem !important;
      padding: 0.5rem 1rem !important;
    }
    
    .card-header h5 {
      font-size: 0.9rem !important;
    }
    
    .card-body {
      padding: 0.75rem !important;
    }
    
    .container-fluid {
      padding-left: 0.5rem !important;
      padding-right: 0.5rem !important;
    }
    
    .row {
      margin-left: -0.25rem !important;
      margin-right: -0.25rem !important;
    }
    
    .col-12, .col-sm-6, .col-md-6, .col-lg-4 {
      padding-left: 0.25rem !important;
      padding-right: 0.25rem !important;
    }
    
    .card {
      margin-bottom: 1rem !important;
    }
    
    .feature-badge {
      font-size: 0.7rem !important;
    }
  }
  
  @media (max-width: 320px) {
    .page-title {
      font-size: 1.1rem !important;
    }
    
    .btn {
      font-size: 0.8rem !important;
    }
    
    .card-header h5 {
      font-size: 0.8rem !important;
    }
  }
`;

const FeatureControlDemo = () => {
  const { 
    currentPlan, 
    hasFeature, 
    getFeatureValue, 
    canAccessRoute, 
    checkLimit,
    updateSubscription 
  } = useSubscription();
  
  const [customerCount, setCustomerCount] = useState(50);
  const [supplierCount, setSupplierCount] = useState(5);
  const [itemCount, setItemCount] = useState(25);

  // Feature status examples
  const features = [
    {
      name: 'Customer Management',
      path: 'customers',
      route: '/master/customers',
      description: 'Manage customer information and history'
    },
    {
      name: 'Supplier Management',
      path: 'suppliers',
      route: '/master/suppliers',
      description: 'Track supplier information and orders'
    },
    {
      name: 'POS System',
      path: 'pos',
      route: '/sale/pos',
      description: 'Point of sale system'
    },
    {
      name: 'Inventory Management',
      path: 'inventory',
      route: '/inventory/newitem',
      description: 'Manage inventory items'
    },
    {
      name: 'Reports',
      path: 'reports',
      route: '/reports/billhistory',
      description: 'Generate business reports'
    },
    {
      name: 'User Management',
      path: 'users',
      route: '/users/newuser',
      description: 'Manage system users'
    }
  ];

  const limits = [
    {
      name: 'Customers',
      path: 'customers',
      current: customerCount,
      description: 'Number of customers you can manage'
    },
    {
      name: 'Suppliers',
      path: 'suppliers',
      current: supplierCount,
      description: 'Number of suppliers you can manage'
    },
    {
      name: 'Items',
      path: 'inventory',
      current: itemCount,
      description: 'Number of items in inventory'
    }
  ];

  const planNames = {
    basic: 'Basic Plan',
    professional: 'Professional Plan',
    business: 'Business Plan',
    enterprise: 'Enterprise Plan'
  };

  return (
    <Layout>
      <style>{mobileStyles}</style>
      <div className="container-fluid px-1 px-sm-2 px-md-3 feature-demo-container">
        <div className="page-header mb-3 mb-md-4">
        <div className="row align-items-center">
          <div className="col-12 col-md-8">
            <h3 className="page-title mb-2 mb-md-0">Feature Control Demo</h3>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link to="/dashboard">Dashboard</Link>
                </li>
                <li className="breadcrumb-item active">Feature Control Demo</li>
              </ol>
            </nav>
          </div>
          <div className="col-12 col-md-4">
            <div className="text-start text-md-end mt-2 mt-md-0">
              <span className="badge bg-primary fs-6 px-3 py-2">
                Current Plan: {planNames[currentPlan]}
              </span>
            </div>
          </div>
        </div>
      </div>

        {/* Plan Switcher */}
        <div className="row mb-3 mb-md-4">
          <div className="col-12">
            <div className="card shadow-sm">
              <div className="card-header bg-primary text-white">
                <h5 className="mb-0">
                  <i className="fas fa-cog me-2"></i>
                  Switch Plans (Demo)
                </h5>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-12">
                    <div className="btn-group-vertical btn-group-lg d-block d-md-none" role="group">
                      {Object.keys(planNames).map(plan => (
                        <button
                          key={plan}
                          type="button"
                          className={`btn ${currentPlan === plan ? 'btn-primary' : 'btn-outline-primary'} mb-2`}
                          onClick={() => updateSubscription(plan)}
                        >
                          {planNames[plan]}
                        </button>
                      ))}
                    </div>
                    <div className="btn-group w-100 d-none d-md-flex" role="group">
                      {Object.keys(planNames).map(plan => (
                        <button
                          key={plan}
                          type="button"
                          className={`btn ${currentPlan === plan ? 'btn-primary' : 'btn-outline-primary'}`}
                          onClick={() => updateSubscription(plan)}
                        >
                          {planNames[plan]}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Access Status */}
        <div className="row mb-3 mb-md-4">
          <div className="col-12">
            <div className="card shadow-sm">
              <div className="card-header bg-success text-white">
                <h5 className="mb-0">
                  <i className="fas fa-shield-alt me-2"></i>
                  Feature Access Status
                </h5>
              </div>
              <div className="card-body">
                <div className="row g-2 g-md-3">
                  {features.map((feature, index) => (
                    <div key={index} className="col-12 col-sm-6 col-lg-4 col-xl-3">
                      <FeatureCard
                        feature={feature.path}
                        className="h-100 border-0 shadow-sm feature-card"
                        title={feature.name}
                        description={feature.description}
                        actions={
                          canAccessRoute(feature.route) ? (
                            <Link to={feature.route} className="btn btn-primary btn-sm w-100">
                              <i className="fas fa-arrow-right me-1"></i>
                              Access Feature
                            </Link>
                          ) : null
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Usage Limits */}
        <div className="row mb-3 mb-md-4">
          <div className="col-12">
            <div className="card shadow-sm">
              <div className="card-header bg-warning text-dark">
                <h5 className="mb-0">
                  <i className="fas fa-chart-bar me-2"></i>
                  Usage Limits
                </h5>
              </div>
              <div className="card-body">
                <div className="row g-2 g-md-3">
                  {limits.map((limit, index) => {
                    const limitValue = getFeatureValue(limit.path);
                    const limitCheck = checkLimit(limit.path, limit.current);
                    const isWithinLimit = limitCheck.withinLimit;
                    
                    return (
                      <div key={index} className="col-12 col-md-6 col-lg-4">
                        <div className="card border-0 shadow-sm h-100">
                          <div className="card-body">
                            <div className="d-flex justify-content-between align-items-start mb-3">
                              <h6 className="card-title mb-0 me-2">{limit.name}</h6>
                              <FeatureBadge
                                feature={limit.path}
                                className={`badge ${isWithinLimit ? 'bg-success' : 'bg-danger'} text-white flex-shrink-0 feature-badge`}
                              >
                                {limit.current} / {limitValue === 'unlimited' ? '∞' : limitValue}
                              </FeatureBadge>
                            </div>
                            <p className="text-muted small mb-3">{limit.description}</p>
                            <div className="progress" style={{ height: '10px' }}>
                              <div
                                className={`progress-bar ${isWithinLimit ? 'bg-success' : 'bg-danger'}`}
                                role="progressbar"
                                style={{
                                  width: limitValue === 'unlimited' ? '50%' : `${Math.min((limit.current / limitValue) * 100, 100)}%`
                                }}
                                aria-valuenow={limitValue === 'unlimited' ? 50 : Math.min((limit.current / limitValue) * 100, 100)}
                                aria-valuemin="0"
                                aria-valuemax="100"
                              ></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Buttons Demo */}
        <div className="row mb-3 mb-md-4">
          <div className="col-12">
            <div className="card shadow-sm">
              <div className="card-header bg-info text-white">
                <h5 className="mb-0">
                  <i className="fas fa-mouse-pointer me-2"></i>
                  Feature Buttons Demo
                </h5>
              </div>
              <div className="card-body">
                <div className="row g-2 g-md-3">
                  <div className="col-12 col-sm-6 col-lg-3">
                    <div className="text-center">
                      <h6 className="mb-3">Add New Customer</h6>
                      <FeatureButton
                        feature="customers"
                        onClick={() => alert('Navigate to add customer')}
                        className="btn btn-primary btn-lg w-100"
                      >
                        <i className="fas fa-user-plus me-2"></i>
                        <span className="d-none d-sm-inline">Add Customer</span>
                        <span className="d-inline d-sm-none">Customer</span>
                      </FeatureButton>
                    </div>
                  </div>
                  
                  <div className="col-12 col-sm-6 col-lg-3">
                    <div className="text-center">
                      <h6 className="mb-3">Add New Supplier</h6>
                      <FeatureButton
                        feature="suppliers"
                        onClick={() => alert('Navigate to add supplier')}
                        className="btn btn-success btn-lg w-100"
                      >
                        <i className="fas fa-truck me-2"></i>
                        <span className="d-none d-sm-inline">Add Supplier</span>
                        <span className="d-inline d-sm-none">Supplier</span>
                      </FeatureButton>
                    </div>
                  </div>
                  
                  <div className="col-12 col-sm-6 col-lg-3">
                    <div className="text-center">
                      <h6 className="mb-3">Access POS System</h6>
                      <FeatureButton
                        feature="pos"
                        onClick={() => alert('Navigate to POS system')}
                        className="btn btn-warning btn-lg w-100"
                      >
                        <i className="fas fa-cash-register me-2"></i>
                        <span className="d-none d-sm-inline">POS System</span>
                        <span className="d-inline d-sm-none">POS</span>
                      </FeatureButton>
                    </div>
                  </div>
                  
                  <div className="col-12 col-sm-6 col-lg-3">
                    <div className="text-center">
                      <h6 className="mb-3">Generate Reports</h6>
                      <FeatureButton
                        feature="reports"
                        onClick={() => alert('Navigate to reports')}
                        className="btn btn-info btn-lg w-100"
                      >
                        <i className="fas fa-chart-line me-2"></i>
                        <span className="d-none d-sm-inline">Reports</span>
                        <span className="d-inline d-sm-none">Reports</span>
                      </FeatureButton>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      {/* Feature Details */}
      <div className="row">
        <div className="col-12">
          <div className="card shadow-sm">
            <div className="card-header bg-secondary text-white">
              <h5 className="mb-0">
                <i className="fas fa-list-alt me-2"></i>
                Current Plan Features
              </h5>
            </div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-12 col-lg-6">
                  <div className="card border-0 shadow-sm h-100">
                    <div className="card-body">
                      <h6 className="card-title text-primary mb-3">
                        <i className="fas fa-database me-2"></i>
                        Master Data
                      </h6>
                      <div className="row g-2">
                        <div className="col-12">
                          <div className="d-flex align-items-center py-2">
                            <i className={`fas fa-${hasFeature('customers') ? 'check text-success' : 'times text-danger'} me-3`}></i>
                            <div className="flex-grow-1">
                              <strong>Customer Management:</strong>
                              <div className="text-muted small">{getFeatureValue('customers') || 'Not available'}</div>
                            </div>
                          </div>
                        </div>
                        <div className="col-12">
                          <div className="d-flex align-items-center py-2">
                            <i className={`fas fa-${hasFeature('suppliers') ? 'check text-success' : 'times text-danger'} me-3`}></i>
                            <div className="flex-grow-1">
                              <strong>Supplier Management:</strong>
                              <div className="text-muted small">{getFeatureValue('suppliers') || 'Not available'}</div>
                            </div>
                          </div>
                        </div>
                        <div className="col-12">
                          <div className="d-flex align-items-center py-2">
                            <i className={`fas fa-${hasFeature('pos') ? 'check text-success' : 'times text-danger'} me-3`}></i>
                            <div className="flex-grow-1">
                              <strong>Table Management:</strong>
                              <div className="text-muted small">{getFeatureValue('pos') || 'Not available'}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="col-12 col-lg-6">
                  <div className="card border-0 shadow-sm h-100">
                    <div className="card-body">
                      <h6 className="card-title text-success mb-3">
                        <i className="fas fa-shopping-cart me-2"></i>
                        Sales Features
                      </h6>
                      <div className="row g-2">
                        <div className="col-12">
                          <div className="d-flex align-items-center py-2">
                            <i className={`fas fa-${hasFeature('pos') ? 'check text-success' : 'times text-danger'} me-3`}></i>
                            <div className="flex-grow-1">
                              <strong>POS System:</strong>
                              <div className="text-muted small">{getFeatureValue('pos') || 'Not available'}</div>
                            </div>
                          </div>
                        </div>
                        <div className="col-12">
                          <div className="d-flex align-items-center py-2">
                            <i className={`fas fa-${hasFeature('pos') ? 'check text-success' : 'times text-danger'} me-3`}></i>
                            <div className="flex-grow-1">
                              <strong>Advance Orders:</strong>
                              <div className="text-muted small">{getFeatureValue('pos') || 'Not available'}</div>
                            </div>
                          </div>
                        </div>
                        <div className="col-12">
                          <div className="d-flex align-items-center py-2">
                            <i className={`fas fa-${hasFeature('pos') ? 'check text-success' : 'times text-danger'} me-3`}></i>
                            <div className="flex-grow-1">
                              <strong>Retail Sales:</strong>
                              <div className="text-muted small">{getFeatureValue('pos') || 'Not available'}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default FeatureControlDemo;
