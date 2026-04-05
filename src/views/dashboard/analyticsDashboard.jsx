import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area } from 'recharts';
import axios from 'axios';
import { getHeaders } from '../../utility/getHeader';
import Layout from "../../layout/Layout";
import Header from "../../components/Header";
import './analyticsDashboard.css';

function AnalyticsDashboard() {
  const REFRESH_INTERVAL_MS = 30000;
  const [dashboardData, setDashboardData] = useState({
    todaySales: 0,
    yesterdaySales: 0,
    monthlyPurchases: 0,
    todayPurchases: 0,
    totalOrders: 0,
    totalSuppliers: 0,
    cancelledBills: 0,
    entertainmentTotal: 0,
    todayDiscount: 0
  });

  const [monthlySalesData, setMonthlySalesData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [topProductsData, setTopProductsData] = useState([]);
  const [orderStatusData, setOrderStatusData] = useState([]);
  const [salesExpensesData, setSalesExpensesData] = useState({
    totalSales: 0,
    totalExpenses: 0,
    netProfit: 0
  });
  const [dailySalesData, setDailySalesData] = useState([]);
  const [purchaseTrendsData, setPurchaseTrendsData] = useState([]);
  const [foodDrinksSaleData, setFoodDrinksSaleData] = useState({
    sales_by_group: {},
    saleDate: '',
    total_all_sales: 0
  });
  const [pendingInvoiceData, setPendingInvoiceData] = useState({
    totalAmount: 0,
    totalItems: 0,
    items: []
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const formatCurrency = (value, options = {}) =>
    `฿${Number(value || 0).toLocaleString('en-US', options)}`;

  const isMockTopProducts = (products) => {
    if (!Array.isArray(products) || products.length !== 4) {
      return false;
    }

    const mockNames = ['Chicken Burgers', 'French Fries', 'Soft Drinks', 'Pizza Slices'];
    return products.every((product, index) => product?.name === mockNames[index]);
  };

  const isMockCategoryDistribution = (categories) => {
    if (!Array.isArray(categories) || categories.length !== 3) {
      return false;
    }

    const mockCategories = [
      { name: 'Food Items', value: 35 },
      { name: 'Beverages', value: 25 },
      { name: 'Other Items', value: 40 }
    ];

    return categories.every((category, index) => (
      category?.name === mockCategories[index].name
      && Number(category?.value) === mockCategories[index].value
    ));
  };

  const refreshAllData = async ({ showLoader = false } = {}) => {
    if (showLoader) {
      setIsLoading(true);
    }

    try {
      setError(null);
      await Promise.all([
        fetchDashboardData(),
        fetchMonthlySalesData(),
        fetchOrderStatusData(),
        fetchTopProductsData(),
        fetchCategoryData(),
        fetchSalesExpensesData(),
        fetchDailySalesData(),
        fetchPurchaseTrendsData(),
        fetchFoodDrinksSaleData(),
        fetchPendingInvoiceData()
      ]);
      setLastUpdated(new Date());
    } catch (refreshError) {
      console.error('Error fetching analytics data:', refreshError);
      setError('Failed to load dashboard data');
    } finally {
      if (showLoader) {
        setIsLoading(false);
      }
    }
  };

  // API Functions
  const fetchDashboardData = async () => {
    try {
      const response = await axios.get('analytics/dashboard', getHeaders());
      if (response.data.success) {
        setDashboardData(response.data.data);
        return;
      }
      setDashboardData({
        todaySales: 0,
        yesterdaySales: 0,
        monthlyPurchases: 0,
        todayPurchases: 0,
        totalOrders: 0,
        totalSuppliers: 0,
        cancelledBills: 0,
        entertainmentTotal: 0,
        todayDiscount: 0
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setDashboardData({
        todaySales: 0,
        yesterdaySales: 0,
        monthlyPurchases: 0,
        todayPurchases: 0,
        totalOrders: 0,
        totalSuppliers: 0,
        cancelledBills: 0,
        entertainmentTotal: 0,
        todayDiscount: 0
      });
      setError('Failed to load dashboard data');
    }
  };

  const fetchMonthlySalesData = async () => {
    try {
      const response = await axios.get('/analytics/monthly-sales-purchases', getHeaders());
      if (response.data.success) {
        setMonthlySalesData(response.data.data);
        return;
      }
      setMonthlySalesData([]);
    } catch (error) {
      console.error('Error fetching monthly sales data:', error);
      setMonthlySalesData([]);
    }
  };

  const fetchOrderStatusData = async () => {
    try {
      const response = await axios.get('analytics/order-status', getHeaders());
      if (response.data.success) {
        setOrderStatusData(response.data.data);
        return;
      }
      setOrderStatusData([]);
    } catch (error) {
      console.error('Error fetching order status data:', error);
      setOrderStatusData([]);
    }
  };

  const fetchTopProductsData = async () => {
    try {
      const response = await axios.get('analytics/top-products', getHeaders());
      if (response.data.success) {
        const products = Array.isArray(response.data.data) ? response.data.data : [];
        if (isMockTopProducts(products)) {
          setTopProductsData([]);
          setError('Top selling products is returning placeholder data from the API.');
          return;
        }

        setTopProductsData(products);
        return;
      }
      setTopProductsData([]);
    } catch (error) {
      console.error('Error fetching top products data:', error);
      setTopProductsData([]);
    }
  };

  const fetchCategoryData = async () => {
    try {
      const response = await axios.get('analytics/category-distribution', getHeaders());
      if (response.data.success) {
        const categories = Array.isArray(response.data.data) ? response.data.data : [];
        if (isMockCategoryDistribution(categories)) {
          setCategoryData([]);
          setError('Category distribution is returning placeholder data from the API.');
          return;
        }

        setCategoryData(categories);
        return;
      }
      setCategoryData([]);
    } catch (error) {
      console.error('Error fetching category data:', error);
      setCategoryData([]);
    }
  };

  const fetchSalesExpensesData = async () => {
    try {
      const response = await axios.get('analytics/sales-expenses', getHeaders());
      if (response.data.success) {
        setSalesExpensesData(response.data.data);
        return;
      }
      setSalesExpensesData({ totalSales: 0, totalExpenses: 0, netProfit: 0 });
    } catch (error) {
      console.error('Error fetching sales expenses data:', error);
      setSalesExpensesData({ totalSales: 0, totalExpenses: 0, netProfit: 0 });
    }
  };

  const fetchDailySalesData = async () => {
    try {
      const response = await axios.get('analytics/daily-sales-trend', getHeaders());
      if (response.data.success) {
        setDailySalesData(response.data.data);
        return;
      }
      setDailySalesData([]);
    } catch (error) {
      console.error('Error fetching daily sales data:', error);
      setDailySalesData([]);
    }
  };

  const fetchPurchaseTrendsData = async () => {
    try {
      const response = await axios.get('analytics/purchase-trends', getHeaders());
      if (response.data.success) {
        setPurchaseTrendsData(response.data.data);
        return;
      }
      setPurchaseTrendsData([]);
    } catch (error) {
      console.error('Error fetching purchase trends data:', error);
      setPurchaseTrendsData([]);
    }
  };

  const fetchFoodDrinksSaleData = async () => {
    try {
      const response = await axios.get('analytics/food-liquor-sale', getHeaders());
      if (response.data.success) {
        const liveData = response.data.data || {};
        setFoodDrinksSaleData({
          sales_by_group: liveData.sales_by_group || {
            food: { total_sale: liveData.totalFoodSale || 0 },
            bar: { total_sale: liveData.totalDrinksSale || 0 },
            shisha: { total_sale: liveData.totalShishaSale || 0 }
          },
          saleDate: liveData.saleDate || '',
          total_all_sales: liveData.total_all_sales || 0
        });
        return;
      }
      setFoodDrinksSaleData({ sales_by_group: {}, saleDate: '', total_all_sales: 0 });
    } catch (error) {
      console.error('Error fetching food and drinks sales data:', error);
      setFoodDrinksSaleData({ sales_by_group: {}, saleDate: '', total_all_sales: 0 });
    }
  };

  const fetchPendingInvoiceData = async () => {
    try {
      const response = await axios.get('/accounts/order-items/pending-invoice', getHeaders());
      if (response.data.success) {
        setPendingInvoiceData(response.data.data);
        return;
      }
      setPendingInvoiceData({ totalAmount: 0, totalItems: 0, items: [] });
    } catch (error) {
      console.error('Error fetching pending invoice data:', error);
      setPendingInvoiceData({ totalAmount: 0, totalItems: 0, items: [] });
    }
  };

  useEffect(() => {
    refreshAllData({ showLoader: true });

    const refreshTimer = setInterval(() => {
      refreshAllData();
    }, REFRESH_INTERVAL_MS);

    return () => clearInterval(refreshTimer);
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
          <div className="alert alert-warning alert-dismissible fade show analytics-floating-alert" role="alert">
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
            {lastUpdated && (
              <small className="text-muted me-3">
                Live data updated {lastUpdated.toLocaleTimeString()}
              </small>
            )}
            <button 
              className="btn btn-sm analytics-refresh-button"
              onClick={() => {
                refreshAllData({ showLoader: true });
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
                <span className="metric-value">฿{dashboardData.todayDiscount?.toLocaleString() || '0'}</span>
                <span className="metric-label">Today's Discount</span>
                <span className="metric-subtext">Total discount</span>
              </div>
            </div>
          </div>
          
          <div className="col-lg-2 col-md-4 col-sm-6 mb-3">
            <div className="metric-card-analytics daily-revenue">
              <div className="metric-header">
                <span className="metric-value">฿{dashboardData.entertainmentTotal?.toLocaleString() || '0'}</span>
                <span className="metric-label">Entertainment</span>
                <span className="metric-subtext">Total amount</span>
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
            <div className="metric-card-analytics total-calls">
              <div className="metric-header">
                <span className="metric-value">{dashboardData.cancelledBills || 0}</span>
                <span className="metric-label">Cancelled Bills</span>
                <span className="metric-subtext">Total</span>
              </div>
            </div>
          </div>

          <div className="col-lg-2 col-md-4 col-sm-6 mb-3">
            <div className="metric-card-analytics pending-invoice">
              <div className="metric-header">
                <span className="metric-value">฿{parseFloat(pendingInvoiceData.totalAmount || 0).toLocaleString()}</span>
                <span className="metric-label">Pending Invoice</span>
                <span className="metric-subtext">{pendingInvoiceData.totalItems || 0} items</span>
              </div>
            </div>
          </div>
          
        </div>

        {/* Main Content Row */}
        <div className="row">
          {/* Food & Drinks Sale */}
          <div className="col-lg-4 col-md-6 mb-4">
            <div className="analytics-panel status-panel">
              <div className="panel-header">
                <h6>FOOD & DRINKS SALE</h6>
              </div>
              <div className="panel-content">
                <div className="status-list">
                  {foodDrinksSaleData.sales_by_group && Object.keys(foodDrinksSaleData.sales_by_group).length > 0 ? (
                    <>
                      {/* Food Sale */}
                      <div className="status-item">
                        <div className="status-indicator" style={{backgroundColor: '#27ae60'}}></div>
                        <div className="status-info">
                          <span className="status-name">Food</span>
                          <span className="status-value">{formatCurrency(foodDrinksSaleData.sales_by_group['food']?.total_sale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                      </div>

                      {/* Bar Sale */}
                      <div className="status-item">
                        <div className="status-indicator" style={{backgroundColor: '#e74c3c'}}></div>
                        <div className="status-info">
                          <span className="status-name">Bar</span>
                          <span className="status-value">{formatCurrency(foodDrinksSaleData.sales_by_group['bar']?.total_sale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                      </div>

                      {/* Shisha Sale */}
                      <div className="status-item">
                        <div className="status-indicator" style={{backgroundColor: '#3498db'}}></div>
                        <div className="status-info">
                          <span className="status-name">Shisha</span>
                          <span className="status-value">{formatCurrency(foodDrinksSaleData.sales_by_group['shisha']?.total_sale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                      </div>

                      {/* Total Sale */}
                      <div className="status-item" style={{borderTop: '1px solid #e0e0e0', paddingTop: '10px', marginTop: '10px'}}>
                        <div className="status-indicator" style={{backgroundColor: '#34495e'}}></div>
                        <div className="status-info">
                          <span className="status-name">Total Sale</span>
                          <span className="status-value">{formatCurrency(foodDrinksSaleData.total_all_sales, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-3">
                      <p className="text-muted">No record found</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Top Products */}
          <div className="col-lg-4 col-md-6 mb-4">
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
                        <span className="agent-score">{formatCurrency(product.revenue, { maximumFractionDigits: 0 })}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-3">
                      <p className="text-muted">No record found</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Category Distribution */}
          <div className="col-lg-4 col-md-12 mb-4">
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
                          formatter={(value) => `${value}%`}
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
                          <span className="legend-text">{category.name} ({category.value}%)</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-5">
                    <p className="text-muted">No record found</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Row */}
        <div className="row">
          {/* Total Sales & Expenses */}
          <div className="col-lg-4 col-md-6 mb-4">
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

          {/* Order Status */}
          <div className="col-lg-4 col-md-6 mb-4">
            <div className="analytics-panel leads-panel">
              <div className="panel-header">
                <h6>ORDER STATUS</h6>
              </div>
              <div className="panel-content">
                <div className="funnel-chart">
                  {orderStatusData && orderStatusData.length > 0 ? (
                    orderStatusData.map((status, index) => {
                      const maxValue = Math.max(...orderStatusData.map(item => Number(item.value || 0)), 1);
                      return (
                        <div key={index} className="funnel-item">
                          <div 
                            className="funnel-bar" 
                            style={{
                              width: `${(Number(status.value || 0) / maxValue) * 100}%`,
                              backgroundColor: status.color || '#95a5a6'
                            }}
                          >
                            <span className="funnel-label">{status.status}</span>
                            <span className="funnel-value">{Number(status.value || 0).toFixed(1)}%</span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-3">
                      <p className="text-muted">No order status data available</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sales vs Purchases */}
          <div className="col-lg-4 col-md-12 mb-4">
            <div className="analytics-panel bottom-chart-panel">
              <div className="panel-header">
                <h6>SALES VS PURCHASES</h6>
              </div>
              <div className="panel-content">
                {monthlySalesData && monthlySalesData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={150}>
                    <BarChart data={monthlySalesData.slice(-6)}>
                      <Bar dataKey="sales" fill="#3498db" name="Sales" />
                      <Bar dataKey="purchases" fill="#f39c12" name="Purchases" />
                      <XAxis dataKey="month" stroke="#2c3e50" fontSize={10} />
                      <YAxis stroke="#2c3e50" fontSize={10} />
                      <Tooltip 
                        formatter={(value) => formatCurrency(value)}
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
                    <p className="text-muted">No monthly sales data available</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Charts Row */}
        <div className="row">
          {/* Daily Sales Trend */}
          <div className="col-lg-6 col-md-12 mb-4">
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
                        formatter={(value) => formatCurrency(value)}
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

          <div className="col-lg-6 col-md-12 mb-4">
            <div className="analytics-panel bottom-chart-panel">
              <div className="panel-header">
                <h6>PURCHASE TREND</h6>
              </div>
              <div className="panel-content">
                {purchaseTrendsData && purchaseTrendsData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={150}>
                    <AreaChart data={purchaseTrendsData}>
                      <Area
                        type="monotone"
                        dataKey="purchases"
                        stroke="#f39c12"
                        fill="#f39c12"
                        fillOpacity={0.45}
                      />
                      <XAxis dataKey="day" stroke="#2c3e50" fontSize={10} />
                      <YAxis stroke="#2c3e50" fontSize={10} />
                      <Tooltip
                        formatter={(value) => formatCurrency(value)}
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
                    <p className="text-muted">No purchase trend data available</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Pending Invoice Records */}
        <div className="row">
          <div className="col-lg-12 col-md-12 mb-4">
            <div className="analytics-panel bottom-chart-panel">
              <div className="panel-header">
                <h6>PENDING INVOICE RECORDS</h6>
              </div>
              <div className="panel-content">
                {pendingInvoiceData.items && pendingInvoiceData.items.length > 0 ? (
                  <div className="table-responsive">
                    <table className="table table-hover table-striped align-middle">
                      <thead className="table-light">
                        <tr>
                          <th>Table No.</th>
                          <th className="text-end">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pendingInvoiceData.items.map((item, index) => (
                          <tr key={index}>
                            <td>{item.table_num || item.table_number || item.table_no || 'N/A'}</td>
                            <td className="text-end">฿{parseFloat(item.amount || item.total_price || 0).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="table-secondary">
                        <tr>
                          <th>Total</th>
                          <th className="text-end">฿{parseFloat(pendingInvoiceData.totalAmount || 0).toFixed(2)}</th>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-5">
                    <p className="text-muted">No pending invoice records</p>
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
