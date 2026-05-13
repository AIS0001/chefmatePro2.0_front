import React, { useState, useEffect, useCallback } from 'react';
import { Card, Row, Col, Statistic, Spin, Alert, Button, List, Empty, Typography, DatePicker, Progress } from 'antd';
import {
  ShopOutlined,
  TeamOutlined,
  DollarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  BarChartOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import axios from 'axios';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import dayjs from 'dayjs';
import './SuperAdminDashboard.css';

const { Text } = Typography;
const { RangePicker } = DatePicker;
const CURRENCY_SYMBOL = '฿';
const PIE_COLORS = ['#2563eb', '#06b6d4', '#f59e0b', '#7c3aed', '#ec4899', '#14b8a6'];
const CHART_SERIES_COLORS = {
  sales: '#2563eb',
  bills: '#7c3aed'
};
const DATE_PRESETS = [
  { key: 'today', label: 'Today', days: 0 },
  { key: 'last7', label: 'Last 7 Days', days: 6 },
  { key: 'last30', label: 'Last 30 Days', days: 29 }
];

function buildQueryParams(dateRange, shopId) {
  const queryParams = {};

  if (shopId) {
    queryParams.shop_id = shopId;
  }

  if (Array.isArray(dateRange) && dateRange.length === 2 && dateRange[0] && dateRange[1]) {
    queryParams.start_date = dayjs(dateRange[0]).format('YYYY-MM-DD');
    queryParams.end_date = dayjs(dateRange[1]).format('YYYY-MM-DD');
  }

  return queryParams;
}

function isSamePresetRange(currentRange, daysBack) {
  if (!Array.isArray(currentRange) || currentRange.length !== 2 || !currentRange[0] || !currentRange[1]) {
    return false;
  }

  const expectedStart = dayjs().startOf('day').subtract(daysBack, 'day');
  const expectedEnd = dayjs().endOf('day');

  return dayjs(currentRange[0]).isSame(expectedStart, 'day') && dayjs(currentRange[1]).isSame(expectedEnd, 'day');
}

function formatBaht(value) {
  const amount = Number(value || 0);
  return `${CURRENCY_SYMBOL}${amount.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

function SuperAdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [systemHealth, setSystemHealth] = useState(null);
  const [selectedShop, setSelectedShop] = useState(null);
  const [dateRange, setDateRange] = useState([]);
  const [healthLoading, setHealthLoading] = useState(false);

  const fetchSystemHealth = useCallback(async (rangeOverride = null, shouldSpin = false) => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const shopId = sessionStorage.getItem('selected_shop_id');
      const effectiveRange = Array.isArray(rangeOverride) && rangeOverride.length === 2 ? rangeOverride : dateRange;
      const queryParams = buildQueryParams(effectiveRange, shopId);

      if (shouldSpin) {
        setHealthLoading(true);
      }

      if (!token) {
        setError('Authentication token not found. Please log in again.');
        return;
      }

      const response = await axios.get('/super-admin/analytics/system-health', {
        headers: { Authorization: `Bearer ${token}` },
        params: queryParams
      });

      if (response.data.success) {
        setSystemHealth(response.data.data);
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message || 'Failed to load system health';
      setError(errorMsg);
    } finally {
      if (shouldSpin) {
        setHealthLoading(false);
      }
    }
  }, [dateRange]);

  const fetchDashboardData = useCallback(async (rangeOverride = null) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const shopId = sessionStorage.getItem('selected_shop_id');
      const effectiveRange = Array.isArray(rangeOverride) && rangeOverride.length === 2 ? rangeOverride : dateRange;
      const queryParams = buildQueryParams(effectiveRange, shopId);

      if (!token) {
        setError('Authentication token not found. Please log in again.');
        return;
      }

      const statsResponse = await axios.get('/super-admin/dashboard/stats', {
        headers: { Authorization: `Bearer ${token}` },
        params: queryParams
      });

      if (statsResponse.data.success) {
        setStats(statsResponse.data.data);
      } else {
        setStats(null);
      }

      await fetchSystemHealth(effectiveRange, false);

      setError(null);
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message || 'Failed to load dashboard data';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [dateRange, fetchSystemHealth]);

  const applyDatePreset = useCallback((daysBack) => {
    const end = dayjs().endOf('day');
    const start = dayjs().startOf('day').subtract(daysBack, 'day');
    const range = [start, end];
    setDateRange(range);
    fetchDashboardData(range);
  }, [fetchDashboardData]);

  useEffect(() => {
    const shopId = sessionStorage.getItem('selected_shop_id');
    setSelectedShop(shopId);

    fetchDashboardData();
    const dashboardInterval = setInterval(fetchDashboardData, 60000);
    const healthInterval = setInterval(() => fetchSystemHealth(null, false), 10000);
    return () => {
      clearInterval(dashboardInterval);
      clearInterval(healthInterval);
    };
  }, [fetchDashboardData, fetchSystemHealth]);

  const totalShops = Number(stats?.totalShops?.[0]?.count || 0);
  const activeShops = Number(stats?.activeShops?.[0]?.count || 0);
  const totalUsers = Number(stats?.totalUsers?.[0]?.count || 0);
  const totalRevenue = Number(stats?.totalRevenue?.[0]?.total || 0);
  const pendingBills = Number(stats?.pendingBills?.[0]?.count || 0);
  const lastMonthRevenue = Number(stats?.lastMonthRevenue?.[0]?.total || 0);
  const subscriptionDistribution = Array.isArray(stats?.subscriptionDistribution) ? stats.subscriptionDistribution : [];
  const topShops = Array.isArray(stats?.topShops) ? stats.topShops.slice(0, 5) : [];
  const pieData = subscriptionDistribution.map((item) => ({
    name: item.name || 'Unknown',
    value: Number(item.count || 0)
  }));
  const lineData = topShops.map((shop, idx) => ({
    name: shop.name ? String(shop.name).slice(0, 12) : `Shop ${idx + 1}`,
    sales: Number(shop.total_sales || 0),
    bills: Number(shop.total_bills || 0)
  }));
  const server = systemHealth?.server;
  const serverMemUsage = Number(server?.memory?.usagePercent || 0);
  const systemCpuUsage = Number(server?.cpuUsagePercent || 0);
  const processCpuUsage = Number(server?.processCpuUsagePercent || 0);
  const serverHeapUsage = Number(
    server?.processMemory?.heapTotalMB > 0
      ? ((server?.processMemory?.heapUsedMB / server?.processMemory?.heapTotalMB) * 100)
      : 0
  );

  return (
    <div className="super-admin-dashboard">
      {error && (
        <Alert
          message="Dashboard Error"
          description={error}
          type="error"
          closable
          onClose={() => setError(null)}
          style={{ marginBottom: 16 }}
          action={<Button size="small" onClick={fetchDashboardData}>Retry</Button>}
        />
      )}

      <div className="dashboard-header">
        <div>
          <h2>Dashboard {selectedShop ? `- Shop ID: ${selectedShop}` : '- All Shops'}</h2>
          <p>{selectedShop ? 'Shop-specific analytics in Thai Baht format' : 'Combined analytics for all shops in Thai Baht format'}</p>
        </div>
        <div className="dashboard-actions">
          <div className="quick-presets">
            {DATE_PRESETS.map((preset) => (
              <Button
                key={preset.key}
                size="small"
                className={`quick-preset-btn${isSamePresetRange(dateRange, preset.days) ? ' quick-preset-btn-active' : ''}`}
                onClick={() => applyDatePreset(preset.days)}
              >
                {preset.label}
              </Button>
            ))}
          </div>
          <RangePicker
            value={dateRange}
            onChange={(dates) => setDateRange(dates || [])}
            allowClear
            format="YYYY-MM-DD"
          />
          <Button onClick={fetchDashboardData} loading={loading}>Apply</Button>
          <Button icon={<ReloadOutlined />} onClick={fetchDashboardData} loading={loading}>Refresh</Button>
        </div>
      </div>

      <Spin spinning={loading && !stats}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={8} xl={4}>
            <Card className="kpi-card kpi-soft-blue">
              <Statistic title="Total Shops" value={totalShops} prefix={<ShopOutlined />} />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={8} xl={4}>
            <Card className="kpi-card kpi-soft-green">
              <Statistic title="Active Shops" value={activeShops} suffix={`/ ${totalShops}`} prefix={<CheckCircleOutlined />} />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={8} xl={4}>
            <Card className="kpi-card kpi-soft-cyan">
              <Statistic title="Total Users" value={totalUsers} prefix={<TeamOutlined />} />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={8} xl={4}>
            <Card className="kpi-card kpi-soft-amber">
              <Statistic title="Total Revenue" value={formatBaht(totalRevenue)} prefix={<DollarOutlined />} />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={8} xl={4}>
            <Card className="kpi-card kpi-soft-purple">
              <Statistic title="Last Month" value={formatBaht(lastMonthRevenue)} prefix={<BarChartOutlined />} />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={8} xl={4}>
            <Card className="kpi-card kpi-soft-rose">
              <Statistic title="Pending Payments" value={pendingBills} prefix={<ClockCircleOutlined />} />
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]} style={{ marginTop: 4 }}>
          <Col xs={24} lg={12}>
            <Card title="Subscription Distribution" className="soft-header-card soft-header-blue">
              {pieData.length === 0 ? (
                <Empty description="No distribution data" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              ) : (
                <div className="chart-wrap">
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        innerRadius={45}
                        label
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${entry.name}-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} shops`, 'Count']} />
                      <Legend
                        iconType="circle"
                        formatter={(value) => <span style={{ color: '#334155', fontWeight: 600 }}>{value}</span>}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>
          </Col>

          <Col xs={24} lg={12}>
            <Card title="Sales Trend by Top Shops" className="soft-header-card soft-header-green">
              {lineData.length === 0 ? (
                <Empty description="No trend data" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              ) : (
                <div className="chart-wrap">
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={lineData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis tickFormatter={(value) => `${CURRENCY_SYMBOL}${Math.round(value / 1000)}k`} tick={{ fontSize: 12 }} />
                      <Tooltip
                        formatter={(value, name) => {
                          if (name === 'sales') return [formatBaht(value), 'Sales'];
                          return [value, 'Bills'];
                        }}
                      />
                      <Legend
                        iconType="circle"
                        formatter={(value) => (
                          <span style={{ color: '#334155', fontWeight: 600 }}>
                            {value === 'sales' ? 'Sales' : 'Bills'}
                          </span>
                        )}
                      />
                      <Line
                        type="monotone"
                        dataKey="sales"
                        name="Sales"
                        stroke={CHART_SERIES_COLORS.sales}
                        strokeWidth={3}
                        dot={{ r: 4, fill: CHART_SERIES_COLORS.sales }}
                      />
                      <Line
                        type="monotone"
                        dataKey="bills"
                        name="Bills"
                        stroke={CHART_SERIES_COLORS.bills}
                        strokeWidth={2.5}
                        dot={{ r: 3, fill: CHART_SERIES_COLORS.bills }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>
          </Col>
        </Row>

        <Card title="Top Performing Shops" className="soft-header-card soft-header-amber" style={{ marginTop: 16 }}>
          {topShops.length === 0 ? (
            <Empty description="No shop performance data" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          ) : (
            <List
              dataSource={topShops}
              renderItem={(shop, idx) => (
                <List.Item>
                  <div className="shop-item-minimal">
                    <Text strong>#{idx + 1} {shop.name || 'Unknown Shop'}</Text>
                    <Text type="secondary">
                      {shop.total_bills || 0} bills • {formatBaht(shop.total_sales || 0)}
                    </Text>
                  </div>
                </List.Item>
              )}
            />
          )}
        </Card>

        {systemHealth && (
          <Card title="System Health" className="soft-header-card soft-header-purple" style={{ marginTop: 16 }}>
            <Row gutter={[16, 16]}>
              <Col xs={12} md={6}>
                <Statistic title="Total Shops" value={systemHealth.totalShops || 0} />
              </Col>
              <Col xs={12} md={6}>
                <Statistic title="Active Users" value={systemHealth.activeUsers || 0} />
              </Col>
              <Col xs={12} md={6}>
                <Statistic title="Today's Bills" value={systemHealth.todayBills || 0} />
              </Col>
              <Col xs={12} md={6}>
                <Statistic title="Today's Revenue" value={formatBaht(systemHealth.todayRevenue || 0)} />
              </Col>
            </Row>

            <div className="system-health-meta">
              <Text type="secondary">
                Current Node host: {server?.hostname || '-'} • IP: {server?.primaryIp || '-'} • Environment: {server?.environment || '-'} • Live metrics refresh every 10 seconds. Last updated: {server?.timestamp ? dayjs(server.timestamp).format('YYYY-MM-DD HH:mm:ss') : '-'}
              </Text>
              {healthLoading && <Text type="secondary">Updating live health...</Text>}
            </div>

            {server && (
              <>
                <Row gutter={[16, 16]} style={{ marginTop: 12 }}>
                  <Col xs={24} md={12} lg={6}>
                    <Statistic title="Server Uptime" value={server.uptimeHuman || '-'} />
                  </Col>
                  <Col xs={24} md={12} lg={6}>
                    <Statistic title="CPU Cores" value={server.cpuCores || 0} />
                  </Col>
                  <Col xs={24} md={12} lg={6}>
                    <Statistic title="DB Status" value={server.database?.status || 'unknown'} />
                  </Col>
                  <Col xs={24} md={12} lg={6}>
                    <Statistic title="DB Ping" value={server.database?.pingMs ?? '-'} suffix={server.database?.pingMs != null ? 'ms' : ''} />
                  </Col>
                </Row>

                <Row gutter={[16, 16]} style={{ marginTop: 10 }}>
                  <Col xs={24} md={12}>
                    <Card size="small" title="Server IP" className="soft-header-card soft-header-blue">
                      <Text strong>{server.primaryIp || '-'}</Text>
                      <Text type="secondary">Primary IPv4 of the host running Node.js</Text>
                    </Card>
                  </Col>
                  <Col xs={24} md={12}>
                    <Card size="small" title="Environment" className="soft-header-card soft-header-green">
                      <Text strong>{server.environment || '-'}</Text>
                      <Text type="secondary">Current backend runtime environment</Text>
                    </Card>
                  </Col>
                </Row>

                <Row gutter={[16, 16]} style={{ marginTop: 10 }}>
                  <Col xs={24} md={12}>
                    <Card size="small" title="Host System CPU Usage" className="soft-header-card soft-header-amber">
                      <Progress percent={Math.min(100, Math.round(systemCpuUsage))} strokeColor="#fa8c16" />
                      <Text type="secondary">
                        Current host CPU load where Node.js is running: {systemCpuUsage.toFixed(2)}% across {server.cpuCores || 0} cores
                      </Text>
                    </Card>
                  </Col>
                  <Col xs={24} md={12}>
                    <Card size="small" title="Node.js Process CPU" className="soft-header-card soft-header-purple">
                      <Progress percent={Math.min(100, Math.round(processCpuUsage))} strokeColor="#722ed1" />
                      <Text type="secondary">
                        Current Node.js process CPU usage on this host: {processCpuUsage.toFixed(2)}%
                      </Text>
                    </Card>
                  </Col>
                  <Col xs={24} md={12}>
                    <Card size="small" title="Host System Memory" className="soft-header-card soft-header-blue">
                      <Progress percent={Math.min(100, Math.round(serverMemUsage))} strokeColor="#1677ff" />
                      <Text type="secondary">
                        Host memory used where Node.js is running: {server.memory?.usedMB || 0} MB / {server.memory?.totalMB || 0} MB
                      </Text>
                    </Card>
                  </Col>
                  <Col xs={24} md={12}>
                    <Card size="small" title="Node.js Heap Memory" className="soft-header-card soft-header-green">
                      <Progress percent={Math.min(100, Math.round(serverHeapUsage))} strokeColor="#13c2c2" />
                      <Text type="secondary">
                        Current Node.js heap usage on this host: {server.processMemory?.heapUsedMB || 0} MB / {server.processMemory?.heapTotalMB || 0} MB
                      </Text>
                    </Card>
                  </Col>
                </Row>

                <Row gutter={[16, 16]} style={{ marginTop: 10 }}>
                  <Col xs={24} md={8}>
                    <Card size="small" title="Process RSS" className="soft-header-card soft-header-blue">
                      <Statistic value={server.processMemory?.rssMB || 0} suffix="MB" />
                    </Card>
                  </Col>
                  <Col xs={24} md={8}>
                    <Card size="small" title="External Memory" className="soft-header-card soft-header-green">
                      <Statistic value={server.processMemory?.externalMB || 0} suffix="MB" />
                    </Card>
                  </Col>
                  <Col xs={24} md={8}>
                    <Card size="small" title="Database Size" className="soft-header-card soft-header-amber">
                      <Statistic value={systemHealth.dbSize || 0} suffix="MB" />
                    </Card>
                  </Col>
                </Row>

                <Row gutter={[16, 16]} style={{ marginTop: 10 }}>
                  <Col xs={24} md={8}>
                    <Card size="small" title="Platform" className="soft-header-card soft-header-purple">
                      <Text strong>{server.platform || '-'}</Text>
                      <Text type="secondary">Release: {server.release || '-'}</Text>
                    </Card>
                  </Col>
                  <Col xs={24} md={8}>
                    <Card size="small" title="Node Version" className="soft-header-card soft-header-blue">
                      <Text strong>{server.nodeVersion || '-'}</Text>
                      <Text type="secondary">Load Avg: {(server.loadAverage || []).join(', ') || '-'}</Text>
                    </Card>
                  </Col>
                  <Col xs={24} md={8}>
                    <Card size="small" title="CPU Model" className="soft-header-card soft-header-green">
                      <Text strong>{server.cpuModel || '-'}</Text>
                      <Text type="secondary">
                        Free RAM: {server.memory?.freeMB || 0} MB
                      </Text>
                    </Card>
                  </Col>
                </Row>
              </>
            )}
          </Card>
        )}
      </Spin>
    </div>
  );
}

export default SuperAdminDashboard;
