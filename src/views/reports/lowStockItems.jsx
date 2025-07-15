import React, { useEffect, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { CSVLink } from "react-csv";
import jsPDF from "jspdf";
import "jspdf-autotable";
import axios from "axios";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";

import Layout from "../../layout/Layout";
import Header from "../../components/Header";
import CardComponent from "../../components/cards/CardComponent";
import { getHeaders } from "../../utility/getHeader";
import fetchData from "../../functions/fetchData";

const COLORS = {
  primary: "#007bff",
  success: "#28a745",
  danger: "#dc3545",
  warning: "#ffc107",
  info: "#17a2b8",
  dark: "#343a40",
  light: "#f8f9fa",
  secondary: "#6c757d",
  purple: "#6f42c1",
  teal: "#20c997",
  pink: "#e83e8c",
  orange: "#fd7e14",
  yellow: "#ffc107",
  green: "#28a745",
  blue: "#007bff",
  indigo: "#6610f2",
  red: "#dc3545"
};

export default function LowStockItems() {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currency, setCurrency] = useState("₹");
  const [stockThreshold, setStockThreshold] = useState(10);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("stock_asc");
  const [summary, setSummary] = useState({
    totalItems: 0,
    lowStockItems: 0,
    outOfStock: 0,
    totalValue: 0,
    criticalItems: 0
  });

  // Fetch currency from settings
  useEffect(() => {
    const fetchCurrency = async () => {
      try {
        const coreSettings = await fetchData('coresetting', null, 'id', {});
        if (coreSettings && coreSettings.length > 0) {
          const currencySymbols = {
            'THB': '฿', 'TH': '฿', 'INR': '₹', 'IN': '₹', 'USD': '$', 'US': '$',
            'EUR': '€', 'GBP': '£', 'UK': '£', 'JPY': '¥', 'AUD': 'A$',
            'CAD': 'C$', 'SGD': 'S$', 'HKD': 'HK$', 'MYR': 'RM', 'PHP': '₱'
          };
          const currencyFromDb = coreSettings[0].currency || 'INR';
          setCurrency(currencySymbols[currencyFromDb] || currencyFromDb || '₹');
        }
      } catch (error) {
        console.error('Error fetching currency:', error);
      }
    };
    fetchCurrency();
  }, []);

  // Fetch low stock items
  useEffect(() => {
    const fetchLowStockItems = async () => {
      setLoading(true);
      try {
        // Fetch low stock alert data
        const lowStockResponse = await axios.get("/report/getlowstockalert", getHeaders());
        
        // Fetch all items for comprehensive analysis
        const allItemsResponse = await fetchData('items', null, 'id', {});
        
        // Fetch categories
        const categoriesResponse = await fetchData('categories', null, 'id', {});
        
        setData(lowStockResponse.data || []);
        setCategories(categoriesResponse || []);
        
        // Calculate summary
        const allItems = allItemsResponse || [];
        const lowStockItems = lowStockResponse.data || [];
        const outOfStock = lowStockItems.filter(item => (item.closing_stock || 0) === 0);
        const criticalItems = lowStockItems.filter(item => (item.closing_stock || 0) <= 5);
        
        const totalValue = lowStockItems.reduce((sum, item) => {
          const stock = item.closing_stock || 0;
          const price = parseFloat(item.selling_price || item.price || 0);
          return sum + (stock * price);
        }, 0);

        setSummary({
          totalItems: allItems.length,
          lowStockItems: lowStockItems.length,
          outOfStock: outOfStock.length,
          totalValue: totalValue,
          criticalItems: criticalItems.length
        });

        toast.success("Low stock items loaded successfully");
      } catch (error) {
        console.error("Error fetching low stock items:", error);
        toast.error("Failed to load low stock items");
      } finally {
        setLoading(false);
      }
    };

    fetchLowStockItems();
  }, []);

  // Filter and sort data
  useEffect(() => {
    let filtered = [...data];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.item_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply category filter
    if (categoryFilter) {
      filtered = filtered.filter(item => item.category === categoryFilter);
    }

    // Apply stock threshold filter
    filtered = filtered.filter(item => (item.closing_stock || 0) <= stockThreshold);

    // Apply sorting
    filtered.sort((a, b) => {
      const stockA = a.closing_stock || 0;
      const stockB = b.closing_stock || 0;
      const priceA = parseFloat(a.selling_price || a.price || 0);
      const priceB = parseFloat(b.selling_price || b.price || 0);

      switch (sortBy) {
        case "stock_asc":
          return stockA - stockB;
        case "stock_desc":
          return stockB - stockA;
        case "name_asc":
          return (a.item_name || "").localeCompare(b.item_name || "");
        case "name_desc":
          return (b.item_name || "").localeCompare(a.item_name || "");
        case "value_asc":
          return (stockA * priceA) - (stockB * priceB);
        case "value_desc":
          return (stockB * priceB) - (stockA * priceA);
        default:
          return stockA - stockB;
      }
    });

    setFilteredData(filtered);
  }, [data, searchTerm, categoryFilter, stockThreshold, sortBy]);

  // CSV Export headers
  const csvHeaders = [
    { label: "Item Name", key: "item_name" },
    { label: "Category", key: "category" },
    { label: "Current Stock", key: "closing_stock" },
    { label: "Selling Price", key: "selling_price" },
    { label: "Stock Value", key: "stock_value" },
    { label: "Status", key: "status" }
  ];

  // Prepare CSV data
  const csvData = filteredData.map(item => ({
    ...item,
    stock_value: ((item.closing_stock || 0) * parseFloat(item.selling_price || item.price || 0)).toFixed(2),
    status: (item.closing_stock || 0) === 0 ? "Out of Stock" : 
            (item.closing_stock || 0) <= 5 ? "Critical" : "Low Stock"
  }));

  // PDF Export
  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(20);
    doc.text("Low Stock Items Report", 20, 20);
    
    // Add summary
    doc.setFontSize(12);
    doc.text(`Total Items: ${summary.totalItems}`, 20, 40);
    doc.text(`Low Stock Items: ${summary.lowStockItems}`, 20, 50);
    doc.text(`Out of Stock: ${summary.outOfStock}`, 20, 60);
    doc.text(`Critical Items: ${summary.criticalItems}`, 20, 70);
    doc.text(`Total Stock Value: ${currency}${summary.totalValue.toFixed(2)}`, 20, 80);
    
    // Add table
    const tableData = filteredData.map(item => [
      item.item_name || "N/A",
      item.category || "N/A",
      item.closing_stock || 0,
      `${currency}${parseFloat(item.selling_price || item.price || 0).toFixed(2)}`,
      `${currency}${((item.closing_stock || 0) * parseFloat(item.selling_price || item.price || 0)).toFixed(2)}`,
      (item.closing_stock || 0) === 0 ? "Out of Stock" : 
      (item.closing_stock || 0) <= 5 ? "Critical" : "Low Stock"
    ]);

    doc.autoTable({
      head: [["Item Name", "Category", "Stock", "Price", "Stock Value", "Status"]],
      body: tableData,
      startY: 90,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [220, 53, 69] }
    });

    doc.save("low-stock-items-report.pdf");
    toast.success("PDF exported successfully");
  };

  // Chart data for stock distribution
  const stockDistributionData = [
    { name: "Out of Stock", value: summary.outOfStock, color: COLORS.danger },
    { name: "Critical (≤5)", value: summary.criticalItems - summary.outOfStock, color: COLORS.warning },
    { name: "Low Stock", value: summary.lowStockItems - summary.criticalItems, color: COLORS.info }
  ];

  // Chart data for category wise distribution
  const categoryData = categories.map(cat => ({
    name: cat.name,
    value: filteredData.filter(item => item.category === cat.name).length
  })).filter(item => item.value > 0);

  return (
    <Layout>
      <Header title="Low Stock Items Report" />
      <ToastContainer />

      {/* Summary Cards */}
      <div className="row mb-4">
        <div className="col-md-2 col-6 mb-3">
          <CardComponent title="Total Items" headerColor="primary" small gradient>
            <div className="h4 text-white">{summary.totalItems}</div>
          </CardComponent>
        </div>
        <div className="col-md-2 col-6 mb-3">
          <CardComponent title="Low Stock" headerColor="info" small gradient>
            <div className="h4 text-white">{summary.lowStockItems}</div>
          </CardComponent>
        </div>
        <div className="col-md-2 col-6 mb-3">
          <CardComponent title="Out of Stock" headerColor="danger" small gradient>
            <div className="h4 text-white">{summary.outOfStock}</div>
          </CardComponent>
        </div>
        <div className="col-md-2 col-6 mb-3">
          <CardComponent title="Critical Items" headerColor="warning" small gradient>
            <div className="h4 text-white">{summary.criticalItems}</div>
          </CardComponent>
        </div>
        <div className="col-md-4 col-12 mb-3">
          <CardComponent title="Total Stock Value" headerColor="success" small gradient>
            <div className="h4 text-white">{currency}{summary.totalValue.toFixed(2)}</div>
          </CardComponent>
        </div>
      </div>

      {/* Charts Row */}
      <div className="row mb-4">
        <div className="col-lg-6 mb-4">
          <CardComponent title="Stock Distribution" headerColor="danger">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stockDistributionData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {stockDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardComponent>
        </div>

        <div className="col-lg-6 mb-4">
          <CardComponent title="Category Wise Low Stock" headerColor="warning">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill={COLORS.warning} />
              </BarChart>
            </ResponsiveContainer>
          </CardComponent>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="row mb-4">
        <div className="col-lg-12">
          <CardComponent title="Filters & Actions" headerColor="secondary">
            <div className="row">
              <div className="col-md-3 mb-3">
                <label className="form-label">Search Items</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search by item name or category"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="col-md-2 mb-3">
                <label className="form-label">Stock Threshold</label>
                <input
                  type="number"
                  className="form-control"
                  value={stockThreshold}
                  onChange={(e) => setStockThreshold(parseInt(e.target.value) || 0)}
                  min="0"
                />
              </div>
              <div className="col-md-2 mb-3">
                <label className="form-label">Category</label>
                <select
                  className="form-select"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <option value="">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-2 mb-3">
                <label className="form-label">Sort By</label>
                <select
                  className="form-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="stock_asc">Stock (Low to High)</option>
                  <option value="stock_desc">Stock (High to Low)</option>
                  <option value="name_asc">Name (A-Z)</option>
                  <option value="name_desc">Name (Z-A)</option>
                  <option value="value_asc">Value (Low to High)</option>
                  <option value="value_desc">Value (High to Low)</option>
                </select>
              </div>
              <div className="col-md-3 mb-3">
                <label className="form-label">Export</label>
                <div className="d-flex gap-2">
                  <CSVLink
                    data={csvData}
                    headers={csvHeaders}
                    filename="low-stock-items.csv"
                    className="btn btn-success btn-sm"
                  >
                    <i className="fas fa-file-csv me-1"></i>
                    CSV
                  </CSVLink>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={exportToPDF}
                  >
                    <i className="fas fa-file-pdf me-1"></i>
                    PDF
                  </button>
                </div>
              </div>
            </div>
          </CardComponent>
        </div>
      </div>

      {/* Data Table */}
      <div className="row">
        <div className="col-12">
          <CardComponent title={`Low Stock Items (${filteredData.length})`} headerColor="danger">
            <div className="table-responsive">
              <table className="table table-striped table-hover">
                <thead style={{ backgroundColor: COLORS.danger, color: 'white' }}>
                  <tr>
                    <th scope="col" style={{ color: 'white', fontWeight: 'bold' }}>Item Name</th>
                    <th scope="col" style={{ color: 'white', fontWeight: 'bold' }}>Current Stock</th>
                    <th scope="col" style={{ color: 'white', fontWeight: 'bold' }}>Selling Price</th>
                    <th scope="col" style={{ color: 'white', fontWeight: 'bold' }}>Stock Value</th>
                    <th scope="col" style={{ color: 'white', fontWeight: 'bold' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="5" className="text-center py-4">
                        <div className="spinner-border text-primary" role="status">
                          <span className="sr-only">Loading...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredData.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center py-4 text-muted">
                        <i className="fas fa-inbox fa-2x mb-2"></i>
                        <br />
                        No low stock items found
                      </td>
                    </tr>
                  ) : (
                    filteredData.map((item, index) => {
                      const stock = item.closing_stock || 0;
                      const price = parseFloat(item.selling_price || item.price || 0);
                      const stockValue = stock * price;
                      
                      return (
                        <tr key={index}>
                          <td>
                            <div className="d-flex align-items-center">
                              <div 
                                className="rounded-circle me-2 d-flex align-items-center justify-content-center"
                                style={{
                                  width: "30px",
                                  height: "30px",
                                  backgroundColor: stock === 0 ? COLORS.danger : 
                                                  stock <= 5 ? COLORS.warning : COLORS.info,
                                  color: "white",
                                  fontSize: "12px",
                                  fontWeight: "bold"
                                }}
                              >
                                {(item.item_name || "N").charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="fw-bold">{item.item_name || "N/A"}</div>
                                <small className="text-muted">{item.category || "No Category"}</small>
                              </div>
                            </div>
                          </td>
                          <td className="text-center">
                            <span 
                              className={`badge ${
                                stock === 0 ? "bg-danger" : 
                                stock <= 5 ? "bg-warning" : "bg-info"
                              }`}
                              style={{ fontSize: "12px", padding: "6px 12px" }}
                            >
                              {stock}
                            </span>
                          </td>
                          <td>{currency}{price.toFixed(2)}</td>
                          <td>{currency}{stockValue.toFixed(2)}</td>
                          <td>
                            {stock === 0 ? (
                              <span className="badge bg-danger">Out of Stock</span>
                            ) : stock <= 5 ? (
                              <span className="badge bg-warning">Critical</span>
                            ) : (
                              <span className="badge bg-info">Low Stock</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
              
              {filteredData.length > 10 && (
                <div className="d-flex justify-content-between align-items-center mt-3">
                  <small className="text-muted">
                    Showing {filteredData.length} items
                  </small>
                  <small className="text-muted">
                    Total Stock Value: {currency}{filteredData.reduce((sum, item) => 
                      sum + ((item.closing_stock || 0) * parseFloat(item.selling_price || item.price || 0)), 0
                    ).toFixed(2)}
                  </small>
                </div>
              )}
            </div>
          </CardComponent>
        </div>
      </div>
    </Layout>
  );
}
