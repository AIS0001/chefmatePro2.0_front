import React, { useEffect, useState } from 'react';
import {
  Button,
  Card,
  Col,
  Drawer,
  Empty,
  Form,
  Input,
  Modal,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Timeline,
  message
} from 'antd';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  EyeOutlined,
  HomeOutlined,
  MessageOutlined,
  PlusOutlined,
  WarningOutlined
} from '@ant-design/icons';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';
import Layout from '../../layout/Layout';
import Header from '../../components/Header';
import { getAuthToken, getHeaders, getResolvedShopId } from '../../utility/getHeader';
import { getUserType } from '../../utility/auth';
import './SupportTickets.css';

const CATEGORY_OPTIONS = [
  'BILLING',
  'TECHNICAL',
  'FEATURE_REQUEST',
  'PAYMENT',
  'PRINTER',
  'INVENTORY',
  'OTHER'
].map((value) => ({ label: value, value }));

const PRIORITY_OPTIONS = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'].map((value) => ({ label: value, value }));

const STATUS_FILTER_OPTIONS = [
  { label: 'All', value: '' },
  { label: 'Not Resolved', value: 'NOT_RESOLVED' },
  { label: 'Resolved', value: 'RESOLVED' },
  { label: 'Closed', value: 'CLOSED' }
];

const UNRESOLVED_STATUSES = ['OPEN', 'IN_PROGRESS', 'PENDING_CUSTOMER', 'ON_HOLD'];
const DEFAULT_PAGE_SIZE = 10;
const DEFAULT_FILTERS = {
  status: 'NOT_RESOLVED',
  category: '',
  priority: '',
  search: ''
};

const getStatusColor = (status) => {
  switch ((status || '').toUpperCase()) {
    case 'OPEN':
      return 'volcano';
    case 'IN_PROGRESS':
      return 'processing';
    case 'PENDING_CUSTOMER':
      return 'gold';
    case 'ON_HOLD':
      return 'orange';
    case 'RESOLVED':
      return 'success';
    case 'CLOSED':
      return 'default';
    default:
      return 'default';
  }
};

const getPriorityColor = (priority) => {
  switch ((priority || '').toUpperCase()) {
    case 'URGENT':
      return 'red';
    case 'HIGH':
      return 'orange';
    case 'MEDIUM':
      return 'blue';
    case 'LOW':
      return 'green';
    default:
      return 'default';
  }
};

const formatDateTime = (value) => {
  if (!value) {
    return 'Not available';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Not available';
  }

  return date.toLocaleString();
};

const getResolutionState = (status) => {
  const normalized = (status || '').toUpperCase();
  if (normalized === 'RESOLVED' || normalized === 'CLOSED') {
    return 'Resolved';
  }
  return 'Not Resolved';
};

const buildTicketNumber = (resolvedShopId) => {
  const now = new Date();
  const datePart = now.toISOString().slice(0, 10).replace(/-/g, '');
  const randomPart = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `TICKET-${resolvedShopId}-${datePart}-${randomPart}`;
};

const getCurrentUserId = () => {
  try {
    const token = getAuthToken();
    if (!token) {
      return null;
    }

    const decoded = jwtDecode(token);
    return decoded?.id || null;
  } catch (error) {
    console.error('Failed to decode auth token:', error);
    return null;
  }
};

const applyTicketFilters = (ticketRows, activeFilters) => {
  const normalizedSearch = (activeFilters.search || '').trim().toLowerCase();

  return [...ticketRows]
    .filter((ticket) => {
      if (activeFilters.category && ticket.category !== activeFilters.category) {
        return false;
      }

      if (activeFilters.priority && ticket.priority !== activeFilters.priority) {
        return false;
      }

      if (activeFilters.status === 'NOT_RESOLVED' && !UNRESOLVED_STATUSES.includes(ticket.status)) {
        return false;
      }

      if (activeFilters.status && activeFilters.status !== 'NOT_RESOLVED' && ticket.status !== activeFilters.status) {
        return false;
      }

      if (normalizedSearch) {
        const haystack = `${ticket.ticket_number || ''} ${ticket.subject || ''} ${ticket.description || ''}`.toLowerCase();
        if (!haystack.includes(normalizedSearch)) {
          return false;
        }
      }

      return true;
    })
    .sort((left, right) => new Date(right.created_at || 0) - new Date(left.created_at || 0));
};

const buildLegacyFetchPath = (tableName, queryString) => `/fetchdata/${tableName}/created_at/${queryString}`;

export default function SupportTickets() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState({
    total_tickets: 0,
    unresolved_tickets: 0,
    resolved_tickets: 0,
    closed_tickets: 0
  });
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: DEFAULT_PAGE_SIZE, total: 0 });
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [createOpen, setCreateOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [commentOpen, setCommentOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [comments, setComments] = useState([]);
  const [apiMode] = useState('legacy');
  const [ticketForm] = Form.useForm();
  const [commentForm] = Form.useForm();

  const shopId = getResolvedShopId();
  const currentUserType = (getUserType() || '').toLowerCase();
  const hideSidebarForCashier = currentUserType === 'cashier';

  const getDashboardPath = () => {
    if (currentUserType === 'cashier') return '/dashboard/cashier';
    if (currentUserType === 'account') return '/dashboard/account';
    if (currentUserType === 'manager' || currentUserType === 'admin') return '/dashboard/admin';
    if (currentUserType === 'super_admin') return '/superadmin/dashboard';
    return '/dashboard';
  };

  const fetchLegacyTickets = async (page = 1, pageSize = pagination.pageSize, activeFilters = filters) => {
    try {
      setLoading(true);
      const response = await axios.get(buildLegacyFetchPath('support_tickets', `shop_id=${shopId}`), getHeaders());
      const allRows = response.data?.data || [];
      const filteredRows = applyTicketFilters(allRows, activeFilters);
      const offset = (page - 1) * pageSize;

      setStats({
        total_tickets: allRows.length,
        unresolved_tickets: allRows.filter((ticket) => UNRESOLVED_STATUSES.includes(ticket.status)).length,
        resolved_tickets: allRows.filter((ticket) => ticket.status === 'RESOLVED').length,
        closed_tickets: allRows.filter((ticket) => ticket.status === 'CLOSED').length
      });

      setTickets(filteredRows.slice(offset, offset + pageSize));
      setPagination({
        current: page,
        pageSize,
        total: filteredRows.length
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    await fetchLegacyTickets(1, pagination.pageSize, filters);
  };

  const fetchTickets = async (page = 1, pageSize = pagination.pageSize, activeFilters = filters) => {
    if (apiMode === 'legacy') {
      await fetchLegacyTickets(page, pageSize, activeFilters);
      return;
    }

    try {
      setLoading(true);
      const requestConfig = getHeaders();
      const response = await axios.get('/support/tickets', {
        ...requestConfig,
        params: {
          ...(requestConfig.params || {}),
          page,
          limit: pageSize,
          ...activeFilters
        }
      });

      if (response.data?.success) {
        setTickets(response.data.data || []);
        setPagination({
          current: page,
          pageSize,
          total: response.data.pagination?.total || 0
        });
      }
    } catch (error) {
      console.error('Error loading support tickets:', error);
      message.error('Failed to load support tickets');
    } finally {
      setLoading(false);
    }
  };

  const fetchTicketDetail = async (ticketId) => {
    if (apiMode === 'legacy') {
      try {
        const [ticketResponse, commentsResponse] = await Promise.all([
          axios.get(buildLegacyFetchPath('support_tickets', `id=${ticketId}&shop_id=${shopId}`), getHeaders()),
          axios.get(buildLegacyFetchPath('support_ticket_comments', `ticket_id=${ticketId}`), getHeaders())
        ]);

        const ticket = ticketResponse.data?.data?.[0] || null;
        if (!ticket) {
          message.error('Ticket not found');
          return;
        }

        setSelectedTicket(ticket);
        setComments((commentsResponse.data?.data || []).filter((comment) => Number(comment.is_internal || 0) === 0));
        setDetailOpen(true);
      } catch (error) {
        console.error('Error loading support ticket detail:', error);
        message.error('Failed to load ticket details');
      }
      return;
    }

    try {
      const response = await axios.get(`/support/tickets/${ticketId}`, getHeaders());
      if (response.data?.success) {
        setSelectedTicket(response.data.ticket);
        setComments(response.data.comments || []);
        setDetailOpen(true);
      }
    } catch (error) {
      console.error('Error loading support ticket detail:', error);
      message.error('Failed to load ticket details');
    }
  };

  useEffect(() => {
    const bootstrapTickets = async () => {
      try {
        setLoading(true);
        const response = await axios.get(buildLegacyFetchPath('support_tickets', `shop_id=${shopId}`), getHeaders());
        const allRows = response.data?.data || [];
        const filteredRows = applyTicketFilters(allRows, DEFAULT_FILTERS);

        setStats({
          total_tickets: allRows.length,
          unresolved_tickets: allRows.filter((ticket) => UNRESOLVED_STATUSES.includes(ticket.status)).length,
          resolved_tickets: allRows.filter((ticket) => ticket.status === 'RESOLVED').length,
          closed_tickets: allRows.filter((ticket) => ticket.status === 'CLOSED').length
        });

        setTickets(filteredRows.slice(0, DEFAULT_PAGE_SIZE));
        setPagination({
          current: 1,
          pageSize: DEFAULT_PAGE_SIZE,
          total: filteredRows.length
        });
      } catch (error) {
        console.error('Error bootstrapping support tickets:', error);
        message.error('Failed to load support tickets');
      } finally {
        setLoading(false);
      }
    };

    bootstrapTickets();
  }, [shopId]);

  const handleCreateTicket = async (values) => {
    if (apiMode === 'legacy') {
      try {
        const userId = getCurrentUserId();
        await axios.post('/insertdata/support_tickets', {
          shop_id: shopId,
          ticket_number: buildTicketNumber(shopId),
          user_id: userId,
          category: values.category,
          subject: values.subject,
          description: values.description,
          priority: values.priority,
          status: 'OPEN'
        }, getHeaders());

        message.success('Support ticket created successfully');
        setCreateOpen(false);
        ticketForm.resetFields();
        fetchTickets(1, pagination.pageSize);
        return;
      } catch (error) {
        console.error('Error creating support ticket:', error);
        message.error(error.response?.data?.msg || error.response?.data?.error || 'Failed to create support ticket');
        return;
      }
    }

    try {
      await axios.post('/support/tickets', values, getHeaders());
      message.success('Support ticket created successfully');
      setCreateOpen(false);
      ticketForm.resetFields();
      fetchStats();
      fetchTickets(1, pagination.pageSize);
    } catch (error) {
      console.error('Error creating support ticket:', error);
      message.error(error.response?.data?.error || 'Failed to create support ticket');
    }
  };

  const handleAddComment = async (values) => {
    if (!selectedTicket?.id) {
      return;
    }

    if (apiMode === 'legacy') {
      try {
        const userId = getCurrentUserId();
        await axios.post('/insertdata/support_ticket_comments', {
          ticket_id: selectedTicket.id,
          user_id: userId,
          comment: values.comment,
          is_internal: 0,
          attachment_url: null
        }, getHeaders());

        message.success('Comment added');
        setCommentOpen(false);
        commentForm.resetFields();
        fetchTicketDetail(selectedTicket.id);
        fetchTickets(pagination.current, pagination.pageSize);
      } catch (error) {
        console.error('Error adding ticket comment:', error);
        message.error(error.response?.data?.msg || error.response?.data?.error || 'Failed to add comment');
      }
      return;
    }

    try {
      await axios.post(`/support/tickets/${selectedTicket.id}/comments`, values, getHeaders());
      message.success('Comment added');
      setCommentOpen(false);
      commentForm.resetFields();
      fetchTicketDetail(selectedTicket.id);
      fetchTickets(pagination.current, pagination.pageSize);
    } catch (error) {
      console.error('Error adding ticket comment:', error);
      message.error(error.response?.data?.error || 'Failed to add comment');
    }
  };

  const columns = [
    {
      title: 'Ticket',
      dataIndex: 'ticket_number',
      key: 'ticket_number',
      width: 170,
      render: (value) => <strong>{value}</strong>
    },
    {
      title: 'Subject',
      dataIndex: 'subject',
      key: 'subject'
    },
    {
      title: 'Stage',
      dataIndex: 'progress_stage',
      key: 'progress_stage',
      width: 160,
      render: (value) => value || 'New'
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 150,
      render: (value) => (
        <Space direction="vertical" size={2}>
          <Tag color={getStatusColor(value)}>{value}</Tag>
          <span className="support-tickets__resolution-chip">{getResolutionState(value)}</span>
        </Space>
      )
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      width: 120,
      render: (value) => <Tag color={getPriorityColor(value)}>{value}</Tag>
    },
    {
      title: 'Created',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (value) => formatDateTime(value)
    },
    {
      title: 'Action',
      key: 'action',
      width: 100,
      render: (_, record) => (
        <Button icon={<EyeOutlined />} onClick={() => fetchTicketDetail(record.id)}>
          View
        </Button>
      )
    }
  ];

  return (
    <Layout hideSidebar={hideSidebarForCashier}>
      <Header title="Support Tickets" />

      <div className="support-tickets">
        <div className="support-tickets__hero">
          <div className="support-tickets__hero-panel">
            <div className="support-tickets__hero-topbar">
              <span className="support-tickets__eyebrow">Shop Care Console</span>
              <span className="support-tickets__live-indicator">Live ticket workspace</span>
            </div>

            <div className="support-tickets__intro">
              <div className="support-tickets__intro-copy">
                <h2>Support tracking built for fast shop follow-up</h2>
                <p>Keep open issues visible, separate resolved work cleanly, and preserve a clear conversation trail for shop {shopId || 'N/A'}.</p>
                <div className="support-tickets__hero-strip">
                  <span className="support-tickets__hero-pill">Shop #{shopId || 'N/A'}</span>
                  <span className="support-tickets__hero-pill">Unresolved first view</span>
                  <span className="support-tickets__hero-pill">SQL-backed history</span>
                </div>
              </div>
              <div className="support-tickets__hero-actions">
                <div className="support-tickets__hero-note">
                  <strong>Daily queue</strong>
                  <span>Open, review, and reply from one place.</span>
                </div>
                <div className="support-tickets__hero-buttons">
                  <Button icon={<HomeOutlined />} onClick={() => navigate(getDashboardPath())}>
                    Dashboard
                  </Button>
                  <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)} className="support-tickets__primary-btn">
                    Raise Ticket
                  </Button>
                </div>
              </div>
            </div>

            <div className="support-tickets__hero-metrics">
              <div className="support-tickets__hero-metric">
                <span className="support-tickets__hero-metric-label">Scope</span>
                <strong>Shop #{shopId || 'N/A'}</strong>
              </div>
              <div className="support-tickets__hero-metric">
                <span className="support-tickets__hero-metric-label">Default queue</span>
                <strong>Not Resolved</strong>
              </div>
              <div className="support-tickets__hero-metric">
                <span className="support-tickets__hero-metric-label">Tracking mode</span>
                <strong>Comment timeline</strong>
              </div>
            </div>
          </div>
        </div>

        <Row gutter={16} className="support-tickets__stats-row">
          <Col xs={24} md={6}>
            <Card className="support-tickets__stat-card support-tickets__stat-card--total">
              <Statistic title="Total Tickets" value={stats.total_tickets || 0} prefix={<WarningOutlined />} />
            </Card>
          </Col>
          <Col xs={24} md={6}>
            <Card className="support-tickets__stat-card support-tickets__stat-card--open">
              <Statistic title="Not Resolved" value={stats.unresolved_tickets || 0} prefix={<ClockCircleOutlined />} />
            </Card>
          </Col>
          <Col xs={24} md={6}>
            <Card className="support-tickets__stat-card support-tickets__stat-card--resolved">
              <Statistic title="Resolved" value={stats.resolved_tickets || 0} prefix={<CheckCircleOutlined />} />
            </Card>
          </Col>
          <Col xs={24} md={6}>
            <Card className="support-tickets__stat-card support-tickets__stat-card--closed">
              <Statistic title="Closed" value={stats.closed_tickets || 0} prefix={<MessageOutlined />} />
            </Card>
          </Col>
        </Row>

        <Card title="Find tickets" className="support-tickets__filter-card support-tickets__surface-card">
          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Input
                placeholder="Search subject or ticket number"
                value={filters.search}
                onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))}
              />
            </Col>
            <Col xs={24} md={5}>
              <Select
                style={{ width: '100%' }}
                placeholder="Resolution"
                value={filters.status}
                options={STATUS_FILTER_OPTIONS}
                onChange={(value) => setFilters((prev) => ({ ...prev, status: value }))}
              />
            </Col>
            <Col xs={24} md={5}>
              <Select
                style={{ width: '100%' }}
                placeholder="Category"
                allowClear
                value={filters.category || undefined}
                options={CATEGORY_OPTIONS}
                onChange={(value) => setFilters((prev) => ({ ...prev, category: value || '' }))}
              />
            </Col>
            <Col xs={24} md={3}>
              <Select
                style={{ width: '100%' }}
                placeholder="Priority"
                allowClear
                value={filters.priority || undefined}
                options={PRIORITY_OPTIONS}
                onChange={(value) => setFilters((prev) => ({ ...prev, priority: value || '' }))}
              />
            </Col>
            <Col xs={24} md={3}>
              <Space>
                <Button type="primary" onClick={() => fetchTickets(1, pagination.pageSize)}>Apply</Button>
                <Button
                  onClick={() => {
                    const resetFilters = { status: 'NOT_RESOLVED', category: '', priority: '', search: '' };
                    setFilters(resetFilters);
                    fetchTickets(1, pagination.pageSize, resetFilters);
                  }}
                >
                  Reset
                </Button>
              </Space>
            </Col>
          </Row>
        </Card>

        <Card title="Tickets" className="support-tickets__surface-card">
          <Table
            rowKey="id"
            loading={loading}
            dataSource={tickets}
            columns={columns}
            locale={{ emptyText: <Empty description="No support tickets found" /> }}
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: pagination.total,
              showSizeChanger: true
            }}
            onChange={(pageInfo) => fetchTickets(pageInfo.current, pageInfo.pageSize)}
            scroll={{ x: 980 }}
          />
        </Card>
      </div>

      <Modal
        title="Raise a support ticket"
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        footer={null}
      >
        <Form form={ticketForm} layout="vertical" onFinish={handleCreateTicket} initialValues={{ priority: 'MEDIUM' }}>
          <Form.Item name="category" label="Category" rules={[{ required: true, message: 'Please select a category' }]}>
            <Select options={CATEGORY_OPTIONS} />
          </Form.Item>
          <Form.Item name="subject" label="Subject" rules={[{ required: true, message: 'Please enter the ticket subject' }]}>
            <Input placeholder="Short summary of the issue" />
          </Form.Item>
          <Form.Item name="description" label="Description" rules={[{ required: true, message: 'Please describe the issue' }]}>
            <Input.TextArea rows={5} placeholder="What happened, what you expected, and any business impact" />
          </Form.Item>
          <Form.Item name="priority" label="Priority" rules={[{ required: true, message: 'Please select a priority' }]}>
            <Select options={PRIORITY_OPTIONS} />
          </Form.Item>
          <Space>
            <Button type="primary" htmlType="submit">Submit Ticket</Button>
            <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
          </Space>
        </Form>
      </Modal>

      <Drawer
        title={selectedTicket ? `${selectedTicket.ticket_number} · ${selectedTicket.subject}` : 'Ticket detail'}
        width={720}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
      >
        {selectedTicket && (
          <div className="support-tickets__detail">
            <Card title="Overview" size="small">
              <Row gutter={16}>
                <Col span={12}>
                  <div className="support-tickets__detail-item">
                    <label>Status</label>
                    <div>
                      <Tag color={getStatusColor(selectedTicket.status)}>{selectedTicket.status}</Tag>
                      <span className="support-tickets__resolution-chip">{getResolutionState(selectedTicket.status)}</span>
                    </div>
                  </div>
                </Col>
                <Col span={12}>
                  <div className="support-tickets__detail-item">
                    <label>Stage</label>
                    <p>{selectedTicket.progress_stage || 'New'}</p>
                  </div>
                </Col>
                <Col span={12}>
                  <div className="support-tickets__detail-item">
                    <label>Created</label>
                    <p>{formatDateTime(selectedTicket.created_at)}</p>
                  </div>
                </Col>
                <Col span={12}>
                  <div className="support-tickets__detail-item">
                    <label>Stage Updated</label>
                    <p>{formatDateTime(selectedTicket.stage_updated_at)}</p>
                  </div>
                </Col>
                <Col span={12}>
                  <div className="support-tickets__detail-item">
                    <label>Resolved At</label>
                    <p>{formatDateTime(selectedTicket.resolved_at)}</p>
                  </div>
                </Col>
                <Col span={12}>
                  <div className="support-tickets__detail-item">
                    <label>Closed At</label>
                    <p>{formatDateTime(selectedTicket.closed_at)}</p>
                  </div>
                </Col>
              </Row>
              <div className="support-tickets__detail-item">
                <label>Description</label>
                <p>{selectedTicket.description}</p>
              </div>
              {selectedTicket.resolution ? (
                <div className="support-tickets__detail-item">
                  <label>Resolution</label>
                  <p>{selectedTicket.resolution}</p>
                </div>
              ) : null}
            </Card>

            <Card
              title="Conversation"
              size="small"
              extra={<Button icon={<PlusOutlined />} onClick={() => setCommentOpen(true)}>Add Comment</Button>}
            >
              {comments.length > 0 ? (
                <Timeline
                  items={comments.map((comment) => ({
                    children: (
                      <div>
                        <strong>{comment.user_name || 'User'}</strong>
                        <div className="support-tickets__comment-time">{formatDateTime(comment.created_at)}</div>
                        <p className="support-tickets__comment-body">{comment.comment}</p>
                      </div>
                    )
                  }))}
                />
              ) : (
                <Empty description="No conversation yet" />
              )}
            </Card>
          </div>
        )}
      </Drawer>

      <Modal
        title="Add comment"
        open={commentOpen}
        onCancel={() => setCommentOpen(false)}
        footer={null}
      >
        <Form form={commentForm} layout="vertical" onFinish={handleAddComment}>
          <Form.Item name="comment" label="Comment" rules={[{ required: true, message: 'Please enter a comment' }]}>
            <Input.TextArea rows={4} placeholder="Share extra detail or reply to support" />
          </Form.Item>
          <Space>
            <Button type="primary" htmlType="submit">Post Comment</Button>
            <Button onClick={() => setCommentOpen(false)}>Cancel</Button>
          </Space>
        </Form>
      </Modal>
    </Layout>
  );
}