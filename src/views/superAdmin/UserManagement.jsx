/**
 * SHOP USER MANAGEMENT (users table)
 * Create and manage shop users (Admin, Cashier, Account) bound to specific shops.
 * super_admin_users table is separate — for super admin, billing, support only.
 */

import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, Spin, message, Space, Tag, Tooltip, Badge, Popconfirm, Alert, Card } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, StopOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { usersAPI, shopsAPI } from '../../api/superAdminAPI';
import './UserManagement.css';

const ROLE_COLORS = {
  admin: 'red',
  Cashier: 'blue',
  Account: 'green',
};

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form] = Form.useForm();
  const [shops, setShops] = useState([]);
  const [filters, setFilters] = useState({ search: '', shop_id: undefined, type: undefined, status: undefined });

  useEffect(() => {
    fetchUsers();
    fetchShops();
  }, []);

  const fetchShops = async () => {
    try {
      const pageSize = 200;
      let currentPage = 1;
      let totalPages = 1;
      const allShops = [];

      while (currentPage <= totalPages) {
        const response = await shopsAPI.getAll({ page: currentPage, limit: pageSize });
        if (!response.data.success) {
          break;
        }

        const pageData = Array.isArray(response.data.data) ? response.data.data : [];
        allShops.push(...pageData);

        const pages = Number(response.data?.pagination?.pages || 1);
        totalPages = pages > 0 ? pages : 1;
        currentPage += 1;
      }

      const uniqueShops = Array.from(new Map(allShops.map((shop) => [shop.id, shop])).values());
      uniqueShops.sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));
      setShops(uniqueShops);
    } catch (error) {
      console.error('Failed to fetch shops:', error);
    }
  };

  const fetchUsers = async (filterOverride) => {
    try {
      setLoading(true);
      const params = filterOverride || filters;
      const cleanParams = {};
      if (params.search) cleanParams.search = params.search;
      if (params.shop_id) cleanParams.shop_id = params.shop_id;
      if (params.type) cleanParams.type = params.type;
      if (params.status !== undefined && params.status !== null) cleanParams.status = params.status;

      const response = await usersAPI.getAll(cleanParams);
      if (response.data.success) {
        setUsers(response.data.data || []);
      }
    } catch (error) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        message.error('Session expired. Please login again.');
      } else {
        message.error(error.response?.data?.error || 'Failed to fetch users');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async () => {
    await fetchShops();
    setEditingUser(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    form.setFieldsValue({
      name: user.name,
      email: user.email,
      contact: user.contact,
      type: user.type,
      shop_id: user.shop_id,
    });
    setIsModalVisible(true);
  };

  const handleSubmit = async (values) => {
    try {
      if (editingUser) {
        await usersAPI.update(editingUser.id, values);
        message.success('User updated successfully');
      } else {
        await usersAPI.create(values);
        message.success('User created successfully');
      }
      setIsModalVisible(false);
      form.resetFields();
      fetchUsers();
    } catch (error) {
      message.error(error.response?.data?.error || 'Failed to save user');
    }
  };

  const handleSuspend = async (user) => {
    try {
      const newStatus = user.status === 1 ? 0 : 1;
      await usersAPI.update(user.id, { status: newStatus });
      message.success(newStatus === 1 ? 'User activated' : 'User suspended');
      fetchUsers();
    } catch (error) {
      message.error('Failed to update user status');
    }
  };

  const handleTerminate = async (userId) => {
    try {
      await usersAPI.delete(userId);
      message.success('User terminated and removed');
      fetchUsers();
    } catch (error) {
      message.error('Failed to terminate user');
    }
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    fetchUsers(newFilters);
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>{text}</div>
          <div style={{ fontSize: 12, color: '#888' }}>Username: <code>{record.username || record.uname || '-'}</code></div>
        </div>
      ),
      width: 180,
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      render: (text) => text || '-',
      width: 180,
    },
    {
      title: 'Contact',
      dataIndex: 'contact',
      key: 'contact',
      render: (text) => text || '-',
      width: 130,
    },
    {
      title: 'Shop',
      key: 'shop',
      render: (_, record) => (
        record.shop_name
          ? <Tag color="blue">{record.shop_name} <span style={{ opacity: 0.6 }}>({record.shop_code})</span></Tag>
          : <Tag>Unassigned</Tag>
      ),
      width: 180,
    },
    {
      title: 'Shop ID',
      dataIndex: 'shop_id',
      key: 'shop_id',
      width: 80,
      render: (id) => <code>{id}</code>,
    },
    {
      title: 'Role',
      dataIndex: 'type',
      key: 'type',
      render: (type) => (
        <Tag color={ROLE_COLORS[type] || 'default'}>
          {type}
        </Tag>
      ),
      width: 100,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Badge
          status={status === 1 ? 'success' : 'error'}
          text={status === 1 ? 'Active' : 'Suspended'}
        />
      ),
      width: 110,
    },
    {
      title: 'Last Login',
      dataIndex: 'last_loggedin',
      key: 'last_loggedin',
      render: (date) => date ? new Date(date).toLocaleDateString() : 'Never',
      width: 110,
    },
    {
      title: 'Action',
      key: 'action',
      width: 160,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Edit">
            <Button size="small" icon={<EditOutlined />} onClick={() => handleEditUser(record)} />
          </Tooltip>
          <Tooltip title={record.status === 1 ? 'Suspend' : 'Activate'}>
            <Popconfirm
              title={record.status === 1 ? 'Suspend this user?' : 'Activate this user?'}
              onConfirm={() => handleSuspend(record)}
              okText="Yes"
              cancelText="No"
            >
              <Button
                size="small"
                danger={record.status === 1}
                type={record.status === 1 ? 'default' : 'primary'}
                icon={record.status === 1 ? <StopOutlined /> : <CheckCircleOutlined />}
              />
            </Popconfirm>
          </Tooltip>
          <Tooltip title="Terminate">
            <Popconfirm
              title="Permanently delete this user?"
              description="This action cannot be undone."
              onConfirm={() => handleTerminate(record.id)}
              okText="Delete"
              okType="danger"
              cancelText="Cancel"
            >
              <Button size="small" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div className="user-management">
      <div className="page-header">
        <div>
          <h1>Shop User Management</h1>
          <p style={{ color: '#666', margin: 0 }}>
            Create and manage shop users (Admin, Cashier, Account) — each user is bound to a specific shop
          </p>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAddUser} size="large">
          Add Shop User
        </Button>
      </div>

      {/* Filters */}
      <Card style={{ marginBottom: 16 }}>
        <Space size="middle" wrap>
          <Input.Search
            placeholder="Search by name, email, login code..."
            allowClear
            style={{ width: 280 }}
            value={filters.search}
            onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
            onSearch={(val) => handleFilterChange('search', val)}
          />
          <Select
            placeholder="Filter by Shop"
            style={{ width: 200 }}
            allowClear
            showSearch
            optionFilterProp="label"
            value={filters.shop_id}
            onChange={(val) => handleFilterChange('shop_id', val)}
            options={shops.map(s => ({ label: `${s.name} (${s.shop_code})`, value: s.id }))}
          />
          <Select
            placeholder="Filter by Role"
            style={{ width: 140 }}
            allowClear
            value={filters.type}
            onChange={(val) => handleFilterChange('type', val)}
            options={[
              { label: 'Admin', value: 'admin' },
              { label: 'Cashier', value: 'Cashier' },
              { label: 'Account', value: 'Account' },
            ]}
          />
          <Select
            placeholder="Filter by Status"
            style={{ width: 140 }}
            allowClear
            value={filters.status}
            onChange={(val) => handleFilterChange('status', val)}
            options={[
              { label: 'Active', value: 1 },
              { label: 'Suspended', value: 0 },
            ]}
          />
        </Space>
      </Card>

      {/* Table */}
      <Card>
        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={users.map(u => ({ ...u, key: u.id }))}
            pagination={{ pageSize: 15, showSizeChanger: true, showTotal: (total) => `Total: ${total} users` }}
            scroll={{ x: 1200 }}
            size="middle"
          />
        </Spin>
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        title={editingUser ? 'Edit Shop User' : 'Add New Shop User'}
        open={isModalVisible}
        onCancel={() => { setIsModalVisible(false); form.resetFields(); }}
        footer={null}
        width={600}
        destroyOnClose
      >
        {!editingUser && (
          <Alert
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
            message="The user will be assigned a random 5-digit login code. They can only access data for the selected shop."
          />
        )}

        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="shop_id"
            label="Assign to Shop"
            rules={[{ required: true, message: 'Please select a shop' }]}
          >
            <Select
              placeholder="Select a shop"
              showSearch
              optionFilterProp="label"
              disabled={!!editingUser}
              options={shops.map(s => ({
                label: `${s.name} (${s.shop_code}) — ID: ${s.id}`,
                value: s.id
              }))}
            />
          </Form.Item>

          <Form.Item
            name="name"
            label="Full Name"
            rules={[{ required: true, message: 'Please enter the user name' }]}
          >
            <Input placeholder="e.g., John Doe" />
          </Form.Item>

          <Form.Item
            name="password"
            label={editingUser ? 'New Password (leave blank to keep)' : 'Password'}
            rules={editingUser ? [] : [
              { required: true, message: 'Please enter a password' },
              { min: 6, message: 'Password must be at least 6 characters' }
            ]}
          >
            <Input.Password placeholder="Enter password" />
          </Form.Item>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item name="email" label="Email">
              <Input type="email" placeholder="user@example.com" />
            </Form.Item>

            <Form.Item name="contact" label="Contact">
              <Input placeholder="+66-XXXXXXXXX" />
            </Form.Item>
          </div>

          <Form.Item
            name="type"
            label="Role"
            rules={[{ required: true, message: 'Please select a role' }]}
          >
            <Select
              placeholder="Select role"
              options={[
                { label: 'Admin (Shop Owner/Manager)', value: 'admin' },
                { label: 'Cashier', value: 'Cashier' },
                { label: 'Account', value: 'Account' },
              ]}
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {editingUser ? 'Update User' : 'Create User'}
              </Button>
              <Button onClick={() => setIsModalVisible(false)}>Cancel</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default UserManagement;
