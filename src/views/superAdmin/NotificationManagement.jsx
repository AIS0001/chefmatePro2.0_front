import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Select, Upload, Card, Table, Space, Modal, message, DatePicker, Tag, Empty, Divider, Row, Col, Checkbox } from 'antd';
import { UploadOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import axios from 'axios';
import { getAuthToken } from '../../utility/auth';
import './NotificationManagement.css';
import dayjs from 'dayjs';

export default function NotificationManagement() {
  const [form] = Form.useForm();
  const [notifications, setNotifications] = useState([]);
  const [shops, setShops] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [targetType, setTargetType] = useState('all');
  const [selectedShops, setSelectedShops] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);

  const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:4402';

  // Fetch notifications, shops, and users on mount
  useEffect(() => {
    fetchNotifications();
    fetchShops();
    fetchUsers();
  }, []);

  // Fetch all notifications
  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const token = getAuthToken();
      const res = await axios.get('/super-admin/notifications/all', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data?.success) {
        setNotifications(res.data.data.notifications || []);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      message.error('Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  };

  // Fetch shops
  const fetchShops = async () => {
    try {
      const token = getAuthToken();
      // Use correct super-admin endpoint to fetch shops
      const res = await axios.get('/super-admin/shops', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('📦 Shops response:', res.data);
      if (res.data?.success) {
        const shopsData = Array.isArray(res.data.data) ? res.data.data : (res.data.data?.shops || []);
        console.log('✅ Shops loaded:', shopsData.length, 'shops', shopsData);
        setShops(shopsData);
      } else if (Array.isArray(res.data?.data)) {
        console.log('✅ Shops loaded (alternate format):', res.data.data.length);
        setShops(res.data.data);
      } else {
        console.warn('⚠️ Unexpected shops response format:', res.data);
        setShops([]);
      }
    } catch (error) {
      console.error('❌ Error fetching shops:', error.response?.data || error.message);
      message.error('Failed to load shops: ' + (error.response?.data?.error || error.message));
      setShops([]);
    }
  };

  // Fetch users
  const fetchUsers = async () => {
    try {
      const token = getAuthToken();
      // Use correct super-admin endpoint to fetch all users
      const res = await axios.get('/super-admin/users/all', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('👥 Users response:', res.data);
      if (res.data?.success) {
        const usersData = Array.isArray(res.data.data) ? res.data.data : (res.data.data?.users || []);
        console.log('✅ Users loaded:', usersData.length, 'users', usersData);
        setUsers(usersData);
      } else if (Array.isArray(res.data?.data)) {
        console.log('✅ Users loaded (alternate format):', res.data.data.length);
        setUsers(res.data.data);
      } else {
        console.warn('⚠️ Unexpected users response format:', res.data);
        setUsers([]);
      }
    } catch (error) {
      console.error('❌ Error fetching users:', error.response?.data || error.message);
      message.error('Failed to load users: ' + (error.response?.data?.error || error.message));
      setUsers([]);
    }
  };

  // Handle image upload
  const handleImageUpload = (e) => {
    const file = e.file;
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle form submission
  const handleSubmit = async (values) => {
    if (targetType === 'specific_shops' && selectedShops.length === 0) {
      message.error('Please select at least one shop');
      return;
    }
    if (targetType === 'specific_users' && selectedUsers.length === 0) {
      message.error('Please select at least one user');
      return;
    }

    setSubmitting(true);
    try {
      const token = getAuthToken();
      const formData = new FormData();

      formData.append('title', values.title);
      formData.append('message', values.message);
      formData.append('notificationType', values.notificationType || 'general');
      formData.append('targetType', targetType);
      formData.append('priority', values.priority || 'normal');

      if (selectedShops.length > 0) {
        formData.append('shopIds', JSON.stringify(selectedShops));
      }
      if (selectedUsers.length > 0) {
        formData.append('userIds', JSON.stringify(selectedUsers));
      }
      if (values.scheduledFor) {
        formData.append('scheduledFor', values.scheduledFor.toISOString());
      }
      if (values.expiresAt) {
        formData.append('expiresAt', values.expiresAt.toISOString());
      }

      if (imageFile) {
        formData.append('image', imageFile);
      }

      const res = await axios.post('/super-admin/notifications/create', formData, {
        headers: { 
          Authorization: `Bearer ${token}`
        }
      });

      if (res.data?.success) {
        message.success('Notification created successfully');
        form.resetFields();
        setImageFile(null);
        setImagePreview(null);
        setSelectedShops([]);
        setSelectedUsers([]);
        setTargetType('all');
        fetchNotifications();
      }
    } catch (error) {
      console.error('Error creating notification:', error);
      message.error(error.response?.data?.error || 'Failed to create notification');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete notification
  const handleDelete = async (id) => {
    Modal.confirm({
      title: 'Delete Notification',
      content: 'Are you sure you want to delete this notification?',
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          const token = getAuthToken();
          const res = await axios.delete(`/super-admin/notifications/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.data?.success) {
            message.success('Notification deleted');
            fetchNotifications();
          }
        } catch (error) {
          message.error('Failed to delete notification');
        }
      }
    });
  };

  // View notification details
  const handleView = (notification) => {
    setSelectedNotification(notification);
    setModalVisible(true);
  };

  // Table columns
  const columns = [
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      width: 200,
      render: (text) => <strong>{text}</strong>
    },
    {
      title: 'Message',
      dataIndex: 'message',
      key: 'message',
      ellipsis: true,
      width: 250
    },
    {
      title: 'Type',
      dataIndex: 'notification_type',
      key: 'notification_type',
      width: 100,
      render: (type) => {
        const colors = {
          general: 'blue',
          announcement: 'green',
          promotion: 'gold',
          alert: 'orange',
          maintenance: 'red'
        };
        return <Tag color={colors[type]}>{type}</Tag>;
      }
    },
    {
      title: 'Target',
      dataIndex: 'target_type',
      key: 'target_type',
      width: 120,
      render: (type, record) => {
        if (type === 'all') return <Tag color="blue">All Users</Tag>;
        if (type === 'specific_shops') return <Tag color="cyan">Shops: {record.shopIds?.length || 0}</Tag>;
        if (type === 'specific_users') return <Tag color="purple">Users: {record.userIds?.length || 0}</Tag>;
      }
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      width: 100,
      render: (priority) => {
        const colors = { low: 'blue', normal: 'green', high: 'orange', urgent: 'red' };
        return <Tag color={colors[priority]}>{priority}</Tag>;
      }
    },
    {
      title: 'Created',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (date) => new Date(date).toLocaleString()
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      render: (_, record) => (
        <Space>
          <Button type="primary" size="small" icon={<EyeOutlined />} onClick={() => handleView(record)} />
          <Button danger size="small" icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)} />
        </Space>
      )
    }
  ];

  return (
    <div className="notification-management">
      <Card title="📬 Notification Management" className="header-card">
        <Divider />

        {/* Create Notification Form */}
        <Card title="Create New Notification" className="form-card">
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
          >
            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item
                  label="Title"
                  name="title"
                  rules={[{ required: true, message: 'Please enter notification title' }]}
                >
                  <Input placeholder="Notification title" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  label="Notification Type"
                  name="notificationType"
                  initialValue="general"
                >
                  <Select>
                    <Select.Option value="general">General</Select.Option>
                    <Select.Option value="announcement">Announcement</Select.Option>
                    <Select.Option value="promotion">Promotion</Select.Option>
                    <Select.Option value="alert">Alert</Select.Option>
                    <Select.Option value="maintenance">Maintenance</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item
                  label="Priority"
                  name="priority"
                  initialValue="normal"
                >
                  <Select>
                    <Select.Option value="low">Low</Select.Option>
                    <Select.Option value="normal">Normal</Select.Option>
                    <Select.Option value="high">High</Select.Option>
                    <Select.Option value="urgent">Urgent</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item label="Target Audience">
                  <Select
                    value={targetType}
                    onChange={setTargetType}
                  >
                    <Select.Option value="all">All Users</Select.Option>
                    <Select.Option value="specific_shops">Specific Shops</Select.Option>
                    <Select.Option value="specific_users">Specific Users</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            {/* Info Box showing available shops/users */}
            <div style={{
              background: '#f0f5ff',
              border: '1px solid #91d5ff',
              borderRadius: '4px',
              padding: '12px 16px',
              marginBottom: '16px',
              display: 'flex',
              gap: '24px',
              fontSize: '13px',
              color: '#0050b3'
            }}>
              <div>📦 <strong>Shops Available:</strong> {shops.length}</div>
              <div>👥 <strong>Users Available:</strong> {users.length}</div>
              {targetType === 'specific_shops' && <div>✅ <strong>Selected Shops:</strong> {selectedShops.length}</div>}
              {targetType === 'specific_users' && <div>✅ <strong>Selected Users:</strong> {selectedUsers.length}</div>}
            </div>

            {targetType === 'specific_shops' && (
              <Form.Item label="Select Shops" name="shopsSelector">
                <Select
                  mode="multiple"
                  placeholder="Select one or more shops"
                  value={selectedShops}
                  onChange={setSelectedShops}
                  loading={shops.length === 0}
                  optionLabelProp="label"
                  style={{ minHeight: '40px' }}
                >
                  {shops.length > 0 ? (
                    shops.map(shop => (
                      <Select.Option key={shop.id} value={shop.id} label={shop.name || `Shop ${shop.id}`}>
                        <div>
                          <span>{shop.name || `Shop ${shop.id}`}</span>
                          <span style={{ color: '#999', marginLeft: '8px', fontSize: '12px' }}>
                            ID: {shop.id}
                          </span>
                        </div>
                      </Select.Option>
                    ))
                  ) : (
                    <Select.Option disabled>No shops available</Select.Option>
                  )}
                </Select>
              </Form.Item>
            )}

            {targetType === 'specific_users' && (
              <Form.Item label="Select Users" name="usersSelector">
                <Select
                  mode="multiple"
                  placeholder="Select one or more users"
                  value={selectedUsers}
                  onChange={setSelectedUsers}
                  loading={users.length === 0}
                  optionLabelProp="label"
                  style={{ minHeight: '40px' }}
                >
                  {users.length > 0 ? (
                    users.map(user => (
                      <Select.Option key={user.id} value={user.id} label={user.username || user.email}>
                        <div>
                          <span>{user.username || user.email}</span>
                          <span style={{ color: '#999', marginLeft: '8px', fontSize: '12px' }}>
                            ID: {user.id}
                          </span>
                        </div>
                      </Select.Option>
                    ))
                  ) : (
                    <Select.Option disabled>No users available</Select.Option>
                  )}
                </Select>
              </Form.Item>
            )}

            <Form.Item
              label="Message"
              name="message"
              rules={[{ required: true, message: 'Please enter notification message' }]}
            >
              <Input.TextArea rows={4} placeholder="Notification message with details" />
            </Form.Item>

            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item label="Schedule For (Optional)">
                  <Form.Item
                    name="scheduledFor"
                    noStyle
                  >
                    <DatePicker showTime format="YYYY-MM-DD HH:mm:ss" />
                  </Form.Item>
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item label="Expires At (Optional)">
                  <Form.Item
                    name="expiresAt"
                    noStyle
                  >
                    <DatePicker showTime format="YYYY-MM-DD HH:mm:ss" />
                  </Form.Item>
                </Form.Item>
              </Col>
            </Row>

            <Form.Item label="Attach Image (Optional)">
              <Upload
                maxCount={1}
                accept="image/*"
                onChange={handleImageUpload}
                beforeUpload={() => false}
              >
                <Button icon={<UploadOutlined />}>Select Image</Button>
              </Upload>
              {imagePreview && (
                <div className="image-preview">
                  <img src={imagePreview} alt="preview" style={{ maxHeight: '100px', marginTop: '10px' }} />
                </div>
              )}
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" size="large" loading={submitting}>
                Create Notification
              </Button>
            </Form.Item>
          </Form>
        </Card>

        <Divider />

        {/* Notifications Table */}
        <Card title="Recent Notifications" className="table-card">
          <Table
            columns={columns}
            dataSource={notifications}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 10 }}
            locale={{
              emptyText: <Empty description="No notifications yet" />
            }}
          />
        </Card>
      </Card>

      {/* Notification Detail Modal */}
      <Modal
        title="Notification Details"
        visible={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        {selectedNotification && (
          <div className="notification-detail">
            <p><strong>Title:</strong> {selectedNotification.title}</p>
            <p><strong>Message:</strong> {selectedNotification.message}</p>
            <p><strong>Type:</strong> {selectedNotification.notification_type}</p>
            <p><strong>Priority:</strong> {selectedNotification.priority}</p>
            <p><strong>Target:</strong> {selectedNotification.target_type}</p>
            {selectedNotification.image_url && (
              <div>
                <p><strong>Image:</strong></p>
                <img src={selectedNotification.image_url} alt="notification" style={{ maxWidth: '100%', maxHeight: '300px' }} />
              </div>
            )}
            <p><strong>Created:</strong> {new Date(selectedNotification.created_at).toLocaleString()}</p>
          </div>
        )}
      </Modal>
    </div>
  );
}
