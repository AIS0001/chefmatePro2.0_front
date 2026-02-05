import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
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
import CardComponent from "../../components/cards/CardComponent";
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
  { name: "Day Close", path: "/reports/dayclose" }
];

export default function AccountDashboard() {
  const [todaySummary, setTodaySummary] = useState(null);
  const [hourlySales, setHourlySales] = useState([]);
  const [reportLinks] = useState(VAT_REPORTS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setIsLoading(true);
        const [todayRes, hourlyRes] = await Promise.all([
          axios.get("/accounts/sales/today", getHeaders()),
          axios.get("/accounts/revenue/hourly", getHeaders())
        ]);

        setTodaySummary(todayRes?.data?.data || null);
        setHourlySales(hourlyRes?.data?.data?.hourlyBreakdown || []);
      } catch (error) {
        console.error("Account dashboard load error:", error);
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

  return (
    <Layout>
      <Header title="Accounts Dashboard" />

      <div className="account-dashboard">
        {isLoading ? (
          <div className="loading-state">Loading dashboard...</div>
        ) : (
          <>
            <div className="row mb-4">
              <div className="col-lg-3 col-md-6 mb-3">
                <CardComponent title="Total Sales" headerColor="primary" pull="left">
                  <div className="summary-value">฿{todaySummary?.totalSales || "0.00"}</div>
                  <div className="summary-sub">Avg Order: ฿{todaySummary?.avgOrderValue || "0.00"}</div>
                </CardComponent>
              </div>
              <div className="col-lg-3 col-md-6 mb-3">
                <CardComponent title="Total Orders" headerColor="success" pull="left">
                  <div className="summary-value">{todaySummary?.totalOrders || 0}</div>
                  <div className="summary-sub">Today</div>
                </CardComponent>
              </div>
              <div className="col-lg-3 col-md-6 mb-3">
                <CardComponent title="Cash Sales" headerColor="info" pull="left">
                  <div className="summary-value">฿{paymentBreakdown.cash}</div>
                  <div className="summary-sub">Card: ฿{paymentBreakdown.card}</div>
                </CardComponent>
              </div>
              <div className="col-lg-3 col-md-6 mb-3">
                <CardComponent title="UPI / Online" headerColor="warning" pull="left">
                  <div className="summary-value">฿{paymentBreakdown.upi}</div>
                  <div className="summary-sub">Online: ฿{paymentBreakdown.online}</div>
                </CardComponent>
              </div>
            </div>

            <div className="row mb-4">
              <div className="col-12">
                <CardComponent title="Daily Sales Analytics" headerColor="primary" pull="left">
                  <div className="chart-container">
                    <ResponsiveContainer width="100%" height={320}>
                      <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#4e73df" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#4e73df" stopOpacity={0.1} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="timeLabel" />
                        <YAxis />
                        <Tooltip formatter={(value) => [`฿${Number(value).toFixed(2)}`, "Revenue"]} />
                        <Area type="monotone" dataKey="revenue" stroke="#4e73df" fillOpacity={1} fill="url(#colorRevenue)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardComponent>
              </div>
            </div>

            <div className="row">
              <div className="col-12">
                <CardComponent title="Reports" headerColor="dark" pull="left">
                  <div className="reports-grid">
                    {reportLinks.map((report) => (
                      <Link key={report.path} to={report.path} className="report-link">
                        <div className="report-card">
                          <span>{report.name}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </CardComponent>
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
