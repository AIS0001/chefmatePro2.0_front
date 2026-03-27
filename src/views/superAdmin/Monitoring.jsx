/**
 * ERROR LOG MONITORING PAGE
 * Display and manage all system error logs across shops
 * Includes both database logs and file-based logs
 */

import React, { useState, useEffect } from 'react';
import {
  Table,
  Card,
  Space,
  Button,
  Tag,
  Modal,
  Form,
  Select,
  Input,
  Drawer,
  Row,
  Col,
  Statistic,
  DatePicker,
  Empty,
  Spin,
  message,
  Tooltip,
  Badge,
  Tabs
} from 'antd';
import {
  SearchOutlined,
  ReloadOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  EyeOutlined,
  FileTextOutlined,
  DeleteOutlined,
  WarningOutlined
} from '@ant-design/icons';
import axios from 'axios';
import { getAuthToken } from '../../utility/auth';
import './Monitoring.css';

const Monitoring = () => {
  const [errorLogs, setErrorLogs] = useState([]);
  const [fileLogs, setFileLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fileLogsLoading, setFileLogsLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });
  const [fileLogsPagination, setFileLogsPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [detailDrawer, setDetailDrawer] = useState(false);
  const [selectedError, setSelectedError] = useState(null);
  const [fileLogDrawer, setFileLogDrawer] = useState(false);
  const [selectedFileLog, setSelectedFileLog] = useState(null);
  const [updateModalVisible, setUpdateModalVisible] = useState(false);
  const [dashboardStats, setDashboardStats] = useState({
    total_errors: 0,
    open_errors: 0,
    critical_errors: 0,
    high_errors: 0
  });
  const [fileLogStats, setFileLogStats] = useState({
    total_files: 0,
    total_size_mb: 0,
    oldest_log: null,
    newest_log: null
  });
  const [filters, setFilters] = useState({
    shop_id: '',
    error_type: '',
    severity: '',
    status: 'OPEN',
    search: ''
  });
  const [fileLogFilters, setFileLogFilters] = useState({
    shop_id: '',
    date_from: '',
    date_to: '',
    search_term: ''
  });
  const [form] = Form.useForm();

  useEffect(() => {
    fetchErrorLogs();
    fetchStats();
    fetchFileLogStats();
  }, []);

  const fetchErrorLogs = async (page = 1) => {
    try {
      setLoading(true);
      const token = getAuthToken();

      const params = {
        page,
        limit: pagination.pageSize,
        ...filters
      };

      const response = await axios.get('/super-admin/error-logs', {
        headers: { Authorization: `Bearer ${token}` },
        params
      });

      if (response.data.success) {
        setErrorLogs(response.data.data);
        setPagination(prev => ({
          ...prev,
          current: page,
          total: response.data.pagination.total
        }));
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
      message.error('Failed to load error logs');
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
        setDashboardStats(response.data.data.errors);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchFileLogs = async (page = 1) => {
    try {
      setFileLogsLoading(true);
      const token = getAuthToken();

      const params = {
        page,
        limit: fileLogsPagination.pageSize,
        ...fileLogFilters
      };

      const response = await axios.get('/super-admin/file-error-logs', {
        headers: { Authorization: `Bearer ${token}` },
        params
      });

      if (response.data.success) {
        setFileLogs(response.data.data);
        setFileLogsPagination(prev => ({
          ...prev,
          current: page,
          total: response.data.pagination.total
        }));
      }
    } catch (error) {
      console.error('Error fetching file logs:', error);
      message.error('Failed to load file logs');
    } finally {
      setFileLogsLoading(false);
    }
  };

  const fetchFileLogStats = async () => {
    try {
      const token = getAuthToken();
      const response = await axios.get('/super-admin/file-log-stats', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setFileLogStats(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching file log stats:', error);
    }
  };

  const searchFileLogs = async () => {
    try {
      setFileLogsLoading(true);
      const token = getAuthToken();

      const response = await axios.get('/super-admin/file-error-logs/search', {
        headers: { Authorization: `Bearer ${token}` },
        params: fileLogFilters
      });

      if (response.data.success) {
        setFileLogs(response.data.data);
        setFileLogsPagination(prev => ({
          ...prev,
          current: 1,
          total: response.data.totalResults || response.data.data.length
        }));
      }
    } catch (error) {
      console.error('Error searching file logs:', error);
      message.error('Failed to search file logs');
    } finally {
      setFileLogsLoading(false);
    }
  };

  const getSeverityColor = (severity) => {
    const colors = {
      CRITICAL: 'red',
      HIGH: 'orange',
      MEDIUM: 'blue',
      LOW: 'green'
    };
    return colors[severity] || 'default';
  };

  const getStatusColor = (status) => {
    const colors = {
      OPEN: 'volcano',
      ACKNOWLEDGED: 'orange',
      RESOLVED: 'green',
      IGNORED: 'gray'
    };
    return colors[status] || 'default';
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleSearch = () => {
    setPagination(prev => ({ ...prev, current: 1 }));
    fetchErrorLogs(1);
    fetchStats();
  };

  const handleReset = () => {
    setFilters({
      shop_id: '',
      error_type: '',
      severity: '',
      status: 'OPEN',
      search: ''
    });
  };

  const handleFileLogFilterChange = (key, value) => {
    setFileLogFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleFileLogSearch = () => {
    if (fileLogFilters.search_term) {
      searchFileLogs();
    } else {
      setFileLogsPagination(prev => ({ ...prev, current: 1 }));
      fetchFileLogs(1);
    }
  };

  const handleFileLogReset = () => {
    setFileLogFilters({
      shop_id: '',
      date_from: '',
      date_to: '',
      search_term: ''
    });
  };

  const handleViewDetail = (record) => {
    setSelectedError(record);
    setDetailDrawer(true);
  };

  const handleStatusUpdate = async (values) => {
    try {
      const token = getAuthToken();
      await axios.put(`/super-admin/error-logs/${selectedError.id}`, values, {
        headers: { Authorization: `Bearer ${token}` }
      });
      message.success('Error log updated successfully');
      setUpdateModalVisible(false);
      fetchErrorLogs(pagination.current);
      setDetailDrawer(false);
    } catch (error) {
      console.error('Error updating log:', error);
      message.error('Failed to update error log');
    }
  };

  const handleClearAllLogs = () => {
    Modal.confirm({
      title: 'Clear All Logs?',
      icon: <ExclamationCircleOutlined />,
      content: 'This will permanently delete all error logs from database and files. This action cannot be undone.',
      okText: 'Clear Logs',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          const token = getAuthToken();
          const response = await axios.delete('/super-admin/logs/clear', {
            headers: { Authorization: `Bearer ${token}` }
          });

          if (response.data.success) {
            message.success(`Logs cleared. DB: ${response.data.databaseDeletedCount}, Files: ${response.data.fileDeletedCount}`);
          } else {
            message.warning('Logs clear completed with warnings');
          }

          setErrorLogs([]);
          setFileLogs([]);
          setSelectedError(null);
          setSelectedFileLog(null);
          fetchErrorLogs(1);
          fetchStats();
          fetchFileLogStats();
        } catch (error) {
          console.error('Error clearing logs:', error);
          message.error(error.response?.data?.error || 'Failed to clear logs');
        }
      }
    });
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60,
      render: id => <span style={{ fontWeight: 'bold' }}>#{id}</span>
    },
    {
      title: 'Shop ID',
      dataIndex: 'shop_id',
      key: 'shop_id',
      width: 80,
      render: shop_id => <Tag>{shop_id}</Tag>
    },
    {
      title: 'Error Type',
      dataIndex: 'error_type',
      key: 'error_type',
      width: 120,
      render: type => <Tag color="blue">{type}</Tag>
    },
    {
      title: 'Severity',
      dataIndex: 'severity',
      key: 'severity',
      width: 100,
      render: severity => <Tag color={getSeverityColor(severity)}>{severity}</Tag>
    },
    {
      title: 'Message',
      dataIndex: 'error_message',
      key: 'error_message',
      width: 300,
      render: msg => (
        <Tooltip title={msg}>
          {msg.length > 50 ? msg.substring(0, 50) + '...' : msg}
        </Tooltip>
      )
    },
    {
      title: 'Module',
      dataIndex: 'module',
      key: 'module',
      width: 120,
      render: module => module ? <span>{module}</span> : <span style={{ color: '#ccc' }}>-</span>
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: status => <Tag color={getStatusColor(status)}>{status}</Tag>
    },
    {
      title: 'Date',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 150,
      render: date => new Date(date).toLocaleString()
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            icon={<EyeOutlined />}
            size="small"
            onClick={() => handleViewDetail(record)}
          />
        </Space>
      )
    }
  ];

  return (
    <div className="monitoring-container">
      {/* Dashboard Stats */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Errors (DB)"
              value={dashboardStats.total_errors}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card style={{ background: '#fff1f0' }}>
            <Statistic
              title="Open Errors"
              value={dashboardStats.open_errors}
              valueStyle={{ color: '#cf1322' }}
              prefix={<ExclamationCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card style={{ background: '#fef3c7' }}>
            <Statistic
              title="File Logs"
              value={fileLogStats.total_files || 0}
              valueStyle={{ color: '#ea580c' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card style={{ background: '#dbeafe' }}>
            <Statistic
              title="File Size"
              value={fileLogStats.total_size_mb || 0}
              suffix="MB"
              valueStyle={{ color: '#0284c7' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Main Tabs - Database Logs vs File Logs */}
      <Card>
        <Tabs
          defaultActiveKey="database"
          items={[
            {
              key: 'database',
              label: 'Database Logs',
              children: (
                <>
                  {/* Database Filters Card */}
                  <Card style={{ marginBottom: '24px' }} title="Search & Filter">
                    <Form layout="vertical">
                      <Row gutter={16}>
                        <Col xs={24} sm={12} md={6}>
                          <Form.Item label="Search">
                            <Input
                              placeholder="Search by message or module..."
                              value={filters.search}
                              onChange={e => handleFilterChange('search', e.target.value)}
                            />
                          </Form.Item>
                        </Col>
                        <Col xs={24} sm={12} md={6}>
                          <Form.Item label="Error Type">
                            <Select
                              placeholder="Select error type"
                              value={filters.error_type}
                              onChange={value => handleFilterChange('error_type', value)}
                              allowClear
                              options={[
                                { label: 'DATABASE', value: 'DATABASE' },
                                { label: 'API', value: 'API' },
                                { label: 'VALIDATION', value: 'VALIDATION' },
                                { label: 'PAYMENT', value: 'PAYMENT' },
                                { label: 'PRINTER', value: 'PRINTER' },
                                { label: 'AUTHENTICATION', value: 'AUTHENTICATION' },
                                { label: 'OTHER', value: 'OTHER' }
                              ]}
                            />
                          </Form.Item>
                        </Col>
                        <Col xs={24} sm={12} md={6}>
                          <Form.Item label="Severity">
                            <Select
                              placeholder="Select severity"
                              value={filters.severity}
                              onChange={value => handleFilterChange('severity', value)}
                              allowClear
                              options={[
                                { label: 'CRITICAL', value: 'CRITICAL' },
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
                                { label: 'ACKNOWLEDGED', value: 'ACKNOWLEDGED' },
                                { label: 'RESOLVED', value: 'RESOLVED' },
                                { label: 'IGNORED', value: 'IGNORED' }
                              ]}
                            />
                          </Form.Item>
                        </Col>
                      </Row>
                      <Row justify="end" gutter={8}>
                        <Col>
                          <Button danger icon={<WarningOutlined />} onClick={handleClearAllLogs}>
                            Clear All Logs
                          </Button>
                        </Col>
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
                      </Row>
                    </Form>
                  </Card>

                  {/* Error Logs Table */}
                  <Card title="Error Logs">
                    <Spin spinning={loading}>
                      <Table
                        columns={columns}
                        dataSource={errorLogs}
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
                          fetchErrorLogs(pag.current);
                        }}
                        scroll={{ x: 1200 }}
                      />
                    </Spin>
                  </Card>
                </>
              )
            },
            {
              key: 'files',
              label: 'File Logs',
              children: (
                <>
                  {/* File Logs Filters Card */}
                  <Card style={{ marginBottom: '24px' }} title="File Logs Search">
                    <Form layout="vertical">
                      <Row gutter={16}>
                        <Col xs={24} sm={12} md={8}>
                          <Form.Item label="Shop ID">
                            <Input
                              placeholder="Enter shop ID..."
                              value={fileLogFilters.shop_id}
                              onChange={e => handleFileLogFilterChange('shop_id', e.target.value)}
                            />
                          </Form.Item>
                        </Col>
                        <Col xs={24} sm={12} md={8}>
                          <Form.Item label="Search Term">
                            <Input
                              placeholder="Search in logs..."
                              value={fileLogFilters.search_term}
                              onChange={e => handleFileLogFilterChange('search_term', e.target.value)}
                            />
                          </Form.Item>
                        </Col>
                        <Col xs={24} sm={12} md={8}>
                          <Form.Item label="From Date">
                            <DatePicker
                              value={fileLogFilters.date_from ? new Date(fileLogFilters.date_from) : null}
                              onChange={(date) => handleFileLogFilterChange('date_from', date ? date.toISOString() : '')}
                              style={{ width: '100%' }}
                            />
                          </Form.Item>
                        </Col>
                      </Row>
                      <Row gutter={16}>
                        <Col xs={24} sm={12} md={8}>
                          <Form.Item label="To Date">
                            <DatePicker
                              value={fileLogFilters.date_to ? new Date(fileLogFilters.date_to) : null}
                              onChange={(date) => handleFileLogFilterChange('date_to', date ? date.toISOString() : '')}
                              style={{ width: '100%' }}
                            />
                          </Form.Item>
                        </Col>
                      </Row>
                      <Row justify="end" gutter={8}>
                        <Col>
                          <Button danger icon={<WarningOutlined />} onClick={handleClearAllLogs}>
                            Clear All Logs
                          </Button>
                        </Col>
                        <Col>
                          <Button onClick={handleFileLogSearch} type="primary" icon={<SearchOutlined />}>
                            Search
                          </Button>
                        </Col>
                        <Col>
                          <Button onClick={handleFileLogReset} icon={<ReloadOutlined />}>
                            Reset
                          </Button>
                        </Col>
                      </Row>
                    </Form>
                  </Card>

                  {/* File Logs List */}
                  <Card title="Error Log Files">
                    <Spin spinning={fileLogsLoading}>
                      {fileLogs.length === 0 ? (
                        <Empty description="No log files found" />
                      ) : (
                        <div>
                          {fileLogs.map((log, idx) => (
                            <Card
                              key={idx}
                              style={{ marginBottom: '16px', cursor: 'pointer' }}
                              onClick={() => {
                                setSelectedFileLog(log);
                                setFileLogDrawer(true);
                              }}
                            >
                              <Row justify="space-between">
                                <Col>
                                  <Space direction="vertical">
                                    <p style={{ margin: 0, fontWeight: 'bold' }}>
                                      📄 {log.filepath.split('/').slice(-1)[0]}
                                    </p>
                                    <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>
                                      Date: {new Date(log.date).toLocaleString()}
                                    </p>
                                    <p style={{ margin: 0, fontSize: '12px', color: '#999' }}>
                                      Size: {(log.size / 1024).toFixed(2)} KB
                                    </p>
                                  </Space>
                                </Col>
                                <Col>
                                  <Button type="primary" size="small" icon={<EyeOutlined />}>
                                    View Details
                                  </Button>
                                </Col>
                              </Row>
                            </Card>
                          ))}
                          <Row justify="center" style={{ marginTop: '24px' }}>
                            <Button
                              onClick={() => {
                                setFileLogsPagination(prev => ({
                                  ...prev,
                                  current: prev.current + 1
                                }));
                                fetchFileLogs(fileLogsPagination.current + 1);
                              }}
                              disabled={fileLogsPagination.current * fileLogsPagination.pageSize >= fileLogsPagination.total}
                              loading={fileLogsLoading}
                            >
                              Load More
                            </Button>
                          </Row>
                        </div>
                      )}
                    </Spin>
                  </Card>
                </>
              )
            }
          ]}
        />
      </Card>

      {/* Detail Drawer - DB Logs */}
      <Drawer
        title="Error Details"
        placement="right"
        onClose={() => setDetailDrawer(false)}
        open={detailDrawer}
        width={600}
      >
        {selectedError && (
          <div>
            <Row gutter={16} style={{ marginBottom: '16px' }}>
              <Col span={12}>
                <div className="detail-item">
                  <label>Error ID:</label>
                  <p>#{selectedError.id}</p>
                </div>
              </Col>
              <Col span={12}>
                <div className="detail-item">
                  <label>Shop ID:</label>
                  <Tag>{selectedError.shop_id}</Tag>
                </div>
              </Col>
            </Row>

            <Row gutter={16} style={{ marginBottom: '16px' }}>
              <Col span={12}>
                <div className="detail-item">
                  <label>Error Type:</label>
                  <Tag color="blue">{selectedError.error_type}</Tag>
                </div>
              </Col>
              <Col span={12}>
                <div className="detail-item">
                  <label>Severity:</label>
                  <Tag color={getSeverityColor(selectedError.severity)}>
                    {selectedError.severity}
                  </Tag>
                </div>
              </Col>
            </Row>

            <Row gutter={16} style={{ marginBottom: '16px' }}>
              <Col span={12}>
                <div className="detail-item">
                  <label>Status:</label>
                  <Tag color={getStatusColor(selectedError.status)}>
                    {selectedError.status}
                  </Tag>
                </div>
              </Col>
              <Col span={12}>
                <div className="detail-item">
                  <label>Date:</label>
                  <p>{new Date(selectedError.created_at).toLocaleString()}</p>
                </div>
              </Col>
            </Row>

            {selectedError.module && (
              <div className="detail-item" style={{ marginBottom: '16px' }}>
                <label>Module:</label>
                <p>{selectedError.module}</p>
              </div>
            )}

            {selectedError.route && (
              <div className="detail-item" style={{ marginBottom: '16px' }}>
                <label>Route:</label>
                <p><code>{selectedError.method} {selectedError.route}</code></p>
              </div>
            )}

            <div className="detail-item" style={{ marginBottom: '16px' }}>
              <label>Error Message:</label>
              <p style={{ background: '#fff1f0', padding: '12px', borderRadius: '4px' }}>
                {selectedError.error_message}
              </p>
            </div>

            {selectedError.error_stack && (
              <div className="detail-item" style={{ marginBottom: '16px' }}>
                <label>Stack Trace:</label>
                <pre style={{ background: '#f5f5f5', padding: '12px', borderRadius: '4px', overflow: 'auto' }}>
                  {selectedError.error_stack}
                </pre>
              </div>
            )}

            {selectedError.notes && (
              <div className="detail-item" style={{ marginBottom: '16px' }}>
                <label>Notes:</label>
                <p>{selectedError.notes}</p>
              </div>
            )}

            {selectedError.ip_address && (
              <div className="detail-item" style={{ marginBottom: '16px' }}>
                <label>IP Address:</label>
                <p><code>{selectedError.ip_address}</code></p>
              </div>
            )}

            <Space style={{ marginTop: '24px' }}>
              <Button
                type="primary"
                onClick={() => setUpdateModalVisible(true)}
              >
                Update Status
              </Button>
              <Button onClick={() => setDetailDrawer(false)}>
                Close
              </Button>
            </Space>
          </div>
        )}
      </Drawer>

      {/* File Log Drawer */}
      <Drawer
        title="File Log Contents"
        placement="right"
        onClose={() => setFileLogDrawer(false)}
        open={fileLogDrawer}
        width={700}
      >
        {selectedFileLog && (
          <div>
            <div className="detail-item" style={{ marginBottom: '16px' }}>
              <label>Filepath:</label>
              <p><code>{selectedFileLog.filepath}</code></p>
            </div>

            <div className="detail-item" style={{ marginBottom: '16px' }}>
              <label>Date:</label>
              <p>{new Date(selectedFileLog.date).toLocaleString()}</p>
            </div>

            <div className="detail-item" style={{ marginBottom: '16px' }}>
              <label>File Size:</label>
              <p>{(selectedFileLog.size / 1024).toFixed(2)} KB</p>
            </div>

            <div className="detail-item" style={{ marginBottom: '16px' }}>
              <label>Log Contents:</label>
              <pre
                style={{
                  background: '#f5f5f5',
                  padding: '12px',
                  borderRadius: '4px',
                  overflow: 'auto',
                  maxHeight: '500px',
                  fontSize: '12px',
                  fontFamily: 'monospace'
                }}
              >
                {selectedFileLog.content}
              </pre>
            </div>

            <Button onClick={() => setFileLogDrawer(false)}>
              Close
            </Button>
          </div>
        )}
      </Drawer>

      {/* Update Status Modal */}
      <Modal
        title="Update Error Log Status"
        open={updateModalVisible}
        onCancel={() => setUpdateModalVisible(false)}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleStatusUpdate}
          initialValues={{ status: selectedError?.status }}
        >
          <Form.Item
            name="status"
            label="Status"
            rules={[{ required: true, message: 'Please select a status' }]}
          >
            <Select
              options={[
                { label: 'OPEN', value: 'OPEN' },
                { label: 'ACKNOWLEDGED', value: 'ACKNOWLEDGED' },
                { label: 'RESOLVED', value: 'RESOLVED' },
                { label: 'IGNORED', value: 'IGNORED' }
              ]}
            />
          </Form.Item>

          <Form.Item
            name="notes"
            label="Notes"
            rules={[{ required: false }]}
          >
            <Input.TextArea placeholder="Add internal notes..." rows={4} />
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
    </div>
  );
};

export default Monitoring;
