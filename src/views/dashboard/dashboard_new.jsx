import React, { useEffect, useState } from "react";
import axios from "axios";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import Layout from "../../layout/Layout";
import Header from "../../components/Header";
import { getHeaders } from "../../utility/getHeader";
import fetchData from "../../functions/fetchData";

export default function Dashboard() {
  const [currency, setCurrency] = useState("₹");
  const [dashboardData, setDashboardData] = useState({
    todaySales: 0,
    todayPurchases: 0,
    totalBills: 0,
    averageOrderPrice: 0
  });
  const [chartData, setChartData] = useState([]);
  const [recentSales, setRecentSales] = useState([]);
  const [recentPurchases, setRecentPurchases] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch currency settings
      const coreSettings = await fetchData('coresetting', null, 'id', {});
      if (coreSettings && coreSettings.length > 0) {
        setCurrency(coreSettings[0].currency || '₹');
      }

      // Fetch today's summary
      const todaySummaryRes = await axios.get("/report/todaysummary", getHeaders());
      const todayData = todaySummaryRes.data || {};

      // Fetch daily sales and purchase data for chart (last 7 days)
      const salesRes = await axios.get("/report/sale?range=week", getHeaders());
      const purchaseRes = await axios.get("/report/purchase?range=week", getHeaders());

      // Fetch recent bills for table data
      const billsData = await fetchData('final_bill', null, 'id', { limit: 5, orderBy: 'created_at', order: 'DESC' });
      const purchaseData = await fetchData('purchase', null, 'id', { limit: 5, orderBy: 'created_at', order: 'DESC' });

      // Process chart data
      const salesData = salesRes.data || [];
      const purchasesData = purchaseRes.data || [];
      
      const combinedChartData = salesData.map((sale, index) => ({
        date: sale.date || sale.day,
        sales: parseFloat(sale.amount || sale.total || 0),
        purchases: parseFloat(purchasesData[index]?.amount || purchasesData[index]?.total || 0)
      }));

      // Calculate metrics
      const todaySales = parseFloat(todayData.todaySales || 0);
      const todayPurchases = parseFloat(todayData.todayPurchases || 0);
      const totalBills = parseInt(todayData.billCount || billsData.length || 0);
      const averageOrderPrice = totalBills > 0 ? (todaySales / totalBills) : 0;

      setDashboardData({
        todaySales,
        todayPurchases,
        totalBills,
        averageOrderPrice
      });

      setChartData(combinedChartData);
      setRecentSales(billsData.slice(0, 5));
      setRecentPurchases(purchaseData.slice(0, 5));

    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <Header title="Dashboard" />
        <div className="container-fluid">
          <div className="row justify-content-center mt-5">
            <div className="col-md-6 text-center">
              <div className="spinner-border text-primary" role="status">
                <span className="sr-only">Loading...</span>
              </div>
              <p className="mt-3">Loading dashboard data...</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Header title="Dashboard" />
      <div className="container-fluid">
        
        {/* Metrics Cards */}
        <div className="row mt-4">
          <div className="col-md-3 mb-3">
            <div className="card bg-primary text-white">
              <div className="card-body text-center">
                <h5>Today's Sales</h5>
                <h3>{currency}{dashboardData.todaySales.toFixed(2)}</h3>
              </div>
            </div>
          </div>
          <div className="col-md-3 mb-3">
            <div className="card bg-success text-white">
              <div className="card-body text-center">
                <h5>Today's Purchases</h5>
                <h3>{currency}{dashboardData.todayPurchases.toFixed(2)}</h3>
              </div>
            </div>
          </div>
          <div className="col-md-3 mb-3">
            <div className="card bg-info text-white">
              <div className="card-body text-center">
                <h5>Total Bills</h5>
                <h3>{dashboardData.totalBills}</h3>
              </div>
            </div>
          </div>
          <div className="col-md-3 mb-3">
            <div className="card bg-warning text-white">
              <div className="card-body text-center">
                <h5>Average Order Price</h5>
                <h3>{currency}{dashboardData.averageOrderPrice.toFixed(2)}</h3>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="row mt-4">
          <div className="col-12">
            <div className="card">
              <div className="card-header">
                <h5>Daily Sales & Purchase Trends</h5>
              </div>
              <div className="card-body">
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value, name) => [`${currency}${value.toFixed(2)}`, name]}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="sales" 
                      stroke="#007bff" 
                      strokeWidth={3}
                      name="Sales"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="purchases" 
                      stroke="#28a745" 
                      strokeWidth={3}
                      name="Purchases"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Tables Section */}
        <div className="row mt-4">
          {/* Recent Sales */}
          <div className="col-md-6">
            <div className="card">
              <div className="card-header">
                <h5>Recent Sales (Last 5)</h5>
              </div>
              <div className="card-body">
                <div className="table-responsive">
                  <table className="table table-striped">
                    <thead>
                      <tr>
                        <th>Bill No</th>
                        <th>Customer</th>
                        <th>Amount</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentSales.length > 0 ? (
                        recentSales.map((sale, index) => (
                          <tr key={index}>
                            <td>{sale.inv_id || sale.bill_no || `#${sale.id}`}</td>
                            <td>{sale.customer_name || 'Walk-in Customer'}</td>
                            <td>{currency}{parseFloat(sale.grand_total || sale.total || 0).toFixed(2)}</td>
                            <td>{new Date(sale.created_at || sale.inv_date).toLocaleDateString()}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="4" className="text-center">No recent sales data</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Purchases */}
          <div className="col-md-6">
            <div className="card">
              <div className="card-header">
                <h5>Recent Purchases (Last 5)</h5>
              </div>
              <div className="card-body">
                <div className="table-responsive">
                  <table className="table table-striped">
                    <thead>
                      <tr>
                        <th>Purchase No</th>
                        <th>Supplier</th>
                        <th>Amount</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentPurchases.length > 0 ? (
                        recentPurchases.map((purchase, index) => (
                          <tr key={index}>
                            <td>{purchase.purchase_id || `#${purchase.id}`}</td>
                            <td>{purchase.supplier_name || purchase.vendor_name || 'Unknown Supplier'}</td>
                            <td>{currency}{parseFloat(purchase.total_amount || purchase.grand_total || 0).toFixed(2)}</td>
                            <td>{new Date(purchase.created_at || purchase.purchase_date).toLocaleDateString()}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="4" className="text-center">No recent purchase data</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </Layout>
  );
}
