import React from 'react';
import { Link } from 'react-router-dom';
import './PublicAccess.css';

const PublicAccess = () => {
    return (
        <div className="public-access-page">
            <div className="public-header">
                <h1 className="public-title">🎫 Public Services</h1>
                <p className="public-subtitle">Access public services without login</p>
            </div>

            <div className="services-grid">
                <Link to="/boarding-pass" className="service-card">
                    <div className="service-icon">🎫</div>
                    <h3 className="service-title">Boarding Pass Generator</h3>
                    <p className="service-description">
                        Generate and print boarding pass tickets for entry
                    </p>
                    <div className="service-features">
                        <span className="feature-tag">No Login Required</span>
                        <span className="feature-tag">Print Ready</span>
                        <span className="feature-tag">QR Code</span>
                    </div>
                </Link>

                <div className="service-card disabled">
                    <div className="service-icon">🏨</div>
                    <h3 className="service-title">Hotel Services</h3>
                    <p className="service-description">
                        Coming soon - Hotel booking and services
                    </p>
                    <div className="service-features">
                        <span className="feature-tag disabled">Coming Soon</span>
                    </div>
                </div>

                <Link to="/vending-machine" className="service-card">
                    <div className="service-icon">�</div>
                    <h3 className="service-title">Vending Machine</h3>
                    <p className="service-description">
                        Purchase items from vending machine with RS485 integration
                    </p>
                    <div className="service-features">
                        <span className="feature-tag">No Login Required</span>
                        <span className="feature-tag">RS485 Ready</span>
                        <span className="feature-tag">Real-time</span>
                    </div>
                </Link>
            </div>

            <div className="public-footer">
                <p>Need access to the admin system? <Link to="/" className="login-link">Login here</Link></p>
            </div>
        </div>
    );
};

export default PublicAccess;
