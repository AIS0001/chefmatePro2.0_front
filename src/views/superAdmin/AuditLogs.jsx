/**
 * AUDIT LOGS
 * View and track all platform activities and changes
 */

import React, { useState, useEffect } from 'react';
import { Table, Card, Input, Select, DatePicker, Button, Spin, message, Space, Tag, Tooltip, Empty, Alert } from 'antd';
import { DownloadOutlined, FilterOutlined, ReloadOutlined } from '@ant-design/icons';
import axios from 'axios';
import { getSelectedShopId, createShopAwareParams } from '../../utils/shopContext';
import { auditLogsAPI, shopsAPI } from '../../api/superAdminAPI';
import dayjs from 'dayjs';
import './AuditLogs.css';

const ACTION_TYPES = {
  CREATE_SHOP: 'success',
  UPDATE_SHOP: 'processing',
  UPDATE_SHOP_STATUS: 'warning',
  DELETE_SHOP: 'error',
  CREATE_PLAN: 'success',
  UPDATE_PLAN: 'processing',
  DELETE_PLAN: 'error',
  CREATE_USER: 'success',
  UPDATE_USER: 'processing',
  DELETE_USER: 'error',
};

function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [shops, setShops] = useState([]);
  const [selectedShop, setSelectedShop] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });
  const [filters, setFilters] = useState({
    shop_id: null,
    action: null,
    search: '',
    dateRange: null
  });

  useEffect(() => {
    const shopId = getSelectedShopId();
    setSelectedShop(shopId);
    
    // Pre-filter by selected shop if available
    if (shopId) {
      setFilters(prev => ({ ...prev, shop_id: shopId }));
    }
    
    fetchShops();
    fetchAuditLogs();
  }, []);

  const fetchShops = async () => {
    try {
      const response = await shopsAPI.getAll({ limit: 100 });
      if (response.data.success) {
        setShops(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch shops:', error);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const shopId = getSelectedShopId();
      const params = createShopAwareParams({
        page: pagination.page,
        limit: pagination.limit,
        ...filters
      });

      const response = await axios.get('/super-admin/audit-logs', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token') || sessionStorage.getItem('token')}` },
        params
      });
      
      if (response.data.success) {
        setLogs(response.data.data);
        setPagination(p => ({
          ...p,
          total: response.data.pagination?.total || 0
        }));
      }
    } catch (error) {
      message.error('Failed to fetch audit logs');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(f => ({
      ...f,
      [key]: value
    }));
    setPagination(p => ({ ...p, page: 1 }));
  };

  const handleApplyFilters = () => {
    fetchAuditLogs();
  };

  const handleResetFilters = () => {
    setFilters({
      shop_id: null,
      action: null,
      search: '',
      dateRange: null
    });
    setPagination({ page: 1, limit: 20, total: 0 });
  };

  const handleExportLogs = () => {
    try {
      const csvContent = generateCSV(logs);
      downloadCSV(csvContent, `audit-logs-${new Date().toISOString()}.csv`);
      message.success('Logs exported successfully');
    } catch (error) {
      message.error('Failed to export logs');
    }
  };

  const generateCSV = (data) => {
    const headers = ['Date', 'Shop ID', 'User ID', 'Action', 'Details'];
    const rows = data.map(log => [
      log.created_at,
      log.shop_id || 'N/A',
      log.user_id || 'N/A',
      log.action,
      log.details || ''
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    return csv;
  };

  const downloadCSV = (csv, filename) => {
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv));
    element.setAttribute('download', filename);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const columns = [
    {
      title: 'Timestamp',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => new Date(date).toLocaleString(),
      width: 150,
      sorter: (a, b) => new Date(a.created_at) - new Date(b.created_at)
    },
    {
      title: 'Shop',
      dataIndex: 'shop_id',
      key: 'shop_id',
      render: (shopId) => {
        const shop = shops.find(s => s.id === shopId);
        return shop ? shop.name : 'N/A';
      },
      width: 150
    },
    {
      title: 'User ID',
      dataIndex: 'user_id',
      key: 'user_id',
      width: 80
    },
    {
      title: 'Action',
      dataIndex: 'action',
      key: 'action',
      render: (action) => (
        <Tag color={ACTION_TYPES[action] || 'default'}>
          {action.replace(/_/g, ' ')}
        </Tag>
      ),
      width: 150
    },
    {
      title: 'Details',
      dataIndex: 'details',
      key: 'details',
      render: (details) => (
        <Tooltip title={details}>
          <span className="details-text">{details?.substring(0, 50)}...</span>
        </Tooltip>
      ),
      ellipsis: true,
      flex: 1
    }
  ];

  return (
    <div className="audit-logs">
      <div className="page-header-section">
        <div>
          <h1>Audit Logs</h1>
          <p>Track all platform activities and changes</p>
        </div>
        <Button
          type="primary"
          icon={<DownloadOutlined />}
          onClick={handleExportLogs}
          size="large"
        >
          Export Logs
        </Button>
      </div>

      {/* Filters */}
      <Card className="filters-card">
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <Space size="middle" wrap>
            <Input.Search
              placeholder="Search details..."
              style={{ width: 250 }}
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              allowClear
            />

            <Select
              placeholder="Filter by shop..."
              style={{ width: 200 }}
              allowClear
              value={filters.shop_id || undefined}
              onChange={(value) => handleFilterChange('shop_id', value)}
              options={[
                { label: 'All Shops', value: null },
                ...shops.map(shop => ({
                  label: shop.name,
                  value: shop.id
                }))
              ]}
            />

            <Select
              placeholder="Filter by action..."
              style={{ width: 200 }}
              allowClear
              value={filters.action || undefined}
              onChange={(value) => handleFilterChange('action', value)}
              options={[
                { label: 'All Actions', value: null },
                ...Object.keys(ACTION_TYPES).map(action => ({
                  label: action.replace(/_/g, ' '),
                  value: action
                }))
              ]}
            />
          </Space>

          <Space>
            <Button
              type="primary"
              icon={<FilterOutlined />}
              onClick={handleApplyFilters}
            >
              Apply Filters
            </Button>
            <Button
              icon={<ReloadOutlined />}
              onClick={handleResetFilters}
            >
              Reset
            </Button>
          </Space>
        </Space>
      </Card>

      {/* Logs Table */}
      <Card className="logs-table-card" style={{ marginTop: '20px' }}>
        <Spin spinning={loading}>
          {logs.length > 0 ? (
            <Table
              columns={columns}
              dataSource={logs.map((log, index) => ({ ...log, key: index }))}
              pagination={{
                current: pagination.page,
                pageSize: pagination.limit,
                total: pagination.total,
                onChange: (page) => setPagination(p => ({ ...p, page }))
              }}
              scroll={{ x: 1200 }}
              size="small"
            />
          ) : (
            <Empty description="No audit logs found" />
          )}
        </Spin>
      </Card>

      {/* Log Statistics */}
      <Card className="stats-card" style={{ marginTop: '20px' }}>
        <div className="stats-grid">
          <div className="stat-item">
            <h4>Total Logs</h4>
            <p className="stat-value">{pagination.total}</p>
          </div>
          <div className="stat-item">
            <h4>Actions Tracked</h4>
            <p className="stat-value">{Object.keys(ACTION_TYPES).length}</p>
          </div>
          <div className="stat-item">
            <h4>Date Range</h4>
            <p className="stat-value">Last 30 days</p>
          </div>
          <div className="stat-item">
            <h4>Logs per Page</h4>
            <p className="stat-value">{pagination.limit}</p>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default AuditLogs;
