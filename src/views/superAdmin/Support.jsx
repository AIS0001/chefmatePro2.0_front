/**
 * SUPPORT TICKETS PAGE
 * Manage support tickets and issues from shops
 */

import React, { useState, useEffect } from 'react';
import {
  Table,
  Card,
  Space,
  Button,
  Checkbox,
  Tag,
  Modal,
  Form,
  Select,
  Input,
  Drawer,
  Row,
  Col,
  Statistic,
  Empty,
  Spin,
  message,
  Tooltip,
  Timeline,
  Divider
} from 'antd';
import {
  SearchOutlined,
  ReloadOutlined,
  PlusOutlined,
  EyeOutlined,
  FileTextOutlined,
  PlusCircleOutlined
} from '@ant-design/icons';
import axios from 'axios';
import { getAuthToken } from '../../utility/auth';
import './Support.css';

const getCurrentSuperAdminId = () => {
  const storedUserId = localStorage.getItem('user_id') || sessionStorage.getItem('user_id');
  return storedUserId ? Number(storedUserId) : null;
};

const Support = () => {
  const [tickets, setTickets] = useState([]);
  const [shops, setShops] = useState([]);
  const [assignees, setAssignees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [shopsLoading, setShopsLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });
  const [detailDrawer, setDetailDrawer] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [ticketComments, setTicketComments] = useState([]);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [updateModalVisible, setUpdateModalVisible] = useState(false);
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [dashboardStats, setDashboardStats] = useState({
    total_tickets: 0,
    open_tickets: 0,
    in_progress_tickets: 0,
    urgent_tickets: 0
  });
  const [filters, setFilters] = useState({
    shop_id: '',
    category: '',
    status: 'OPEN',
    priority: '',
    search: ''
  });
  const [form] = Form.useForm();
  const [updateForm] = Form.useForm();
  const [commentForm] = Form.useForm();

  useEffect(() => {
    fetchTickets();
    fetchStats();
    fetchShops();
    fetchAssignees();
  }, []);

  const fetchShops = async () => {
    try {
      setShopsLoading(true);
      const token = getAuthToken();
      const response = await axios.get('/super-admin/shops', {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit: 100, page: 1 }
      });

      if (response.data?.success) {
        setShops(Array.isArray(response.data.data) ? response.data.data : []);
      }
    } catch (error) {
      console.error('Error fetching shops:', error);
      message.error('Failed to load shops list');
    } finally {
      setShopsLoading(false);
    }
  };

  const fetchAssignees = async () => {
    try {
      const token = getAuthToken();
      const response = await axios.get('/super-admin/users/super-admins', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data?.success) {
        setAssignees(Array.isArray(response.data.data) ? response.data.data : []);
      }
    } catch (error) {
      console.error('Error fetching assignees:', error);
    }
  };

  const fetchTickets = async (page = 1) => {
    try {
      setLoading(true);
      const token = getAuthToken();

      const params = {
        page,
        limit: pagination.pageSize,
        ...filters
      };

      const response = await axios.get('/super-admin/support-tickets', {
        headers: { Authorization: `Bearer ${token}` },
        params
      });

      if (response.data.success) {
        setTickets(response.data.data);
        setPagination(prev => ({
          ...prev,
          current: page,
          total: response.data.pagination.total
        }));
      }
    } catch (error) {
      console.error('Error fetching tickets:', error);
      message.error('Failed to load support tickets');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = getAuthToken();
      const response = await axios.get('/super-admin/monitoring/stats', {
        headers: { Authorization: `Bearer ${token}` },
        params: { shop_id: filters.shop_id }
      });

      if (response.data.success) {
        setDashboardStats(response.data.data.tickets);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const getPriorityColor = (priority) => {
    const colors = {
      URGENT: 'red',
      HIGH: 'orange',
      MEDIUM: 'blue',
      LOW: 'green'
    };
    return colors[priority] || 'default';
  };

  const getStatusColor = (status) => {
    const colors = {
      OPEN: 'volcano',
      IN_PROGRESS: 'processing',
      PENDING_CUSTOMER: 'warning',
      ON_HOLD: 'error',
      RESOLVED: 'success',
      CLOSED: 'default'
    };
    return colors[status] || 'default';
  };

  const getCategoryColor = (category) => {
    const colors = {
      BILLING: 'cyan',
      TECHNICAL: 'blue',
      FEATURE_REQUEST: 'purple',
      PAYMENT: 'orange',
      PRINTER: 'green',
      INVENTORY: 'magenta',
      OTHER: 'default'
    };
    return colors[category] || 'default';
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleSearch = () => {
    setPagination(prev => ({ ...prev, current: 1 }));
    fetchTickets(1);
    fetchStats();
  };

  const handleReset = () => {
    setFilters({
      shop_id: '',
      category: '',
      status: 'OPEN',
      priority: '',
      search: ''
    });
  };

  const handleViewDetail = async (record) => {
    try {
      const token = getAuthToken();
      const response = await axios.get(`/super-admin/support-tickets/${record.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setSelectedTicket(response.data.ticket);
        setTicketComments(response.data.comments);
        setDetailDrawer(true);
        updateForm.setFieldsValue({
          status: response.data.ticket.status,
          priority: response.data.ticket.priority,
          assigned_to: response.data.ticket.assigned_to || undefined,
          progress_stage: response.data.ticket.progress_stage || '',
          notes: response.data.ticket.notes || '',
          resolution: response.data.ticket.resolution || ''
        });
      }
    } catch (error) {
      console.error('Error fetching ticket detail:', error);
      message.error('Failed to load ticket details');
    }
  };

  const handleCreateTicket = async (values) => {
    try {
      const token = getAuthToken();
      const currentUserId = getCurrentSuperAdminId();

      if (!currentUserId) {
        message.error('Current super admin user could not be identified. Please log in again.');
        return;
      }
      
      await axios.post('/super-admin/support-tickets', {
        ...values,
        created_by: currentUserId
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      message.success('Support ticket created successfully');
      setCreateModalVisible(false);
      form.resetFields();
      fetchTickets();
      fetchStats();
    } catch (error) {
      console.error('Error creating ticket:', error);
      message.error('Failed to create ticket');
    }
  };

  const handleUpdateTicket = async (values) => {
    try {
      const token = getAuthToken();
      await axios.put(`/super-admin/support-tickets/${selectedTicket.id}`, values, {
        headers: { Authorization: `Bearer ${token}` }
      });

      message.success('Ticket updated successfully');
      setUpdateModalVisible(false);
      fetchTickets(pagination.current);
      handleViewDetail(selectedTicket);
    } catch (error) {
      console.error('Error updating ticket:', error);
      message.error('Failed to update ticket');
    }
  };

  const handleAddComment = async (values) => {
    try {
      const token = getAuthToken();
      const currentUserId = getCurrentSuperAdminId();

      if (!selectedTicket?.id) {
        message.error('No support ticket selected');
        return;
      }

      if (!currentUserId) {
        message.error('Current super admin user could not be identified. Please log in again.');
        return;
      }

      await axios.post(
        `/super-admin/support-tickets/${selectedTicket.id}/comments`,
        {
          ...values,
          user_id: currentUserId,
          is_internal: values.is_internal ? 1 : 0
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      message.success('Comment added successfully');
      setCommentModalVisible(false);
      commentForm.resetFields();
      handleViewDetail(selectedTicket);
    } catch (error) {
      console.error('Error adding comment:', error);
      message.error(error.response?.data?.error || 'Failed to add comment');
    }
  };

  const columns = [
    {
      title: 'Ticket #',
      dataIndex: 'ticket_number',
      key: 'ticket_number',
      width: 140,
      render: num => <span style={{ fontWeight: 'bold', color: '#1890ff' }}>{num}</span>
    },
    {
      title: 'Shop',
      dataIndex: 'shop_name',
      key: 'shop_name',
      width: 120
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      width: 100,
      render: category => <Tag color={getCategoryColor(category)}>{category}</Tag>
    },
    {
      title: 'Subject',
      dataIndex: 'subject',
      key: 'subject',
      width: 250,
      render: subject => (
        <Tooltip title={subject}>
          {subject.length > 30 ? subject.substring(0, 30) + '...' : subject}
        </Tooltip>
      )
    },
    {
      title: 'Stage',
      dataIndex: 'progress_stage',
      key: 'progress_stage',
      width: 140,
      render: stage => stage || 'New'
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      width: 90,
      render: priority => <Tag color={getPriorityColor(priority)}>{priority}</Tag>
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: status => <Tag color={getStatusColor(status)}>{status}</Tag>
    },
    {
      title: 'Created',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 130,
      render: date => new Date(date).toLocaleDateString()
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      fixed: 'right',
      render: (_, record) => (
        <Button
          type="primary"
          icon={<EyeOutlined />}
          size="small"
          onClick={() => handleViewDetail(record)}
        />
      )
    }
  ];

  return (
    <div className="support-container">
      {/* Dashboard Stats */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Tickets"
              value={dashboardStats.total_tickets}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card style={{ background: '#fff1f0' }}>
            <Statistic
              title="Open Tickets"
              value={dashboardStats.open_tickets}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card style={{ background: '#e6f7ff' }}>
            <Statistic
              title="In Progress"
              value={dashboardStats.in_progress_tickets}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card style={{ background: '#fff7e6' }}>
            <Statistic
              title="Urgent"
              value={dashboardStats.urgent_tickets}
              valueStyle={{ color: '#ff7a45' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters Card */}
      <Card style={{ marginBottom: '24px' }} title="Search & Filter">
        <Form layout="vertical">
          <Row gutter={16}>
            <Col xs={24} sm={12} md={6}>
              <Form.Item label="Search">
                <Input
                  placeholder="Search by subject or ticket #..."
                  value={filters.search}
                  onChange={e => handleFilterChange('search', e.target.value)}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item label="Category">
                <Select
                  placeholder="Select category"
                  value={filters.category}
                  onChange={value => handleFilterChange('category', value)}
                  allowClear
                  options={[
                    { label: 'BILLING', value: 'BILLING' },
                    { label: 'TECHNICAL', value: 'TECHNICAL' },
                    { label: 'FEATURE_REQUEST', value: 'FEATURE_REQUEST' },
                    { label: 'PAYMENT', value: 'PAYMENT' },
                    { label: 'PRINTER', value: 'PRINTER' },
                    { label: 'INVENTORY', value: 'INVENTORY' },
                    { label: 'OTHER', value: 'OTHER' }
                  ]}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item label="Priority">
                <Select
                  placeholder="Select priority"
                  value={filters.priority}
                  onChange={value => handleFilterChange('priority', value)}
                  allowClear
                  options={[
                    { label: 'URGENT', value: 'URGENT' },
                    { label: 'HIGH', value: 'HIGH' },
                    { label: 'MEDIUM', value: 'MEDIUM' },
                    { label: 'LOW', value: 'LOW' }
                  ]}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item label="Status">
                <Select
                  placeholder="Select status"
                  value={filters.status}
                  onChange={value => handleFilterChange('status', value)}
                  options={[
                    { label: 'All', value: '' },
                    { label: 'OPEN', value: 'OPEN' },
                    { label: 'IN_PROGRESS', value: 'IN_PROGRESS' },
                    { label: 'PENDING_CUSTOMER', value: 'PENDING_CUSTOMER' },
                    { label: 'ON_HOLD', value: 'ON_HOLD' },
                    { label: 'RESOLVED', value: 'RESOLVED' },
                    { label: 'CLOSED', value: 'CLOSED' }
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>
          <Row justify="end" gutter={8}>
            <Col>
              <Button onClick={handleSearch} type="primary" icon={<SearchOutlined />}>
                Search
              </Button>
            </Col>
            <Col>
              <Button onClick={() => { handleReset(); }} icon={<ReloadOutlined />}>
                Reset
              </Button>
            </Col>
            <Col>
              <Button
                type="default"
                icon={<PlusOutlined />}
                onClick={() => {
                  fetchShops();
                  setCreateModalVisible(true);
                }}
              >
                New Ticket
              </Button>
            </Col>
          </Row>
        </Form>
      </Card>

      {/* Tickets Table */}
      <Card title="Support Tickets">
        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={tickets}
            rowKey="id"
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: pagination.total,
              showSizeChanger: true,
              showQuickJumper: true
            }}
            onChange={(pag) => {
              setPagination(prev => ({ ...prev, current: pag.current, pageSize: pag.pageSize }));
              fetchTickets(pag.current);
            }}
            scroll={{ x: 1200 }}
          />
        </Spin>
      </Card>

      {/* Detail Drawer */}
      <Drawer
        title={`Ticket: ${selectedTicket?.ticket_number}`}
        placement="right"
        onClose={() => setDetailDrawer(false)}
        open={detailDrawer}
        width={700}
      >
        {selectedTicket && (
          <div>
            {/* Ticket Overview */}
            <Card type="inner" title="Overview" style={{ marginBottom: '16px' }}>
              <Row gutter={16}>
                <Col xs={12}>
                  <div className="detail-item">
                    <label>Shop:</label>
                    <p>{selectedTicket.shop_name}</p>
                  </div>
                </Col>
                <Col xs={12}>
                  <div className="detail-item">
                    <label>Category:</label>
                    <Tag color={getCategoryColor(selectedTicket.category)}>
                      {selectedTicket.category}
                    </Tag>
                  </div>
                </Col>
              </Row>

              <Row gutter={16} style={{ marginTop: '12px' }}>
                <Col xs={12}>
                  <div className="detail-item">
                    <label>Priority:</label>
                    <Tag color={getPriorityColor(selectedTicket.priority)}>
                      {selectedTicket.priority}
                    </Tag>
                  </div>
                </Col>
                <Col xs={12}>
                  <div className="detail-item">
                    <label>Status:</label>
                    <Tag color={getStatusColor(selectedTicket.status)}>
                      {selectedTicket.status}
                    </Tag>
                  </div>
                </Col>
              </Row>

              <Row gutter={16} style={{ marginTop: '12px' }}>
                <Col xs={12}>
                  <div className="detail-item">
                    <label>Stage:</label>
                    <p>{selectedTicket.progress_stage || 'New'}</p>
                  </div>
                </Col>
                <Col xs={12}>
                  <div className="detail-item">
                    <label>Assigned To:</label>
                    <p>{selectedTicket.assigned_to_name || 'Unassigned'}</p>
                  </div>
                </Col>
              </Row>

              <Row gutter={16} style={{ marginTop: '12px' }}>
                <Col xs={12}>
                  <div className="detail-item">
                    <label>Created At:</label>
                    <p>{new Date(selectedTicket.created_at).toLocaleString()}</p>
                  </div>
                </Col>
                <Col xs={12}>
                  <div className="detail-item">
                    <label>Stage Updated:</label>
                    <p>{selectedTicket.stage_updated_at ? new Date(selectedTicket.stage_updated_at).toLocaleString() : 'Not updated yet'}</p>
                  </div>
                </Col>
              </Row>

              <Row gutter={16} style={{ marginTop: '12px' }}>
                <Col xs={12}>
                  <div className="detail-item">
                    <label>Resolved At:</label>
                    <p>{selectedTicket.resolved_at ? new Date(selectedTicket.resolved_at).toLocaleString() : 'Not resolved yet'}</p>
                  </div>
                </Col>
                <Col xs={12}>
                  <div className="detail-item">
                    <label>Closed At:</label>
                    <p>{selectedTicket.closed_at ? new Date(selectedTicket.closed_at).toLocaleString() : 'Not closed yet'}</p>
                  </div>
                </Col>
              </Row>

              <div className="detail-item" style={{ marginTop: '16px' }}>
                <label>Subject:</label>
                <p style={{ fontWeight: 'bold' }}>{selectedTicket.subject}</p>
              </div>

              <div className="detail-item">
                <label>Description:</label>
                <p style={{ background: '#fafafa', padding: '12px', borderRadius: '4px' }}>
                  {selectedTicket.description}
                </p>
              </div>
            </Card>

            {/* Comments Section */}
            <Card type="inner" title="Comments & Activity" style={{ marginBottom: '16px' }}>
              {ticketComments && ticketComments.length > 0 ? (
                <Timeline>
                  {ticketComments.map((comment, idx) => (
                    <Timeline.Item key={idx}>
                      <div style={{ marginBottom: '12px' }}>
                        <p style={{ marginBottom: '4px' }}>
                          <strong>{comment.user_name || 'Admin'}</strong>
                          {comment.is_internal && (
                            <Tag color="red" style={{ marginLeft: '8px' }}>
                              Internal Note
                            </Tag>
                          )}
                        </p>
                        <p style={{ color: '#666', fontSize: '12px', marginBottom: '8px' }}>
                          {new Date(comment.created_at).toLocaleString()}
                        </p>
                        <p style={{ background: '#fafafa', padding: '8px', borderRadius: '4px' }}>
                          {comment.comment}
                        </p>
                      </div>
                    </Timeline.Item>
                  ))}
                </Timeline>
              ) : (
                <Empty description="No comments yet" />
              )}

              <Divider />

              <Button
                type="primary"
                icon={<PlusCircleOutlined />}
                onClick={() => setCommentModalVisible(true)}
                style={{ marginTop: '12px' }}
              >
                Add Comment
              </Button>
            </Card>

            {/* Action Buttons */}
            <Space style={{ marginTop: '24px', width: '100%', justifyContent: 'flex-end' }}>
              <Button
                onClick={() => {
                  updateForm.setFieldsValue({
                    status: 'CLOSED',
                    priority: selectedTicket.priority,
                    assigned_to: selectedTicket.assigned_to || undefined,
                    progress_stage: selectedTicket.progress_stage || 'Closed',
                    notes: selectedTicket.notes || '',
                    resolution: selectedTicket.resolution || ''
                  });
                  setUpdateModalVisible(true);
                }}
              >
                Close Ticket
              </Button>
              <Button onClick={() => setUpdateModalVisible(true)} type="primary">
                Update Ticket
              </Button>
              <Button onClick={() => setDetailDrawer(false)}>
                Close
              </Button>
            </Space>
          </div>
        )}
      </Drawer>

      {/* Create Ticket Modal */}
      <Modal
        title="Create New Support Ticket"
        open={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateTicket}
        >
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
                value: shop.id,
                label: `${shop.id} - ${shop.name || shop.shop_name || 'Unnamed Shop'}`
              }))}
              notFoundContent={shops.length === 0 ? 'No shops found' : undefined}
            />
          </Form.Item>

          <Form.Item
            name="category"
            label="Category"
            rules={[{ required: true, message: 'Please select a category' }]}
          >
            <Select
              options={[
                { label: 'BILLING', value: 'BILLING' },
                { label: 'TECHNICAL', value: 'TECHNICAL' },
                { label: 'FEATURE_REQUEST', value: 'FEATURE_REQUEST' },
                { label: 'PAYMENT', value: 'PAYMENT' },
                { label: 'PRINTER', value: 'PRINTER' },
                { label: 'INVENTORY', value: 'INVENTORY' },
                { label: 'OTHER', value: 'OTHER' }
              ]}
            />
          </Form.Item>

          <Form.Item
            name="subject"
            label="Subject"
            rules={[{ required: true, message: 'Please enter subject' }]}
          >
            <Input placeholder="Brief description of the issue" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: 'Please enter detailed description' }]}
          >
            <Input.TextArea placeholder="Detailed description of the issue" rows={5} />
          </Form.Item>

          <Form.Item
            name="priority"
            label="Priority"
            rules={[{ required: true, message: 'Please select priority' }]}
            initialValue="MEDIUM"
          >
            <Select
              options={[
                { label: 'URGENT', value: 'URGENT' },
                { label: 'HIGH', value: 'HIGH' },
                { label: 'MEDIUM', value: 'MEDIUM' },
                { label: 'LOW', value: 'LOW' }
              ]}
            />
          </Form.Item>

          <Form.Item
            name="progress_stage"
            label="Initial Stage"
            initialValue="New"
          >
            <Input placeholder="Examples: New, Awaiting triage" />
          </Form.Item>

          <Space>
            <Button type="primary" htmlType="submit">
              Create Ticket
            </Button>
            <Button onClick={() => setCreateModalVisible(false)}>
              Cancel
            </Button>
          </Space>
        </Form>
      </Modal>

      {/* Update Ticket Modal */}
      <Modal
        title="Update Ticket"
        open={updateModalVisible}
        onCancel={() => setUpdateModalVisible(false)}
        footer={null}
      >
        <Form
          form={updateForm}
          layout="vertical"
          onFinish={handleUpdateTicket}
        >
          <Form.Item
            name="status"
            label="Status"
            rules={[{ required: true }]}
          >
            <Select
              options={[
                { label: 'OPEN', value: 'OPEN' },
                { label: 'IN_PROGRESS', value: 'IN_PROGRESS' },
                { label: 'PENDING_CUSTOMER', value: 'PENDING_CUSTOMER' },
                { label: 'ON_HOLD', value: 'ON_HOLD' },
                { label: 'RESOLVED', value: 'RESOLVED' },
                { label: 'CLOSED', value: 'CLOSED' }
              ]}
            />
          </Form.Item>

          <Form.Item
            name="priority"
            label="Priority"
            rules={[{ required: true }]}
          >
            <Select
              options={[
                { label: 'URGENT', value: 'URGENT' },
                { label: 'HIGH', value: 'HIGH' },
                { label: 'MEDIUM', value: 'MEDIUM' },
                { label: 'LOW', value: 'LOW' }
              ]}
            />
          </Form.Item>

          <Form.Item
            name="assigned_to"
            label="Assign To"
          >
            <Select
              allowClear
              placeholder="Select support owner"
              options={assignees.map((assignee) => ({
                value: assignee.id,
                label: [assignee.first_name, assignee.last_name].filter(Boolean).join(' ') || assignee.username || `User ${assignee.id}`
              }))}
            />
          </Form.Item>

          <Form.Item
            name="progress_stage"
            label="Progress Stage"
          >
            <Input placeholder="Examples: Investigating, Waiting for logs, Patch deployed" />
          </Form.Item>

          <Form.Item
            name="notes"
            label="Internal Notes"
          >
            <Input.TextArea placeholder="Internal notes visible only to admins" rows={4} />
          </Form.Item>

          <Form.Item
            name="resolution"
            label="Resolution"
            rules={[{ required: false }]}
          >
            <Input.TextArea placeholder="How was the issue resolved?" rows={3} />
          </Form.Item>

          <Space>
            <Button type="primary" htmlType="submit">
              Update
            </Button>
            <Button onClick={() => setUpdateModalVisible(false)}>
              Cancel
            </Button>
          </Space>
        </Form>
      </Modal>

      {/* Add Comment Modal */}
      <Modal
        title="Add Comment"
        open={commentModalVisible}
        onCancel={() => setCommentModalVisible(false)}
        footer={null}
      >
        <Form
          form={commentForm}
          layout="vertical"
          onFinish={handleAddComment}
        >
          <Form.Item
            name="comment"
            label="Comment"
            rules={[{ required: true, message: 'Please enter a comment' }]}
          >
            <Input.TextArea placeholder="Add your comment..." rows={4} />
          </Form.Item>

          <Form.Item
            name="is_internal"
            label="Internal Note"
            valuePropName="checked"
            initialValue={false}
          >
            <Checkbox />
          </Form.Item>

          <Space>
            <Button type="primary" htmlType="submit">
              Add Comment
            </Button>
            <Button onClick={() => setCommentModalVisible(false)}>
              Cancel
            </Button>
          </Space>
        </Form>
      </Modal>
    </div>
  );
};

export default Support;
