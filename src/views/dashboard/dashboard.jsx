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
  Legend
} from "recharts";

export default function Dashboard() {
  const [salesData, setSalesData] = useState([]);
  const [purchaseData, setPurchaseData] = useState([]);
  const [summary, setSummary] = useState({ totalSales: 0, totalPurchase: 0 });

useEffect(() => {
  const fetchDashboardData = async () => {
    try {
      const [salesRes, purchaseRes, summaryRes] = await Promise.all([
          
        axios.get("/report/sale", getHeaders()),
        axios.get("/report/purchase", getHeaders()),
        axios.get("/report/summary", getHeaders()),
      ]);

      console.log("✅ Sales Response:", salesRes.data);
      console.log("✅ Purchase Response:", purchaseRes.data);
      console.log("✅ Summary Response:", summaryRes.data);

      setSalesData(salesRes.data);
      setPurchaseData(purchaseRes.data);
      setSummary(summaryRes.data);
    } catch (error) {
      toast.error("Failed to load dashboard data");

      // Detailed error output
      if (error.response) {
        console.error("❌ Server responded with error:", error.response.data);
      } else if (error.request) {
        console.error("❌ No response received:", error.request);
      } else {
        console.error("❌ Error setting up request:", error.message);
      }
    }
  };

  fetchDashboardData();
}, []);


  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

  return (
    <Layout>
      <Header title="POS Dashboard" />
      <ToastContainer />

      <div className="row">
        <div className="col-lg-6">
          <CardComponent title="Sales Overview" headerColor="green">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={salesData}>
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="amount" stroke="#8884d8" />
              </LineChart>
            </ResponsiveContainer>
          </CardComponent>
        </div>

        <div className="col-lg-6">
          <CardComponent title="Purchase Overview" headerColor="orange">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={purchaseData}>
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="amount" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </CardComponent>
        </div>

        <div className="col-lg-6">
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
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardComponent>
        </div>

        <div className="col-lg-6">
          <CardComponent title="Summary" headerColor="purple">
            <ul className="list-group">
              <li className="list-group-item d-flex justify-content-between align-items-center">
                Total Sales
                <span className="badge badge-success badge-pill">{summary.totalSales}</span>
              </li>
              <li className="list-group-item d-flex justify-content-between align-items-center">
                Total Purchases
                <span className="badge badge-primary badge-pill">{summary.totalPurchase}</span>
              </li>
            </ul>
          </CardComponent>
        </div>
      </div>
    </Layout>
  );
}
