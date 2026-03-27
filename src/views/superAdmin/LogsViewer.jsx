import React, { useEffect, useState } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Input,
  Select,
  Spin,
  Empty,
  Pagination,
  Drawer,
  Row,
  Col,
  Statistic,
  Timeline,
  Badge,
  message,
  Modal,
  Tooltip,
  Descriptions
} from 'antd';
import {
  DownloadOutlined,
  DeleteOutlined,
  EyeOutlined,
  ReloadOutlined,
  FilterOutlined
} from '@ant-design/icons';
import axios from 'axios';
import { format } from 'date-fns';
import { getAuthToken } from '../../utility/auth';

export default function LogsViewer() {
  const [logs, setLogs] = useState([]);
  const [selectedLog, setSelectedLog] = useState(null);
  const [loading, setLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 15, total: 0 });
  const [logStats, setLogStats] = useState({ total_files: 0, total_size_mb: 0 });
  const [filters, setFilters] = useState({
    statusCode: undefined,
    method: undefined,
    searchText: ''
  });
  const [sortBy, setSortBy] = useState('timestamp');
  const [sortOrder, setSortOrder] = useState('desc');
  const [expandedGroups, setExpandedGroups] = useState([]);

  // Fetch error logs with pagination
  const fetchLogs = async (page = 1) => {
    try {
      setLoading(true);
      const token = getAuthToken();
      const response = await axios.get('/super-admin/file-error-logs', {
        headers: { Authorization: `Bearer ${token}` },
        params: { page, limit: pagination.pageSize }
      });
      if (response.data.success) {
        setLogs(response.data.data || []);
        setPagination(prev => ({
          ...prev,
          total: response.data.pagination?.total || 0,
          current: page
        }));
      }
    } catch (error) {
      message.error('Failed to fetch logs');
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch log statistics
  const fetchLogStats = async () => {
    try {
      const token = getAuthToken();
      const response = await axios.get('/super-admin/file-log-stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setLogStats(response.data.data || {});
      }
    } catch (error) {
      console.error('Error fetching log stats:', error);
    }
  };

  // Clear all logs
  const handleClearAllLogs = () => {
    Modal.confirm({
      title: 'Clear All Logs',
      content: 'Are you sure you want to clear all error logs? This action cannot be undone and will delete both database and file-based logs.',
      okText: 'Yes, Clear All',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          const token = getAuthToken();
          const response = await axios.delete('/super-admin/logs/clear', {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (response.data.success) {
            message.success('All logs have been cleared successfully');
            setLogs([]);
            setPagination(prev => ({ ...prev, total: 0 }));
            fetchLogs();
          }
        } catch (error) {
          message.error('Failed to clear logs');
          console.error('Error clearing logs:', error);
        }
      }
    });
  };

  // Filter logs
  const getFilteredLogs = () => {
    let filtered = [...logs];

    if (filters.statusCode) {
      filtered = filtered.filter(log => log.statusCode === parseInt(filters.statusCode));
    }
    if (filters.method) {
      filtered = filtered.filter(log => log.method === filters.method);
    }
    if (filters.searchText) {
      filtered = filtered.filter(log =>
        (log.endpoint && log.endpoint.toLowerCase().includes(filters.searchText.toLowerCase())) ||
        (log.error && log.error.toLowerCase().includes(filters.searchText.toLowerCase()))
      );
    }

    return filtered;
  };

  // Group logs by file and date
  const groupLogsByFileAndDate = () => {
    const filtered = getFilteredLogs();
    const grouped = {};

    filtered.forEach((log, index) => {
      const logDate = log.timestamp ? format(new Date(log.timestamp), 'yyyy-MM-dd') : 'Unknown Date';
      const logFile = log.file || 'unknown.log';
      const groupKey = `${logFile}_${logDate}`;

      if (!grouped[groupKey]) {
        grouped[groupKey] = {
          key: groupKey,
          file: logFile,
          date: logDate,
          logs: [],
          count: 0,
          errorCount: 0,
          warningCount: 0
        };
      }

      grouped[groupKey].logs.push({ ...log, _index: index });
      grouped[groupKey].count++;
      if (log.statusCode >= 400) {
        grouped[groupKey].errorCount++;
      }
    });

    return Object.values(grouped).sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  const statusCodes = [...new Set(logs.map(log => log.statusCode))].sort((a, b) => a - b);
  const methods = [...new Set(logs.map(log => log.method))].sort();
  const groupedLogs = groupLogsByFileAndDate();

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  // Get status code color
  const getStatusCodeColor = (code) => {
    if (code >= 200 && code < 300) return 'green';
    if (code >= 300 && code < 400) return 'blue';
    if (code >= 400 && code < 500) return 'orange';
    if (code >= 500) return 'red';
    return 'default';
  };

  // Get method color
  const getMethodColor = (method) => {
    const colors = {
      'GET': 'blue',
      'POST': 'green',
      'PUT': 'orange',
      'DELETE': 'red',
      'PATCH': 'purple'
    };
    return colors[method] || 'default';
  };

  // Log table columns
  const logColumns = [
    {
      title: 'Time',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 170,
      render: (text) => text ? format(new Date(text), 'MMM dd HH:mm:ss') : '-',
      sorter: (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
    },
    {
      title: 'Method',
      dataIndex: 'method',
      key: 'method',
      width: 80,
      render: (text) => <Tag color={getMethodColor(text)}>{text}</Tag>
    },
    {
      title: 'Status',
      dataIndex: 'statusCode',
      key: 'statusCode',
      width: 80,
      render: (text) => <Tag color={getStatusCodeColor(text)}>{text}</Tag>
    },
    {
      title: 'Endpoint',
      dataIndex: 'endpoint',
      key: 'endpoint',
      render: (text) => <Tooltip title={text}><code style={{ fontSize: '11px', maxWidth: '300px' }}>{text ? (text.length > 50 ? text.substring(0, 50) + '...' : text) : '-'}</code></Tooltip>,
      ellipsis: true
    },
    {
      title: 'Error',
      dataIndex: 'error',
      key: 'error',
      render: (text) => (
        <Tooltip title={text}>
          <span style={{ color: text ? '#ff4d4f' : '#999' }}>
            {text ? (text.length > 40 ? text.substring(0, 40) + '...' : text) : 'N/A'}
          </span>
        </Tooltip>
      ),
      ellipsis: true
    },
    {
      title: 'Shop',
      dataIndex: 'shopId',
      key: 'shopId',
      width: 60,
      render: (text) => text || '-'
    },
    {
      title: 'MS',
      dataIndex: 'responseTime',
      key: 'responseTime',
      width: 60,
      align: 'center',
      render: (text) => text ? <Tag>{text}ms</Tag> : '-'
    }
  ];

  // Group columns
  const groupColumns = [
    {
      title: 'File',
      dataIndex: 'file',
      key: 'file',
      width: 250,
      render: (text) => <code style={{ fontSize: '12px', color: '#1890ff' }}>{text}</code>
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      width: 130,
      render: (text) => format(new Date(text), 'MMM dd, yyyy')
    },
    {
      title: 'Total Logs',
      dataIndex: 'count',
      key: 'count',
      width: 100,
      render: (count) => <Tag color="blue">{count} logs</Tag>
    },
    {
      title: 'Errors',
      dataIndex: 'errorCount',
      key: 'errorCount',
      width: 80,
      render: (count) => count > 0 ? <Tag color="red">{count} errors</Tag> : <Tag>0</Tag>
    }
  ];

  // Log content columns
  const contentColumns = [
    {
      title: 'Line',
      dataIndex: 'lineNumber',
      key: 'lineNumber',
      width: 60,
      render: (text) => <code>{text}</code>
    },
    {
      title: 'Time',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 200,
      render: (text) => text ? format(new Date(text), 'yyyy-MM-dd HH:mm:ss') : '-'
    },
    {
      title: 'Method',
      dataIndex: 'method',
      key: 'method',
      width: 80,
      render: (text) => text ? <Tag color={getMethodColor(text)}>{text}</Tag> : '-'
    },
    {
      title: 'Status',
      dataIndex: 'statusCode',
      key: 'statusCode',
      width: 80,
      render: (text) => text ? <Tag color={getStatusCodeColor(text)}>{text}</Tag> : '-'
    },
    {
      title: 'Endpoint',
      dataIndex: 'endpoint',
      key: 'endpoint',
      width: 300,
      render: (text) => <code style={{ fontSize: '11px' }}>{text || '-'}</code>,
      ellipsis: true
    },
    {
      title: 'Error',
      dataIndex: 'error',
      key: 'error',
      width: 250,
      render: (text) => text ? <span style={{ color: '#ff4d4f' }}>{text}</span> : '-',
      ellipsis: true
    },
    {
      title: 'Response Time',
      dataIndex: 'responseTime',
      key: 'responseTime',
      width: 120,
      render: (text) => text ? <span>{text}ms</span> : '-'
    },
    {
      title: 'Shop ID',
      dataIndex: 'shopId',
      key: 'shopId',
      width: 80,
      render: (text) => text ? <Badge count={text} style={{ backgroundColor: '#52c41a' }} /> : '-'
    }
  ];

  useEffect(() => {
    fetchLogs(1);
    fetchLogStats();
  }, []);

  return (
    <div className="logs-viewer-container" style={{ padding: '24px' }}>
      {/* Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Log Files"
              value={logStats.total_files || 0}
              prefix="📄"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Log Entries"
              value={pagination.total}
              prefix="📝"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Size"
              value={logStats.total_size_mb ? `${logStats.total_size_mb} MB` : '0 MB'}
              prefix="💾"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Button
              type='primary'
              icon={<ReloadOutlined />}
              onClick={() => { fetchLogs(1); fetchLogStats(); }}
              block
              loading={loading}
            >
              Refresh
            </Button>
          </Card>
        </Col>
      </Row>

      {/* Error Logs Table */}
      <Card
        title="Error Logs"
        style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }}
        extra={
          <Button
            danger
            size='small'
            icon={<DeleteOutlined />}
            onClick={handleClearAllLogs}
          >
            Clear All Logs
          </Button>
        }
      >
        <Spin spinning={loading}>
          <Table
            columns={groupColumns}
            dataSource={groupedLogs}
            rowKey="key"
            loading={loading}
            size="small"
            scroll={{ x: 1200 }}
            pagination={false}
            expandable={{
              expandedRowRender: (record) => (
                <Table
                  columns={logColumns}
                  dataSource={record.logs}
                  rowKey="_index"
                  pagination={false}
                  size="small"
                  scroll={{ x: 1000 }}
                  onRow={(log) => ({
                    onClick: () => {
                      setSelectedLog(log);
                      setDrawerOpen(true);
                    },
                    cursor: 'pointer',
                    style: { cursor: 'pointer' }
                  })}
                />
              ),
              expandedRowKeys: expandedGroups,
              onExpandedRowsChange: setExpandedGroups,
              expandIcon: ({ expanded, onExpand, record }) => (
                <Button
                  type="text"
                  size="small"
                  onClick={(e) => onExpand(record, e)}
                  style={{ marginRight: '8px' }}
                >
                  {expanded ? '▼' : '▶'}
                </Button>
              )
            }}
          />
        </Spin>
      </Card>

      {/* Drawer for detailed log view */}
      <Drawer
        title={`📋 Log Details`}
        placement="right"
        onClose={() => setDrawerOpen(false)}
        open={drawerOpen}
        width={600}
      >
        {selectedLog && (
          <div>
            <Descriptions column={1} bordered>
              <Descriptions.Item label="Timestamp">
                {selectedLog.timestamp || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Method">
                <Tag color={getMethodColor(selectedLog.method)}>
                  {selectedLog.method || '-'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Endpoint">
                <code style={{ fontSize: '12px', color: '#1890ff' }}>
                  {selectedLog.endpoint || '-'}
                </code>
              </Descriptions.Item>
              <Descriptions.Item label="Status Code">
                <Tag color={getStatusCodeColor(selectedLog.statusCode)}>
                  {selectedLog.statusCode || '-'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Response Time">
                {selectedLog.responseTime ? `${selectedLog.responseTime}ms` : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Shop ID">
                <Badge count={selectedLog.shopId} style={{ backgroundColor: '#52c41a' }} />
              </Descriptions.Item>
              <Descriptions.Item label="Error Message">
                <div style={{
                  backgroundColor: '#fff7f6',
                  border: '1px solid #ffccc7',
                  borderRadius: '4px',
                  padding: '12px',
                  color: '#ff4d4f',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  fontSize: '12px'
                }}>
                  {selectedLog.error || 'No error message'}
                </div>
              </Descriptions.Item>
              {selectedLog.stack && (
                <Descriptions.Item label="Stack Trace">
                  <div style={{
                    backgroundColor: '#f5f5f5',
                    border: '1px solid #d9d9d9',
                    borderRadius: '4px',
                    padding: '12px',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    fontSize: '11px',
                    fontFamily: 'monospace',
                    maxHeight: '300px',
                    overflow: 'auto'
                  }}>
                    {selectedLog.stack}
                  </div>
                </Descriptions.Item>
              )}
            </Descriptions>
          </div>
        )}
      </Drawer>
    </div>
  );
}
