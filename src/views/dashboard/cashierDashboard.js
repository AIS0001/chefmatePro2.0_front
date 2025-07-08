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
  ComposedChart,
  RadialBarChart,
  RadialBar
} from "recharts";

// Custom color palette
const COLORS = {
  primary: "#4e73df",
  secondary: "#858796",
  success: "#1cc88a",
  info: "#36b9cc",
  warning: "#f6c23e",
  danger: "#e74a3b",
  light: "#f8f9fc",
  dark: "#5a5c69",
  purple: "#6f42c1",
  pink: "#e83e8c",
  teal: "#20c9a6"
};

const CHART_COLORS = [
  "#4e73df", "#1cc88a", "#36b9cc", "#f6c23e",
  "#e74a3b", "#6f42c1", "#e83e8c", "#20c9a6"
];

export default function CashierDashboard() {
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
  const [todaySummary, setTodaySummary] = useState({
    todaySales: 0,
    yesterdaySales: 0,
    todayPurchases: 0,
    yesterdayPurchases: 0
  });
  const [toptenProducts, setTopProducts] = useState([]);
  const [lowStockAlerts, setLowStockAlerts] = useState([]);
  const [dateRange, setDateRange] = useState('week');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        const [salesRes, purchaseRes, summaryRes, todaysummaryRes, lowStock,getTopproducts] = await Promise.all([
          axios.get(`/report/sale?range=${dateRange}`, getHeaders()),
          axios.get(`/report/purchase?range=${dateRange}`, getHeaders()),
          axios.get("/report/summary", getHeaders()),
          axios.get("/report/todaysummary", getHeaders()),
          axios.get("/report/getlowstockalert", getHeaders()),
          axios.get("/report/gettopproducts", getHeaders()),
        ]);

        setSalesData(salesRes.data);
        setPurchaseData(purchaseRes.data);

        setSummary(prev => ({
          ...prev,
           totalSales: summaryRes.data.totalSales,
          totalPurchase: summaryRes.data.totalPurchase,
          topProduct: summaryRes.data.topProduct,
          profitMargin: summaryRes.data.totalSales > 0
            ? ((summaryRes.data.totalSales - summaryRes.data.totalPurchase) / summaryRes.data.totalSales * 100).toFixed(2)
            : 0,
          lowStockItems: lowStock.data.map(item => ({
            ...item,
            stock: item.closing_stock
          })),
          topProductList: getTopproducts.data.map(item => ({
            ...item,
            stock: item.closing_stock
          })),
        }));

        setTodaySummary(todaysummaryRes.data);

        // Set low stock alerts data here
        setLowStockAlerts(lowStock.data);
        setTopProducts(getTopproducts.data);

      } catch (error) {
        toast.error("Failed to load dashboard data");
        console.error("Error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [dateRange]);


  const combinedData = salesData.map((sale, index) => ({
    date: sale.date,
    salesAmount: sale.amount,
    purchaseAmount: purchaseData[index]?.amount || 0,
    transactions: Math.floor(sale.amount / 100)
  }));

  // Radial chart data for customer stats
  const customerRadialData = [
    {
      name: 'Repeat',
      value: summary.customerStats?.repeat || 0,
      fill: COLORS.success
    },
    {
      name: 'New',
      value: summary.customerStats?.new || 0,
      fill: COLORS.info
    }
  ];

  return (
    <Layout>
      <Header title="POS Dashboard" />
      <ToastContainer />

      {/* Date Range Filter */}


      {/* Key Metrics Cards */}
      <div className="row mb-4">
        <div className="col-md-3 col-6 mb-3">
          <CardComponent
            title="Today's Sales"
            headerColor='primary'
            small
            gradient
          >
            <div className="h4 text-white">฿{todaySummary.todaySales}</div>
            {summary.todaySales > 0 && (
              <small className="text-white opacity-75">
                ↑ {((todaySummary.todaySales - todaySummary.yesterdaySales) / todaySummary.yesterdaySales * 100).toFixed(1)}% from yesterday
              </small>
            )}
          </CardComponent>
        </div>

        {/* <div className="col-md-2 col-6 mb-3">
          <CardComponent
            title="Today's Purchases"
            headerColor='warning'
            small
            gradient
          >
            <div className="h4 text-white">฿{todaySummary.todayPurchases}</div>
          </CardComponent>
        </div> */}

        <div className="col-md-3 col-6 mb-3">
          <CardComponent
            title="Net Profit"
            headerColor='success'
            small
            gradient
          >
            <div className="h4 text-white">฿{(todaySummary.todaySales - todaySummary.todayPurchases).toFixed(2)}</div>
            <small className="text-white opacity-75">Margin: {todaySummary.profitMargin}%</small>
          </CardComponent>
        </div>

        <div className="col-md-3 col-6 mb-3">
          <CardComponent
            title="Transactions"
            headerColor='info'
            small
            gradient
          >
            <div className="h4 text-white">{todaySummary.todayTransactionCount}</div>
          </CardComponent>
        </div>

        {/* <div className="col-md-2 col-6 mb-3">
          <CardComponent
            title="Top Product"
            headerColor='danger'
            small
            gradient
          >
            <div className="h6 text-white text-truncate">{summary.topProduct || "N/A"}</div>
          </CardComponent>
        </div> */}

        <div className="col-md-3 col-6 mb-3">
          <CardComponent
            title="Stock Alerts"
            headerColor='info'
            small
            gradient
          >
            <div className="h4 text-white">{summary.lowStockItems?.length || 0}</div>
            <small className="text-white opacity-75">Items low in stock</small>
          </CardComponent>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="row">
        <div className="col-lg-6 mb-4">
          <CardComponent
            title="Sales Overview"
            headerColor={COLORS.primary}
            customHeader={
              <div className="d-flex justify-content-between align-items-center">
                <h6 className="m-0 font-weight-bold">Sales Overview</h6>
                <i className="fas fa-chart-line fa-2x text-gray-300"></i>
              </div>
            }
          >
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={salesData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: COLORS.dark }}
                />
                <YAxis tick={{ fill: COLORS.dark }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="amount"
                  stroke={COLORS.primary}
                  strokeWidth={2}
                  dot={{ fill: COLORS.primary, r: 4 }}
                  activeDot={{ r: 6, fill: COLORS.primary }}
                  name="Sales (฿)"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardComponent>
        </div>

        <div className="col-lg-6 mb-4">
          <CardComponent
            title="Purchase Overview"
            headerColor={COLORS.warning}
            customHeader={
              <div className="d-flex justify-content-between align-items-center">
                <h6 className="m-0 font-weight-bold">Purchase Overview</h6>
                <i className="fas fa-shopping-cart fa-2x text-gray-300"></i>
              </div>
            }
          >
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={purchaseData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: COLORS.dark }}
                />
                <YAxis tick={{ fill: COLORS.dark }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Legend />
                <Bar
                  dataKey="amount"
                  fill={COLORS.warning}
                  radius={[4, 4, 0, 0]}
                  name="Purchases (฿)"
                />
              </BarChart>
            </ResponsiveContainer>
          </CardComponent>
        </div>
      </div>

      {/* Second Row */}
      <div className="row mb-4">
        <div className="col-lg-4 mb-4">
          <CardComponent
            title="Sales vs Purchase"
            headerColor={COLORS.success}
            customHeader={
              <div className="d-flex justify-content-between align-items-center">
                <h6 className="m-0 font-weight-bold">Sales vs Purchase</h6>
                <i className="fas fa-percentage fa-2x text-gray-300"></i>
              </div>
            }
          >
            <ResponsiveContainer width="100%" height={300}>
              {summary.totalSales > 0 || summary.totalPurchase > 0 ? (
                <PieChart width={300} height={300}>
                  <Pie
                    dataKey="value"
                    data={[
                      { name: "Sales", value: summary.totalSales },
                      { name: "Purchase", value: summary.totalPurchase },
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    <Cell fill={COLORS.primary} />
                    <Cell fill={COLORS.warning} />
                  </Pie>
                  <Tooltip
                    formatter={(value) => `$${value}`}
                    contentStyle={{
                      backgroundColor: 'white',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Legend />
                </PieChart>
              ) : (
                <div>No sales or purchase data</div>
              )}

            </ResponsiveContainer>
          </CardComponent>
        </div>

        

        <div className="col-lg-4 mb-4">
          <CardComponent
            title="Transactions & Profit"
            headerColor={COLORS.teal}
            customHeader={
              <div className="d-flex justify-content-between align-items-center">
                <h6 className="m-0 font-weight-bold">Transactions & Profit</h6>
                <i className="fas fa-exchange-alt fa-2x text-gray-300"></i>
              </div>
            }
          >
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={combinedData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: COLORS.dark }}
                />
                <YAxis
                  yAxisId="left"
                  orientation="left"
                  tick={{ fill: COLORS.dark }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fill: COLORS.dark }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Legend />
                <Bar
                  yAxisId="left"
                  dataKey="transactions"
                  fill={COLORS.purple}
                  name="Transactions"
                  radius={[4, 4, 0, 0]}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="salesAmount"
                  stroke={COLORS.teal}
                  strokeWidth={2}
                  dot={{ fill: COLORS.teal, r: 4 }}
                  activeDot={{ r: 6, fill: COLORS.teal }}
                  name="Sales ($)"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </CardComponent>
        </div>
      </div>

      {/* Third Row */}
      <div className="row mb-4">
        <div className="col-lg-6 mb-4">
          <CardComponent
            title="Monthly Comparison"
            headerColor={COLORS.info}
            customHeader={
              <div className="d-flex justify-content-between align-items-center">
                <h6 className="m-0 font-weight-bold">Monthly Comparison</h6>
                <i className="fas fa-balance-scale fa-2x text-gray-300"></i>
              </div>
            }
          >
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={combinedData}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.8} />
                    <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorPurchases" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.warning} stopOpacity={0.8} />
                    <stop offset="95%" stopColor={COLORS.warning} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: COLORS.dark }}
                />
                <YAxis tick={{ fill: COLORS.dark }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="salesAmount"
                  stroke={COLORS.primary}
                  fillOpacity={1}
                  fill="url(#colorSales)"
                  name="Sales ($)"
                />
                <Area
                  type="monotone"
                  dataKey="purchaseAmount"
                  stroke={COLORS.warning}
                  fillOpacity={1}
                  fill="url(#colorPurchases)"
                  name="Purchases ($)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardComponent>
        </div>

        <div className="col-lg-4 mb-4">
          <CardComponent
            title="Summary & Alerts"
            headerColor={COLORS.danger}
            customHeader={
              <div className="d-flex justify-content-between align-items-center">
                <h6 className="m-0 font-weight-bold">Summary & Alerts</h6>
                <i className="fas fa-exclamation-triangle fa-2x text-gray-300"></i>
              </div>
            }
          >
            <div className="row">
 

  <div className="col-lg-8 col-md-6 col-sm-12 mb-3">
    <div className="card border-0 shadow-sm h-100">
      <div className="card-header bg-white py-2">
        <h6 className="m-0 font-weight-bold text-gray-800">Low Stock Alerts</h6>
      </div>
      <div className="card-body p-0">
        {lowStockAlerts.length > 0 ? (
          <ul className="list-group list-group-flush">
            {lowStockAlerts.map((item, i) => (
              <li
                key={i}
                className="list-group-item d-flex justify-content-between align-items-center py-2"
              >
                <span>{item.iname}</span>
                <span
                  className="badge badge-pill"
                  style={{
                    backgroundColor:
                      item.closing_stock < 5 ? COLORS.danger : COLORS.warning,
                    color: 'white'
                  }}
                >
                  {item.closing_stock} left
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="alert alert-success m-2">All items are well stocked</div>
        )}
      </div>
    </div>
  </div>
  
</div>

          </CardComponent>
        </div>
      </div>
    </Layout>
  );
}