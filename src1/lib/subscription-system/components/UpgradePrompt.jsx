import React from 'react';
import { useSubscription } from '../hooks/useSubscription';
import { Link } from 'react-router-dom';

const UpgradePrompt = ({ 
  featureName, 
  className = '',
  showBackButton = true,
  customTitle = null,
  customDescription = null 
}) => {
  const { currentPlan, features } = useSubscription();
  
  const planNames = {
    basic: 'Basic Plan',
    professional: 'Professional Plan',
    business: 'Business Plan',
    enterprise: 'Enterprise Plan'
  };
  
  const getNextPlanWithFeature = (featureName) => {
    const plans = ['professional', 'business', 'enterprise'];
    
    for (const plan of plans) {
      if (features[plan]?.features[featureName]?.enabled) {
        return plan;
      }
    }
    return 'enterprise';
  };
  
  const nextPlan = getNextPlanWithFeature(featureName);
  
  return (
    <div className={`container-fluid ${className}`}>
      <div className="row justify-content-center">
        <div className="col-12 col-md-8 col-lg-6">
          <div className="card border-0 shadow-lg">
            <div className="card-body text-center p-4 p-md-5">
              <div className="mb-4">
                <i className="fas fa-lock fa-4x text-warning mb-3"></i>
                <h2 className="text-primary mb-3">
                  {customTitle || 'Feature Not Available'}
                </h2>
                <p className="text-muted lead">
                  {customDescription || 
                    `This feature is not available in your current ${planNames[currentPlan]}. 
                    Upgrade to ${planNames[nextPlan]} to unlock this feature.`
                  }
                </p>
              </div>
              
              <div className="row mb-4">
                <div className="col-12 col-md-6">
                  <div className="card bg-light border-0 h-100">
                    <div className="card-body">
                      <h6 className="text-muted">Current Plan</h6>
                      <h5 className="text-primary">{planNames[currentPlan]}</h5>
                      <p className="text-muted small mb-0">
                        <i className="fas fa-times text-danger me-1"></i>
                        Feature not included
                      </p>
                    </div>
                  </div>
                </div>
                <div className="col-12 col-md-6">
                  <div className="card bg-primary text-white border-0 h-100">
                    <div className="card-body">
                      <h6 className="text-light">Recommended Plan</h6>
                      <h5 className="text-white">{planNames[nextPlan]}</h5>
                      <p className="text-light small mb-0">
                        <i className="fas fa-check text-success me-1"></i>
                        Feature included
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="d-grid gap-2 d-md-flex justify-content-md-center">
                <Link 
                  to="/subscription" 
                  className="btn btn-primary btn-lg px-4"
                >
                  <i className="fas fa-arrow-up me-2"></i>
                  Upgrade Now
                </Link>
                {showBackButton && (
                  <button 
                    onClick={() => window.history.back()} 
                    className="btn btn-outline-secondary btn-lg px-4"
                  >
                    <i className="fas fa-arrow-left me-2"></i>
                    Go Back
                  </button>
                )}
              </div>
              
              <div className="mt-4 pt-3 border-top">
                <p className="text-muted small mb-0">
                  <i className="fas fa-info-circle me-1"></i>
                  Need help? <Link to="/support" className="text-primary">Contact Support</Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpgradePrompt;
