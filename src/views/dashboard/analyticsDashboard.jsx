import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area } from 'recharts';
import axios from 'axios';
import { getHeaders } from '../../utility/getHeader';
import Layout from "../../layout/Layout";
import Header from "../../components/Header";
import './analyticsDashboard.css';

function AnalyticsDashboard() {
  const [dashboardData, setDashboardData] = useState({
    todaySales: 0,
    yesterdaySales: 0,
    monthlyPurchases: 0,
    todayPurchases: 0,
    totalOrders: 0,
    totalSuppliers: 0
  });

  const [monthlySalesData, setMonthlySalesData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [topProductsData, setTopProductsData] = useState([]);
  const [suppliersData, setSuppliersData] = useState([]);
  const [orderStatusData, setOrderStatusData] = useState([]);
  const [salesExpensesData, setSalesExpensesData] = useState({
    totalSales: 0,
    totalExpenses: 0,
    netProfit: 0
  });
  const [dailySalesData, setDailySalesData] = useState([]);
  const [purchaseTrendsData, setPurchaseTrendsData] = useState([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // API Functions
  const fetchDashboardData = async () => {
    try {
      const response = await axios.get('analytics/dashboard', getHeaders());
      if (response.data.success) {
        setDashboardData(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data');
    }
  };

  const fetchMonthlySalesData = async () => {
    try {
      const response = await axios.get('/analytics/monthly-sales-purchases', getHeaders());
      if (response.data.success) {
        setMonthlySalesData(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching monthly sales data:', error);
      // Keep empty array on error - chart will show empty state
    }
  };

  const fetchSuppliersData = async () => {
    try {
      const response = await axios.get('analytics/suppliers-outstanding', getHeaders());
      if (response.data.success) {
        const formattedData = response.data.data.map(supplier => ({
          name: supplier.supplier_name,
          orders: supplier.total_orders,
          amount: supplier.total_amount,
          rating: supplier.avg_rating
        }));
        setSuppliersData(formattedData);
      }
    } catch (error) {
      console.error('Error fetching suppliers data:', error);
      // Keep empty array on error
    }
  };

  const fetchOrderStatusData = async () => {
    try {
      const response = await axios.get('analytics/order-status', getHeaders());
      if (response.data.success) {
        setOrderStatusData(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching order status data:', error);
      // Keep empty array on error
    }
  };

  const fetchTopProductsData = async () => {
    try {
      const response = await axios.get('analytics/top-products', getHeaders());
      if (response.data.success) {
        setTopProductsData(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching top products data:', error);
      // Keep empty array on error
    }
  };

  const fetchCategoryData = async () => {
    try {
      const response = await axios.get('analytics/category-distribution', getHeaders());
      if (response.data.success) {
        setCategoryData(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching category data:', error);
      // Keep empty array on error
    }
  };

  const fetchSalesExpensesData = async () => {
    try {
      const response = await axios.get('analytics/sales-expenses', getHeaders());
      if (response.data.success) {
        setSalesExpensesData(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching sales expenses data:', error);
      // Keep default values on error
    }
  };

  const fetchDailySalesData = async () => {
    try {
      const response = await axios.get('analytics/daily-sales-trend', getHeaders());
      if (response.data.success) {
        setDailySalesData(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching daily sales data:', error);
      // Keep empty array on error
    }
  };

  const fetchPurchaseTrendsData = async () => {
    try {
      const response = await axios.get('analytics/analytics/purchase-trends', getHeaders());
      if (response.data.success) {
        setPurchaseTrendsData(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching purchase trends data:', error);
      // Keep empty array on error
    }
  };

  useEffect(() => {
    const fetchAllData = async () => {
      setIsLoading(true);
      try {
        await Promise.all([
          fetchDashboardData(),
          fetchMonthlySalesData(),
          fetchSuppliersData(),
          fetchOrderStatusData(),
          fetchTopProductsData(),
          fetchCategoryData(),
          fetchSalesExpensesData(),
          fetchDailySalesData(),
          fetchPurchaseTrendsData()
        ]);
      } catch (error) {
        console.error('Error fetching analytics data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllData();
  }, []);

  if (isLoading) {
    return (
      <Layout>
        <Header title="Analytics Dashboard" />
        <div className="container-fluid">
          <div className="row justify-content-center mt-5">
            <div className="col-md-6 text-center">
              <div className="spinner-border text-primary" role="status">
                <span className="sr-only">Loading...</span>
              </div>
              <p className="mt-3">Loading analytics dashboard...</p>
              {error && (
                <div className="alert alert-warning mt-3">
                  <small>{error}</small>
                </div>
              )}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Header title="Analytics Dashboard" />
      <div className="analytics-dashboard">
        
        {/* Error Alert */}
        {error && (
          <div className="alert alert-warning alert-dismissible fade show mb-4" role="alert">
            <strong>Warning:</strong> {error}
            <button 
              type="button" 
              className="btn-close" 
              onClick={() => setError(null)}
              aria-label="Close"
            ></button>
          </div>
        )}

        {/* Refresh Button */}
        <div className="row mb-3">
          <div className="col-12 text-end">
            <button 
              className="btn btn-outline-primary btn-sm"
              onClick={() => {
                setError(null);
                setIsLoading(true);
                const fetchAllData = async () => {
                  try {
                    await Promise.all([
                      fetchDashboardData(),
                      fetchMonthlySalesData(),
                      fetchSuppliersData(),
                      fetchOrderStatusData(),
                      fetchTopProductsData(),
                      fetchCategoryData(),
                      fetchSalesExpensesData(),
                      fetchDailySalesData(),
                      fetchPurchaseTrendsData()
                    ]);
                  } catch (error) {
                    console.error('Error refreshing analytics data:', error);
                    setError('Failed to refresh dashboard data');
                  } finally {
                    setIsLoading(false);
                  }
                };
                fetchAllData();
              }}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                  Refreshing...
                </>
              ) : (
                <>
                  <i className="fas fa-sync-alt me-2"></i>
                  Refresh Data
                </>
              )}
            </button>
          </div>
        </div>
        
        {/* Top Metrics Row */}
        <div className="row mb-4">
          <div className="col-lg-2 col-md-4 col-sm-6 mb-3">
            <div className="metric-card-analytics today-customers">
              <div className="metric-header">
                <span className="metric-value">฿{dashboardData.todaySales?.toLocaleString() || '0'}</span>
                <span className="metric-label">Today's Sales</span>
              </div>
            </div>
          </div>
          
          <div className="col-lg-2 col-md-4 col-sm-6 mb-3">
            <div className="metric-card-analytics yesterday-customers">
              <div className="metric-header">
                <span className="metric-value">฿{dashboardData.yesterdaySales?.toLocaleString() || '0'}</span>
                <span className="metric-label">Yesterday's Sales</span>
              </div>
            </div>
          </div>
          
          <div className="col-lg-2 col-md-4 col-sm-6 mb-3">
            <div className="metric-card-analytics monthly-revenue">
              <div className="metric-header">
                <span className="metric-value">฿{dashboardData.monthlyPurchases?.toLocaleString() || '0'}</span>
                <span className="metric-label">Monthly Purchases</span>
                <span className="metric-subtext">Total procurement</span>
              </div>
            </div>
          </div>
          
          <div className="col-lg-2 col-md-4 col-sm-6 mb-3">
            <div className="metric-card-analytics daily-revenue">
              <div className="metric-header">
                <span className="metric-value">฿{dashboardData.todayPurchases?.toLocaleString() || '0'}</span>
                <span className="metric-label">Today's Purchases</span>
                <span className="metric-subtext">Daily procurement</span>
              </div>
            </div>
          </div>
          
          <div className="col-lg-2 col-md-4 col-sm-6 mb-3">
            <div className="metric-card-analytics total-calls">
              <div className="metric-header">
                <span className="metric-value">{dashboardData.totalOrders || 0}</span>
                <span className="metric-label">Total Orders</span>
                <span className="metric-subtext">This month</span>
              </div>
            </div>
          </div>
          
          <div className="col-lg-2 col-md-4 col-sm-6 mb-3">
            <div className="metric-card-analytics total-emails">
              <div className="metric-header">
                <span className="metric-value">{dashboardData.totalSuppliers || 0}</span>
                <span className="metric-label">Active Suppliers</span>
                <span className="metric-subtext">Verified vendors</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Row */}
        <div className="row">
          {/* Left Column */}
          <div className="col-lg-3 col-md-12 mb-4">
            {/* Suppliers Outstanding Payment */}
            <div className="analytics-panel agents-panel">
              <div className="panel-header">
                <h6>SUPPLIERS OUTSTANDING PAYMENT</h6>
              </div>
              <div className="panel-content">
                <div className="agents-list">
                  {suppliersData && suppliersData.length > 0 ? (
                    suppliersData.map((supplier, index) => (
                      <div key={index} className="agent-item">
                        <div className="agent-name">{supplier.name}</div>
                        <div className="agent-stats">
                          <span className="stat-item">Orders: {supplier.orders}</span>
                          <span className="stat-item">Amount: ฿{supplier.amount?.toLocaleString() || '0'}</span>
                          <span className="stat-item">Rating: {supplier.rating}⭐</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-3">
                      <p className="text-muted">No supplier data available</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Center Column */}
          <div className="col-lg-6 col-md-12 mb-4">
            {/* Monthly Sales vs Purchases Flow */}
            <div className="analytics-panel chart-panel">
              <div className="panel-header">
                <h6>MONTHLY SALES VS PURCHASES FLOW</h6>
              </div>
              <div className="panel-content">
                {monthlySalesData && monthlySalesData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={monthlySalesData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#bdc3c7" />
                      <XAxis dataKey="month" stroke="#2c3e50" fontSize={12} />
                      <YAxis stroke="#2c3e50" fontSize={12} />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: '#ffffff',
                          border: '1px solid #bdc3c7',
                          borderRadius: '8px',
                          color: '#2c3e50'
                        }}
                      />
                      <Bar dataKey="sales" fill="#27ae60" name="Sales" />
                      <Bar dataKey="purchases" fill="#e74c3c" name="Purchases" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-5">
                    <p className="text-muted">No sales data available</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="col-lg-3 col-md-12 mb-4">
            {/* Order Status */}
            <div className="analytics-panel status-panel">
              <div className="panel-header">
                <h6>ORDER WISE STATUS</h6>
              </div>
              <div className="panel-content">
                <div className="status-list">
                  {orderStatusData && orderStatusData.length > 0 ? (
                    orderStatusData.map((status, index) => (
                      <div key={index} className="status-item">
                        <div className="status-indicator" style={{backgroundColor: status.color}}></div>
                        <div className="status-info">
                          <span className="status-name">{status.status}</span>
                          <span className="status-value">{status.value}%</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-3">
                      <p className="text-muted">No order status data available</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Row */}
        <div className="row">
          {/* Total Sales & Expenses */}
          <div className="col-lg-3 col-md-6 mb-4">
            <div className="analytics-panel sales-panel">
              <div className="panel-header">
                <h6>TOTAL SALES & EXPENSES</h6>
              </div>
              <div className="panel-content">
                <div className="sales-metrics">
                  <div className="sales-item">
                    <span className="sales-label">Total Sales</span>
                    <span className="sales-value">฿{salesExpensesData.totalSales?.toLocaleString() || '0'}</span>
                  </div>
                  <div className="sales-item">
                    <span className="sales-label">Total Expenses</span>
                    <span className="sales-value">฿{salesExpensesData.totalExpenses?.toLocaleString() || '0'}</span>
                  </div>
                  <div className="sales-item profit">
                    <span className="sales-label">Net Profit</span>
                    <span className="sales-value">฿{salesExpensesData.netProfit?.toLocaleString() || '0'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Top Products */}
          <div className="col-lg-3 col-md-6 mb-4">
            <div className="analytics-panel agents-ranking-panel">
              <div className="panel-header">
                <h6>TOP SELLING PRODUCTS</h6>
              </div>
              <div className="panel-content">
                <div className="agents-ranking">
                  {topProductsData && topProductsData.length > 0 ? (
                    topProductsData.map((product, index) => (
                      <div key={index} className="ranking-item">
                        <span className="rank">#{index + 1}</span>
                        <span className="agent-name">{product.name}</span>
                        <span className="agent-score">{product.sales}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-3">
                      <p className="text-muted">No product data available</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Category Distribution */}
          <div className="col-lg-3 col-md-6 mb-4">
            <div className="analytics-panel suppliers-panel">
              <div className="panel-header">
                <h6>CATEGORY DISTRIBUTION</h6>
              </div>
              <div className="panel-content">
                {categoryData && categoryData.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={categoryData}
                          cx="50%"
                          cy="50%"
                          outerRadius={60}
                          dataKey="value"
                        >
                          {categoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: '#ffffff',
                            border: '1px solid #bdc3c7',
                            borderRadius: '8px',
                            color: '#2c3e50'
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="suppliers-legend">
                      {categoryData.map((category, index) => (
                        <div key={index} className="legend-item">
                          <div className="legend-color" style={{backgroundColor: category.color}}></div>
                          <span className="legend-text">{category.name}</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-5">
                    <p className="text-muted">No category data available</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Customer Sources */}
          <div className="col-lg-3 col-md-6 mb-4">
            <div className="analytics-panel leads-panel">
              <div className="panel-header">
                <h6>CUSTOMER SOURCES</h6>
              </div>
              <div className="panel-content">
                <div className="funnel-chart">
                  {topProductsData && topProductsData.length > 0 ? (
                    topProductsData.map((product, index) => {
                      const maxSales = Math.max(...topProductsData.map(p => p.sales));
                      return (
                        <div key={index} className="funnel-item">
                          <div 
                            className="funnel-bar" 
                            style={{
                              width: `${(product.sales / maxSales) * 100}%`,
                              backgroundColor: product.color
                            }}
                          >
                            <span className="funnel-label">{product.name}</span>
                            <span className="funnel-value">฿{product.revenue?.toLocaleString() || '0'}</span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-3">
                      <p className="text-muted">No customer source data available</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Charts Row */}
        <div className="row">
          {/* Daily Sales Trend */}
          <div className="col-lg-4 col-md-12 mb-4">
            <div className="analytics-panel bottom-chart-panel">
              <div className="panel-header">
                <h6>DAILY SALES TREND</h6>
              </div>
              <div className="panel-content">
                {dailySalesData && dailySalesData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={150}>
                    <AreaChart data={dailySalesData}>
                      <Area 
                        type="monotone" 
                        dataKey="sales" 
                        stroke="#27ae60" 
                        fill="#27ae60" 
                        fillOpacity={0.6}
                      />
                      <XAxis dataKey="day" stroke="#2c3e50" fontSize={10} />
                      <YAxis stroke="#2c3e50" fontSize={10} />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: '#ffffff',
                          border: '1px solid #bdc3c7',
                          borderRadius: '8px',
                          color: '#2c3e50'
                        }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-5">
                    <p className="text-muted">No daily sales data available</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Purchase Trends */}
          <div className="col-lg-4 col-md-12 mb-4">
            <div className="analytics-panel bottom-chart-panel">
              <div className="panel-header">
                <h6>PURCHASE TRENDS</h6>
              </div>
              <div className="panel-content">
                {purchaseTrendsData && purchaseTrendsData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={150}>
                    <LineChart data={purchaseTrendsData}>
                      <Line 
                        type="monotone" 
                        dataKey="purchases" 
                        stroke="#e74c3c" 
                        strokeWidth={3}
                        dot={{ fill: '#e74c3c', strokeWidth: 2, r: 4 }}
                      />
                      <XAxis dataKey="day" stroke="#2c3e50" fontSize={10} />
                      <YAxis stroke="#2c3e50" fontSize={10} />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: '#ffffff',
                          border: '1px solid #bdc3c7',
                          borderRadius: '8px',
                          color: '#2c3e50'
                        }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-5">
                    <p className="text-muted">No purchase trends data available</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Revenue Overview */}
          <div className="col-lg-4 col-md-12 mb-4">
            <div className="analytics-panel bottom-chart-panel">
              <div className="panel-header">
                <h6>REVENUE OVERVIEW</h6>
              </div>
              <div className="panel-content">
                {monthlySalesData && monthlySalesData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={150}>
                    <BarChart data={monthlySalesData.slice(-6)}>
                      <Bar dataKey="sales" fill="#3498db" />
                      <XAxis dataKey="month" stroke="#2c3e50" fontSize={10} />
                      <YAxis stroke="#2c3e50" fontSize={10} />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: '#ffffff',
                          border: '1px solid #bdc3c7',
                          borderRadius: '8px',
                          color: '#2c3e50'
                        }}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-5">
                    <p className="text-muted">No revenue data available</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

      </div>
    </Layout>
  );
}

export default AnalyticsDashboard;
