/* eslint-disable no-undef */
import React, { useEffect, useState } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { format } from "date-fns";

import Layout from "../../layout/Layout";
import Header from "../../components/Header";
import CardComponent from "../../components/cards/CardComponent";
import { getHeaders } from "../../utility/getHeader";

import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
  CartesianGrid,
  AreaChart,
  Area,
  ComposedChart
} from "recharts";

export default function Dashboard() {
  const [salesData, setSalesData] = useState([]);
  const [purchaseData, setPurchaseData] = useState([]);
  const [summary, setSummary] = useState({ 
    totalSales: 0, 
    totalPurchase: 0,
    todaySales: 0,
    todayPurchases: 0,
    transactionsCount: 0,
    topProduct: '',
    profitMargin: 0,
    customerStats: {
      repeat: 0,
      new: 0
    },
    topCustomers: [],
    lowStockItems: []
  });

  const [dateRange, setDateRange] = useState('week');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        const [salesRes, purchaseRes, summaryRes] = await Promise.all([
          axios.get(`/report/sale?range=${dateRange}`, getHeaders()),
          axios.get(`/report/purchase?range=${dateRange}`, getHeaders()),
          axios.get("/report/summary", getHeaders()),
        ]);

        setSalesData(salesRes.data);
        setPurchaseData(purchaseRes.data);
        setSummary({
          ...summaryRes.data,
          profitMargin: summaryRes.data.totalSales > 0 ? 
            ((summaryRes.data.totalSales - summaryRes.data.totalPurchase) / summaryRes.data.totalSales * 100).toFixed(2) : 0
        });
      } catch (error) {
        toast.error("Failed to load dashboard data");
        console.error("Error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [dateRange]);

  const COLORS = ["#4B6587", "#FC5C65", "#45AAF2", "#F7B731", "#26DE81"];
  const CUSTOMER_COLORS = ["#FC427B", "#2D98DA"];

  const combinedData = salesData.map((sale, index) => ({
    date: sale.date,
    salesAmount: sale.amount,
    purchaseAmount: purchaseData[index]?.amount || 0,
    transactions: Math.floor(sale.amount / 100)
  }));

  return (
    <Layout>
      <Header title="POS Dashboard" />
      <ToastContainer />

      {/* Date Range Filter */}
       <div className="mb-3 text-right">
        <select 
          className="form-control form-control-sm d-inline-block w-auto border border-secondary rounded-pill"
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
        >
          <option value="day">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="year">This Year</option>
        </select>
      </div>

      {/* Key Metrics Cards */}
      <div className="row mb-4">
        <div className="col-md-2 col-6">
          <CardComponent title="Today's Sales" headerColor="green" small>
            <div className="h4">${summary.todaySales}</div>
            {summary.todaySales > 0 && (
              <small className="text-success">
                ↑ {((summary.todaySales - summary.yesterdaySales) / summary.yesterdaySales * 100).toFixed(1)}% from yesterday
              </small>
            )}
          </CardComponent>
        </div>

        <div className="col-md-2 col-6">
          <CardComponent title="Today's Purchases" headerColor="orange" small>
            <div className="h4">${summary.todayPurchases}</div>
          </CardComponent>
        </div>

        <div className="col-md-2 col-6">
          <CardComponent title="Net Profit" headerColor="blue" small>
            <div className="h4">${(summary.todaySales - summary.todayPurchases).toFixed(2)}</div>
            <small>Margin: {summary.profitMargin}%</small>
          </CardComponent>
        </div>

        <div className="col-md-2 col-6">
          <CardComponent title="Transactions" headerColor="purple" small>
            <div className="h4">{summary.transactionsCount}</div>
          </CardComponent>
        </div>

        <div className="col-md-2 col-6">
          <CardComponent title="Top Product" headerColor="teal" small>
            <div className="h6 text-truncate">{summary.topProduct || 'N/A'}</div>
          </CardComponent>
        </div>

        <div className="col-md-2 col-6">
          <CardComponent title="Stock Alerts" headerColor="red" small>
            <div className="h4">{summary.lowStockItems?.length || 0}</div>
            <small>Items low in stock</small>
          </CardComponent>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="row">
        <div className="col-lg-6">
          <CardComponent title="Sales Overview" headerColor="green">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="amount" stroke="#8884d8" name="Sales" />
              </LineChart>
            </ResponsiveContainer>
          </CardComponent>
        </div>

        <div className="col-lg-6">
          <CardComponent title="Purchase Overview" headerColor="orange">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={purchaseData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="amount" fill="#82ca9d" name="Purchases" />
              </BarChart>
            </ResponsiveContainer>
          </CardComponent>
        </div>
      </div>

      {/* Second Row */}
      <div className="row mt-4">
        <div className="col-lg-4">
          <CardComponent title="Sales vs Purchase" headerColor="blue">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  dataKey="value"
                  data={[
                    { name: "Sales", value: summary.totalSales },
                    { name: "Purchase", value: summary.totalPurchase },
                  ]}
                  outerRadius={100}
                  fill="#8884d8"
                  label
                >
                  {[
                    { name: "Sales", value: summary.totalSales },
                    { name: "Purchase", value: summary.totalPurchase },
                  ].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `$${value}`} />
              </PieChart>
            </ResponsiveContainer>
          </CardComponent>
        </div>

        <div className="col-lg-4">
          <CardComponent title="Customer Insights" headerColor="purple">
            <div className="row">
              <div className="col-md-6">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Repeat", value: summary.customerStats?.repeat || 0 },
                        { name: "New", value: summary.customerStats?.new || 0 }
                      ]}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label
                    >
                      <Cell fill="#FF6384" />
                      <Cell fill="#36A2EB" />
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="col-md-6">
                <h6>Top Customers</h6>
                <ul className="list-group">
                  {summary.topCustomers?.slice(0, 3).map((customer, i) => (
                    <li key={i} className="list-group-item d-flex justify-content-between align-items-center py-1">
                      <span className="text-truncate" style={{maxWidth: '100px'}}>{customer.name}</span>
                      <span className="badge badge-primary badge-pill">${customer.total}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardComponent>
        </div>

        <div className="col-lg-4">
          <CardComponent title="Transactions & Profit" headerColor="teal">
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={combinedData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" orientation="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="transactions" fill="#413ea0" name="Transactions" />
                <Line yAxisId="right" type="monotone" dataKey="salesAmount" stroke="#ff7300" name="Sales ($)" />
              </ComposedChart>
            </ResponsiveContainer>
          </CardComponent>
        </div>
      </div>

      {/* Third Row */}
      <div className="row mt-4">
        <div className="col-lg-6">
          <CardComponent title="Monthly Comparison" headerColor="indigo">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={combinedData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="salesAmount" stackId="1" stroke="#8884d8" fill="#8884d8" name="Sales" />
                <Area type="monotone" dataKey="purchaseAmount" stackId="2" stroke="#82ca9d" fill="#82ca9d" name="Purchases" />
              </AreaChart>
            </ResponsiveContainer>
          </CardComponent>
        </div>

        <div className="col-lg-6">
          <CardComponent title="Summary & Alerts" headerColor="red">
            <div className="row">
              <div className="col-md-6">
                <ul className="list-group">
                  <li className="list-group-item d-flex justify-content-between align-items-center">
                    Total Sales
                    <span className="badge badge-success badge-pill">${summary.totalSales}</span>
                  </li>
                  <li className="list-group-item d-flex justify-content-between align-items-center">
                    Total Purchases
                    <span className="badge badge-primary badge-pill">${summary.totalPurchase}</span>
                  </li>
                  <li className="list-group-item d-flex justify-content-between align-items-center">
                    Gross Profit
                    <span className="badge badge-info badge-pill">
                      ${(summary.totalSales - summary.totalPurchase).toFixed(2)}
                    </span>
                  </li>
                  <li className="list-group-item d-flex justify-content-between align-items-center">
                    Profit Margin
                    <span className="badge badge-dark badge-pill">
                      {summary.profitMargin}%
                    </span>
                  </li>
                </ul>
              </div>
              <div className="col-md-6">
                <h6>Low Stock Alerts</h6>
                {summary.lowStockItems?.length > 0 ? (
                  <ul className="list-group">
                    {summary.lowStockItems.map((item, i) => (
                      <li key={i} className="list-group-item d-flex justify-content-between align-items-center py-1">
                        <span>{item.name}</span>
                        <span className="badge badge-danger badge-pill">{item.stock} left</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="alert alert-success">All items are well stocked</div>
                )}
              </div>
            </div>
          </CardComponent>
        </div>
      </div>
    </Layout>
  );
}