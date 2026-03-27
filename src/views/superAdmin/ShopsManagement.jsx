/**
 * SHOPS MANAGEMENT - MINIMAL UI WITH THAI BAHT
 * Super admin dashboard for managing all shops
 */

import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, Spin, message, Space, Tooltip, Tag, Pagination, Card, Empty, Alert, Drawer, Popconfirm, Badge } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, ExclamationCircleOutlined, ReloadOutlined, TeamOutlined, UserAddOutlined, DownloadOutlined } from '@ant-design/icons';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { shopUsersAPI, shopsAPI } from '../../api/superAdminAPI';
import './ShopsManagement.css';

const buildBillPrefixFromName = (shopName = '') => {
  const stopWords = new Set(['AND', 'CO', 'COMPANY', 'INC', 'LTD', 'LIMITED', 'LLC', 'PVT', 'PRIVATE']);
  const words = String(shopName)
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, ' ')
    .split(/\s+/)
    .map((word) => word.replace(/[^A-Z]/g, ''))
    .filter(Boolean)
    .filter((word) => !stopWords.has(word));

  if (words.length >= 3) {
    return words.slice(0, 3).map((word) => word[0]).join('');
  }

  if (words.length === 2) {
    const [firstWord, secondWord] = words;
    return `${firstWord[0]}${secondWord[0]}${secondWord.slice(-1) || 'X'}`;
  }

  if (words.length === 1) {
    return words[0].slice(0, 3).padEnd(3, words[0].slice(-1) || 'X');
  }

  return '';
};

const STATUS_COLORS = {
  active: 'success',
  inactive: 'default',
  trial: 'processing',
  suspended: 'error'
};

const CURRENCY_SYMBOL = '฿'; // Thai Baht

function ShopsManagement() {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingShop, setEditingShop] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [form] = Form.useForm();
  const [plans, setPlans] = useState([]);

  // Shop User Management state
  const [userDrawerOpen, setUserDrawerOpen] = useState(false);
  const [selectedShop, setSelectedShop] = useState(null);
  const [shopUsers, setShopUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userForm] = Form.useForm();

  useEffect(() => {
    fetchShops();
    fetchPlans();
  }, [pagination.page, statusFilter]);

  const fetchShops = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      if (!token) {
        setError('Authentication token not found. Please log in again.');
        return;
      }
      
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search: searchText,
        status: statusFilter
      };

      const response = await axios.get('/super-admin/shops', {
        headers: { Authorization: `Bearer ${token}` },
        params
      });

      if (response.data.success) {
        setShops(response.data.data || []);
        setPagination(p => ({
          ...p,
          total: response.data.pagination?.total || 0
        }));
      } else {
        setError(response.data.message || 'Failed to fetch shops');
        setShops([]);
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message || 'Failed to fetch shops';
      setError(errorMsg);
      setShops([]);
      console.error('Fetch shops error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlans = async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      console.log('Fetching plans with token:', token ? 'Present' : 'Missing');
      
      const response = await axios.get('/super-admin/subscription-plans', {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('Plans response:', response.data);
      
      if (response.data.success) {
        console.log('Plans fetched successfully:', response.data.data);
        setPlans(response.data.data || []);
      } else {
        console.warn('Plans fetch unsuccessful:', response.data);
        setPlans([]);
      }
    } catch (error) {
      console.error('Failed to fetch plans:', error.response?.data || error.message);
      setPlans([]);
    }
  };

  const handleAddShop = () => {
    console.log('handleAddShop called');
    console.log('Current isModalVisible:', isModalVisible);
    setEditingShop(null);
    form.resetFields();
    setIsModalVisible(true);
    console.log('Setting isModalVisible to true');
  };

  const handleEditShop = async (shop) => {
    setEditingShop(shop);
    form.setFieldsValue({
      name: shop.name,
      shop_code: shop.shop_code,
      bill_prefix: shop.bill_prefix,
      tax_id: shop.tax_id,
      phone_number: shop.phone_number,
      email: shop.email,
      address: shop.address,
      city: shop.city,
      state: shop.state,
      zip_code: shop.zip_code,
      country: shop.country,
      website: shop.website,
      contact_person: shop.contact_person,
      contact_person_phone: shop.contact_person_phone,
      subscription_plan_id: shop.subscription_plan_id,
      subscription_status: shop.subscription_status,
    });
    setIsModalVisible(true);
  };

  const handleSubmit = async (values) => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const payload = {
        ...values,
        bill_prefix: String(values.bill_prefix || '').toUpperCase().replace(/[^A-Z0-9]/g, '')
      };
      
      if (editingShop) {
        // Update shop
        await axios.put(`/super-admin/shops/${editingShop.id}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        message.success('Shop updated successfully');
      } else {
        // Create new shop
        await axios.post('/super-admin/shops', payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        message.success('Shop created successfully');
      }

      setIsModalVisible(false);
      form.resetFields();
      fetchShops();
    } catch (error) {
      message.error(error.response?.data?.error || 'Failed to save shop');
    }
  };

  const handleStatusChange = async (shopId, newStatus) => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      await axios.patch(`/super-admin/shops/${shopId}/status`, 
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      message.success('Shop status updated');
      fetchShops();
    } catch (error) {
      message.error('Failed to update shop status');
    }
  };

  const handleDeleteShop = (shop) => {
    Modal.confirm({
      title: 'Delete Shop',
      content: `Are you sure you want to delete "${shop.name}"? This action cannot be undone.`,
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          const token = localStorage.getItem('token') || sessionStorage.getItem('token');
          await axios.delete(`/super-admin/shops/${shop.id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          message.success('Shop deleted');
          fetchShops();
        } catch (error) {
          message.error('Failed to delete shop');
        }
      }
    });
  };

  // ── Shop User Management ──────────────────────────────

  const fetchShopUsers = async (shopId) => {
    try {
      setUsersLoading(true);
      const response = await shopUsersAPI.getAll(shopId);
      if (response.data.success) {
        setShopUsers(response.data.data || []);
      }
    } catch (error) {
      message.error('Failed to fetch shop users');
      setShopUsers([]);
    } finally {
      setUsersLoading(false);
    }
  };

  const handleManageUsers = (shop) => {
    setSelectedShop(shop);
    setUserDrawerOpen(true);
    fetchShopUsers(shop.id);
  };

  const handleAddUser = () => {
    setEditingUser(null);
    userForm.resetFields();
    userForm.setFieldsValue({ type: 'admin' });
    setUserModalOpen(true);
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    userForm.setFieldsValue({
      name: user.name,
      email: user.email,
      contact: user.contact,
      type: user.type,
    });
    setUserModalOpen(true);
  };

  const handleUserSubmit = async (values) => {
    try {
      if (editingUser) {
        await shopUsersAPI.update(selectedShop.id, editingUser.id, values);
        message.success('User updated successfully');
      } else {
        await shopUsersAPI.create(selectedShop.id, values);
        message.success('User created successfully');
      }
      setUserModalOpen(false);
      userForm.resetFields();
      fetchShopUsers(selectedShop.id);
      fetchShops(); // refresh user count
    } catch (error) {
      message.error(error.response?.data?.error || 'Failed to save user');
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      await shopUsersAPI.delete(selectedShop.id, userId);
      message.success('User deleted');
      fetchShopUsers(selectedShop.id);
      fetchShops();
    } catch (error) {
      message.error('Failed to delete user');
    }
  };

  const formatDateTime = (value) => {
    if (!value) return '-';
    const dt = new Date(value);
    if (Number.isNaN(dt.getTime())) return '-';
    return dt.toLocaleString();
  };

  const loadImageDataUrl = async (src) => {
    const response = await fetch(src);
    if (!response.ok) {
      throw new Error(`Unable to load image: ${src}`);
    }
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const handleExportShopDetails = async (shop) => {
    try {
      const [shopResponse, usersResponse] = await Promise.all([
        shopsAPI.getById(shop.id),
        shopUsersAPI.getAll(shop.id)
      ]);

      const shopData = shopResponse?.data?.data || shop;
      const users = Array.isArray(usersResponse?.data?.data) ? usersResponse.data.data : [];
      const reportTime = new Date().toLocaleString();
      let logoDataUrl = null;

      try {
        logoDataUrl = await loadImageDataUrl('/assets/img/logo/cloudnet_logo.png');
      } catch (logoError) {
        console.warn('Cloudnet logo not loaded for PDF export:', logoError?.message || logoError);
      }

      const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();

      doc.setFillColor(232, 244, 253);
      doc.roundedRect(24, 20, pageWidth - 48, 126, 10, 10, 'F');

      if (logoDataUrl) {
        doc.addImage(logoDataUrl, 'PNG', 34, 34, 102, 44, undefined, 'FAST');
      }

      doc.setTextColor(23, 37, 84);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(17);
      doc.text('Cloudnet Softwares Co. Ltd.', 152, 50);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(71, 85, 105);
      doc.text('Product Name: Chefmate Pro 2.0', 152, 66);
      doc.text('Website: www.cloudnetsoftwares,cin', 152, 80);
      doc.text('Phone: +66 948712350 (WhatsApp/Line)', 152, 94);
      doc.text('Email: indo@cloudnetsoftwares.com', 152, 108);
      doc.text(`Generated: ${reportTime}`, 152, 122);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(30, 41, 59);
      doc.text('Shop Details Report', 40, 170);

      autoTable(doc, {
        startY: 182,
        theme: 'grid',
        styles: { fontSize: 9, cellPadding: 6, textColor: [31, 41, 55] },
        headStyles: { fillColor: [191, 219, 254], textColor: [17, 24, 39], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        columnStyles: {
          0: { cellWidth: 150, fontStyle: 'bold', fillColor: [239, 246, 255] },
          1: { cellWidth: 360 }
        },
        body: [
          ['Shop ID', String(shopData.id || '-')],
          ['Shop Name', String(shopData.name || '-')],
          ['Shop Code', String(shopData.shop_code || '-')],
          ['Bill Prefix', String(shopData.bill_prefix || '-')],
          ['Tax ID', String(shopData.tax_id || '-')],
          ['Email', String(shopData.email || '-')],
          ['Phone Number', String(shopData.phone_number || '-')],
          ['Address', String(shopData.address || '-')],
          ['City / State / Zip', `${shopData.city || '-'} / ${shopData.state || '-'} / ${shopData.zip_code || '-'}`],
          ['Country', String(shopData.country || '-')],
          ['Plan Name', String(shopData.plan_name || shopData.subscription_plan || '-')],
          ['Subscription Status', String(shopData.subscription_status || '-')],
          ['Created At', String(formatDateTime(shopData.created_at))],
          ['Total Users', String(users.length)]
        ]
      });

      const usersTableStart = doc.lastAutoTable.finalY + 16;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(30, 41, 59);
      doc.text('Shop Users', 40, usersTableStart);

      autoTable(doc, {
        startY: usersTableStart + 8,
        theme: 'striped',
        styles: { fontSize: 8, cellPadding: 5, textColor: [31, 41, 55] },
        headStyles: { fillColor: [167, 243, 208], textColor: [17, 24, 39], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [240, 253, 250] },
        head: [['#', 'Name', 'Username', 'Email', 'Contact', 'Role', 'Status', 'Last Login']],
        body: users.length > 0
          ? users.map((user, idx) => [
              idx + 1,
              user.name || '-',
              user.uname || '-',
              user.email || '-',
              user.contact || '-',
              user.type || '-',
              Number(user.status) === 1 ? 'Active' : 'Inactive',
              formatDateTime(user.last_loggedin)
            ])
          : [['', 'No users found for this shop', '', '', '', '', '', '']]
      });

      const footerHeight = 78;
      const footerBottomMargin = 18;
      const currentPageHeight = doc.internal.pageSize.getHeight();
      const footerBoxYCurrentPage = currentPageHeight - footerHeight - footerBottomMargin;

      // Keep footer pinned to page end; move to new page if table would overlap.
      if (doc.lastAutoTable.finalY + 24 > footerBoxYCurrentPage) {
        doc.addPage();
      }

      const pageHeight = doc.internal.pageSize.getHeight();
      const footerBoxY = pageHeight - footerHeight - footerBottomMargin;
      const footerY = footerBoxY + 16;

      doc.setFillColor(254, 242, 242);
      doc.roundedRect(32, footerBoxY, pageWidth - 64, footerHeight, 8, 8, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(127, 29, 29);
      doc.text('Note:', 40, footerY + 2);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(69, 10, 10);
      doc.text(
        'For any issue, contact Cloudnet Softwares: +66 948712350 (WhatsApp/Line) | info@cloudnetsoftwares.com',
        74,
        footerY + 2,
        { maxWidth: pageWidth - 120 }
      );

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 64, 175);
      doc.text('Company Address:', 40, footerY + 30);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(30, 41, 59);
      doc.text(
        '109, 19 Soi-14, Pattaya City, Bang Lamung District, Chon Buri 20150',
        126,
        footerY + 30,
        { maxWidth: pageWidth - 166 }
      );

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(30, 41, 59);
      doc.text('Design and Developed by Cloudnet Softwares', pageWidth / 2, footerY + 60, { align: 'center' });

      const safeName = String(shopData.name || `shop-${shop.id}`).replace(/[^a-zA-Z0-9-_]/g, '_');
      doc.save(`${safeName}_details_report.pdf`);
      message.success('Shop details exported to PDF successfully');
    } catch (error) {
      console.error('Export shop details error:', error);
      message.error(error?.response?.data?.error || 'Failed to export shop details');
    }
  };

  const userColumns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Username',
      dataIndex: 'uname',
      key: 'uname',
      render: (text) => <code>{text}</code>,
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      render: (text) => text || '-',
    },
    {
      title: 'Contact',
      dataIndex: 'contact',
      key: 'contact',
      render: (text) => text || '-',
    },
    {
      title: 'Role',
      dataIndex: 'type',
      key: 'type',
      render: (type) => {
        const colors = { admin: 'red', Cashier: 'blue', Account: 'green' };
        return <Tag color={colors[type] || 'default'}>{type}</Tag>;
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Badge status={status === 1 ? 'success' : 'error'} text={status === 1 ? 'Active' : 'Inactive'} />
      ),
    },
    {
      title: 'Action',
      key: 'action',
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Edit">
            <Button size="small" icon={<EditOutlined />} onClick={() => handleEditUser(record)} />
          </Tooltip>
          <Popconfirm
            title="Delete this user?"
            onConfirm={() => handleDeleteUser(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const columns = [
    {
      title: 'Shop Name',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <div>
          <div className="shop-name">{text}</div>
          <div className="shop-code">{record.shop_code} {record.bill_prefix ? `• ${record.bill_prefix}` : ''}</div>
        </div>
      ),
      width: 200
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      width: 150
    },
    {
      title: 'Phone',
      dataIndex: 'phone_number',
      key: 'phone_number',
      width: 130
    },
    {
      title: 'Plan',
      dataIndex: 'plan_name',
      key: 'plan_name',
      render: (text) => text || 'N/A'
    },
    {
      title: 'Status',
      dataIndex: 'subscription_status',
      key: 'subscription_status',
      render: (status) => (
        <Tag color={STATUS_COLORS[status] || 'default'}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Tag>
      )
    },
    {
      title: 'Users',
      dataIndex: 'total_users',
      key: 'total_users',
      render: (count) => <span className="user-count">{count}</span>
    },
    {
      title: 'Action',
      key: 'action',
      width: 250,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Manage Users">
            <Button
              type="primary"
              size="small"
              icon={<TeamOutlined />}
              onClick={() => handleManageUsers(record)}
            />
          </Tooltip>
          <Tooltip title="View Details">
            <Button
              type="default"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleEditShop(record)}
            />
          </Tooltip>
          <Tooltip title="Edit">
            <Button
              type="default"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEditShop(record)}
            />
          </Tooltip>
          <Tooltip title="Export Shop Report">
            <Button
              type="default"
              size="small"
              icon={<DownloadOutlined />}
              onClick={() => handleExportShopDetails(record)}
            />
          </Tooltip>
          <Tooltip title="Delete">
            <Button
              danger
              size="small"
              icon={<DeleteOutlined />}
              onClick={() => handleDeleteShop(record)}
            />
          </Tooltip>
        </Space>
      )
    }
  ];

  const handleSearch = () => {
    setPagination(p => ({ ...p, page: 1 }));
    fetchShops();
  };

  return (
    <div style={{ width: '100%' }}>
      {/* Error Alert */}
      {error && (
        <Alert
          message="Error Loading Shops"
          description={error}
          type="error"
          closable
          onClose={() => setError(null)}
          style={{ marginBottom: '20px' }}
          action={
            <Button size="small" onClick={fetchShops}>
              Retry
            </Button>
          }
        />
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ margin: 0 }}>Shops Management</h2>
          <p style={{ color: '#666', fontSize: '12px', margin: '4px 0 0 0' }}>
            {shops.length} shops found {CURRENCY_SYMBOL}
          </p>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={fetchShops} loading={loading}>
            Refresh
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAddShop}>
            Add Shop
          </Button>
        </Space>
      </div>

      {/* Filters */}
      <Card style={{ marginBottom: '20px', padding: '12px' }}>
        <Space size="middle" wrap>
          <Input.Search
            placeholder="Search shop..."
            allowClear
            style={{ width: 250 }}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onSearch={handleSearch}
          />
          <Select
            placeholder="Filter by status"
            style={{ width: 150 }}
            allowClear
            value={statusFilter || undefined}
            onChange={(value) => {
              setStatusFilter(value);
              setPagination(p => ({ ...p, page: 1 }));
            }}
            options={[
              { label: 'Active', value: 'active' },
              { label: 'Inactive', value: 'inactive' },
              { label: 'Trial', value: 'trial' },
              { label: 'Suspended', value: 'suspended' }
            ]}
          />
        </Space>
      </Card>

      {/* Table */}
      <Card style={{ padding: '0' }}>
        <Spin spinning={loading}>
          {shops.length === 0 && !loading ? (
            <Empty 
              description="No shops found" 
              style={{ padding: '40px 0' }}
              onClick={handleAddShop}
            />
          ) : (
            <Table
              columns={columns}
              dataSource={shops.map(shop => ({ ...shop, key: shop.id }))}
              pagination={false}
              scroll={{ x: 1200 }}
              style={{ marginBottom: '16px' }}
            />
          )}
        </Spin>

        {/* Pagination */}
        {shops.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderTop: '1px solid #f0f0f0' }}>
            <Pagination
              current={pagination.page}
              pageSize={pagination.limit}
              total={pagination.total}
              onChange={(page) => setPagination(p => ({ ...p, page }))}
              showSizeChanger
              pageSizeOptions={['10', '20', '50']}
              size="small"
            />
            <span style={{ fontSize: '12px', color: '#666' }}>
              Total: {pagination.total} shops
            </span>
          </div>
        )}
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        title={editingShop ? 'Edit Shop' : 'Add New Shop'}
        open={isModalVisible}
        onCancel={() => {
          console.log('Modal onCancel called');
          setIsModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={700}
        destroyOnClose={true}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          onValuesChange={(changedValues, allValues) => {
            if (editingShop || !('name' in changedValues)) {
              return;
            }

            const currentPrefix = String(allValues.bill_prefix || '').trim();
            if (currentPrefix) {
              return;
            }

            const suggestedPrefix = buildBillPrefixFromName(changedValues.name || '');
            if (suggestedPrefix) {
              form.setFieldsValue({ bill_prefix: suggestedPrefix });
            }
          }}
          autoComplete="off"
        >
          <Form.Item
            name="name"
            label="Shop Name"
            rules={[{ required: true, message: 'Please enter shop name' }]}
          >
            <Input placeholder="e.g., The Golden Fork" />
          </Form.Item>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item
              name="shop_code"
              label="Shop Code"
              rules={[{ required: true, message: 'Please enter shop code' }]}
            >
              <Input placeholder="e.g., SHOP001" disabled={!!editingShop} />
            </Form.Item>

            <Form.Item
              name="bill_prefix"
              label="Bill Prefix"
              rules={[
                { required: true, message: 'Please enter bill prefix' },
                { pattern: /^[A-Za-z0-9]{2,10}$/, message: 'Use 2-10 letters or numbers only' }
              ]}
            >
              <Input placeholder="e.g., TVW" maxLength={10} style={{ textTransform: 'uppercase' }} />
            </Form.Item>

            <Form.Item
              name="tax_id"
              label="Tax ID"
              rules={[{ required: true, message: 'Please enter tax ID' }]}
            >
              <Input placeholder="e.g., 12345678" disabled={!!editingShop} />
            </Form.Item>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item
              name="email"
              label="Email"
              rules={[{ required: true, type: 'email' }]}
            >
              <Input type="email" placeholder="shop@example.com" />
            </Form.Item>

            <Form.Item
              name="phone_number"
              label="Phone Number"
              rules={[{ required: true }]}
            >
              <Input placeholder="+66-1234567890" />
            </Form.Item>
          </div>

          <Form.Item
            name="address"
            label="Address"
            rules={[{ required: true }]}
          >
            <Input.TextArea placeholder="Full address" rows={2} />
          </Form.Item>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item name="city" label="City">
              <Input placeholder="City" />
            </Form.Item>

            <Form.Item name="state" label="State">
              <Input placeholder="State" />
            </Form.Item>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item name="zip_code" label="Zip Code">
              <Input placeholder="Zip Code" />
            </Form.Item>

            <Form.Item name="country" label="Country">
              <Input placeholder="Country" />
            </Form.Item>
          </div>

          <Form.Item
            name="subscription_plan_id"
            label="Subscription Plan"
            rules={[{ required: true, message: 'Please select a subscription plan' }]}
          >
            <Select
              placeholder={plans.length === 0 ? 'Loading plans...' : 'Select a plan'}
              options={plans.map(plan => ({
                label: `${plan.name} - ${CURRENCY_SYMBOL}${plan.price_per_month}/month`,
                value: plan.id
              }))}
              notFoundContent={plans.length === 0 ? 'No plans available' : 'No plan found'}
            />
          </Form.Item>

          {editingShop && (
            <Form.Item
              name="subscription_status"
              label="Status"
            >
              <Select
                options={[
                  { label: 'Active', value: 'active' },
                  { label: 'Inactive', value: 'inactive' },
                  { label: 'Trial', value: 'trial' },
                  { label: 'Suspended', value: 'suspended' }
                ]}
              />
            </Form.Item>
          )}

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {editingShop ? 'Update Shop' : 'Create Shop'}
              </Button>
              <Button onClick={() => setIsModalVisible(false)}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Shop Users Drawer */}
      <Drawer
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Users — {selectedShop?.name || ''}</span>
            <Button type="primary" size="small" icon={<UserAddOutlined />} onClick={handleAddUser}>
              Add User
            </Button>
          </div>
        }
        placement="right"
        width={720}
        open={userDrawerOpen}
        onClose={() => {
          setUserDrawerOpen(false);
          setSelectedShop(null);
          setShopUsers([]);
        }}
      >
        <Spin spinning={usersLoading}>
          {shopUsers.length === 0 && !usersLoading ? (
            <Empty description="No users for this shop" />
          ) : (
            <Table
              columns={userColumns}
              dataSource={shopUsers.map(u => ({ ...u, key: u.id }))}
              pagination={false}
              size="small"
            />
          )}
        </Spin>
      </Drawer>

      {/* Add/Edit Shop User Modal */}
      <Modal
        title={editingUser ? 'Edit User' : `Add User — ${selectedShop?.name || ''}`}
        open={userModalOpen}
        onCancel={() => {
          setUserModalOpen(false);
          userForm.resetFields();
        }}
        footer={null}
        destroyOnClose
      >
        {/* Shop assignment info */}
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message={
            <span>
              Assigned to Shop: <strong>{selectedShop?.name}</strong>
              {' '}(ID: {selectedShop?.id}, Code: {selectedShop?.shop_code})
            </span>
          }
          description="This user will only be able to access data for this shop when they log in."
        />

        <Form form={userForm} layout="vertical" onFinish={handleUserSubmit}>
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
            rules={editingUser ? [] : [{ required: true, message: 'Please enter a password' }]}
          >
            <Input.Password placeholder="Password" />
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
              options={[
                { label: 'Admin', value: 'admin' },
                { label: 'Cashier', value: 'Cashier' },
                { label: 'Account', value: 'Account' },
              ]}
            />
          </Form.Item>

          {editingUser && (
            <Form.Item name="status" label="Active" valuePropName="checked" initialValue={true}>
              <Select
                options={[
                  { label: 'Active', value: true },
                  { label: 'Inactive', value: false },
                ]}
              />
            </Form.Item>
          )}

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {editingUser ? 'Update User' : 'Create User'}
              </Button>
              <Button onClick={() => setUserModalOpen(false)}>Cancel</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default ShopsManagement;
