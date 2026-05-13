import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { Alert, Button, Card, Col, Empty, Row, Skeleton, Space, Statistic, Tag, Typography } from "antd";
import {
  AreaChart,
  Area,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

import Layout from "../../layout/Layout";
import Header from "../../components/Header";
import { getHeaders } from "../../utility/getHeader";

import "./accountDashboard.css";

const VAT_REPORTS = [
  { name: "Sale Report", path: "/reports/billhistory" },
  { name: "Quotation History", path: "/quotation-history" },
  { name: "Item Wise", path: "/reports/itemwisesummaryvat" },
  { name: "Pre Orders", path: "/reports/advanceorderreport" },
  { name: "Purchase Report", path: "/inventory/stockreports" },
  { name: "Low Stock Items", path: "/reports/lowstockitems" },
  { name: "Supplier Ledger", path: "/reports/supplierledger" },
  { name: "Customer Ledger", path: "/reports/saleledger" },
  { name: "Day Close", path: "/reports/dayclose" },
  { name: "Support Tickets", path: "/support/tickets" }
];

export default function AccountDashboard() {
  const { Text } = Typography;
  const [todaySummary, setTodaySummary] = useState(null);
  const [hourlySales, setHourlySales] = useState([]);
  const [reportLinks] = useState(VAT_REPORTS);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setIsLoading(true);
        setLoadError("");

        const [todayRes, hourlyRes] = await Promise.all([
          axios.get("/accounts/dashboard", getHeaders()),
          axios.get("/accounts/revenue/hourly", getHeaders())
        ]);

        const dashboardData = todayRes?.data?.data || {};
        const todayData = dashboardData?.todaySummary || {};
        const paymentList = Array.isArray(dashboardData?.paymentBreakdown)
          ? dashboardData.paymentBreakdown
          : [];

        const paymentBreakdown = paymentList.reduce(
          (acc, current) => {
            const mode = String(current?.mode || "").toLowerCase();
            const amount = Number(current?.amount || 0).toFixed(2);
            if (mode === "cash") acc.cash = amount;
            if (mode === "card") acc.card = amount;
            if (mode === "upi") acc.upi = amount;
            if (mode === "online") acc.online = amount;
            return acc;
          },
          { cash: "0.00", card: "0.00", upi: "0.00", online: "0.00" }
        );

        let resolvedSummary = {
          totalSales: Number(todayData?.sales || 0).toFixed(2),
          totalOrders: Number(todayData?.orders || 0),
          avgOrderValue: Number(
            todayData?.orders > 0
              ? Number(todayData?.sales || 0) / Number(todayData?.orders || 1)
              : 0
          ).toFixed(2),
          paymentBreakdown
        };

        // Fallback for environments where /accounts/dashboard may be partial or outdated.
        if (!todayData || Object.keys(todayData).length === 0) {
          const fallbackRes = await axios.get("/accounts/sales/today", getHeaders());
          resolvedSummary = fallbackRes?.data?.data || resolvedSummary;
        }

        setTodaySummary(resolvedSummary);
        setHourlySales(hourlyRes?.data?.data?.hourlyBreakdown || []);
      } catch (error) {
        console.error("Account dashboard load error:", error);
        setLoadError(
          error?.response?.data?.error ||
          error?.response?.data?.message ||
          "Unable to load account dashboard data"
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const chartData = useMemo(() => (
    hourlySales.map(item => ({
      ...item,
      revenue: Number(item.revenue || 0),
      orders: Number(item.orders || 0)
    }))
  ), [hourlySales]);

  const paymentBreakdown = todaySummary?.paymentBreakdown || {
    cash: "0.00",
    card: "0.00",
    upi: "0.00",
    online: "0.00"
  };

  const hasChartData = chartData.some((item) => Number(item.revenue || 0) > 0 || Number(item.orders || 0) > 0);

  const formatCurrency = (value) => `฿${Number(value || 0).toFixed(2)}`;

  return (
    <Layout>
      <Header title="Accounts Dashboard" />

      <div className="account-dashboard">
        {isLoading && <Skeleton active paragraph={{ rows: 8 }} />}

        {!isLoading && loadError && (
          <Alert
            type="error"
            showIcon
            message="Dashboard API error"
            description={loadError}
            style={{ marginBottom: 16 }}
          />
        )}

        {!isLoading && (
          <Space direction="vertical" size={16} style={{ width: "100%" }}>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} lg={6}>
                <Card className="account-color-card account-color-card-sales">
                  <Statistic
                    title={<span className="account-card-title">Total Sales</span>}
                    value={Number(todaySummary?.totalSales || 0)}
                    precision={2}
                    prefix="฿"
                    valueStyle={{ color: "#ffffff" }}
                  />
                  <Text className="account-card-subtitle">Avg Order: {formatCurrency(todaySummary?.avgOrderValue || 0)}</Text>
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card className="account-color-card account-color-card-orders">
                  <Statistic
                    title={<span className="account-card-title">Total Orders</span>}
                    value={Number(todaySummary?.totalOrders || 0)}
                    valueStyle={{ color: "#ffffff" }}
                  />
                  <Text className="account-card-subtitle">Today</Text>
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card className="account-color-card account-color-card-cash">
                  <Statistic
                    title={<span className="account-card-title">Cash Sales</span>}
                    value={Number(paymentBreakdown.cash || 0)}
                    precision={2}
                    prefix="฿"
                    valueStyle={{ color: "#ffffff" }}
                  />
                  <Text className="account-card-subtitle">Card: {formatCurrency(paymentBreakdown.card || 0)}</Text>
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card className="account-color-card account-color-card-upi">
                  <Statistic
                    title={<span className="account-card-title">UPI / Online</span>}
                    value={Number(paymentBreakdown.upi || 0)}
                    precision={2}
                    prefix="฿"
                    valueStyle={{ color: "#ffffff" }}
                  />
                  <Text className="account-card-subtitle">Online: {formatCurrency(paymentBreakdown.online || 0)}</Text>
                </Card>
              </Col>
            </Row>

            <Card
              className="account-analytics-card"
              title="Daily Sales Analytics"
              extra={<Tag color="blue">Ant Design</Tag>}
            >
              {hasChartData ? (
                <div className="chart-container">
                  <ResponsiveContainer width="100%" height={320}>
                    <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#1677ff" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#1677ff" stopOpacity={0.1} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="timeLabel" />
                      <YAxis />
                      <Tooltip formatter={(value) => [formatCurrency(value), "Revenue"]} />
                      <Area type="monotone" dataKey="revenue" stroke="#1677ff" fillOpacity={1} fill="url(#colorRevenue)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <Empty description="No analytics records for today" />
              )}
            </Card>

            <Card className="account-reports-card" title="Analytics Reports" extra={<Tag color="gold">ANT Design</Tag>}>
              <Row gutter={[12, 12]}>
                {reportLinks.map((report) => (
                  <Col xs={24} sm={12} md={8} lg={6} key={report.path}>
                    <Link to={report.path}>
                      <Button block type="default" className="account-report-btn" style={{ textAlign: "left" }}>
                        {report.name}
                      </Button>
                    </Link>
                  </Col>
                ))}
              </Row>
            </Card>
          </Space>
        )}
      </div>
    </Layout>
  );
}
