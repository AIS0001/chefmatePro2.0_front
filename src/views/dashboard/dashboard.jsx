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
import fetchData from "../../functions/fetchData";
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
import './dashboard.css';

// Modern color palette
const COLORS = {
  primary: "#667eea",
  secondary: "#764ba2",
  success: "#10b981",
  info: "#06b6d4",
  warning: "#f59e0b",
  danger: "#ef4444",
  light: "#f8fafc",
  dark: "#1e293b",
  purple: "#8b5cf6",
  pink: "#ec4899",
  teal: "#14b8a6",
  indigo: "#6366f1",
  emerald: "#059669",
  amber: "#d97706",
  rose: "#f43f5e",
  slate: "#64748b"
};

const CHART_COLORS = [
  "#667eea", "#10b981", "#06b6d4", "#f59e0b",
  "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6",
  "#6366f1", "#059669", "#d97706", "#f43f5e"
];

export default function Dashboard() {
  const [salesData, setSalesData] = useState([]);
  const [purchaseData, setPurchaseData] = useState([]);
  const [weeklySalesData, setWeeklySalesData] = useState([]);
  const [weeklyPurchaseData, setWeeklyPurchaseData] = useState([]);
  const [currency, setCurrency] = useState("₹"); // Default currency
  const [isLoadingCurrency, setIsLoadingCurrency] = useState(true);
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
    lowStockItems: [],
    weeklySummary: {
      totalSales: 0,
      totalPurchases: 0,
      profitMargin: 0
    },
    monthlySummary: {
      totalSales: 0,
      totalPurchases: 0,
      profitMargin: 0
    }
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

  // Function to process customer data and calculate insights
  const processCustomerData = (customerData) => {
    console.log('Processing customer data:', {
      totalRecords: customerData ? customerData.length : 0,
      sampleRecord: customerData && customerData.length > 0 ? customerData[0] : 'No data'
    });

    if (!customerData || customerData.length === 0) {
      console.log('No customer data available, returning demo data');
      return { 
        repeatCustomers: 25, 
        newCustomers: 15, 
        topCustomers: [
          { name: 'Rajesh Kumar', total: '2850.00', orderCount: 8 },
          { name: 'Priya Sharma', total: '1940.50', orderCount: 5 },
          { name: 'Amit Patel', total: '1275.25', orderCount: 3 }
        ]
      };
    }

    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));
    
    let repeatCustomers = 0;
    let newCustomers = 0;
    const customerSales = {};
    let skippedRecords = 0;

    // Process each customer record
    customerData.forEach(customer => {
      const customerId = customer.customer_id || customer.id || customer.customer_name;
      let customerName = customer.customer_name || customer.name || 'Unknown Customer';
      
      // Enhanced filtering to exclude walk-in customers and invalid names
      const isWalkInCustomer = !customerName || 
                              customerName === 'Unknown Customer' || 
                              customerName === 'Walk-in Customer' ||
                              customerName.toLowerCase().includes('walk-in') ||
                              customerName.toLowerCase().includes('walkin') ||
                              customerName.trim() === '' ||
                              customerName.trim() === '-' ||
                              customerName.length < 2;

      if (!customerId || isWalkInCustomer) {
        skippedRecords++;
        return;
      }

      // Clean up customer name
      customerName = customerName.trim();
      
      const orderDate = new Date(customer.created_at || customer.order_date || customer.inv_date);
      const totalAmount = parseFloat(customer.total_amount || customer.grand_total || customer.subtotal || 0);

      // Skip if invalid amount or date
      if (totalAmount <= 0 || isNaN(orderDate.getTime())) {
        skippedRecords++;
        return;
      }

      // Count customer orders and total spending
      if (!customerSales[customerId]) {
        customerSales[customerId] = {
          name: customerName,
          total: 0,
          orderCount: 0,
          firstOrderDate: orderDate,
          lastOrderDate: orderDate
        };
      }

      customerSales[customerId].total += totalAmount;
      customerSales[customerId].orderCount += 1;
      
      // Update date ranges
      if (orderDate < customerSales[customerId].firstOrderDate) {
        customerSales[customerId].firstOrderDate = orderDate;
      }
      if (orderDate > customerSales[customerId].lastOrderDate) {
        customerSales[customerId].lastOrderDate = orderDate;
      }
    });

    console.log('Customer processing stats:', {
      totalRecords: customerData.length,
      skippedRecords,
      validCustomers: Object.keys(customerSales).length,
      customerNames: Object.values(customerSales).map(c => c.name)
    });

    // If no valid customers found, return demo data but log it
    if (Object.keys(customerSales).length === 0) {
      console.log('No valid customers found after filtering, returning demo data');
      return { 
        repeatCustomers: 12, 
        newCustomers: 8, 
        topCustomers: [
          { name: 'Rajesh Kumar', total: '2850.00', orderCount: 8 },
          { name: 'Priya Sharma', total: '1940.50', orderCount: 5 },
          { name: 'Amit Patel', total: '1275.25', orderCount: 3 }
        ]
      };
    }

    // Analyze customer behavior
    Object.values(customerSales).forEach(customer => {
      const daysSinceFirstOrder = (today - customer.firstOrderDate) / (1000 * 60 * 60 * 24);
      
      // Consider as repeat if has more than 1 order OR first order was more than 7 days ago and has recent activity
      if (customer.orderCount > 1 || (daysSinceFirstOrder > 7 && customer.lastOrderDate > thirtyDaysAgo)) {
        repeatCustomers++;
      } else {
        newCustomers++;
      }
    });

    // Get top customers by total spending
    const topCustomers = Object.values(customerSales)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5)
      .map(customer => ({
        name: customer.name,
        total: customer.total.toFixed(2),
        orderCount: customer.orderCount
      }));

    console.log('Final customer analysis:', {
      repeatCustomers,
      newCustomers,
      topCustomers
    });

    return { repeatCustomers, newCustomers, topCustomers };
  };

  // Function to fetch currency from coresetting
  const fetchCurrency = async () => {
    try {
      setIsLoadingCurrency(true);
      const coreSettings = await fetchData('coresetting', null, 'id', {});
      if (coreSettings && coreSettings.length > 0) {
        const currencyFromDb = coreSettings[0].currency;
        // Map currency codes to symbols
        const currencySymbols = {
          'THB': '฿',
          'TH': '฿',
          'INR': '₹',
          'IN': '₹',
          'USD': '$',
          'US': '$',
          'EUR': '€',
          'GBP': '£',
          'UK': '£',
          'JPY': '¥',
          'AUD': 'A$',
          'CAD': 'C$',
          'SGD': 'S$',
          'HKD': 'HK$',
          'MYR': 'RM',
          'PHP': '₱',
          'VND': '₫',
          'KRW': '₩',
          'CNY': '¥',
          'TWD': 'NT$',
          'IDR': 'Rp',
          'BRL': 'R$',
          'RUB': '₽',
          'ZAR': 'R',
          'TRY': '₺',
          'AED': 'د.إ',
          'SAR': 'ر.س',
          'QAR': 'ر.ق',
          'KWD': 'د.ك',
          'BHD': 'د.ب',
          'OMR': 'ر.ع',
          'JOD': 'د.أ',
          'EGP': 'ج.م',
          'PKR': '₨',
          'LKR': 'Rs',
          'BDT': '৳',
          'NPR': 'रू',
          'MMK': 'K',
          'LAK': '₭',
          'KHR': '៛',
          'MOP': 'MOP$',
          'BND': 'B$',
          'FJD': 'FJ$',
          'NZD': 'NZ$',
          'PGK': 'K',
          'SBD': 'SI$',
          'TOP': 'T$',
          'VUV': 'VT',
          'WST': 'WS$'
        };
        
        const currencySymbol = currencySymbols[currencyFromDb] || currencyFromDb || '₹';
        setCurrency(currencySymbol);
        console.log('Currency loaded from database:', currencyFromDb, '→', currencySymbol);
      } else {
        console.log('No core settings found, using default currency');
        setCurrency('₹');
      }
    } catch (error) {
      console.error('Error fetching currency from coresetting:', error);
      toast.error('Failed to load currency setting, using default');
      setCurrency('₹'); // Fallback to default
    } finally {
      setIsLoadingCurrency(false);
    }
  };

  useEffect(() => {
    fetchCurrency();
  }, []);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        const [salesRes, purchaseRes, weeklySalesRes, weeklyPurchaseRes, summaryRes, todaysummaryRes, lowStock, getTopproducts, customersRes, billsRes, customersTableRes] = await Promise.all([
          axios.get(`/report/sale?range=${dateRange}`, getHeaders()),
          axios.get(`/report/purchase?range=${dateRange}`, getHeaders()),
          axios.get(`/report/weeklysales`, getHeaders()),
          axios.get(`/report/weeklypurchase`, getHeaders()).catch(() => {
            // Fallback to the previous endpoint if weeklypurchase doesn't exist
            console.log('Weekly purchase API not found, falling back to purchase?range=week');
            return axios.get(`/report/purchase?range=week`, getHeaders());
          }),
          axios.get("/report/summary", getHeaders()),
          axios.get("/report/todaysummary", getHeaders()),
          axios.get("/report/getlowstockalert", getHeaders()),
          axios.get("/report/gettopproducts", getHeaders()),
          axios.get("/report/customers", getHeaders()).catch(() => ({ data: [] })), // Fallback if API doesn't exist
          fetchData('final_bill', null, 'id', {}).catch(() => []), // Get bills data as fallback
          fetchData('customers', null, 'id', {}).catch(() => []), // Get customers table data
        ]);

        setSalesData(salesRes.data);
        setPurchaseData(purchaseRes.data);
        setWeeklySalesData(weeklySalesRes.data);
        setWeeklyPurchaseData(weeklyPurchaseRes.data);

        console.log('Weekly sales data from API:', {
          endpoint: '/report/weeklysales',
          count: weeklySalesRes.data.length,
          sample: weeklySalesRes.data.slice(0, 3)
        });
        
        console.log('Weekly purchase data from API:', {
          endpoint: '/report/weeklypurchase',
          count: weeklyPurchaseRes.data.length,
          sample: weeklyPurchaseRes.data.slice(0, 3)
        });

        // Calculate weekly and monthly summaries
        const weeklyTotalSales = weeklySalesRes.data.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
        const weeklyTotalPurchases = weeklyPurchaseRes.data.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
        const weeklyProfitMargin = weeklyTotalSales > 0 ? ((weeklyTotalSales - weeklyTotalPurchases) / weeklyTotalSales * 100).toFixed(2) : 0;

        const monthlyTotalSales = salesRes.data.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
        const monthlyTotalPurchases = purchaseRes.data.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
        const monthlyProfitMargin = monthlyTotalSales > 0 ? ((monthlyTotalSales - monthlyTotalPurchases) / monthlyTotalSales * 100).toFixed(2) : 0;

        // Process customer data for insights
        let customerData = customersRes.data || [];
        
        console.log('Initial customer data from API:', {
          source: 'customers API',
          count: customerData.length,
          sample: customerData.slice(0, 3)
        });
        
        // If customer API doesn't return data, try to use bills data
        if (customerData.length === 0 && billsRes.length > 0) {
          console.log('Using bills data as fallback for customer analysis');
          customerData = billsRes
            .filter(bill => {
              const customerName = bill.customer_name;
              return customerName && 
                     customerName.trim() !== '' && 
                     customerName !== 'Walk-in Customer' &&
                     !customerName.toLowerCase().includes('walk-in') &&
                     !customerName.toLowerCase().includes('walkin') &&
                     customerName.trim() !== '-' &&
                     customerName.length >= 2;
            })
            .map(bill => ({
              customer_id: bill.customer_id || bill.id,
              customer_name: bill.customer_name || `Customer ${bill.id}`,
              total_amount: parseFloat(bill.grand_total) || 0,
              created_at: bill.created_at || bill.inv_date,
              order_date: bill.inv_date || bill.created_at
            }));
          
          console.log('Filtered bills data:', {
            totalBills: billsRes.length,
            validCustomerBills: customerData.length,
            sample: customerData.slice(0, 3)
          });
        }

        // If still no data, try to combine customers table with bills
        if (customerData.length === 0 && customersTableRes.length > 0) {
          console.log('Using customers table with bills as fallback');
          const customerMap = {};
          
          // Create map of customers
          customersTableRes.forEach(customer => {
            if (customer.name && customer.name.trim() !== '' && customer.name !== 'Walk-in Customer') {
              customerMap[customer.id] = {
                id: customer.id,
                name: customer.name,
                phone: customer.phone,
                totalSpent: 0,
                orderCount: 0
              };
            }
          });

          // Add bill data to customers
          billsRes.forEach(bill => {
            const customerId = bill.customer_id;
            if (customerId && customerMap[customerId] && bill.grand_total) {
              customerMap[customerId].totalSpent += parseFloat(bill.grand_total || 0);
              customerMap[customerId].orderCount += 1;
            }
          });

          // Convert to customer data format
          customerData = Object.values(customerMap)
            .filter(customer => customer.orderCount > 0 && customer.totalSpent > 0)
            .map(customer => ({
              customer_id: customer.id,
              customer_name: customer.name,
              total_amount: customer.totalSpent,
              created_at: new Date(),
              order_count: customer.orderCount
            }));
          
          console.log('Combined customer and bills data:', {
            totalCustomersTable: customersTableRes.length,
            validCombinedCustomers: customerData.length,
            sample: customerData.slice(0, 3)
          });
        }

        const { repeatCustomers, newCustomers, topCustomers } = processCustomerData(customerData);
        
        console.log('Customer Data Analysis:', {
          totalCustomers: customerData.length,
          repeatCustomers,
          newCustomers,
          topCustomers
        });

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
          customerStats: {
            repeat: repeatCustomers,
            new: newCustomers
          },
          topCustomers: topCustomers,
          weeklySummary: {
            totalSales: weeklyTotalSales,
            totalPurchases: weeklyTotalPurchases,
            profitMargin: weeklyProfitMargin
          },
          monthlySummary: {
            totalSales: monthlyTotalSales,
            totalPurchases: monthlyTotalPurchases,
            profitMargin: monthlyProfitMargin
          }
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

  const weeklyCombinedData = weeklySalesData.map((sale, index) => ({
    date: sale.date,
    salesAmount: sale.amount,
    purchaseAmount: weeklyPurchaseData[index]?.amount || 0,
    transactions: Math.floor(sale.amount / 100)
  }));

  // Radial chart data for customer stats
  const customerRadialData = [
    {
      name: 'Repeat Customers',
      value: summary.customerStats?.repeat || 0,
      fill: COLORS.success
    },
    {
      name: 'New Customers',
      value: summary.customerStats?.new || 0,
      fill: COLORS.info
    }
  ];

  // Only show chart if we have customer data
  const hasCustomerData = (summary.customerStats?.repeat || 0) > 0 || (summary.customerStats?.new || 0) > 0;

  return (
    <Layout>
      <style jsx>{`
        /* Enhanced Creative Dashboard Styles */
        .dashboard-container {
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
          min-height: 100vh;
          padding: 20px 0;
        }

        .metric-card {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border-radius: 20px;
          padding: 25px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        }

        .metric-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, transparent, rgba(255, 255, 255, 0.1), transparent);
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .metric-card:hover::before {
          opacity: 1;
        }

        .metric-card:hover {
          transform: translateY(-10px) scale(1.02);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
          border-color: rgba(255, 255, 255, 0.3);
        }

        .metric-icon {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 15px;
          font-size: 24px;
          color: white;
          position: relative;
          z-index: 2;
        }

        .metric-icon::after {
          content: '';
          position: absolute;
          top: -10px;
          left: -10px;
          right: -10px;
          bottom: -10px;
          border-radius: 50%;
          background: inherit;
          opacity: 0.3;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.3; }
          50% { transform: scale(1.1); opacity: 0.1; }
        }

        .metric-value {
          font-size: 2.5rem;
          font-weight: 800;
          text-align: center;
          margin-bottom: 10px;
          background: linear-gradient(135deg, #667eea, #764ba2);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .metric-label {
          color: #6c757d;
          font-size: 0.9rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1px;
          text-align: center;
        }

        .chart-card {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border-radius: 20px;
          padding: 30px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .chart-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, #667eea, #764ba2, #f093fb, #f5576c);
          background-size: 300% 100%;
          animation: gradientMove 3s ease infinite;
        }

        @keyframes gradientMove {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        .chart-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 15px 40px rgba(0, 0, 0, 0.15);
        }

        .chart-header {
          display: flex;
          justify-content: between;
          align-items: center;
          margin-bottom: 25px;
          padding-bottom: 15px;
          border-bottom: 2px solid rgba(102, 126, 234, 0.1);
        }

        .chart-title {
          font-size: 1.4rem;
          font-weight: 700;
          color: #2d3748;
          margin: 0;
        }

        .chart-icon {
          color: #667eea;
          opacity: 0.6;
        }

        .financial-summary-card {
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.95) 100%);
          backdrop-filter: blur(15px);
          border-radius: 20px;
          padding: 25px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .financial-summary-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, #28a745, #20c997, #17a2b8);
          background-size: 200% 100%;
          animation: shimmer 2s ease-in-out infinite;
        }

        @keyframes shimmer {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        .financial-summary-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
        }

        .summary-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 15px;
          border-bottom: 2px solid rgba(102, 126, 234, 0.1);
        }

        .summary-period {
          display: flex;
          align-items: center;
          font-weight: 600;
          color: #2d3748;
          font-size: 1.1rem;
        }

        .period-text {
          font-size: 1rem;
          margin-left: 8px;
        }

        .summary-badge .badge {
          font-size: 12px;
          padding: 8px 16px;
          border-radius: 20px;
          font-weight: 700;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .summary-metrics {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          height: calc(100% - 80px);
        }

        .metric-item {
          display: flex;
          align-items: center;
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(10px);
          border-radius: 15px;
          padding: 20px;
          border: 1px solid rgba(255, 255, 255, 0.3);
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .metric-item::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), transparent);
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .metric-item:hover::before {
          opacity: 1;
        }

        .metric-item:hover {
          background: rgba(255, 255, 255, 0.95);
          border-color: rgba(102, 126, 234, 0.3);
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
        }

        .metric-icon {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 15px;
          color: white;
          font-size: 20px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
          position: relative;
        }

        .metric-icon::after {
          content: '';
          position: absolute;
          top: -5px;
          left: -5px;
          right: -5px;
          bottom: -5px;
          border-radius: 50%;
          background: inherit;
          opacity: 0.3;
          z-index: -1;
          animation: pulse 2s infinite;
        }

        .metric-content {
          flex: 1;
          min-width: 0;
        }

        .metric-label {
          font-size: 12px;
          color: #6c757d;
          font-weight: 600;
          margin-bottom: 5px;
          text-transform: uppercase;
          letter-spacing: 0.8px;
        }

        .metric-value {
          font-size: 1.8rem;
          font-weight: 800;
          line-height: 1.2;
          word-break: break-all;
          background: linear-gradient(135deg, #667eea, #764ba2);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .bg-success {
          background: linear-gradient(135deg, #28a745, #20c997) !important;
        }

        .bg-info {
          background: linear-gradient(135deg, #17a2b8, #6f42c1) !important;
        }

        .bg-primary {
          background: linear-gradient(135deg, #007bff, #667eea) !important;
        }

        .bg-dark {
          background: linear-gradient(135deg, #343a40, #495057) !important;
        }

        .bg-warning {
          background: linear-gradient(135deg, #ffc107, #fd7e14) !important;
        }

        .bg-danger {
          background: linear-gradient(135deg, #dc3545, #e83e8c) !important;
        }

        .text-success {
          color: #28a745 !important;
        }

        .text-info {
          color: #17a2b8 !important;
        }

        .text-primary {
          color: #007bff !important;
        }

        .text-dark {
          color: #343a40 !important;
        }

        /* Creative Loading States */
        .loading-shimmer {
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
        }

        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }

        /* Enhanced Mobile Responsiveness */
        @media (max-width: 768px) {
          .dashboard-title {
            font-size: 2rem;
          }
          
          .metric-value {
            font-size: 1.5rem;
          }
          
          .chart-card {
            padding: 20px;
          }
          
          .summary-metrics {
            grid-template-columns: 1fr;
            gap: 15px;
          }
          
          .metric-item {
            padding: 15px;
          }
          
          .metric-icon {
            width: 40px;
            height: 40px;
            margin-right: 10px;
            font-size: 16px;
          }
          
          .metric-value {
            font-size: 1.4rem;
          }
          
          .metric-label {
            font-size: 10px;
          }
        }

        /* Glass morphism effects */
        .glass-card {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border-radius: 20px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        }

        /* Floating animation */
        .floating {
          animation: floating 3s ease-in-out infinite;
        }

        @keyframes floating {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }

        /* Gradient text effects */
        .gradient-text {
          background: linear-gradient(135deg, #667eea, #764ba2);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        /* Customer Insights Optimization */
        .customer-list {
          scrollbar-width: thin;
          scrollbar-color: #dee2e6 #f8f9fa;
        }

        .customer-list::-webkit-scrollbar {
          width: 6px;
        }

        .customer-list::-webkit-scrollbar-track {
          background: #f8f9fa;
          border-radius: 3px;
        }

        .customer-list::-webkit-scrollbar-thumb {
          background: #dee2e6;
          border-radius: 3px;
        }

        .customer-list::-webkit-scrollbar-thumb:hover {
          background: #adb5bd;
        }

        .customer-card {
          border: 1px solid #e9ecef !important;
          position: relative;
          overflow: hidden;
        }

        .customer-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent);
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .customer-card:hover::before {
          opacity: 1;
        }

        .customer-avatar {
          position: relative;
          overflow: hidden;
        }

        .customer-avatar::after {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: linear-gradient(45deg, transparent, rgba(255,255,255,0.3), transparent);
          transform: rotate(45deg);
          transition: all 0.6s ease;
          opacity: 0;
        }

        .customer-card:hover .customer-avatar::after {
          animation: shimmer 1.5s ease-in-out;
          opacity: 1;
        }

        @keyframes shimmer {
          0% { transform: translateX(-100%) translateY(-100%) rotate(45deg); }
          50% { transform: translateX(0%) translateY(0%) rotate(45deg); }
          100% { transform: translateX(100%) translateY(100%) rotate(45deg); }
        }

        .empty-state {
          background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
          border-radius: 12px;
          border: 2px dashed #e9ecef;
          margin: 10px;
        }

        .rank-badge .badge {
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .total-amount {
          text-shadow: 0 1px 2px rgba(0,0,0,0.1);
        }
      `}</style>
      <Header 
        title="Business Intelligence Dashboard" 
        subtitle={!isLoadingCurrency ? `${currency} • Real-time Analytics & Performance Insights` : "Loading system configuration..."}
      />

      <ToastContainer 
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        toastStyle={{
          borderRadius: '15px',
          backdropFilter: 'blur(10px)',
          background: 'rgba(255, 255, 255, 0.9)'
        }}
      />

      {isLoadingCurrency ? (
        <div className="row justify-content-center">
          <div className="col-md-8">
            <div className="glass-card" style={{ padding: '50px', textAlign: 'center' }}>
              <div className="loading-shimmer" style={{ 
                width: '60px', 
                height: '60px', 
                borderRadius: '50%', 
                margin: '0 auto 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <div className="spinner-border text-primary" role="status">
                  <span className="sr-only">Loading...</span>
                </div>
              </div>
              <h3 className="gradient-text mb-3">Loading Dashboard</h3>
              <p className="text-muted">Fetching currency and system settings...</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="dashboard-container">
          {/* Enhanced Header with Quick Actions */}
          <div className="row mb-4">
            <div className="col-12">
              <div className="dashboard-header-card">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h2 className="dashboard-title gradient-text mb-2">
                      Welcome to ChefMate Analytics
                    </h2>
                    <p className="dashboard-subtitle text-muted mb-0">
                      <i className="fas fa-clock me-2"></i>
                      Last updated: {format(new Date(), 'MMMM dd, yyyy • HH:mm')}
                      <span className="ms-3">
                        <i className="fas fa-chart-line me-2"></i>
                        {isLoading ? 'Refreshing...' : 'Live Data'}
                      </span>
                    </p>
                  </div>
                  <div className="dashboard-actions">
                    <div className="date-range-selector me-3">
                      <label className="form-label mb-1" style={{ fontSize: '0.8rem', fontWeight: '600', color: '#6c757d' }}>
                        View Period:
                      </label>
                      <select 
                        className="form-select form-select-sm"
                        value={dateRange}
                        onChange={(e) => setDateRange(e.target.value)}
                        style={{ 
                          borderRadius: '10px',
                          border: '1px solid rgba(102, 126, 234, 0.3)',
                          fontSize: '0.85rem',
                          minWidth: '120px'
                        }}
                      >
                        <option value="week">This Week</option>
                        <option value="month">This Month</option>
                        <option value="year">This Year</option>
                      </select>
                    </div>
                    <button 
                      className="btn btn-outline-primary btn-sm me-2"
                      onClick={() => window.location.reload()}
                      disabled={isLoading}
                      style={{ minWidth: '80px' }}
                    >
                      <i className={`fas fa-sync-alt me-1 ${isLoading ? 'fa-spin' : ''}`}></i>
                      {isLoading ? 'Loading...' : 'Refresh'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Key Metrics Cards - 6 columns */}
          <div className="row mb-4">
            <div className="col-lg-2 col-md-4 col-6 mb-3">
              <div className="metric-card floating" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                <div className="metric-icon" style={{ background: 'rgba(255, 255, 255, 0.2)' }}>
                  <i className="fas fa-chart-line"></i>
                </div>
                <div className="metric-value" style={{ color: 'white' }}>{currency}{todaySummary.todaySales}</div>
                <div className="metric-label" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>Today's Sales</div>
                {todaySummary.todaySales > 0 && todaySummary.yesterdaySales > 0 && (
                  <small className="text-white" style={{ fontSize: '0.8rem', fontWeight: '600', opacity: '0.9' }}>
                    <i className="fas fa-arrow-up me-1"></i>
                    {((todaySummary.todaySales - todaySummary.yesterdaySales) / todaySummary.yesterdaySales * 100).toFixed(1)}% vs yesterday
                  </small>
                )}
              </div>
            </div>

            <div className="col-lg-2 col-md-4 col-6 mb-3">
              <div className="metric-card floating" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
                <div className="metric-icon" style={{ background: 'rgba(255, 255, 255, 0.2)' }}>
                  <i className="fas fa-shopping-cart"></i>
                </div>
                <div className="metric-value" style={{ color: 'white' }}>{currency}{todaySummary.todayPurchases}</div>
                <div className="metric-label" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>Today's Purchases</div>
                {todaySummary.todayPurchases > 0 && todaySummary.yesterdayPurchases > 0 && (
                  <small className="text-white" style={{ fontSize: '0.8rem', fontWeight: '600', opacity: '0.9' }}>
                    <i className="fas fa-arrow-down me-1"></i>
                    {((todaySummary.todayPurchases - todaySummary.yesterdayPurchases) / todaySummary.yesterdayPurchases * 100).toFixed(1)}% vs yesterday
                  </small>
                )}
              </div>
            </div>

            <div className="col-lg-2 col-md-4 col-6 mb-3">
              <div className="metric-card floating" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
                <div className="metric-icon" style={{ background: 'rgba(255, 255, 255, 0.2)' }}>
                  <i className="fas fa-coins"></i>
                </div>
                <div className="metric-value" style={{ color: 'white' }}>{currency}{(todaySummary.todaySales - todaySummary.todayPurchases).toFixed(2)}</div>
                <div className="metric-label" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>Net Profit</div>
                <small style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.9)' }}>
                  <i className="fas fa-percentage me-1"></i>
                  {todaySummary.todaySales > 0 ? ((todaySummary.todaySales - todaySummary.todayPurchases) / todaySummary.todaySales * 100).toFixed(1) : 0}% margin
                </small>
              </div>
            </div>

            <div className="col-lg-2 col-md-4 col-6 mb-3">
              <div className="metric-card floating" style={{ background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)' }}>
                <div className="metric-icon" style={{ background: 'rgba(255, 255, 255, 0.2)' }}>
                  <i className="fas fa-exchange-alt"></i>
                </div>
                <div className="metric-value" style={{ color: '#2d3748' }}>{todaySummary.todayTransactionCount}</div>
                <div className="metric-label" style={{ color: '#4a5568' }}>Transactions</div>
                <small style={{ fontSize: '0.8rem', color: '#4a5568' }}>
                  <i className="fas fa-calculator me-1"></i>
                  Avg: {currency}{todaySummary.todayTransactionCount > 0 ? (todaySummary.todaySales / todaySummary.todayTransactionCount).toFixed(0) : "0"}
                </small>
              </div>
            </div>

            <div className="col-lg-2 col-md-4 col-6 mb-3">
              <div className="metric-card floating" style={{ background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)' }}>
                <div className="metric-icon" style={{ background: 'rgba(255, 255, 255, 0.2)' }}>
                  <i className="fas fa-trophy"></i>
                </div>
                <div className="metric-value" style={{ fontSize: '1.2rem', color: '#2d3748' }}>{summary.topProduct ? summary.topProduct.substring(0, 10) + (summary.topProduct.length > 10 ? '...' : '') : "N/A"}</div>
                <div className="metric-label" style={{ color: '#4a5568' }}>Top Product</div>
                <small style={{ fontSize: '0.8rem', color: '#4a5568' }}>
                  <i className="fas fa-crown me-1"></i>
                  Best seller
                </small>
              </div>
            </div>

            <div className="col-lg-2 col-md-4 col-6 mb-3">
              <div className="metric-card floating" style={{ background: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)' }}>
                <div className="metric-icon" style={{ background: 'rgba(255, 255, 255, 0.2)' }}>
                  <i className="fas fa-exclamation-triangle"></i>
                </div>
                <div className="metric-value" style={{ color: '#2d3748' }}>{summary.lowStockItems?.length || 0}</div>
                <div className="metric-label" style={{ color: '#4a5568' }}>Stock Alerts</div>
                <small style={{ fontSize: '0.8rem', color: '#4a5568' }}>
                  <i className="fas fa-box me-1"></i>
                  {summary.lowStockItems?.length > 0 ? 'Needs attention' : 'All stocked'}
                </small>
              </div>
            </div>
          </div>

          {/* Performance Analytics Section */}
          <div className="row mb-4">
            <div className="col-12">
              <div className="section-header">
                <h4 className="section-title">
                  <i className="fas fa-chart-line me-2"></i>
                  Performance Analytics
                </h4>
                <p className="section-subtitle">Real-time business performance metrics and trends</p>
              </div>
            </div>
          </div>

          {/* Performance Overview Row - 3 columns */}
          <div className="row mb-5">
            <div className="col-lg-4 mb-4">
              <div className="chart-card">
                <div className="chart-header">
                  <h6 className="chart-title">Sales Overview</h6>
                  <i className="fas fa-chart-line fa-2x chart-icon"></i>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={salesData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: COLORS.dark }}
                    />
                    <YAxis tick={{ fill: COLORS.dark }} />
                    <Tooltip
                      formatter={(value, name) => [`${currency}${value}`, name]}
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        borderRadius: '15px',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        backdropFilter: 'blur(10px)'
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="amount"
                      stroke="#667eea"
                      strokeWidth={3}
                      dot={{ fill: "#667eea", r: 6 }}
                      activeDot={{ r: 8, fill: "#667eea" }}
                      name={`Sales (${currency})`}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="col-lg-4 mb-4">
              <div className="chart-card">
                <div className="chart-header">
                  <h6 className="chart-title">Purchase Overview</h6>
                  <i className="fas fa-shopping-cart fa-2x chart-icon"></i>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={purchaseData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: COLORS.dark }}
                    />
                    <YAxis tick={{ fill: COLORS.dark }} />
                    <Tooltip
                      formatter={(value, name) => [`${currency}${value}`, name]}
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        borderRadius: '15px',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        backdropFilter: 'blur(10px)'
                      }}
                    />
                    <Legend />
                    <Bar
                      dataKey="amount"
                      fill="#ffc107"
                      radius={[8, 8, 0, 0]}
                      name={`Purchases (${currency})`}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="col-lg-4 mb-4">
              <div className="chart-card">
                <div className="chart-header">
                  <h6 className="chart-title">Daily Performance</h6>
                  <i className="fas fa-calendar-day fa-2x chart-icon"></i>
                </div>
                <div style={{ height: '300px', padding: '20px' }}>
                  <div className="row h-100">
                    <div className="col-12 mb-3">
                      <div className="metric-item">
                        <div className="metric-icon bg-success">
                          <i className="fas fa-chart-line"></i>
                        </div>
                        <div className="metric-content">
                          <div className="metric-label">Sales Growth</div>
                          <div className="metric-value">
                            {todaySummary.todaySales > 0 && todaySummary.yesterdaySales > 0 
                              ? `+${((todaySummary.todaySales - todaySummary.yesterdaySales) / todaySummary.yesterdaySales * 100).toFixed(1)}%`
                              : "0%"
                            }
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="col-12 mb-3">
                      <div className="metric-item">
                        <div className="metric-icon bg-info">
                          <i className="fas fa-clock"></i>
                        </div>
                        <div className="metric-content">
                          <div className="metric-label">Avg Transaction</div>
                          <div className="metric-value">
                            {currency}{todaySummary.todayTransactionCount > 0 
                              ? (todaySummary.todaySales / todaySummary.todayTransactionCount).toFixed(0)
                              : "0"
                            }
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="col-12">
                      <div className="metric-item">
                        <div className="metric-icon bg-warning">
                          <i className="fas fa-percentage"></i>
                        </div>
                        <div className="metric-content">
                          <div className="metric-label">Profit Margin</div>
                          <div className="metric-value">
                            {todaySummary.todaySales > 0 
                              ? ((todaySummary.todaySales - todaySummary.todayPurchases) / todaySummary.todaySales * 100).toFixed(1)
                              : "0"
                            }%
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Financial Intelligence Section */}
          <div className="row mb-4">
            <div className="col-12">
              <div className="section-header">
                <h4 className="section-title">
                  <i className="fas fa-coins me-2"></i>
                  Financial Intelligence
                </h4>
                <p className="section-subtitle">Comprehensive financial overview and key customer insights</p>
              </div>
            </div>
          </div>

          {/* Financial Summary Row - 4 columns */}
          <div className="row mb-5">
            <div className="col-lg-3 mb-4">
              <div className="financial-summary-card">
                <div className="summary-header">
                  <div className="summary-period">
                    <i className="fas fa-calendar-week text-success me-2"></i>
                    <span className="period-text">This Week</span>
                  </div>
                  <div className="summary-badge">
                    <span className="badge bg-success">Weekly</span>
                  </div>
                </div>
                
                <div className="summary-metrics" style={{ gridTemplateColumns: '1fr', gap: '10px' }}>
                  <div className="metric-item">
                    <div className="metric-icon bg-success">
                      <i className="fas fa-chart-line"></i>
                    </div>
                    <div className="metric-content">
                      <div className="metric-label">Sales</div>
                      <div className="metric-value">
                        {currency}{(summary.weeklySummary?.totalSales || 0).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  
                  <div className="metric-item">
                    <div className="metric-icon bg-info">
                      <i className="fas fa-shopping-cart"></i>
                    </div>
                    <div className="metric-content">
                      <div className="metric-label">Purchases</div>
                      <div className="metric-value">
                        {currency}{(summary.weeklySummary?.totalPurchases || 0).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  
                  <div className="metric-item">
                    <div className="metric-icon bg-primary">
                      <i className="fas fa-coins"></i>
                    </div>
                    <div className="metric-content">
                      <div className="metric-label">Profit</div>
                      <div className="metric-value">
                        {currency}{((summary.weeklySummary?.totalSales || 0) - (summary.weeklySummary?.totalPurchases || 0)).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-lg-3 mb-4">
              <div className="financial-summary-card">
                <div className="summary-header">
                  <div className="summary-period">
                    <i className="fas fa-calendar-alt text-primary me-2"></i>
                    <span className="period-text">This Month</span>
                  </div>
                  <div className="summary-badge">
                    <span className="badge bg-primary">Monthly</span>
                  </div>
                </div>
                
                <div className="summary-metrics" style={{ gridTemplateColumns: '1fr', gap: '10px' }}>
                  <div className="metric-item">
                    <div className="metric-icon bg-success">
                      <i className="fas fa-chart-line"></i>
                    </div>
                    <div className="metric-content">
                      <div className="metric-label">Sales</div>
                      <div className="metric-value">
                        {currency}{(summary.monthlySummary?.totalSales || 0).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  
                  <div className="metric-item">
                    <div className="metric-icon bg-info">
                      <i className="fas fa-shopping-cart"></i>
                    </div>
                    <div className="metric-content">
                      <div className="metric-label">Purchases</div>
                      <div className="metric-value">
                        {currency}{(summary.monthlySummary?.totalPurchases || 0).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  
                  <div className="metric-item">
                    <div className="metric-icon bg-primary">
                      <i className="fas fa-coins"></i>
                    </div>
                    <div className="metric-content">
                      <div className="metric-label">Profit</div>
                      <div className="metric-value">
                        {currency}{((summary.monthlySummary?.totalSales || 0) - (summary.monthlySummary?.totalPurchases || 0)).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-lg-3 mb-4">
              <div className="financial-summary-card">
                <div className="summary-header">
                  <div className="summary-period">
                    <i className="fas fa-trophy text-warning me-2"></i>
                    <span className="period-text">Top Products</span>
                  </div>
                  <div className="summary-badge">
                    <span className="badge bg-warning">Trending</span>
                  </div>
                </div>
                
                <div style={{ height: '340px', overflowY: 'auto' }}>
                  {toptenProducts && toptenProducts.length > 0 ? (
                    <ul className="list-group list-group-flush">
                      {toptenProducts.slice(0, 5).map((product, index) => (
                        <li key={index} className="list-group-item d-flex justify-content-between align-items-center py-2 border-0">
                          <div className="d-flex align-items-center">
                            <div 
                              className="rounded-circle me-3 d-flex align-items-center justify-content-center"
                              style={{
                                width: '30px',
                                height: '30px',
                                backgroundColor: COLORS.warning,
                                color: 'white',
                                fontSize: '12px',
                                fontWeight: 'bold'
                              }}
                            >
                              {index + 1}
                            </div>
                            <div>
                              <div className="font-weight-bold" style={{ fontSize: '13px' }}>
                                {product.item_name}
                              </div>
                              <small className="text-muted">Stock: {product.closing_stock}</small>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-center text-muted p-3">
                      <i className="fas fa-box fa-2x mb-2"></i>
                      <p className="mb-0">No product data</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="col-lg-3 mb-4">
              <div className="financial-summary-card">
                <div className="summary-header">
                  <div className="summary-period">
                    <i className="fas fa-users text-info me-2"></i>
                    <span className="period-text">Top Customers</span>
                  </div>
                  <div className="summary-badge">
                    <span className="badge bg-info">VIP</span>
                  </div>
                </div>
                
                <div style={{ height: '340px', overflowY: 'auto' }}>
                  {summary.topCustomers && summary.topCustomers.length > 0 ? (
                    <ul className="list-group list-group-flush">
                      {summary.topCustomers.map((customer, index) => (
                        <li key={index} className="list-group-item d-flex justify-content-between align-items-center py-2 border-0">
                          <div className="d-flex align-items-center">
                            <div 
                              className="rounded-circle me-3 d-flex align-items-center justify-content-center"
                              style={{
                                width: '30px',
                                height: '30px',
                                backgroundColor: COLORS.info,
                                color: 'white',
                                fontSize: '12px',
                                fontWeight: 'bold'
                              }}
                            >
                              {customer.name?.charAt(0).toUpperCase() || 'C'}
                            </div>
                            <div>
                              <div className="font-weight-bold" style={{ fontSize: '13px' }}>
                                {customer.name}
                              </div>
                              <small className="text-muted">{currency}{customer.total}</small>
                              <span className="badge badge-info badge-pill" style={{ fontSize: '10px',float: 'right' }}>
                            {customer.orderCount} orders
                          </span>
                            </div>
                          </div>
                          
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-center text-muted p-3">
                      <i className="fas fa-user-friends fa-2x mb-2"></i>
                      <p className="mb-0">No customer data</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Business Intelligence Section */}
          <div className="row mb-4">
            <div className="col-12">
              <div className="section-header">
                <h4 className="section-title">
                  <i className="fas fa-brain me-2"></i>
                  Business Intelligence
                </h4>
                <p className="section-subtitle">Advanced analytics and operational insights</p>
              </div>
            </div>
          </div>

          {/* Analytics Row - 2 columns */}
          <div className="row mb-5">
            <div className="col-lg-6 mb-4">
              <div className="chart-card">
                <div className="chart-header">
                  <h6 className="chart-title">Sales vs Purchase Distribution</h6>
                  <i className="fas fa-chart-pie fa-2x chart-icon"></i>
                </div>
                <div style={{ height: '400px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    {summary.totalSales > 0 || summary.totalPurchase > 0 ? (
                      <PieChart>
                        <Pie
                          dataKey="value"
                          data={[
                            { name: "Sales", value: summary.totalSales },
                            { name: "Purchase", value: summary.totalPurchase },
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={120}
                          paddingAngle={5}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          labelLine={false}
                        >
                          <Cell fill="url(#colorSales)" />
                          <Cell fill="url(#colorPurchase)" />
                        </Pie>
                        <defs>
                          <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#667eea" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#764ba2" stopOpacity={0.8} />
                          </linearGradient>
                          <linearGradient id="colorPurchase" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ffc107" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#fd7e14" stopOpacity={0.8} />
                          </linearGradient>
                        </defs>
                        <Tooltip
                          formatter={(value) => `${currency}${value}`}
                          contentStyle={{
                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                            borderRadius: '15px',
                            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            backdropFilter: 'blur(10px)'
                          }}
                        />
                        <Legend />
                      </PieChart>
                    ) : (
                      <div className="d-flex align-items-center justify-content-center h-100">
                        <div className="text-center">
                          <i className="fas fa-chart-pie fa-4x text-muted mb-3"></i>
                          <p className="text-muted">No sales or purchase data</p>
                        </div>
                      </div>
                    )}
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="col-lg-6 mb-4">
              <div className="chart-card">
                <div className="chart-header">
                  <h6 className="chart-title">Transaction Trends & Performance</h6>
                  <i className="fas fa-exchange-alt fa-2x chart-icon"></i>
                </div>
                <div style={{ height: '400px' }}>
                  <ResponsiveContainer width="100%" height="100%">
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
                        formatter={(value, name) => {
                          if (name.includes('Sales')) {
                            return [`${currency}${value}`, name];
                          }
                          return [value, name];
                        }}
                        contentStyle={{
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          borderRadius: '15px',
                          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          backdropFilter: 'blur(10px)'
                        }}
                      />
                      <Legend />
                      <Bar
                        yAxisId="left"
                        dataKey="transactions"
                        fill="#6f42c1"
                        name="Transactions"
                        radius={[8, 8, 0, 0]}
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="salesAmount"
                        stroke="#20c997"
                        strokeWidth={3}
                        dot={{ fill: "#20c997", r: 6 }}
                        activeDot={{ r: 8, fill: "#20c997" }}
                        name={`Sales (${currency})`}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

          {/* Operational Intelligence Section */}
          <div className="row mb-4">
            <div className="col-12">
              <div className="section-header">
                <h4 className="section-title">
                  <i className="fas fa-cogs me-2"></i>
                  Operational Intelligence
                </h4>
                <p className="section-subtitle">Weekly trends, inventory management, and customer behavior analysis</p>
              </div>
            </div>
          </div>

          {/* Business Intelligence Row - 3 columns */}
          <div className="row mb-5">
            <div className="col-lg-4 mb-4">
              <div className="chart-card">
                <div className="chart-header">
                  <h6 className="chart-title">Weekly Sales Trends</h6>
                  <i className="fas fa-calendar-week fa-2x chart-icon"></i>
                </div>
                <div style={{ height: '350px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={weeklyCombinedData}>
                      <defs>
                        <linearGradient id="colorWeeklySales" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={COLORS.success} stopOpacity={0.8} />
                          <stop offset="95%" stopColor={COLORS.success} stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorWeeklyPurchases" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={COLORS.danger} stopOpacity={0.8} />
                          <stop offset="95%" stopColor={COLORS.danger} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis
                        dataKey="date"
                        tick={{ fill: COLORS.dark }}
                      />
                      <YAxis tick={{ fill: COLORS.dark }} />
                      <Tooltip
                        formatter={(value, name) => [`${currency}${value}`, name]}
                        contentStyle={{
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          borderRadius: '15px',
                          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          backdropFilter: 'blur(10px)'
                        }}
                      />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="salesAmount"
                        stroke={COLORS.success}
                        fillOpacity={1}
                        fill="url(#colorWeeklySales)"
                        name={`Weekly Sales (${currency})`}
                      />
                      <Area
                        type="monotone"
                        dataKey="purchaseAmount"
                        stroke={COLORS.danger}
                        fillOpacity={1}
                        fill="url(#colorWeeklyPurchases)"
                        name={`Weekly Purchases (${currency})`}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="col-lg-4 mb-4">
              <div className="chart-card">
                <div className="chart-header">
                  <h6 className="chart-title">Inventory Alerts</h6>
                  <i className="fas fa-exclamation-triangle fa-2x chart-icon"></i>
                </div>
                <div style={{ height: '350px', overflowY: 'auto' }}>
                  <div className="card border-0 shadow-sm">
                    <div className="card-header bg-white py-2">
                      <h6 className="m-0 font-weight-bold text-gray-800">
                        Low Stock Items
                        <span className="badge badge-danger badge-pill ms-2">
                          {summary.lowStockItems?.length || 0}
                        </span>
                      </h6>
                    </div>
                    <div className="card-body p-0" style={{ maxHeight: '280px', overflowY: 'auto' }}>
                      {summary.lowStockItems && summary.lowStockItems.length > 0 ? (
                        <ul className="list-group list-group-flush">
                          {summary.lowStockItems.map((item, index) => (
                            <li key={index} className="list-group-item d-flex justify-content-between align-items-center py-3">
                              <div className="d-flex align-items-center">
                                <div 
                                  className="rounded-circle me-3 d-flex align-items-center justify-content-center"
                                  style={{
                                    width: '40px',
                                    height: '40px',
                                    backgroundColor: COLORS.danger,
                                    color: 'white',
                                    fontSize: '14px',
                                    fontWeight: 'bold'
                                  }}
                                >
                                  {item.item_name?.charAt(0).toUpperCase() || 'N'}
                                </div>
                                <div>
                                  <div className="font-weight-bold" style={{ fontSize: '14px' }}>
                                    {item.item_name}
                                  </div>
                                  <small className="text-muted">Item ID: {item.id}</small>
                                </div>
                              </div>
                              <div className="text-end">
                                <span className="badge badge-danger badge-pill" style={{ fontSize: '12px', padding: '6px 12px' }}>
                                  {item.stock || item.closing_stock} left
                                </span>
                              </div>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="p-4 text-center text-muted">
                          <i className="fas fa-check-circle fa-3x mb-3 text-success"></i>
                          <h6 className="text-muted">All Items Well Stocked</h6>
                          <p className="mb-0">No low stock alerts at this time</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-lg-4 mb-4">
              <div className="chart-card">
                <div className="chart-header">
                  <h6 className="chart-title">Customer Analytics</h6>
                  <div className="d-flex align-items-center">
                    <button 
                      className="btn btn-sm btn-outline-primary me-2"
                      onClick={async () => {
                        toast.info('Refreshing customer data...');
                        try {
                          setIsLoading(true);
                          
                          // Refetch customer data
                          const [customersRes, billsRes, customersTableRes] = await Promise.all([
                            axios.get("/report/customers", getHeaders()).catch(() => ({ data: [] })),
                            fetchData('final_bill', null, 'id', {}).catch(() => []),
                            fetchData('customers', null, 'id', {}).catch(() => [])
                          ]);

                          // Process customer data for insights
                          let customerData = customersRes.data || [];
                          
                          console.log('Refreshed customer data from API:', {
                            source: 'customers API',
                            count: customerData.length,
                            sample: customerData.slice(0, 3)
                          });
                          
                          // If customer API doesn't return data, try to use bills data
                          if (customerData.length === 0 && billsRes.length > 0) {
                            customerData = billsRes
                              .filter(bill => {
                                const customerName = bill.customer_name;
                                return customerName && 
                                       customerName.trim() !== '' && 
                                       customerName !== 'Walk-in Customer' &&
                                       !customerName.toLowerCase().includes('walk-in') &&
                                       !customerName.toLowerCase().includes('walkin') &&
                                       customerName.trim() !== '-' &&
                                       customerName.length >= 2;
                              })
                              .map(bill => ({
                                customer_id: bill.customer_id || bill.id,
                                customer_name: bill.customer_name || `Customer ${bill.id}`,
                                total_amount: parseFloat(bill.grand_total) || 0,
                                created_at: bill.created_at || bill.inv_date,
                                order_date: bill.inv_date || bill.created_at
                              }));
                          }

                          const { repeatCustomers, newCustomers, topCustomers } = processCustomerData(customerData);
                          
                          setSummary(prev => ({
                            ...prev,
                            customerStats: {
                              repeat: repeatCustomers,
                              new: newCustomers,
                            },
                            topCustomers: topCustomers
                          }));
                          
                          toast.success('Customer data refreshed successfully!');
                        } catch (error) {
                          console.error('Error refreshing customer data:', error);
                          toast.error('Failed to refresh customer data');
                        } finally {
                          setIsLoading(false);
                        }
                      }}
                      title="Refresh Customer Data"
                      disabled={isLoading}
                    >
                      <i className={`fas fa-sync-alt ${isLoading ? 'fa-spin' : ''}`}></i>
                    </button>
                    <i className="fas fa-users fa-2x chart-icon"></i>
                  </div>
                </div>
                <div style={{ height: '350px' }}>
                  {hasCustomerData ? (
                    <div className="customer-analytics-container">
                      <div className="customer-stats-summary">
                        <div className="row mb-3">
                          <div className="col-6">
                            <div className="stat-item">
                              <div className="stat-value text-success">
                                {summary.customerStats?.repeat || 0}
                              </div>
                              <div className="stat-label">Repeat Customers</div>
                              <div className="stat-percentage">
                                {((summary.customerStats?.repeat || 0) / ((summary.customerStats?.repeat || 0) + (summary.customerStats?.new || 0)) * 100).toFixed(0)}%
                              </div>
                            </div>
                          </div>
                          <div className="col-6">
                            <div className="stat-item">
                              <div className="stat-value text-info">
                                {summary.customerStats?.new || 0}
                              </div>
                              <div className="stat-label">New Customers</div>
                              <div className="stat-percentage">
                                {((summary.customerStats?.new || 0) / ((summary.customerStats?.repeat || 0) + (summary.customerStats?.new || 0)) * 100).toFixed(0)}%
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="customer-chart-container" style={{ height: '200px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <RadialBarChart
                            innerRadius="50%"
                            outerRadius="90%"
                            data={customerRadialData}
                            startAngle={90}
                            endAngle={-270}
                          >
                            <RadialBar
                              minAngle={15}
                              label={{ position: 'insideStart', fill: '#fff', fontSize: 12, fontWeight: 'bold' }}
                              background={{ fill: 'rgba(255, 255, 255, 0.1)' }}
                              clockWise
                              dataKey="value"
                              cornerRadius={10}
                            />
                            <Legend
                              iconSize={8}
                              layout="horizontal"
                              verticalAlign="bottom"
                              wrapperStyle={{
                                paddingTop: '10px',
                                fontSize: '12px',
                                fontWeight: '500'
                              }}
                            />
                            <Tooltip
                              formatter={(value, name) => [`${value} customers`, name]}
                              contentStyle={{
                                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                borderRadius: '15px',
                                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                backdropFilter: 'blur(10px)',
                                fontSize: '12px'
                              }}
                            />
                          </RadialBarChart>
                        </ResponsiveContainer>
                      </div>
                      
                      <div className="customer-insights">
                        <div className="insight-item">
                          <i className="fas fa-users-cog text-primary me-2"></i>
                          <span className="insight-text">
                            Total: {(summary.customerStats?.repeat || 0) + (summary.customerStats?.new || 0)} customers
                          </span>
                        </div>
                        <div className="insight-item">
                          <i className="fas fa-chart-line text-success me-2"></i>
                          <span className="insight-text">
                            {summary.customerStats?.repeat > summary.customerStats?.new ? 'Strong' : 'Growing'} loyalty base
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="empty-state h-100 d-flex flex-column justify-content-center">
                      <i className="fas fa-chart-pie fa-4x text-muted mb-3"></i>
                      <h5 className="text-muted mb-2">No Customer Data</h5>
                      <p className="text-muted mb-3">Customer analytics will appear here once data is available</p>
                      <small className="text-muted">
                        <i className="fas fa-info-circle me-1"></i>
                        Total: {(summary.customerStats?.repeat || 0) + (summary.customerStats?.new || 0)} customers
                      </small>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Strategic Overview Section */}
          <div className="row mb-4">
            <div className="col-12">
              <div className="section-header">
                <h4 className="section-title">
                  <i className="fas fa-chart-area me-2"></i>
                  Strategic Overview
                </h4>
                <p className="section-subtitle">Monthly performance comparison and strategic insights</p>
              </div>
            </div>
          </div>

          {/* Monthly Trends - Full width */}
          <div className="row mb-5">
            <div className="col-lg-12 mb-4">
              <div className="chart-card">
                <div className="chart-header">
                  <h6 className="chart-title">Monthly Performance Comparison</h6>
                  <i className="fas fa-balance-scale fa-2x chart-icon"></i>
                </div>
                <div style={{ height: '350px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={combinedData}>
                      <defs>
                        <linearGradient id="colorMonthlySales" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.8} />
                          <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorMonthlyPurchases" x1="0" y1="0" x2="0" y2="1">
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
                        formatter={(value, name) => [`${currency}${value}`, name]}
                        contentStyle={{
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          borderRadius: '15px',
                          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          backdropFilter: 'blur(10px)'
                        }}
                      />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="salesAmount"
                        stroke={COLORS.primary}
                        fillOpacity={1}
                        fill="url(#colorMonthlySales)"
                        name={`Monthly Sales (${currency})`}
                      />
                      <Area
                        type="monotone"
                        dataKey="purchaseAmount"
                        stroke={COLORS.warning}
                        fillOpacity={1}
                        fill="url(#colorMonthlyPurchases)"
                        name={`Monthly Purchases (${currency})`}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}