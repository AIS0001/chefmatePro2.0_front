import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Table, Spin, message, Alert, Button, Space, Empty } from 'antd';
import { ShoppingCartOutlined, TeamOutlined, BarChartOutlined, DollarOutlined, ArrowUpOutlined, CheckCircleOutlined, ReloadOutlined } from '@ant-design/icons';
import axios from 'axios';
import './SuperAdminDashboard.css';

const CURRENCY_SYMBOL = '฿'; // Thai Baht

function SuperAdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [systemHealth, setSystemHealth] = useState(null);
  const [selectedShop, setSelectedShop] = useState(null);

  useEffect(() => {
    // Get selected shop from sessionStorage
    const shopId = sessionStorage.getItem('selected_shop_id');
    setSelectedShop(shopId);
    
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const shopId = sessionStorage.getItem('selected_shop_id');

      if (!token) {
        setError('Authentication token not found. Please log in again.');
        setLoading(false);
        return;
      }

      // Check if shop is selected
      if (!shopId) {
        setError('Please select a shop from the top bar to view dashboard data');
        setLoading(false);
        return;
      }

      try {
        const statsRes = await axios.get('/super-admin/dashboard/stats', {
          headers: { Authorization: `Bearer ${token}` },
          params: { shop_id: shopId }  // Add shop_id parameter
        });
        if (statsRes.data.success) {
          setStats(statsRes.data.data);
        }
      } catch (err) {
        console.warn('Dashboard stats not available:', err.message);
        // Don't set error, just continue with mock data
        setStats(null);
      }

      try {
        const healthRes = await axios.get('/super-admin/analytics/system-health', {
          headers: { Authorization: `Bearer ${token}` },
          params: { shop_id: shopId }  // Add shop_id parameter
        });
        if (healthRes.data.success) {
          setSystemHealth(healthRes.data.data);
        }
      } catch (err) {
        console.warn('System health not available:', err.message);
        setSystemHealth(null);
      }

      setError(null);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      const errorMsg = err.response?.data?.error || err.message || 'Failed to load dashboard data';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const totalShops = stats?.totalShops?.[0]?.count || 0;
  const activeShops = stats?.activeShops?.[0]?.count || 0;
  const totalUsers = stats?.totalUsers?.[0]?.count || 0;
  const totalRevenue = stats?.totalRevenue?.[0]?.total || 0;
  const pendingBills = stats?.pendingBills?.[0]?.count || 0;
  const lastMonthRevenue = stats?.lastMonthRevenue?.[0]?.total || 0;

  return (
    <div style={{ width: '100%' }}>
      {/* Error Alert */}
      {error && (
        <Alert
          message="Dashboard Error"
          description={error}
          type="error"
          closable
          onClose={() => setError(null)}
          style={{ marginBottom: '20px' }}
          action={
            <Button size="small" onClick={fetchDashboardData} loading={loading}>
              Retry
            </Button>
          }
        />
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ margin: 0 }}>Dashboard {selectedShop && `📍 Shop ID: ${selectedShop}`}</h2>
          <p style={{ color: '#666', fontSize: '12px', margin: '4px 0 0 0' }}>
            Shop-specific overview and metrics {CURRENCY_SYMBOL}
          </p>
        </div>
        <Button icon={<ReloadOutlined />} onClick={fetchDashboardData} loading={loading}>
          Refresh
        </Button>
      </div>

      {!selectedShop && (
        <Alert
          message="No Shop Selected"
          description="Please select a shop from the dropdown menu at the top to view dashboard data"
          type="info"
          showIcon
          style={{ marginBottom: '20px' }}
        />
      )}

      <Spin spinning={loading && !stats}>
        {/* Key Metrics */}
        <Row gutter={[16, 16]} style={{ marginBottom: '20px' }}>
          <Col xs={24} sm={12} lg={6}>
            <Card hoverable>
              <Statistic
                title="Total Shops"
                value={totalShops}
                prefix={<ShoppingCartOutlined />}
                valueStyle={{ color: '#3498db' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card hoverable>
              <Statistic
                title="Active Shops"
                value={activeShops}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: '#27ae60' }}
                suffix={`/ ${totalShops}`}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card hoverable>
              <Statistic
                title="Total Users"
                value={totalUsers}
                prefix={<TeamOutlined />}
                valueStyle={{ color: '#9b59b6' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card hoverable>
              <Statistic
                title="Total Revenue"
                value={totalRevenue}
                prefix={`${CURRENCY_SYMBOL} `}
                valueStyle={{ color: '#f39c12' }}
                precision={0}
              />
            </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <MetricCard
            title="Total Revenue"
            value={`₹${(totalRevenue / 100000).toFixed(2)}L`}
            icon={DollarOutlined}
            color="#e74c3c"
            trend="+23%"
          />
        </Col>
      </Row>

      {/* Secondary Metrics */}
      <Row gutter={[20, 20]} className="metrics-row" style={{ marginTop: '20px' }}>
        <Col xs={24} sm={12} lg={8}>
          <Card className="metric-card">
            <div className="metric-content">
              <div className="metric-icon" style={{ background: '#f1c40f' }}>
                <ArrowUpOutlined style={{ fontSize: '24px', color: 'white' }} />
              </div>
              <div className="metric-info">
                <p className="metric-label">Last Month Revenue</p>
                <h3 className="metric-value">₹{(lastMonthRevenue / 100000).toFixed(2)}L</h3>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card className="metric-card">
            <div className="metric-content">
              <div className="metric-icon" style={{ background: '#e74c3c' }}>
                <ArrowUpOutlined style={{ fontSize: '24px', color: 'white' }} />
              </div>
              <div className="metric-info">
                <p className="metric-label">Pending Payments</p>
                <h3 className="metric-value">{pendingBills}</h3>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card className="metric-card">
            <div className="metric-content">
              <div className="metric-icon" style={{ background: '#3498db' }}>
                <BarChartOutlined style={{ fontSize: '24px', color: 'white' }} />
              </div>
              <div className="metric-info">
                <p className="metric-label">Database Size</p>
                <h3 className="metric-value">{systemHealth?.dbSize || '0'} MB</h3>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Subscription Distribution */}
      <Row gutter={[20, 20]} style={{ marginTop: '20px' }}>
        <Col xs={24} lg={12}>
          <Card title="Subscription Plan Distribution" setChildrenLayout="horizontal">
            <div className="distribution-chart">
              {stats?.subscriptionDistribution?.map((item, index) => (
                <div key={index} className="distribution-item">
                  <span className="plan-name">{item.name || 'Unknown'}</span>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${(item.count / totalShops) * 100}%`,
                        background: `hsl(${index * 120}, 70%, 50%)`
                      }}
                    />
                  </div>
                  <span className="count">{item.count} shops</span>
                </div>
              ))}
            </div>
          </Card>
        </Col>

        {/* Top Shops */}
        <Col xs={24} lg={12}>
          <Card title="Top Performing Shops">
            <div className="top-shops-list">
              {stats?.topShops?.slice(0, 5).map((shop, index) => (
                <div key={index} className="shop-item">
                  <div className="shop-rank">#{index + 1}</div>
                  <div className="shop-details">
                    <h4>{shop.name}</h4>
                    <p>{shop.total_bills} bills • ₹{(shop.total_sales || 0).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>

      {/* System Health */}
      {systemHealth && (
        <Card title="System Health" style={{ marginTop: '20px' }}>
          <Row gutter={[20, 20]}>
            <Col xs={24} sm={12} md={6}>
              <div className="health-item">
                <p>Total Shops</p>
                <h4>{systemHealth.totalShops}</h4>
              </div>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <div className="health-item">
                <p>Active Users</p>
                <h4>{systemHealth.activeUsers}</h4>
              </div>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <div className="health-item">
                <p>Today's Bills</p>
                <h4>{systemHealth.todayBills}</h4>
              </div>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <div className="health-item">
                <p>Today's Revenue</p>
                <h4>₹{(systemHealth.todayRevenue || 0).toLocaleString()}</h4>
              </div>
            </Col>
          </Row>
        </Card>
      )}
      </Spin>
    </div>
  );
}

/**
 * Metric Card Component
 */
function MetricCard({ title, value, icon: Icon, color, trend }) {
  return (
    <Card className="metric-card" hoverable>
      <div className="metric-content-main">
        <div className="metric-icon-main" style={{ background: color }}>
          <Icon style={{ fontSize: '28px', color: 'white' }} />
        </div>
        <div className="metric-text">
          <p className="metric-title">{title}</p>
          <h2 className="metric-number">{value}</h2>
          <p className="metric-trend" style={{ color: trend.startsWith('+') ? '#27ae60' : '#e74c3c' }}>
            {trend}
          </p>
        </div>
      </div>
    </Card>
  );
}

export default SuperAdminDashboard;
