/**
 * LOGIN TYPE SELECTOR
 * First page - users choose between regular login and super admin login
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from 'antd';
import {
  ShopOutlined,
  DashboardOutlined,
  PrinterOutlined,
  BarChartOutlined,
  TeamOutlined,
  SafetyCertificateOutlined,
  PhoneOutlined,
  MailOutlined,
  GlobalOutlined,
  CheckCircleFilled,
} from '@ant-design/icons';
import './LoginSelector.css';

function LoginSelector() {
  const navigate = useNavigate();
  return (
    <div className="login-selector">
      <div className="login-selector-pattern"></div>

      <div className="selector-container">

        {/* ── Top brand bar ── */}
        <div className="brand-topbar">
          <img src="/assets/img/logo/3840x2160logo.png" alt="CloudNet Softwares" className="brand-topbar-logo" />
        </div>

        {/* ── Main two-column body ── */}
        <div className="selector-body">

          {/* LEFT — product showcase */}
          <div className="showcase-panel">
            <div className="showcase-badge">🚀 SAAS Platform</div>
            <h1 className="showcase-title">ChefMate <span className="title-accent">Pro2</span></h1>
            <p className="showcase-desc">
              The all-in-one restaurant &amp; retail management platform — built for speed, built for scale.
            </p>

            <div className="showcase-features">
              <div className="sf-item">
                <DashboardOutlined className="sf-icon" />
                <div>
                  <strong>Smart POS</strong>
                  <p>Fast order entry, KOT printing &amp; table management</p>
                </div>
              </div>
              <div className="sf-item">
                <PrinterOutlined className="sf-icon" />
                <div>
                  <strong>ESC/POS &amp; Thermal Printing</strong>
                  <p>Auto-detect printers with fallback browser print</p>
                </div>
              </div>
              <div className="sf-item">
                <BarChartOutlined className="sf-icon" />
                <div>
                  <strong>Real-Time Reports</strong>
                  <p>Sales analytics, stock tracking &amp; audit logs</p>
                </div>
              </div>
              <div className="sf-item">
                <TeamOutlined className="sf-icon" />
                <div>
                  <strong>Multi-Staff Access</strong>
                  <p>Role-based logins for cashiers, managers &amp; admins</p>
                </div>
              </div>
              <div className="sf-item">
                <SafetyCertificateOutlined className="sf-icon" />
                <div>
                  <strong>Cloud Secured</strong>
                  <p>Encrypted data, auto backups &amp; 99.9% uptime SLA</p>
                </div>
              </div>
            </div>

            <div className="showcase-stats">
              <div className="stat-item"><span className="stat-num">500+</span><span className="stat-label">Shops</span></div>
              <div className="stat-divider"></div>
              <div className="stat-item"><span className="stat-num">99.9%</span><span className="stat-label">Uptime</span></div>
              <div className="stat-divider"></div>
              <div className="stat-item"><span className="stat-num">24/7</span><span className="stat-label">Support</span></div>
            </div>
          </div>

          {/* RIGHT — login card */}
          <div className="login-panel">
            <div className="login-card">
              <div className="login-card-header">
              
                <h2>Shop Admin Portal</h2>
                <p>Sign in to manage your restaurant or retail shop</p>
              </div>

              <div className="login-card-features">
                {[
                  'POS &amp; Order Management',
                  'Inventory &amp; Stock Control',
                  'KOT &amp; Receipt Printing',
                  'Staff &amp; Role Management',
                  'Sales Reports &amp; Analytics',
                  'Customer Display Support',
                ].map((f, i) => (
                  <div key={i} className="lcf-row">
                    <CheckCircleFilled className="lcf-check" />
                    <span dangerouslySetInnerHTML={{ __html: f }} />
                  </div>
                ))}
              </div>

              <Button
                type="primary"
                size="large"
                block
                className="login-card-btn"
                onClick={() => navigate('/login')}
              >
                Login as Shop Admin
              </Button>

              <p className="login-card-note">
                Need access? <a href="mailto:support@cloudnetsoftwares.com">Contact Support</a>
              </p>
            </div>
          </div>
        </div>

        {/* ── Contact footer ── */}
        <div className="contact-footer">
          <div className="cf-brand">
            <img src="/assets/img/logo/3840x2160logo.png" alt="CloudNet Softwares" className="cf-logo-img" />
            <div>
              <div className="cf-company">CloudNet Softwares</div>
              <div className="cf-tagline">Powering smart businesses worldwide</div>
            </div>
          </div>
          <div className="cf-contacts">
            <a href="tel:+66948712350" className="cf-link"><PhoneOutlined /> +66948712350 / +66952477020</a>
            <a href="mailto:support@cloudnetsoftwares.com" className="cf-link"><MailOutlined /> support@cloudnetsoftwares.com</a>
            <a href="https://www.cloudnetsoftwares.com" target="_blank" rel="noreferrer" className="cf-link"><GlobalOutlined /> www.cloudnetsoftwares.com</a>
          </div>
          <div className="cf-version">ChefMate Pro2 SAAS v1.0</div>
        </div>

      </div>
    </div>
  );
}

export default LoginSelector;
