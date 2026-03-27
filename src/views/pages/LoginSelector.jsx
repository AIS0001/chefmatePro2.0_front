/**
 * LOGIN TYPE SELECTOR
 * First page - users choose between regular login and super admin login
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Row, Col, Typography, Space, Divider } from 'antd';
import { UserOutlined, CrownOutlined, ShopOutlined } from '@ant-design/icons';
import './LoginSelector.css';

function LoginSelector() {
  const navigate = useNavigate();
  const { Title, Paragraph } = Typography;

  return (
    <div className="login-selector">
      <div className="selector-container">
        <div className="selector-header">
          <h1 className="selector-title">ChefMate Pro</h1>
          <p className="selector-subtitle">Choose Your Portal</p>
        </div>

        <Row gutter={[30, 30]} className="selector-cards">
          {/* Regular User Login */}
          <Col xs={24} sm={24} md={12} lg={10}>
            <Card 
              className="selector-card regular-card"
              hoverable
              onClick={() => navigate('/login')}
            >
              <div className="card-icon">
                <ShopOutlined style={{ fontSize: '48px' }} />
              </div>
              <h2>Shop Admin</h2>
              <p>Login to manage your restaurant or retail shop</p>
              <div className="card-features">
                <ul>
                  <li>POS Management</li>
                  <li>Inventory Tracking</li>
                  <li>Staff Management</li>
                  <li>Sales Reports</li>
                </ul>
              </div>
              <Button type="primary" size="large" block className="card-button">
                Login as Shop Admin
              </Button>
            </Card>
          </Col>

          <Col xs={24} sm={24} md={12} lg={10} style={{ marginLeft: 'auto' }}>
            {/* Super Admin Login */}
            <Card 
              className="selector-card admin-card"
              hoverable
              onClick={() => navigate('/superadmin-login')}
            >
              <div className="card-icon admin-icon">
                <CrownOutlined style={{ fontSize: '48px' }} />
              </div>
              <h2>Super Admin</h2>
              <p>Manage the entire SAAS platform and all shops</p>
              <div className="card-features">
                <ul>
                  <li>Platform Analytics</li>
                  <li>Shop Management</li>
                  <li>Billing Control</li>
                  <li>Audit Logs</li>
                </ul>
              </div>
              <Button type="primary" size="large" block danger className="card-button">
                Login as Super Admin
              </Button>
            </Card>
          </Col>
        </Row>

        <Divider />

        <div className="selector-footer">
          <p className="footer-text">
            Don't have an account? <a href="mailto:support@cloudnetsoftwares.com">Contact Support</a>
          </p>
          <p className="footer-version">ChefMate Pro SAAS v1.0</p>
        </div>
      </div>
    </div>
  );
}

export default LoginSelector;
