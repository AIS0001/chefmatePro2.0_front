import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Badge, Button, Card, Col, Empty, Row, Space, Tag, Typography, message, notification } from 'antd';
import { LogoutOutlined, ReloadOutlined, WifiOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getHeaders } from '../../utility/getHeader';
import { getAuthToken, logout } from '../../utility/auth';

const { Text, Title } = Typography;

// ---------- WebSocket URL resolver (mirrors Topbar logic) ----------
const normalizeBaseUrl = (v) => String(v || '').trim().replace(/\/+$/, '');
const resolveWebSocketUrl = () => {
  const explicit = normalizeBaseUrl(process.env.REACT_APP_WS_URL);
  if (explicit) return `${explicit.replace(/^http/i, 'ws')}/ws`;
  const axiosBase = normalizeBaseUrl(axios?.defaults?.baseURL);
  if (axiosBase) {
    const origin = axiosBase.replace(/\/api$/i, '');
    return `${origin.replace(/^http/i, 'ws')}/ws`;
  }
  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${proto}//${window.location.host}/ws`;
};
// ------------------------------------------------------------------

// ---- Beep using Web Audio API (no external file needed) ----------
const playBeep = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, ctx.currentTime);          // A5 tone
    oscillator.frequency.setValueAtTime(660, ctx.currentTime + 0.12);   // E5 tone
    gainNode.gain.setValueAtTime(0.6, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.4);
    oscillator.onended = () => ctx.close();
  } catch (_) {}
};
// ------------------------------------------------------------------

const statusColors = {
  queue: 'red',
  processing: 'orange',
  completed: 'green'
};

const statusBackgrounds = {
  queue: '#fff1f0',
  processing: '#fff7e6',
  completed: '#f6ffed'
};

const statusDotColors = {
  queue: '#ff4d4f',
  processing: '#fa8c16',
  completed: '#52c41a'
};

const groupOrders = (orders = []) => {
  const grouped = new Map();

  orders.forEach((order) => {
    const orderId = String(order?.order_id || '-');
    const tableNumber = String(order?.table_number || '-');
    const bucket = String(order?.status_bucket || 'queue');
    const key = `${orderId}__${tableNumber}__${bucket}`;

    if (!grouped.has(key)) {
      grouped.set(key, {
        key,
        order_id: orderId,
        table_number: tableNumber,
        status_bucket: bucket,
        rowIds: [],
        items: []
      });
    }

    const bucketData = grouped.get(key);
    bucketData.rowIds.push(order.id);
    bucketData.items.push({
      item_name: order?.item_name || '-',
      quantity: Number(order?.quantity || 0)
    });
  });

  return Array.from(grouped.values());
};

const KdsOrderCard = ({ orderGroup, onMove }) => {
  const orderNumber = orderGroup?.order_id || '-';
  const tableNumber = orderGroup?.table_number || '-';
  const dotColor = statusDotColors[orderGroup.status_bucket] || '#1677ff';
  const bucket = orderGroup.status_bucket;

  return (
    <div
      className="kds-order-card"
      style={{
        marginBottom: 6,
        padding: '8px 10px',
        borderRadius: 6,
        border: `1px solid ${statusColors[bucket] ? (bucket === 'queue' ? '#ffccc7' : bucket === 'processing' ? '#ffd591' : '#b7eb8f') : '#d9d9d9'}`,
        backgroundColor: statusBackgrounds[bucket] || '#fff',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 8,
        flexWrap: 'wrap',
      }}
    >
      {/* Left: dot + order info */}
      <span className="kds-live-dot" style={{ backgroundColor: dotColor, flexShrink: 0 }} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <Text strong style={{ fontSize: 16, lineHeight: 1.2 }}>Order #{orderNumber}</Text>
          <Text type="secondary" style={{ fontSize: 14, lineHeight: 1.2 }}>Table {tableNumber}</Text>
        </div>
        <div style={{ marginTop: 4, display: 'grid', rowGap: 2 }}>
          {(orderGroup.items || []).map((item, idx) => (
            <div
              key={`${item.item_name}-${idx}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 8
              }}
            >
              <Text style={{ fontSize: 15, color: '#262626', lineHeight: 1.2 }} ellipsis={{ tooltip: item.item_name }}>
                {item.item_name}
              </Text>
              <Tag style={{ marginRight: 0, fontSize: 13 }}>x {item.quantity}</Tag>
            </div>
          ))}
        </div>
      </div>

      {/* Right: action buttons */}
      <Space size={6} style={{ flexShrink: 0 }}>
        {bucket === 'processing' && (
          <Button size="middle" onClick={() => onMove(orderGroup.rowIds, 'queue')}>
            ← Queue
          </Button>
        )}
        {bucket === 'queue' && (
          <Button size="middle" type="default" onClick={() => onMove(orderGroup.rowIds, 'processing')}>
            Processing →
          </Button>
        )}
        {bucket === 'processing' && (
          <Button size="middle" type="primary" onClick={() => onMove(orderGroup.rowIds, 'completed')}>
            ✓ Complete
          </Button>
        )}
        {bucket === 'completed' && (
          <Button size="middle" onClick={() => onMove(orderGroup.rowIds, 'queue')}>
            ← Requeue
          </Button>
        )}
      </Space>
    </div>
  );
};

export default function KdsDashboard() {
  const navigate = useNavigate();
  const [notificationApi, notificationContextHolder] = notification.useNotification();
  const [loading, setLoading] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const wsRef = useRef(null);
  const wsIntentionalCloseRef = useRef(false);
  const prevQueueOrderIdsRef = useRef(null);
  const [updatingGroupKey, setUpdatingGroupKey] = useState(null);
  const [boardData, setBoardData] = useState({
    queueOrders: [],
    processingOrders: [],
    completedOrders: [],
    counts: { queue: 0, processing: 0, completed: 0 }
  });

  const fetchBoard = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get('/kds/orders', getHeaders());
      const payload = response?.data?.data || {};
      const newQueueOrders = payload.queueOrders || [];
      const groupedQueueOrders = groupOrders(newQueueOrders);
      const currentQueueOrderIds = new Set(groupedQueueOrders.map((order) => String(order.order_id)));

      // Beep + toast when truly new order IDs arrive (skip first load)
      if (prevQueueOrderIdsRef.current) {
        const newOrderIds = Array.from(currentQueueOrderIds).filter(
          (orderId) => !prevQueueOrderIdsRef.current.has(orderId)
        );

        if (newOrderIds.length > 0) {
          const readableIds = newOrderIds.slice(0, 3).map((id) => `#${id}`).join(', ');
          const moreCount = Math.max(0, newOrderIds.length - 3);
          const suffix = moreCount > 0 ? ` +${moreCount} more` : '';

          notificationApi.open({
            message: 'New Order Received',
            description: `Order ${readableIds}${suffix}`,
            placement: 'topRight',
            duration: 3,
          });

          playBeep();
        }
      }

      prevQueueOrderIdsRef.current = currentQueueOrderIds;

      setBoardData({
        queueOrders: newQueueOrders,
        processingOrders: payload.processingOrders || [],
        completedOrders: payload.completedOrders || [],
        counts: payload.counts || { queue: 0, processing: 0, completed: 0 }
      });
    } catch (error) {
      console.error('KDS fetch error:', error);
      message.error(error?.response?.data?.message || 'Failed to load KDS orders');
    } finally {
      setLoading(false);
    }
  }, [notificationApi]);

  useEffect(() => {
    fetchBoard();
    // Fallback polling every 30 s (WebSocket is primary)
    const timer = setInterval(fetchBoard, 30000);
    return () => clearInterval(timer);
  }, [fetchBoard]);

  // ---- Real-time WebSocket (same pattern as Topbar) ----
  useEffect(() => {
    const token = getAuthToken();
    if (!token || typeof WebSocket === 'undefined') return;

    const wsUrl = resolveWebSocketUrl();
    let isUnmounted = false;
    wsIntentionalCloseRef.current = false;

    try {
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        if (isUnmounted) return;
        setWsConnected(true);
        wsRef.current.send(JSON.stringify({ type: 'auth', token }));
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          // Trigger refresh on kds_update pushed by insertcontrol / kdsController
          if (data.type === 'notification' && data.data?.type === 'kds_update') {
            fetchBoard();
          }
        } catch (_) {}
      };

      wsRef.current.onerror = () => {
        if (!isUnmounted) setWsConnected(false);
      };

      wsRef.current.onclose = () => {
        if (!isUnmounted) setWsConnected(false);
      };
    } catch (_) {}

    return () => {
      isUnmounted = true;
      wsIntentionalCloseRef.current = true;
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      setWsConnected(false);
    };
  }, [fetchBoard]);

  const handleMoveStatus = async (orderIds, status) => {
    const ids = Array.isArray(orderIds) ? orderIds : [orderIds];
    const key = `${status}-${ids.join('_')}`;
    try {
      setUpdatingGroupKey(key);
      await Promise.all(
        ids.map((id) => axios.put(`/kds/orders/${id}/status`, { status }, getHeaders()))
      );
      await fetchBoard();
    } catch (error) {
      console.error('KDS update error:', error);
      message.error(error?.response?.data?.message || 'Failed to update order status');
    } finally {
      setUpdatingGroupKey(null);
    }
  };

  const columns = useMemo(
    () => [
      {
        key: 'queue',
        title: 'Queue Orders',
        data: groupOrders(boardData.queueOrders),
        color: 'red'
      },
      {
        key: 'processing',
        title: 'Processing Orders',
        data: groupOrders(boardData.processingOrders),
        color: 'orange'
      },
      {
        key: 'completed',
        title: 'Completed Orders',
        data: groupOrders(boardData.completedOrders),
        color: 'green'
      }
    ],
    [boardData]
  );

  return (
    <div style={{ minHeight: '100vh', padding: 16, background: '#f5f7fa' }}>
      {notificationContextHolder}
      <style>
        {`
          .kds-order-card {
            animation: kdsCardIn 0.45s ease both;
            transition: transform 0.2s ease, box-shadow 0.2s ease;
            border-width: 1px;
            border-style: solid;
          }

          .kds-order-card:hover {
            transform: translateY(-2px) scale(1.01);
            box-shadow: 0 10px 24px rgba(0, 0, 0, 0.12);
          }

          .kds-live-dot {
            width: 10px;
            height: 10px;
            border-radius: 50%;
            display: inline-block;
            box-shadow: 0 0 0 rgba(0, 0, 0, 0.2);
            animation: kdsPulse 1.4s infinite;
          }

          @keyframes kdsCardIn {
            from {
              opacity: 0;
              transform: translateY(10px) scale(0.98);
            }
            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }

          @keyframes kdsPulse {
            0% {
              transform: scale(0.95);
              box-shadow: 0 0 0 0 rgba(0, 0, 0, 0.25);
            }
            70% {
              transform: scale(1);
              box-shadow: 0 0 0 8px rgba(0, 0, 0, 0);
            }
            100% {
              transform: scale(0.95);
              box-shadow: 0 0 0 0 rgba(0, 0, 0, 0);
            }
          }
        `}
      </style>

      <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
        <Space align="center" size={10}>
          <Title level={3} style={{ margin: 0, fontSize: 34, lineHeight: 1.1 }}>Kitchen Display System</Title>
          <Tag
            icon={<WifiOutlined />}
            color={wsConnected ? 'success' : 'default'}
            style={{ marginBottom: 2, fontSize: 14, padding: '2px 8px' }}
          >
            {wsConnected ? 'Live' : 'Polling'}
          </Tag>
        </Space>
        <Space>
          <Button size="large" icon={<ReloadOutlined />} loading={loading} onClick={fetchBoard}>
            Refresh
          </Button>
          <Button
            size="large"
            danger
            icon={<LogoutOutlined />}
            onClick={() => { logout(); navigate('/', { replace: true }); }}
          >
            Logout
          </Button>
        </Space>
      </Space>

      <Row gutter={[16, 16]}>
        {columns.map((column) => (
          <Col xs={24} md={8} key={column.key}>
            <Card
              title={<Space><Badge color={column.color} /><span style={{ fontSize: 24, fontWeight: 700 }}>{column.title}</span></Space>}
              extra={<Tag style={{ fontSize: 20, padding: '4px 10px' }}>{column.data.length}</Tag>}
              style={{ backgroundColor: statusBackgrounds[column.key] }}
              bodyStyle={{ maxHeight: '82vh', overflowY: 'auto', padding: '8px' }}
            >
              {column.data.length === 0 && <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No orders" />}

              {column.data.map((group) => (
                <div
                  key={group.key}
                  style={{ opacity: updatingGroupKey && group.rowIds.every((id) => updatingGroupKey.includes(String(id))) ? 0.6 : 1 }}
                >
                  <KdsOrderCard orderGroup={group} onMove={handleMoveStatus} />
                </div>
              ))}
            </Card>
          </Col>
        ))}
      </Row>

      {/* ---- Footer ---- */}
      <div style={{
        marginTop: 32,
        paddingTop: 16,
        borderTop: '1px solid #e8e8e8',
        textAlign: 'center',
        color: '#8c8c8c',
        fontSize: 13,
        lineHeight: '1.8'
      }}>
        <Text type="secondary" style={{ fontSize: 13 }}>
          Powered by <strong style={{ color: '#595959' }}>ChefMate POS</strong> &nbsp;|&nbsp; By{' '}
          <strong style={{ color: '#595959' }}>Cloudnet Softwares</strong>
        </Text>
        <br />
        <Text type="secondary" style={{ fontSize: 12 }}>
          Support: <a href="tel:+66948712350" style={{ color: '#8c8c8c' }}>+66-948712350</a>
          &nbsp;&nbsp;|&nbsp;&nbsp;
          <a href="mailto:info@cloudnetsoftwares.com" style={{ color: '#8c8c8c' }}>info@cloudnetsoftwares.com</a>
        </Text>
      </div>
    </div>
  );
}
