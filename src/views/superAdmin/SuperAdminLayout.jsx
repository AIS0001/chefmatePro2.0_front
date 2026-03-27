/**
 * SUPER ADMIN LAYOUT - MINIMAL ANT DESIGN UI
 * Clean and simple navigation layout for super admin dashboard
 */

import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Layout, Menu, Button, Tooltip, Space, Alert, Select, Spin } from 'antd';
import { BarChartOutlined, ShopOutlined, TeamOutlined, FileTextOutlined, LogoutOutlined, MenuFoldOutlined, MenuUnfoldOutlined, AlertOutlined, CustomerServiceOutlined, CreditCardOutlined } from '@ant-design/icons';
import axios from 'axios';
import { getAuthToken, logout } from '../../utility/auth';
import './SuperAdminLayout.css';

const { Header, Sider, Content } = Layout;

function SuperAdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [error, setError] = useState(null);
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedShop, setSelectedShop] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  // Fetch shops on component mount and load stored shop_id
  useEffect(() => {
    fetchShops();
    const storedShopId = sessionStorage.getItem('selected_shop_id');
    if (storedShopId) {
      setSelectedShop(storedShopId);
    }
  }, []);

  const fetchShops = async () => {
    try {
      setLoading(true);
      const token = getAuthToken();

      if (!token) {
        setError('Authentication token not found. Please log in again.');
        return;
      }

      const response = await axios.get('/super-admin/shops', {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit: 100 } // Get first 100 shops
      });
      
      if (response.data && response.data.shops) {
        setShops(response.data.shops);
      }
    } catch (err) {
      console.error('Error fetching shops:', err);
      setError('Failed to load shops');
    } finally {
      setLoading(false);
    }
  };

  const handleShopChange = (shopId) => {
    setSelectedShop(shopId);
    sessionStorage.setItem('selected_shop_id', shopId);
    // Trigger a refresh of the dashboard by navigating
    window.location.pathname !== '/superadmin/dashboard' && navigate('/superadmin/dashboard');
    // Force refresh if already on dashboard
    if (window.location.pathname === '/superadmin/dashboard') {
      window.location.reload();
    }
  };

  const menuItems = [
    {
      key: '/superadmin',
      icon: <BarChartOutlined />,
      label: <Link to="/superadmin">Dashboard</Link>
    },
    {
      key: '/superadmin/shops',
      icon: <ShopOutlined />,
      label: <Link to="/superadmin/shops">Shops</Link>
    },
    {
      key: '/superadmin/billing',
      icon: <BarChartOutlined />,
      label: <Link to="/superadmin/billing">Billing</Link>
    },
    {
      key: '/superadmin/payment',
      icon: <CreditCardOutlined />,
      label: <Link to="/superadmin/payment">Payment</Link>
    },
    {
      key: '/superadmin/users',
      icon: <TeamOutlined />,
      label: <Link to="/superadmin/users">Users</Link>
    },
    {
      key: '/superadmin/audit-logs',
      icon: <FileTextOutlined />,
      label: <Link to="/superadmin/audit-logs">Audit Logs</Link>
    },
    {
      key: '/superadmin/monitoring',
      icon: <AlertOutlined />,
      label: <Link to="/superadmin/monitoring">Monitoring</Link>
    },
    {
      key: '/superadmin/support',
      icon: <CustomerServiceOutlined />,
      label: <Link to="/superadmin/support">Support</Link>
    }
  ];


  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  const selectedKey = menuItems.find(item => item.key === location.pathname)?.key || '/superadmin';

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* Sidebar */}
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        width={200}
        style={{ backgroundColor: '#fff', borderRight: '1px solid #f0f0f0' }}
      >
        <div style={{ padding: '20px', textAlign: 'center', borderBottom: '1px solid #f0f0f0' }}>
          <h3 style={{ margin: 0, fontSize: collapsed ? '12px' : '16px', fontWeight: 'bold' }}>
            {collapsed ? 'CM' : 'ChefMate Pro'}
          </h3>
        </div>

        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems}
          style={{ border: 'none' }}
        />

        <div style={{ padding: '16px', marginTop: 'auto', borderTop: '1px solid #f0f0f0' }}>
          <Button
            type="primary"
            danger
            block
            icon={<LogoutOutlined />}
            onClick={handleLogout}
          >
            {!collapsed && 'Logout'}
          </Button>
        </div>
      </Sider>

      {/* Main Layout */}
      <Layout>
        {/* Top Header */}
        <Header
          style={{
            backgroundColor: '#fff',
            borderBottom: '1px solid #f0f0f0',
            padding: '0 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ fontSize: '18px' }}
          />
          <h2 style={{ margin: 0, flex: 1, marginLeft: '20px' }}>Super Admin Dashboard</h2>
          
          {/* Shop Selector */}
          <div style={{ minWidth: '250px', marginRight: '20px' }}>
            <label style={{ fontSize: '12px', color: '#666', marginRight: '8px' }}>Select Shop:</label>
            <Spin spinning={loading} size="small">
              <Select
                placeholder="Choose a shop..."
                value={selectedShop}
                onChange={handleShopChange}
                style={{ width: '100%' }}
                options={shops.map(shop => ({
                  label: `${shop.name} (${shop.shop_code || 'N/A'})`,
                  value: shop.id
                }))}
              />
            </Spin>
          </div>

          <Space>
            <span style={{ fontSize: '12px', color: '#666' }}>{new Date().toLocaleDateString()}</span>
          </Space>
        </Header>

        {/* Content */}
        <Content style={{ padding: '20px', backgroundColor: '#fafafa' }}>
          {error && (
            <Alert
              message="Error"
              description={error}
              type="error"
              closable
              onClose={() => setError(null)}
              style={{ marginBottom: '20px' }}
            />
          )}
          <Outlet context={{ setError }} />
        </Content>
      </Layout>
    </Layout>
  );
}

export default SuperAdminLayout;
