/**
 * PAYMENT & SUBSCRIPTION MANAGEMENT PAGE
 * Manage subscriptions, plans, and payment records for all shops
 */

import React, { useState, useEffect } from 'react';
import {
  Tabs,
  Card,
  Table,
  Button,
  Modal,
  Form,
  Select,
  Input,
  InputNumber,
  DatePicker,
  Space,
  Tag,
  Statistic,
  Row,
  Col,
  Checkbox,
  message,
  Drawer,
  Spin,
  Alert
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import axios from 'axios';
import { getAuthToken } from '../../utility/auth';
import dayjs from 'dayjs';
import './Payment.css';

const Payment = () => {
  const [activeTab, setActiveTab] = useState('1');
  const [plans, setPlans] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [planModalVisible, setPlannedModalVisible] = useState(false);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [detailDrawer, setDetailDrawer] = useState(false);
  const [stats, setStats] = useState({});
  const [shopsLoading, setShopsLoading] = useState(false);
  const [subscriptionsLoading, setSubscriptionsLoading] = useState(false);
  const [subscriptions, setSubscriptions] = useState([]);
  const [subscriptionModalVisible, setSubscriptionModalVisible] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState(null);
  const [subscriptionForm] = Form.useForm();
  const [planForm] = Form.useForm();
  const [paymentForm] = Form.useForm();
  const [shops, setShops] = useState([]);

  useEffect(() => {
    fetchSubscriptionPlans();
    fetchSubscriptions();
    fetchPaymentRecords();
    fetchStats();
    fetchShops();
  }, []);

  const fetchSubscriptionPlans = async () => {
    try {
      const token = getAuthToken();
      const response = await axios.get('/super-admin/subscription-plans', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setPlans(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
      message.error('Failed to load subscription plans');
    }
  };

  const fetchSubscriptions = async () => {
    try {
      setSubscriptionsLoading(true);
      const token = getAuthToken();
      const response = await axios.get('/super-admin/subscriptions', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setSubscriptions(Array.isArray(response.data.data) ? response.data.data : []);
      }
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      message.error('Failed to load subscriptions');
    } finally {
      setSubscriptionsLoading(false);
    }
  };

  const fetchPaymentRecords = async () => {
    try {
      setLoading(true);
      const token = getAuthToken();
      const response = await axios.get('/super-admin/payment-records', {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit: 100 }
      });

      if (response.data.success) {
        setPayments(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
      message.error('Failed to load payment records');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = getAuthToken();
      const response = await axios.get('/super-admin/payment-stats', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchShops = async () => {
    try {
      setShopsLoading(true);
      const token = getAuthToken();
      const response = await axios.get('/super-admin/shops', {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit: 1000 }
      });

      if (response.data?.success) {
        setShops(Array.isArray(response.data.data) ? response.data.data : []);
      }
    } catch (error) {
      console.error('Error fetching shops:', error);
      message.error('Failed to load shops');
    } finally {
      setShopsLoading(false);
    }
  };

  const handleCreatePlan = async (values) => {
    try {
      const token = getAuthToken();
      const url = selectedPlan ? `/super-admin/subscription-plans/${selectedPlan.id}` : '/super-admin/subscription-plans';
      const method = selectedPlan ? 'put' : 'post';

      await axios[method](url, values, {
        headers: { Authorization: `Bearer ${token}` }
      });

      message.success(selectedPlan ? 'Plan updated successfully' : 'Plan created successfully');
      setPlannedModalVisible(false);
      planForm.resetFields();
      setSelectedPlan(null);
      fetchSubscriptionPlans();
    } catch (error) {
      console.error('Error saving plan:', error);
      message.error('Failed to save plan');
    }
  };

  const handleCreatePayment = async (values) => {
    try {
      const token = getAuthToken();
      
      const payload = {
        ...values,
        due_date: values.due_date.format('YYYY-MM-DD')
      };

      const url = selectedPayment ? `/super-admin/payment-records/${selectedPayment.id}` : '/super-admin/payment-records';
      const method = selectedPayment ? 'put' : 'post';

      await axios[method](url, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      message.success(selectedPayment ? 'Payment updated successfully' : 'Payment created successfully');
      setPaymentModalVisible(false);
      paymentForm.resetFields();
      setSelectedPayment(null);
      fetchPaymentRecords();
      fetchSubscriptions();
      fetchStats();
    } catch (error) {
      console.error('Error saving payment:', error);
      message.error('Failed to save payment');
    }
  };

  const handleSaveSubscription = async (values) => {
    try {
      const token = getAuthToken();
      const payload = {
        ...values,
        start_date: values.start_date ? values.start_date.format('YYYY-MM-DD') : undefined,
        end_date: values.end_date ? values.end_date.format('YYYY-MM-DD') : undefined,
        renewal_date: values.renewal_date ? values.renewal_date.format('YYYY-MM-DD') : undefined,
        auto_create_payment: !!values.auto_create_payment
      };

      const method = selectedSubscription ? 'put' : 'post';
      const url = selectedSubscription
        ? `/super-admin/subscriptions/${selectedSubscription.shop_id}`
        : '/super-admin/subscriptions';

      await axios[method](url, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      message.success(selectedSubscription ? 'Subscription updated successfully' : 'Subscription assigned successfully');
      setSubscriptionModalVisible(false);
      subscriptionForm.resetFields();
      setSelectedSubscription(null);
      fetchSubscriptions();
      fetchPaymentRecords();
      fetchStats();
    } catch (error) {
      console.error('Error saving subscription:', error);
      message.error(error.response?.data?.error || 'Failed to save subscription');
    }
  };

  const openAssignSubscriptionModal = (record = null) => {
    setSelectedSubscription(record);

    if (record) {
      subscriptionForm.setFieldsValue({
        shop_id: Number(record.shop_id),
        plan_id: Number(record.plan_id),
        subscription_type: record.subscription_type || 'MONTHLY',
        start_date: record.start_date ? dayjs(record.start_date) : null,
        end_date: record.end_date ? dayjs(record.end_date) : null,
        renewal_date: record.renewal_date ? dayjs(record.renewal_date) : null,
        auto_create_payment: true
      });
    } else {
      subscriptionForm.resetFields();
      subscriptionForm.setFieldsValue({
        subscription_type: 'MONTHLY',
        auto_create_payment: true,
        start_date: dayjs()
      });
    }

    setSubscriptionModalVisible(true);
  };

  const handleMarkAsPaid = async (paymentId) => {
    try {
      const token = getAuthToken();
      await axios.put(`/super-admin/payment-records/${paymentId}`, {
        payment_status: 'COMPLETED',
        paid_date: new Date().toISOString().split('T')[0]
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      message.success('Payment marked as completed');
      fetchPaymentRecords();
      fetchStats();
    } catch (error) {
      console.error('Error updating payment:', error);
      message.error('Failed to update payment');
    }
  };

  const getPaymentStatusColor = (status) => {
    const colors = {
      COMPLETED: 'success',
      PENDING: 'processing',
      FAILED: 'error',
      OVERDUE: 'volcano'
    };
    return colors[status] || 'default';
  };

  const getSubscriptionStatusColor = (status) => {
    const colors = {
      ACTIVE: 'success',
      SUSPENDED: 'warning',
      EXPIRED: 'error',
      CANCELLED: 'default'
    };
    return colors[String(status || '').toUpperCase()] || 'default';
  };

  // Plans Table Columns
  const plansColumns = [
    {
      title: 'Plan Name',
      dataIndex: 'name',
      key: 'name',
      render: name => <strong>{name}</strong>
    },
    {
      title: 'Monthly Price',
      dataIndex: 'monthly_price',
      key: 'monthly_price',
      render: price => price ? `$${parseFloat(price).toFixed(2)}` : '-'
    },
    {
      title: 'Quarterly Price',
      dataIndex: 'quarterly_price',
      key: 'quarterly_price',
      render: price => price ? `$${parseFloat(price).toFixed(2)}` : '-'
    },
    {
      title: 'Yearly Price',
      dataIndex: 'yearly_price',
      key: 'yearly_price',
      render: price => price ? `$${parseFloat(price).toFixed(2)}` : '-'
    },
    {
      title: 'Max Users',
      dataIndex: 'max_users',
      key: 'max_users'
    },
    {
      title: 'Max Tables',
      dataIndex: 'max_tables',
      key: 'max_tables'
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            size="small"
            icon={<EditOutlined />}
            onClick={() => {
              setSelectedPlan(record);
              planForm.setFieldsValue(record);
              setPlannedModalVisible(true);
            }}
          />
        </Space>
      )
    }
  ];

  // Payments Table Columns
  const subscriptionsColumns = [
    {
      title: 'Shop',
      dataIndex: 'shop_name',
      key: 'shop_name',
      render: (_, record) => `${record.shop_id} - ${record.shop_name || 'Unnamed Shop'}`
    },
    {
      title: 'Plan',
      dataIndex: 'plan_name',
      key: 'plan_name',
      render: (value) => value || '-'
    },
    {
      title: 'Type',
      dataIndex: 'subscription_type',
      key: 'subscription_type',
      render: (value) => <Tag>{value || '-'}</Tag>
    },
    {
      title: 'Period',
      key: 'period',
      render: (_, record) => `${record.start_date || '-'} to ${record.end_date || '-'}`
    },
    {
      title: 'Renewal Date',
      dataIndex: 'renewal_date',
      key: 'renewal_date',
      render: (value) => value ? new Date(value).toLocaleDateString() : '-'
    },
    {
      title: 'Subscription',
      dataIndex: 'status',
      key: 'status',
      render: (value) => <Tag color={getSubscriptionStatusColor(value)}>{String(value || '-').toUpperCase()}</Tag>
    },
    {
      title: 'Latest Payment',
      dataIndex: 'latest_payment_status',
      key: 'latest_payment_status',
      render: (value) => value ? <Tag color={getPaymentStatusColor(value)}>{value}</Tag> : <Tag>No Invoice</Tag>
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 180,
      render: (_, record) => (
        <Space>
          <Button
            size="small"
            type="primary"
            icon={<EditOutlined />}
            onClick={() => openAssignSubscriptionModal(record)}
          >
            Edit
          </Button>
          <Button
            size="small"
            icon={<PlusOutlined />}
            onClick={() => {
              setSelectedPayment(null);
              paymentForm.resetFields();
              paymentForm.setFieldsValue({
                shop_id: Number(record.shop_id),
                subscription_id: record.id,
                payment_type: record.subscription_type || 'MONTHLY',
                due_date: record.renewal_date ? dayjs(record.renewal_date) : dayjs()
              });
              setPaymentModalVisible(true);
            }}
          >
            Invoice
          </Button>
        </Space>
      )
    }
  ];

  const paymentsColumns = [
    {
      title: 'Shop',
      dataIndex: 'shop_id',
      key: 'shop_id',
      render: shop_id => {
        const normalizedShopId = Number(shop_id);
        const shop = shops.find(s => Number(s.id) === normalizedShopId);
        return shop ? `${shop.id} - ${shop.name}` : `Shop #${shop_id}`;
      }
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: amount => <strong>${parseFloat(amount).toFixed(2)}</strong>
    },
    {
      title: 'Type',
      dataIndex: 'payment_type',
      key: 'payment_type',
      render: type => <Tag>{type}</Tag>
    },
    {
      title: 'Method',
      dataIndex: 'payment_method',
      key: 'payment_method'
    },
    {
      title: 'Due Date',
      dataIndex: 'due_date',
      key: 'due_date',
      render: date => new Date(date).toLocaleDateString()
    },
    {
      title: 'Status',
      dataIndex: 'payment_status',
      key: 'payment_status',
      render: status => <Tag color={getPaymentStatusColor(status)}>{status}</Tag>
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      render: (_, record) => (
        <Space>
          {record.payment_status !== 'COMPLETED' && (
            <Button
              type="primary"
              size="small"
              icon={<CheckCircleOutlined />}
              onClick={() => handleMarkAsPaid(record.id)}
            />
          )}
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => {
              setSelectedPayment(record);
              setDetailDrawer(true);
            }}
          />
        </Space>
      )
    }
  ];

  return (
    <div className="payment-container">
      {/* Stats Row */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Payments"
              value={stats.total_payments || 0}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card style={{ background: '#f6ffed' }}>
            <Statistic
              title="Completed"
              value={stats.completed_payments || 0}
              valueStyle={{ color: '#52c41a' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card style={{ background: '#e6f7ff' }}>
            <Statistic
              title="Pending"
              value={stats.pending_payments || 0}
              valueStyle={{ color: '#1890ff' }}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card style={{ background: '#fff1f0' }}>
            <Statistic
              title="Amount Collected"
              value={`$${parseFloat(stats.total_collected || 0).toFixed(2)}`}
              valueStyle={{ color: '#52c41a' }}
              prefix={<DollarOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Tabs */}
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: '1',
            label: 'Subscription Plans',
            children: (
              <Card
                title="Subscription Plans"
                extra={
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => {
                      setSelectedPlan(null);
                      planForm.resetFields();
                      setPlannedModalVisible(true);
                    }}
                  >
                    New Plan
                  </Button>
                }
              >
                <Table
                  columns={plansColumns}
                  dataSource={plans}
                  rowKey="id"
                  pagination={{ pageSize: 10 }}
                  scroll={{ x: 1000 }}
                />
              </Card>
            )
          },
          {
            key: '2',
            label: 'Shop Subscriptions',
            children: (
              <Card
                title="Shop Subscriptions"
                extra={
                  <Space>
                    <Alert
                      type="info"
                      showIcon
                      message="Assign plan and enable auto invoice so shops never hit 'No subscription found' on login."
                    />
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={() => openAssignSubscriptionModal(null)}
                    >
                      Assign Subscription
                    </Button>
                  </Space>
                }
              >
                <Spin spinning={subscriptionsLoading}>
                  <Table
                    columns={subscriptionsColumns}
                    dataSource={subscriptions}
                    rowKey="id"
                    pagination={{ pageSize: 20 }}
                    scroll={{ x: 1400 }}
                  />
                </Spin>
              </Card>
            )
          },
          {
            key: '3',
            label: 'Payment Records',
            children: (
              <Card
                title="Payment Records"
                extra={
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => {
                      setSelectedPayment(null);
                      paymentForm.resetFields();
                      fetchShops();
                      setPaymentModalVisible(true);
                    }}
                  >
                    New Payment Record
                  </Button>
                }
              >
                <Spin spinning={loading}>
                  <Table
                    columns={paymentsColumns}
                    dataSource={payments}
                    rowKey="id"
                    pagination={{ pageSize: 20 }}
                    scroll={{ x: 1200 }}
                  />
                </Spin>
              </Card>
            )
          }
        ]}
      />

      {/* Create/Edit Plan Modal */}
      <Modal
        title={selectedPlan ? 'Edit Subscription Plan' : 'Create Subscription Plan'}
        open={planModalVisible}
        onCancel={() => setPlannedModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={planForm}
          layout="vertical"
          onFinish={handleCreatePlan}
        >
          <Form.Item
            name="name"
            label="Plan Name"
            rules={[{ required: true, message: 'Please enter plan name' }]}
          >
            <Input placeholder="e.g., Starter, Professional, Enterprise" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
          >
            <Input.TextArea placeholder="Plan description" rows={3} />
          </Form.Item>

          <Row gutter={16}>
            <Col xs={24} sm={8}>
              <Form.Item
                name="monthly_price"
                label="Monthly Price"
              >
                <InputNumber min={0} step={0.01} prefix="$" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item
                name="quarterly_price"
                label="Quarterly Price"
              >
                <InputNumber min={0} step={0.01} prefix="$" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item
                name="yearly_price"
                label="Yearly Price"
              >
                <InputNumber min={0} step={0.01} prefix="$" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="max_users"
                label="Max Users"
              >
                <InputNumber min={1} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="max_tables"
                label="Max Tables"
              >
                <InputNumber min={1} />
              </Form.Item>
            </Col>
          </Row>

          <Space>
            <Button type="primary" htmlType="submit">
              {selectedPlan ? 'Update' : 'Create'} Plan
            </Button>
            <Button onClick={() => setPlannedModalVisible(false)}>
              Cancel
            </Button>
          </Space>
        </Form>
      </Modal>

      {/* Create/Edit Subscription Modal */}
      <Modal
        title={selectedSubscription ? 'Edit Shop Subscription' : 'Assign Shop Subscription'}
        open={subscriptionModalVisible}
        onCancel={() => setSubscriptionModalVisible(false)}
        footer={null}
        width={680}
      >
        <Form
          form={subscriptionForm}
          layout="vertical"
          onFinish={handleSaveSubscription}
        >
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="shop_id"
                label="Shop"
                rules={[{ required: true, message: 'Please select a shop' }]}
              >
                <Select
                  placeholder="Select shop"
                  disabled={!!selectedSubscription}
                  showSearch
                  optionFilterProp="label"
                  options={shops.map(shop => ({
                    label: `${shop.id} - ${shop.name || 'Unnamed Shop'}`,
                    value: Number(shop.id)
                  }))}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="plan_id"
                label="Subscription Plan"
                rules={[{ required: true, message: 'Please select plan' }]}
              >
                <Select
                  placeholder="Select plan"
                  options={plans.map(plan => ({
                    label: `${plan.name} (${plan.monthly_price != null ? `$${plan.monthly_price}/mo` : '-'})`,
                    value: Number(plan.id)
                  }))}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="subscription_type"
                label="Billing Cycle"
                rules={[{ required: true }]}
              >
                <Select
                  options={[
                    { label: 'Monthly', value: 'MONTHLY' },
                    { label: 'Quarterly', value: 'QUARTERLY' },
                    { label: 'Yearly', value: 'YEARLY' }
                  ]}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="renewal_date"
                label="Renewal / Next Due Date"
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="start_date"
                label="Start Date"
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="end_date"
                label="End Date (Optional)"
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="auto_create_payment"
            valuePropName="checked"
          >
            <Checkbox>Create/ensure first pending invoice automatically</Checkbox>
          </Form.Item>

          <Space>
            <Button type="primary" htmlType="submit">
              {selectedSubscription ? 'Update Subscription' : 'Assign Subscription'}
            </Button>
            <Button onClick={() => setSubscriptionModalVisible(false)}>
              Cancel
            </Button>
          </Space>
        </Form>
      </Modal>

      {/* Create/Edit Payment Modal */}
      <Modal
        title={selectedPayment ? 'Edit Payment Record' : 'Create Payment Record'}
        open={paymentModalVisible}
        onCancel={() => setPaymentModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={paymentForm}
          layout="vertical"
          onFinish={handleCreatePayment}
        >
          <Form.Item name="subscription_id" hidden>
            <Input />
          </Form.Item>

          <Form.Item
            name="shop_id"
            label="Shop"
            rules={[{ required: true, message: 'Please select a shop' }]}
          >
            <Select
              placeholder="Select shop"
              showSearch
              optionFilterProp="label"
              loading={shopsLoading}
              options={shops.map(shop => ({
                label: `${shop.id} - ${shop.name || 'Unnamed Shop'}`,
                value: Number(shop.id)
              }))}
              notFoundContent={shopsLoading ? 'Loading shops...' : 'No shops found'}
            />
          </Form.Item>

          <Form.Item
            name="amount"
            label="Amount"
            rules={[{ required: true, message: 'Please enter amount' }]}
          >
            <InputNumber min={0} step={0.01} prefix="$" style={{ width: '100%' }} />
          </Form.Item>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="payment_type"
                label="Payment Type"
                initialValue="MONTHLY"
                rules={[{ required: true }]}
              >
                <Select
                  options={[
                    { label: 'Monthly', value: 'MONTHLY' },
                    { label: 'Quarterly', value: 'QUARTERLY' },
                    { label: 'Yearly', value: 'YEARLY' }
                  ]}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="payment_method"
                label="Payment Method"
                rules={[{ required: true, message: 'Please select method' }]}
              >
                <Select
                  options={[
                    { label: 'Credit Card', value: 'CREDIT_CARD' },
                    { label: 'Bank Transfer', value: 'BANK_TRANSFER' },
                    { label: 'UPI', value: 'UPI' },
                    { label: 'Cheque', value: 'CHEQUE' },
                    { label: 'Cash', value: 'CASH' }
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="due_date"
            label="Due Date"
            rules={[{ required: true, message: 'Please select due date' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="notes"
            label="Notes"
          >
            <Input.TextArea placeholder="Additional notes" rows={3} />
          </Form.Item>

          <Space>
            <Button type="primary" htmlType="submit">
              {selectedPayment ? 'Update' : 'Create'} Payment
            </Button>
            <Button onClick={() => setPaymentModalVisible(false)}>
              Cancel
            </Button>
          </Space>
        </Form>
      </Modal>

      {/* Payment Detail Drawer */}
      <Drawer
        title={`Payment Details - ${selectedPayment?.id}`}
        placement="right"
        onClose={() => setDetailDrawer(false)}
        open={detailDrawer}
        width={500}
      >
        {selectedPayment && (
          <div>
            <div className="detail-item">
              <label>Shop:</label>
              <p>{shops.find(s => Number(s.id) === Number(selectedPayment.shop_id))?.name || `Shop #${selectedPayment.shop_id}`}</p>
            </div>
            <div className="detail-item">
              <label>Amount:</label>
              <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#52c41a' }}>
                ${parseFloat(selectedPayment.amount).toFixed(2)}
              </p>
            </div>
            <div className="detail-item">
              <label>Status:</label>
              <Tag color={getPaymentStatusColor(selectedPayment.payment_status)}>
                {selectedPayment.payment_status}
              </Tag>
            </div>
            <div className="detail-item">
              <label>Type:</label>
              <p>{selectedPayment.payment_type}</p>
            </div>
            <div className="detail-item">
              <label>Method:</label>
              <p>{selectedPayment.payment_method}</p>
            </div>
            <div className="detail-item">
              <label>Due Date:</label>
              <p>{new Date(selectedPayment.due_date).toLocaleDateString()}</p>
            </div>
            {selectedPayment.paid_date && (
              <div className="detail-item">
                <label>Paid Date:</label>
                <p>{new Date(selectedPayment.paid_date).toLocaleDateString()}</p>
              </div>
            )}
            {selectedPayment.notes && (
              <div className="detail-item">
                <label>Notes:</label>
                <p style={{ background: '#fafafa', padding: '8px', borderRadius: '4px' }}>
                  {selectedPayment.notes}
                </p>
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default Payment;
