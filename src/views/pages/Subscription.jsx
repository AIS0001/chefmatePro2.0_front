import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Subscription.css';

const Subscription = () => {
  const [selectedPlan, setSelectedPlan] = useState('professional');
  const [billingCycle, setBillingCycle] = useState('monthly');

  const subscriptionPlans = {
    basic: {
      name: 'Basic',
      price: { monthly: 999, yearly: 9999 },
      color: '#28a745',
      features: [
        'Single User Access',
        'Basic POS System',
        'Basic Inventory Management',
        'Simple Sales Reports',
        'Customer Management',
        'Basic Tax Calculation',
        'Email Support',
        'Single Location',
        'Up to 100 Items',
        'Basic Dashboard'
      ],
      limitations: [
        'No Advanced Reports',
        'No Multi-user Access',
        'No GST/VAT Reports',
        'No Expense Tracking',
        'No Supplier Management'
      ]
    },
    professional: {
      name: 'Professional',
      price: { monthly: 1999, yearly: 19999 },
      color: '#007bff',
      popular: true,
      features: [
        'Up to 3 Users',
        'Complete POS System',
        'Advanced Inventory Management',
        'Comprehensive Sales Reports',
        'Customer & Supplier Management',
        'GST/VAT Tax Support',
        'Advance Order System',
        'Expense Tracking',
        'Financial Reports',
        'Priority Email Support',
        'Single Location',
        'Up to 500 Items',
        'Advanced Dashboard',
        'Low Stock Alerts',
        'Voucher System'
      ],
      limitations: [
        'No Multi-location Support',
        'No Custom Integrations',
        'No Advanced Analytics'
      ]
    },
    business: {
      name: 'Business',
      price: { monthly: 3999, yearly: 39999 },
      color: '#fd7e14',
      features: [
        'Up to 10 Users',
        'Complete POS System',
        'Advanced Inventory Management',
        'All Reports & Analytics',
        'Customer & Supplier Management',
        'GST/VAT Tax Support',
        'Advance Order System',
        'Expense Tracking',
        'Financial Reports',
        'Phone & Email Support',
        'Up to 3 Locations',
        'Unlimited Items',
        'Advanced Dashboard',
        'Low Stock Alerts',
        'Voucher System',
        'Item-wise Reports',
        'Ledger Reports',
        'Data Export Features',
        'Custom Tax Rates'
      ],
      limitations: [
        'No Custom Integrations',
        'No White-label Solution'
      ]
    },
    enterprise: {
      name: 'Enterprise',
      price: { monthly: 7999, yearly: 79999 },
      color: '#6f42c1',
      features: [
        'Unlimited Users',
        'Complete POS System',
        'Advanced Inventory Management',
        'All Reports & Analytics',
        'Customer & Supplier Management',
        'GST/VAT Tax Support',
        'Advance Order System',
        'Expense Tracking',
        'Financial Reports',
        '24/7 Priority Support',
        'Unlimited Locations',
        'Unlimited Items',
        'Advanced Dashboard',
        'Low Stock Alerts',
        'Voucher System',
        'Item-wise Reports',
        'Ledger Reports',
        'Data Export Features',
        'Custom Tax Rates',
        'Custom Integrations',
        'API Access',
        'White-label Solution',
        'Training & Onboarding',
        'Custom Reports',
        'Advanced Analytics',
        'Multi-currency Support',
        'Backup & Recovery'
      ],
      limitations: []
    }
  };

  const handlePlanSelect = (planKey) => {
    setSelectedPlan(planKey);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(price);
  };

  const getDiscount = () => {
    return billingCycle === 'yearly' ? 17 : 0; // 17% discount for yearly
  };

  return (
    <div className="subscription-page">
      <div className="container-fluid">
        <div className="row">
          <div className="col-12">
            <div className="subscription-header text-center mb-5">
              <h1 className="display-4 mb-3">Choose Your ChefMate Plan</h1>
              <p className="lead text-muted">
                Select the perfect plan for your restaurant business needs
              </p>
              
              {/* Billing Toggle */}
              <div className="billing-toggle mt-4">
                <div className="btn-group" role="group">
                  <button
                    type="button"
                    className={`btn ${billingCycle === 'monthly' ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => setBillingCycle('monthly')}
                  >
                    Monthly
                  </button>
                  <button
                    type="button"
                    className={`btn ${billingCycle === 'yearly' ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => setBillingCycle('yearly')}
                  >
                    Yearly
                    <span className="badge badge-success ml-2">Save 17%</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="row justify-content-center">
          {Object.entries(subscriptionPlans).map(([key, plan]) => (
            <div key={key} className="col-lg-3 col-md-6 mb-4">
              <div className={`subscription-card ${selectedPlan === key ? 'selected' : ''} ${plan.popular ? 'popular' : ''}`}>
                {plan.popular && (
                  <div className="popular-badge">
                    <span>Most Popular</span>
                  </div>
                )}
                
                <div className="card-header" style={{ backgroundColor: plan.color }}>
                  <h3 className="plan-name">{plan.name}</h3>
                  <div className="price-section">
                    <span className="price">
                      {formatPrice(plan.price[billingCycle])}
                    </span>
                    <span className="billing-period">
                      /{billingCycle === 'monthly' ? 'month' : 'year'}
                    </span>
                    {billingCycle === 'yearly' && (
                      <div className="yearly-savings">
                        <small>Save {formatPrice(plan.price.monthly * 12 - plan.price.yearly)}</small>
                      </div>
                    )}
                  </div>
                </div>

                <div className="card-body">
                  <div className="features-section">
                    <h5 className="section-title">Features Included:</h5>
                    <ul className="features-list">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="feature-item">
                          <i className="zmdi zmdi-check text-success"></i>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {plan.limitations.length > 0 && (
                    <div className="limitations-section">
                      <h5 className="section-title">Limitations:</h5>
                      <ul className="limitations-list">
                        {plan.limitations.map((limitation, index) => (
                          <li key={index} className="limitation-item">
                            <i className="zmdi zmdi-close text-danger"></i>
                            {limitation}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="card-footer">
                  <button
                    className={`btn btn-block ${selectedPlan === key ? 'btn-success' : 'btn-outline-primary'}`}
                    onClick={() => handlePlanSelect(key)}
                  >
                    {selectedPlan === key ? 'Selected' : 'Select Plan'}
                  </button>
                  
                  {key === 'enterprise' && (
                    <div className="mt-2">
                      <Link to="/contact" className="btn btn-outline-secondary btn-block">
                        Contact Sales
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Features Comparison Table */}
        <div className="row mt-5">
          <div className="col-12">
            <div className="comparison-section">
              <h2 className="text-center mb-4">Feature Comparison</h2>
              <div className="table-responsive">
                <table className="table table-striped comparison-table">
                  <thead>
                    <tr>
                      <th>Feature</th>
                      <th>Basic</th>
                      <th>Professional</th>
                      <th>Business</th>
                      <th>Enterprise</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Number of Users</td>
                      <td>1</td>
                      <td>3</td>
                      <td>10</td>
                      <td>Unlimited</td>
                    </tr>
                    <tr>
                      <td>Number of Locations</td>
                      <td>1</td>
                      <td>1</td>
                      <td>3</td>
                      <td>Unlimited</td>
                    </tr>
                    <tr>
                      <td>Number of Items</td>
                      <td>100</td>
                      <td>500</td>
                      <td>Unlimited</td>
                      <td>Unlimited</td>
                    </tr>
                    <tr>
                      <td>POS System</td>
                      <td><i className="zmdi zmdi-check text-success"></i></td>
                      <td><i className="zmdi zmdi-check text-success"></i></td>
                      <td><i className="zmdi zmdi-check text-success"></i></td>
                      <td><i className="zmdi zmdi-check text-success"></i></td>
                    </tr>
                    <tr>
                      <td>Inventory Management</td>
                      <td>Basic</td>
                      <td>Advanced</td>
                      <td>Advanced</td>
                      <td>Advanced</td>
                    </tr>
                    <tr>
                      <td>GST/VAT Reports</td>
                      <td><i className="zmdi zmdi-close text-danger"></i></td>
                      <td><i className="zmdi zmdi-check text-success"></i></td>
                      <td><i className="zmdi zmdi-check text-success"></i></td>
                      <td><i className="zmdi zmdi-check text-success"></i></td>
                    </tr>
                    <tr>
                      <td>Expense Tracking</td>
                      <td><i className="zmdi zmdi-close text-danger"></i></td>
                      <td><i className="zmdi zmdi-check text-success"></i></td>
                      <td><i className="zmdi zmdi-check text-success"></i></td>
                      <td><i className="zmdi zmdi-check text-success"></i></td>
                    </tr>
                    <tr>
                      <td>Advanced Analytics</td>
                      <td><i className="zmdi zmdi-close text-danger"></i></td>
                      <td><i className="zmdi zmdi-close text-danger"></i></td>
                      <td><i className="zmdi zmdi-close text-danger"></i></td>
                      <td><i className="zmdi zmdi-check text-success"></i></td>
                    </tr>
                    <tr>
                      <td>API Access</td>
                      <td><i className="zmdi zmdi-close text-danger"></i></td>
                      <td><i className="zmdi zmdi-close text-danger"></i></td>
                      <td><i className="zmdi zmdi-close text-danger"></i></td>
                      <td><i className="zmdi zmdi-check text-success"></i></td>
                    </tr>
                    <tr>
                      <td>24/7 Support</td>
                      <td><i className="zmdi zmdi-close text-danger"></i></td>
                      <td><i className="zmdi zmdi-close text-danger"></i></td>
                      <td><i className="zmdi zmdi-close text-danger"></i></td>
                      <td><i className="zmdi zmdi-check text-success"></i></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="row mt-5">
          <div className="col-12">
            <div className="faq-section">
              <h2 className="text-center mb-4">Frequently Asked Questions</h2>
              <div className="row">
                <div className="col-md-6">
                  <div className="faq-item">
                    <h5>Can I upgrade or downgrade my plan?</h5>
                    <p>Yes, you can upgrade or downgrade your plan at any time. Changes will be reflected in your next billing cycle.</p>
                  </div>
                  <div className="faq-item">
                    <h5>Is there a free trial available?</h5>
                    <p>Yes, we offer a 14-day free trial for all plans. No credit card required.</p>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="faq-item">
                    <h5>What payment methods do you accept?</h5>
                    <p>We accept all major credit cards, debit cards, and UPI payments.</p>
                  </div>
                  <div className="faq-item">
                    <h5>Is my data secure?</h5>
                    <p>Yes, we use industry-standard encryption and security measures to protect your data.</p>
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

export default Subscription;
