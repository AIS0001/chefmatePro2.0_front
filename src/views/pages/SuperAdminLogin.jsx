/**
 * SUPER ADMIN LOGIN PAGE
 * Dedicated login interface for super admin users
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Card, Row, Col, Typography, Space, Divider, message, Checkbox } from 'antd';
import { LockOutlined, MailOutlined, EyeInvisibleOutlined, EyeTwoTone, SecurityScanOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import axios from 'axios';
import { logout } from '../../utility/auth';
import './SuperAdminLogin.css';

const { Title, Text, Paragraph } = Typography;

function SuperAdminLogin() {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Load saved credentials if they exist
    const savedEmail = localStorage.getItem('superadmin_email');
    const savedRemember = localStorage.getItem('superadmin_remember');
    if (savedEmail && savedRemember === 'true') {
      form.setFieldsValue({ email: savedEmail });
      setRememberMe(true);
    }
  }, [form]);

  const handleLogin = async (values) => {
    try {
      setLoading(true);
      setError(null);

      const loginData = {
        username: values.email,
        password: values.password,
        is_super_admin: true
      };

      const response = await axios.post('/super-admin/login', loginData);

      if (response.data.success) {
        const token = response.data.token;
        const user = response.data.user;

        // Calculate expiration time (24 hours from now for super admin)
        const expirationTime = Date.now() + (24 * 60 * 60 * 1000);

        // Clear any stale auth state so an expired token in the other storage
        // cannot override the newly created super admin session.
        logout();

        // Store token
        if (rememberMe) {
          localStorage.setItem('token', token);
          localStorage.setItem('expirationTime', expirationTime.toString());
          localStorage.setItem('superadmin_email', values.email);
          localStorage.setItem('superadmin_remember', 'true');
        } else {
          sessionStorage.setItem('token', token);
          sessionStorage.setItem('expirationTime', expirationTime.toString());
          localStorage.removeItem('superadmin_email');
          localStorage.removeItem('superadmin_remember');
        }

        // Store super admin info
        if (rememberMe) {
          localStorage.setItem('usertype', 'super_admin');
          localStorage.setItem('user_id', user.id);
          localStorage.setItem('username', user.username);
        } else {
          sessionStorage.setItem('usertype', 'super_admin');
          sessionStorage.setItem('user_id', user.id);
          sessionStorage.setItem('username', user.username);
        }

        message.success('Logged in successfully as Super Admin');

        // Redirect to super admin dashboard
        setTimeout(() => {
          navigate('/superadmin', { replace: true });
        }, 500);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Invalid credentials';
      setError(errorMessage);
      message.error(errorMessage);
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="superadmin-login-container">
      {/* Security Background Pattern */}
      <div className="security-pattern"></div>

      {/* Main Content */}
      <div className="login-wrapper">
        <Row gutter={[40, 40]} align="middle" justify="center" style={{ minHeight: '100vh' }}>
          {/* Left Side - Branding and Features */}
          <Col xs={0} lg={12} className="brand-section">
            <div className="brand-content">
              <div className="brand-icon">
                <SecurityScanOutlined />
              </div>
              <Title level={1} className="brand-title">
                ChefMate Pro
              </Title>
              <Paragraph className="brand-subtitle">
                Enterprise Platform Administration
              </Paragraph>

              <Divider style={{ borderColor: 'rgba(255, 255, 255, 0.2)' }} />

              <div className="features-list">
                <div className="feature-item">
                  <div className="feature-icon">📊</div>
                  <div className="feature-text">
                    <h4>Platform Management</h4>
                    <p>Manage all restaurants and retail shops</p>
                  </div>
                </div>

                <div className="feature-item">
                  <div className="feature-icon">💰</div>
                  <div className="feature-text">
                    <h4>Billing Control</h4>
                    <p>Manage subscriptions and payments</p>
                  </div>
                </div>

                <div className="feature-item">
                  <div className="feature-icon">👥</div>
                  <div className="feature-text">
                    <h4>Admin Management</h4>
                    <p>Control admin users and permissions</p>
                  </div>
                </div>

                <div className="feature-item">
                  <div className="feature-icon">📈</div>
                  <div className="feature-text">
                    <h4>Analytics</h4>
                    <p>Real-time platform analytics</p>
                  </div>
                </div>
              </div>

              <div className="brand-footer">
                <p>Secure Platform Administration Dashboard</p>
              </div>
            </div>
          </Col>

          {/* Right Side - Login Form */}
          <Col xs={24} sm={24} md={20} lg={10}>
            <div className="form-container">
              <Card 
                className="login-card"
                bodyStyle={{ padding: '48px 40px' }}
                bordered={false}
              >
                {/* Header */}
                <div className="form-header">
                  <div className="form-title-icon">
                    <SecurityScanOutlined />
                  </div>
                  <Title level={2} className="form-title">
                    Super Admin Login
                  </Title>
                  <Text className="form-subtitle">
                    Administrative access required
                  </Text>
                </div>

                {/* Error Alert */}
                {error && (
                  <div className="error-alert">
                    <ExclamationCircleOutlined style={{ fontSize: '18px' }} />
                    <span>{error}</span>
                  </div>
                )}

                {/* Login Form */}
                <Form
                  form={form}
                  layout="vertical"
                  onFinish={handleLogin}
                  autoComplete="off"
                  className="login-form"
                >
                  {/* Email/Username Field */}
                  <Form.Item
                    name="email"
                    rules={[
                      { required: true, message: 'Please enter email or username' },
                      {
                        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$|^[a-zA-Z0-9_]{3,}$/,
                        message: 'Please enter a valid email or username'
                      }
                    ]}
                  >
                    <Input
                      prefix={<MailOutlined className="input-icon" />}
                      placeholder="Email or Username"
                      size="large"
                      disabled={loading}
                      className="login-input"
                    />
                  </Form.Item>

                  {/* Password Field */}
                  <Form.Item
                    name="password"
                    rules={[
                      { required: true, message: 'Please enter your password' },
                      { min: 6, message: 'Password must be at least 6 characters' }
                    ]}
                  >
                    <Input.Password
                      prefix={<LockOutlined className="input-icon" />}
                      placeholder="Password"
                      size="large"
                      iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                      disabled={loading}
                      className="login-input"
                    />
                  </Form.Item>

                  {/* Remember Me & Forgot Password */}
                  <div className="form-extras">
                    <Checkbox 
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="remember-checkbox"
                    >
                      Remember me
                    </Checkbox>
                    <button type="button" className="forgot-link">
                      Forgot password?
                    </button>
                  </div>

                  {/* Submit Button */}
                  <Form.Item>
                    <Button
                      type="primary"
                      size="large"
                      htmlType="submit"
                      loading={loading}
                      block
                      className="login-button"
                    >
                      {loading ? 'Logging in...' : 'Login'}
                    </Button>
                  </Form.Item>
                </Form>

                {/* Security Info */}
                <div className="security-info">
                  <SecurityScanOutlined className="security-icon" />
                  <Text className="security-text">
                    This is a secure admin portal. All access is logged.
                  </Text>
                </div>

                {/* Divider */}
                <Divider style={{ margin: '20px 0' }} />

                {/* Back Button */}
                <Button
                  type="text"
                  block
                  onClick={() => navigate('/')}
                  className="back-button"
                >
                  ← Back to Portal Selection
                </Button>
              </Card>

              {/* Footer Info */}
              <div className="form-footer">
                <Space direction="vertical" align="center" style={{ width: '100%' }}>
                  <Text className="footer-text">
                    ChefMate Pro Platform v2.0
                  </Text>
                  <Text className="footer-version">
                    © 2026 Cloudnet Softwares Co. Ltd.. All rights reserved.
                  </Text>
                </Space>
              </div>
            </div>
          </Col>
        </Row>
      </div>
    </div>
  );
}

export default SuperAdminLogin;
