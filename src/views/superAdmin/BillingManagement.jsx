/**
 * BILLING MANAGEMENT
 * Manage subscription plans and billing for shops
 */

import React, { useState, useEffect } from 'react';
import { Card, Button, Modal, Form, Input, InputNumber, Select, Spin, message, Space, Table, Tag, Tabs, Alert } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, DollarOutlined } from '@ant-design/icons';
import axios from 'axios';
import { createShopAwareParams, getSelectedShopId, isShopSelected } from '../../utils/shopContext';
import { plansAPI, billingAPI, shopsAPI } from '../../api/superAdminAPI';
import './BillingManagement.css';

const CURRENCY_SYMBOL = '฿'; // Thai Baht

function BillingManagement() {
  const [plans, setPlans] = useState([]);
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [form] = Form.useForm();
  const [revenueData, setRevenueData] = useState(null);
  const [selectedShop, setSelectedShop] = useState(null);
  const [billingHistory, setBillingHistory] = useState(null);

  useEffect(() => {
    const shopId = getSelectedShopId();
    setSelectedShop(shopId);
    
    fetchPlans();
    fetchShops();
    fetchRevenueAnalytics();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const response = await plansAPI.getAll();
      if (response.data.success) {
        setPlans(response.data.data);
      }
    } catch (error) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        message.error('Session expired. Please login again.');
      } else {
        message.error(error.response?.data?.error || 'Failed to fetch plans');
      }
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

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

  const fetchRevenueAnalytics = async (period = 30) => {
    try {
      const shopId = getSelectedShopId();
      const params = createShopAwareParams({ period });
      
      const response = await axios.get('/super-admin/analytics/revenue', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token') || sessionStorage.getItem('token')}` },
        params
      });
      
      if (response.data.success) {
        setRevenueData(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch revenue analytics:', error);
    }
  };

  const handleAddPlan = () => {
    setEditingPlan(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEditPlan = (plan) => {
    setEditingPlan(plan);
    form.setFieldsValue({
      name: plan.name,
      description: plan.description,
      price_per_month: plan.price_per_month,
      max_terminals: plan.max_terminals,
      max_users: plan.max_users,
      storage_quota_gb: plan.storage_quota_gb,
    });
    setIsModalVisible(true);
  };

  const handleSubmit = async (values) => {
    try {
      if (editingPlan) {
        const response = await plansAPI.update(editingPlan.id, values);
        if (response.data.success) {
          message.success('Plan updated successfully');
        }
      } else {
        const response = await plansAPI.create(values);
        if (response.data.success) {
          message.success('Plan created successfully');
        }
      }

      setIsModalVisible(false);
      form.resetFields();
      fetchPlans();
    } catch (error) {
      message.error(error.response?.data?.error || 'Failed to save plan');
    }
  };

  const handleDeletePlan = (plan) => {
    Modal.confirm({
      title: 'Delete Plan',
      content: `Are you sure you want to delete "${plan.name}"?`,
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await plansAPI.delete(plan.id);
          message.success('Plan deleted');
          fetchPlans();
        } catch (error) {
          message.error('Failed to delete plan');
        }
      }
    });
  };

  const fetchShopBillingHistory = async (shopId) => {
    try {
      setLoading(true);
      const response = await billingAPI.getShopBilling(shopId);
      if (response.data.success) {
        setBillingHistory(response.data.data);
      }
    } catch (error) {
      message.error('Failed to fetch billing history');
    } finally {
      setLoading(false);
    }
  };

  const planColumns = [
    {
      title: 'Plan Name',
      dataIndex: 'name',
      key: 'name',
      render: (text) => <strong>{text}</strong>
    },
    {
      title: 'Price/Month',
      dataIndex: 'price_per_month',
      key: 'price_per_month',
      render: (price) => <span className="price">{CURRENCY_SYMBOL}{price}</span>
    },
    {
      title: 'Terminals',
      dataIndex: 'max_terminals',
      key: 'max_terminals'
    },
    {
      title: 'Users',
      dataIndex: 'max_users',
      key: 'max_users'
    },
    {
      title: 'Storage (GB)',
      dataIndex: 'storage_quota_gb',
      key: 'storage_quota_gb'
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="default"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEditPlan(record)}
          >
            Edit
          </Button>
          <Button
            danger
            size="small"
            icon={<DeleteOutlined />}
            onClick={() => handleDeletePlan(record)}
          >
            Delete
          </Button>
        </Space>
      )
    }
  ];

  const billingColumns = [
    {
      title: 'Billing Period',
      key: 'period',
      render: (_, record) => `${record.billing_period_start} to ${record.billing_period_end}`
    },
    {
      title: 'Amount Due',
      dataIndex: 'amount_due',
      render: (amount) => <span className="amount">{CURRENCY_SYMBOL}{amount}</span>
    },
    {
      title: 'Amount Paid',
      dataIndex: 'amount_paid',
      render: (amount) => <span className="amount-paid">{CURRENCY_SYMBOL}{amount}</span>
    },
    {
      title: 'Status',
      dataIndex: 'billing_status',
      render: (status) => {
        const statusColors = {
          paid: 'success',
          pending: 'warning',
          overdue: 'error',
          cancelled: 'default'
        };
        return <Tag color={statusColors[status]}>{status.toUpperCase()}</Tag>;
      }
    }
  ];

  return (
    <div className="billing-management">
      <div className="page-header">
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <DollarOutlined style={{ fontSize: '28px', color: '#2c3e50' }} />
            Billing Management
          </h1>
          <p>Manage subscription plans and track billing</p>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAddPlan} size="large">
          Create Plan
        </Button>
      </div>

      <Tabs defaultActiveKey="1" items={[
        {
          key: '1',
          label: 'Subscription Plans',
          children: (
            <Card style={{ marginTop: '20px' }}>
              <Spin spinning={loading}>
                <Table
                  columns={planColumns}
                  dataSource={plans.map(p => ({ ...p, key: p.id }))}
                  pagination={{ pageSize: 10 }}
                />
              </Spin>
            </Card>
          )
        },
        {
          key: '2',
          label: 'Revenue Analytics',
          children: (
            <Card style={{ marginTop: '20px' }}>
              <div className="revenue-section">
                <div className="revenue-stats">
                  <div className="stat-box">
                    <h4>Total Revenue</h4>
                    <p>{CURRENCY_SYMBOL}{revenueData?.reduce((sum, item) => sum + (item.daily_revenue || 0), 0).toLocaleString()}</p>
                  </div>
                  <div className="stat-box">
                    <h4>Active Shops</h4>
                    <p>{revenueData?.length || 0}</p>
                  </div>
                </div>
              </div>
            </Card>
          )
        },
        {
          key: '3',
          label: 'Shop Billing',
          children: (
            <Card style={{ marginTop: '20px' }}>
              <div className="shop-billing-section">
                <Select
                  placeholder="Select a shop to view billing history"
                  style={{ width: '100%', marginBottom: '20px' }}
                  options={shops.map(shop => ({
                    label: shop.name,
                    value: shop.id
                  }))}
                  onChange={(shopId) => {
                    setSelectedShop(shopId);
                    fetchShopBillingHistory(shopId);
                  }}
                />

                {selectedShop && billingHistory && (
                  <Spin spinning={loading}>
                    <Table
                      columns={billingColumns}
                      dataSource={billingHistory.map((b, i) => ({ ...b, key: i }))}
                      pagination={{ pageSize: 10 }}
                    />
                  </Spin>
                )}
              </div>
            </Card>
          )
        }
      ]} />

      {/* Add/Edit Plan Modal */}
      <Modal
        title={editingPlan ? 'Edit Subscription Plan' : 'Create New Plan'}
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="name"
            label="Plan Name"
            rules={[{ required: true }]}
          >
            <Input placeholder="e.g., Professional" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
          >
            <Input.TextArea placeholder="Plan description" rows={2} />
          </Form.Item>

          <Form.Item
            name="price_per_month"
            label={`Price per Month (${CURRENCY_SYMBOL})`}
            rules={[{ required: true }]}
          >
            <InputNumber min={0} step={100} precision={2} />
          </Form.Item>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item
              name="max_terminals"
              label="Max Terminals"
              rules={[{ required: true }]}
            >
              <InputNumber min={1} />
            </Form.Item>

            <Form.Item
              name="max_users"
              label="Max Users"
              rules={[{ required: true }]}
            >
              <InputNumber min={1} />
            </Form.Item>
          </div>

          <Form.Item
            name="storage_quota_gb"
            label="Storage Quota (GB)"
            rules={[{ required: true }]}
          >
            <InputNumber min={1} />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {editingPlan ? 'Update Plan' : 'Create Plan'}
              </Button>
              <Button onClick={() => setIsModalVisible(false)}>Cancel</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default BillingManagement;
