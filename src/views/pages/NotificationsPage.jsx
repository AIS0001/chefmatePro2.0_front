import React, { useState, useEffect } from 'react';
import { Card, List, Badge, Button, Empty, Spin, Modal, Divider, Tag, Space, Popconfirm, message, Checkbox, Drawer } from 'antd';
import { DeleteOutlined, CloseOutlined, FilterOutlined, BellOutlined } from '@ant-design/icons';
import axios from 'axios';
import { getAuthToken } from '../../utility/auth';
import Layout from '../../layout/Layout';
import './NotificationsPage.css';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterUnreadOnly, setFilterUnreadOnly] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  
  // Filter states
  const [filterType, setFilterType] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filteredNotifications, setFilteredNotifications] = useState([]);

  const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:4402';

  // Fetch notifications on mount and when page changes
  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
  }, [page, filterUnreadOnly]);

  // Apply filters to notifications
  useEffect(() => {
    let filtered = [...notifications];
    
    if (filterType !== 'all') {
      filtered = filtered.filter(n => n.notificationType === filterType);
    }
    
    if (filterPriority !== 'all') {
      filtered = filtered.filter(n => n.priority === filterPriority);
    }
    
    setFilteredNotifications(filtered);
  }, [notifications, filterType, filterPriority]);

  // Fetch all notifications
  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const token = getAuthToken();
      const res = await axios.get('/notifications', {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          page,
          limit: 20,
          unreadOnly: filterUnreadOnly
        }
      });

      if (res.data?.success) {
        setNotifications(res.data.data.notifications || []);
        setTotalPages(res.data.data.pagination?.pages || 1);
        console.log('✅ Notifications fetched:', res.data.data.notifications?.length);
      }
    } catch (error) {
      console.error('❌ Error fetching notifications:', error.response?.data || error.message);
      message.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  // Fetch unread count
  const fetchUnreadCount = async () => {
    try {
      const token = getAuthToken();
      const res = await axios.get('/notifications/unread/count', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data?.success) {
        setUnreadCount(res.data.data.unreadCount || 0);
      }
    } catch (error) {
      console.error('❌ Error fetching unread count:', error.response?.data || error.message);
    }
  };

  // Open notification detail
  const handleOpenNotification = (notification) => {
    setSelectedNotification(notification);
    setDetailModalOpen(true);
  };

  // Close detail modal
  const handleCloseDetailModal = () => {
    setDetailModalOpen(false);
    setSelectedNotification(null);
    fetchNotifications();
    fetchUnreadCount();
  };

  // Get priority color
  const getPriorityColor = (priority) => {
    const colors = {
      low: '#87d068',
      normal: '#1890ff',
      high: '#ff7a45',
      urgent: '#f5222d'
    };
    return colors[priority] || '#1890ff';
  };

  // Get notification type color
  const getTypeColor = (type) => {
    const colors = {
      general: 'default',
      announcement: 'green',
      promotion: 'gold',
      alert: 'orange',
      maintenance: 'red'
    };
    return colors[type] || 'default';
  };

  // Render notification item
  const renderNotificationItem = (notification) => {
    return (
      <div
        className={`notification-item ${!notification.isRead ? 'unread' : 'read'}`}
        onClick={() => handleOpenNotification(notification)}
      >
        <div className="notification-item-header">
          <div className="notification-title-section">
            {!notification.isRead && <Badge status="processing" />}
            <h4 className="notification-title">{notification.title}</h4>
            <Tag color={getTypeColor(notification.notificationType)} style={{ marginLeft: '8px' }}>
              {notification.notificationType}
            </Tag>
            <Tag color={getPriorityColor(notification.priority)} style={{ marginLeft: '4px' }}>
              {notification.priority}
            </Tag>
          </div>
          <span className="notification-time">
            {new Date(notification.createdAt).toLocaleString()}
          </span>
        </div>
        <div className="notification-message">
          {notification.message.substring(0, 100)}
          {notification.message.length > 100 ? '...' : ''}
        </div>
      </div>
    );
  };

  return (
    <Layout>
      <div style={{ display: 'flex', height: '100%', gap: '0' }}>
        {/* Left Sidebar for Filters - Desktop */}
        {window.innerWidth > 768 && (
          <div className="notifications-sidebar" style={{
            width: '280px',
            backgroundColor: '#fafafa',
            padding: '24px',
            borderRight: '1px solid #e8e8e8',
            overflowY: 'auto',
            maxHeight: 'calc(100vh - 64px)'
          }}>
            <div className="sidebar-content">
              {/* Filter Header */}
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>
                  <FilterOutlined /> Filters
                </h3>
              </div>

              {/* Unread Filter */}
              <div className="filter-section" style={{ marginBottom: '24px' }}>
                <h4 style={{ fontSize: '12px', fontWeight: 600, color: '#666', textTransform: 'uppercase', marginBottom: '12px' }}>Read Status</h4>
                <Checkbox
                  checked={filterUnreadOnly}
                  onChange={(e) => {
                    setFilterUnreadOnly(e.target.checked);
                    setPage(1);
                  }}
                >
                  Unread Only
                </Checkbox>
              </div>

              <Divider />

              {/* Notification Type Filter */}
              <div className="filter-section" style={{ marginBottom: '24px' }}>
                <h4 style={{ fontSize: '12px', fontWeight: 600, color: '#666', textTransform: 'uppercase', marginBottom: '12px' }}>Type</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <Checkbox
                    checked={filterType === 'all'}
                    onChange={() => { setFilterType('all'); setPage(1); }}
                  >
                    All Types
                  </Checkbox>
                  <Checkbox
                    checked={filterType === 'general'}
                    onChange={() => { setFilterType('general'); setPage(1); }}
                  >
                    General
                  </Checkbox>
                  <Checkbox
                    checked={filterType === 'announcement'}
                    onChange={() => { setFilterType('announcement'); setPage(1); }}
                  >
                    Announcement
                  </Checkbox>
                  <Checkbox
                    checked={filterType === 'alert'}
                    onChange={() => { setFilterType('alert'); setPage(1); }}
                  >
                    Alert
                  </Checkbox>
                  <Checkbox
                    checked={filterType === 'promotion'}
                    onChange={() => { setFilterType('promotion'); setPage(1); }}
                  >
                    Promotion
                  </Checkbox>
                </div>
              </div>

              <Divider />

              {/* Priority Filter */}
              <div className="filter-section" style={{ marginBottom: '24px' }}>
                <h4 style={{ fontSize: '12px', fontWeight: 600, color: '#666', textTransform: 'uppercase', marginBottom: '12px' }}>Priority</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <Checkbox
                    checked={filterPriority === 'all'}
                    onChange={() => { setFilterPriority('all'); setPage(1); }}
                  >
                    All Priorities
                  </Checkbox>
                  <Checkbox
                    checked={filterPriority === 'urgent'}
                    onChange={() => { setFilterPriority('urgent'); setPage(1); }}
                  >
                    🔴 Urgent
                  </Checkbox>
                  <Checkbox
                    checked={filterPriority === 'high'}
                    onChange={() => { setFilterPriority('high'); setPage(1); }}
                  >
                    🟠 High
                  </Checkbox>
                  <Checkbox
                    checked={filterPriority === 'normal'}
                    onChange={() => { setFilterPriority('normal'); setPage(1); }}
                  >
                    🔵 Normal
                  </Checkbox>
                  <Checkbox
                    checked={filterPriority === 'low'}
                    onChange={() => { setFilterPriority('low'); setPage(1); }}
                  >
                    🟢 Low
                  </Checkbox>
                </div>
              </div>

              <Divider />

              {/* Quick Stats */}
              <div className="filter-section">
                <h4 style={{ fontSize: '12px', fontWeight: 600, color: '#666', textTransform: 'uppercase', marginBottom: '12px' }}>Stats</h4>
                <div style={{
                  backgroundColor: '#fff',
                  padding: '12px',
                  borderRadius: '4px',
                  border: '1px solid #e8e8e8'
                }}>
                  <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#666', fontSize: '12px' }}>Total:</span>
                    <Badge count={notifications.length} style={{ backgroundColor: '#1890ff' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#666', fontSize: '12px' }}>Unread:</span>
                    <Badge count={unreadCount} style={{ backgroundColor: '#ff4d4f' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Mobile Sidebar Drawer */}
        <Drawer
          title="Filters"
          placement="left"
          onClose={() => setMobileDrawerOpen(false)}
          open={mobileDrawerOpen}
          width={280}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <Checkbox
              checked={filterUnreadOnly}
              onChange={(e) => {
                setFilterUnreadOnly(e.target.checked);
                setPage(1);
              }}
            >
              Unread Only
            </Checkbox>
            <Divider />
            <h4 style={{ fontSize: '12px', fontWeight: 600 }}>Type</h4>
            {['all', 'general', 'announcement', 'alert', 'promotion'].map(type => (
              <Checkbox
                key={type}
                checked={filterType === type}
                onChange={() => { setFilterType(type); setPage(1); setMobileDrawerOpen(false); }}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Checkbox>
            ))}
            <Divider />
            <h4 style={{ fontSize: '12px', fontWeight: 600 }}>Priority</h4>
            {['all', 'urgent', 'high', 'normal', 'low'].map(priority => (
              <Checkbox
                key={priority}
                checked={filterPriority === priority}
                onChange={() => { setFilterPriority(priority); setPage(1); setMobileDrawerOpen(false); }}
              >
                {priority.charAt(0).toUpperCase() + priority.slice(1)}
              </Checkbox>
            ))}
          </div>
        </Drawer>

        {/* Main Content Area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '24px', overflowY: 'auto' }}>
          <Card
            title={
              <div className="notifications-header" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <BellOutlined style={{ fontSize: '20px' }} />
                <span>Notifications</span>
                {unreadCount > 0 && <Badge count={unreadCount} style={{ backgroundColor: '#ff4d4f' }} />}
              </div>
            }
            extra={
              <Space>
                {window.innerWidth <= 768 && (
                  <Button
                    icon={<FilterOutlined />}
                    onClick={() => setMobileDrawerOpen(true)}
                  >
                    Filters
                  </Button>
                )}
                <Button
                  type={filterUnreadOnly ? 'primary' : 'default'}
                  onClick={() => {
                    setFilterUnreadOnly(!filterUnreadOnly);
                    setPage(1);
                  }}
                >
                  {filterUnreadOnly ? 'All' : 'Unread'}
                </Button>
                <Button onClick={() => fetchNotifications()}>Refresh</Button>
              </Space>
            }
            className="notifications-card"
            style={{ flex: 1 }}
          >
            <Spin spinning={loading}>
              {filteredNotifications.length > 0 ? (
                <div className="notifications-list">
                  {filteredNotifications.map((notification) => (
                    <div key={notification.id} className="notification-item-wrapper">
                      {renderNotificationItem(notification)}
                    </div>
                  ))}

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="pagination-controls">
                      <Button
                        onClick={() => setPage(page - 1)}
                        disabled={page === 1}
                      >
                        Previous
                      </Button>
                      <span className="page-info">
                        Page {page} of {totalPages}
                      </span>
                      <Button
                        onClick={() => setPage(page + 1)}
                        disabled={page === totalPages}
                      >
                        Next
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <Empty
                  description={filterUnreadOnly ? 'No unread notifications' : 'No notifications found'}
                  style={{ padding: '50px 0' }}
                />
              )}
            </Spin>
          </Card>
        </div>
      </div>

      {/* Notification Detail Modal with Optimized Image */}
      <Modal
        title={selectedNotification?.title}
        open={detailModalOpen}
        onCancel={handleCloseDetailModal}
        width={900}
        footer={[
          <Button key="close" onClick={handleCloseDetailModal}>
            Close
          </Button>
        ]}
        className="notification-detail-modal"
        bodyStyle={{ padding: '24px' }}
      >
        {selectedNotification && (
          <div style={{ display: 'flex', gap: '24px' }}>
            {/* Left Side - Image (if present) */}
            {selectedNotification.imageUrl && (
              <div style={{
                flex: '0 0 300px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                <div style={{
                  backgroundColor: '#f5f5f5',
                  borderRadius: '8px',
                  padding: '12px',
                  overflow: 'hidden',
                  height: '300px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <img
                    src={selectedNotification.imageUrl}
                    alt={selectedNotification.title}
                    style={{
                      maxWidth: '100%',
                      maxHeight: '100%',
                      objectFit: 'contain',
                      borderRadius: '4px'
                    }}
                  />
                </div>
                <div style={{
                  fontSize: '12px',
                  color: '#999',
                  textAlign: 'center'
                }}>
                  Image {selectedNotification.imageUrl.split('/').pop()}
                </div>
              </div>
            )}

            {/* Right Side - Details */}
            <div style={{ flex: 1 }}>
              {/* Header Info */}
              <div className="detail-header" style={{ marginBottom: '16px' }}>
                <Space>
                  <Tag color={getTypeColor(selectedNotification.notificationType)}>
                    {selectedNotification.notificationType}
                  </Tag>
                  <Tag color={getPriorityColor(selectedNotification.priority)}>
                    {selectedNotification.priority}
                  </Tag>
                  {selectedNotification.isRead && (
                    <Tag color="green">Read</Tag>
                  )}
                </Space>
                <div style={{
                  fontSize: '12px',
                  color: '#999',
                  marginTop: '8px'
                }}>
                  {new Date(selectedNotification.createdAt).toLocaleString()}
                </div>
              </div>

              <Divider />

              {/* Message */}
              <div className="detail-message" style={{ marginBottom: '16px' }}>
                <h4 style={{ marginBottom: '8px', fontWeight: 600 }}>Message:</h4>
                <p style={{
                  color: '#333',
                  lineHeight: '1.6',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word'
                }}>
                  {selectedNotification.message}
                </p>
              </div>

              {/* Meta Info */}
              <Divider />
              <div className="detail-meta">
                <div style={{ marginBottom: '12px' }}>
                  <span style={{ fontWeight: 600, color: '#666' }}>Received:</span>
                  <div style={{ color: '#333', marginTop: '4px' }}>
                    {new Date(selectedNotification.createdAt).toLocaleString()}
                  </div>
                </div>
                {selectedNotification.readAt && (
                  <div>
                    <span style={{ fontWeight: 600, color: '#666' }}>Read at:</span>
                    <div style={{ color: '#333', marginTop: '4px' }}>
                      {new Date(selectedNotification.readAt).toLocaleString()}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </Layout>
  );
}
