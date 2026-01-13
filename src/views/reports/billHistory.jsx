// Updated BillHistory.jsx with Ant Design
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { CSVLink } from "react-csv";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { parseISO, format } from "date-fns";
import { useNavigate } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import {
  Table,
  Card,
  Button,
  DatePicker,
  Select,
  Input,
  Row,
  Col,
  Tabs,
  Space,
  Statistic,
  Empty,
  Modal,
  Tooltip as AntTooltip,
  Tag,
  InputNumber,
} from "antd";
import {
  FilterOutlined,
  ClearOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
  ArrowLeftOutlined,
  HomeOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

import Layout from "../../layout/Layout";
import Header from "../../components/Header";
import CardComponent from "../../components/cards/CardComponent";
import DataTable from "../../components/data-tables/dataTable";
import fetchData from "../../functions/fetchData";
import logo from "../../assets/logo.png";
import BillItemModal from "../../components/Modals/BillItemModal";
import { getUserType } from "../../utility/auth";

const PAYMENT_MODES = [
  { label: "Cash", value: "Cash" },
  { label: "Credit", value: "Credit" },
  { label: "Bank Transfer", value: "Bank Transfer" },
  { label: "Entertainment", value: "Entertainment" },
  { label: "UPI", value: "UPI" },
  { label: "QR Code", value: "QR Code" },
];

export default function BillHistory() {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);
  const [activeTab, setActiveTab] = useState("active");
  
  // Filter states
  const [filters, setFilters] = useState({
    startDate: localStorage.getItem("startDate") ? dayjs(localStorage.getItem("startDate")) : null,
    endDate: localStorage.getItem("endDate") ? dayjs(localStorage.getItem("endDate")) : null,
    paymentMode: localStorage.getItem("paymentMode") || "",
    invoiceNo: "",
    tableNumber: "",
    minAmount: null,
    maxAmount: null,
    sortBy: "date",
    sortOrder: "descend",
  });

  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  const navigate = useNavigate();
  const userType = getUserType();
  const isCashier = userType?.toLowerCase() === 'cashier';

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        await fetchData("final_bill", setData, "id",{});
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchAllData();
  }, []);

  // Initial data load effect
  useEffect(() => {
    if (data.length > 0) {
      applyFilters();
    }
  }, [data]);

  // Filter change effect
  useEffect(() => {
    if (filters.startDate) {
      localStorage.setItem("startDate", filters.startDate.format("YYYY-MM-DD"));
    } else {
      localStorage.removeItem("startDate");
    }
    if (filters.endDate) {
      localStorage.setItem("endDate", filters.endDate.format("YYYY-MM-DD"));
    } else {
      localStorage.removeItem("endDate");
    }
    localStorage.setItem("paymentMode", filters.paymentMode);
    
    if (data.length > 0) {
      applyFilters();
    }
  }, [filters, data, activeTab]);

  const applyFilters = () => {
    if (filters.startDate && filters.endDate && filters.startDate.isAfter(filters.endDate)) {
      toast.error("Invalid date range: Start Date is after End Date");
      return;
    }

    let filtered = [...data];
    
    // Filter by status (active/cancelled)
    if (activeTab === "cancelled") {
      filtered = filtered.filter(item => item.status === 2 || item.status === "2");
    } else {
      filtered = filtered.filter(item => item.status !== 2 && item.status !== "2");
    }
    
    // Filter by date range
    if (filters.startDate && filters.endDate) {
      const start = filters.startDate.startOf('day').toDate();
      const end = filters.endDate.endOf('day').toDate();
      
      filtered = filtered.filter(item => {
        if (!item.setup_date) return false;
        const itemDate = new Date(item.setup_date);
        return itemDate >= start && itemDate <= end;
      });
    } else if (filters.startDate) {
      const start = filters.startDate.startOf('day').toDate();
      filtered = filtered.filter(item => {
        if (!item.setup_date) return false;
        const itemDate = new Date(item.setup_date);
        return itemDate >= start;
      });
    } else if (filters.endDate) {
      const end = filters.endDate.endOf('day').toDate();
      filtered = filtered.filter(item => {
        if (!item.setup_date) return false;
        const itemDate = new Date(item.setup_date);
        return itemDate <= end;
      });
    }
    
    // Filter by payment mode
    if (filters.paymentMode) {
      filtered = filtered.filter(item => item.payment_mode === filters.paymentMode);
    }
    
    // Filter by invoice number
    if (filters.invoiceNo) {
      filtered = filtered.filter(item => 
        item.id.toString().includes(filters.invoiceNo.toLowerCase())
      );
    }
    
    // Filter by table
    if (filters.tableNumber) {
      filtered = filtered.filter(item => 
        item.table_number && item.table_number.toLowerCase().includes(filters.tableNumber.toLowerCase())
      );
    }
    
    // Filter by amount range
    if (filters.minAmount !== null || filters.maxAmount !== null) {
      filtered = filtered.filter(item => {
        const amount = parseFloat(item.grand_total || 0);
        const minAmount = filters.minAmount !== null ? parseFloat(filters.minAmount) : 0;
        const maxAmount = filters.maxAmount !== null ? parseFloat(filters.maxAmount) : Infinity;
        return amount >= minAmount && amount <= maxAmount;
      });
    }
    
    // Sort data
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (filters.sortBy) {
        case "date":
          aValue = new Date(a.setup_date + " " + (a.inv_time || "00:00:00"));
          bValue = new Date(b.setup_date + " " + (b.inv_time || "00:00:00"));
          break;
        case "amount":
          aValue = parseFloat(a.grand_total || 0);
          bValue = parseFloat(b.grand_total || 0);
          break;
        case "table":
          aValue = a.table_number || "";
          bValue = b.table_number || "";
          break;
        case "invoice":
          aValue = parseInt(a.id || 0);
          bValue = parseInt(b.id || 0);
          break;
        default:
          aValue = a.id;
          bValue = b.id;
      }
      
      if (filters.sortOrder === "ascend") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    
    setFilteredData(filtered);
  };
  const clearFilters = () => {
    setFilters({
      startDate: null,
      endDate: null,
      paymentMode: "",
      invoiceNo: "",
      tableNumber: "",
      minAmount: null,
      maxAmount: null,
      sortBy: "date",
      sortOrder: "descend",
    });
    localStorage.removeItem("startDate");
    localStorage.removeItem("endDate");
    localStorage.removeItem("paymentMode");
    toast.success("Filters cleared!");
  };

 const exportPDF = () => {
  const doc = new jsPDF();
  doc.addImage(logo, "PNG", 150, 10, 40, 15);
  doc.setFontSize(16);
  doc.text("Bill History Report", 14, 20);

  const tableColumn = ["Invoice No", "Date", "Time", "Table", "Subtotal", "Tax", "Grand Total", "Payment Mode"];
  const tableRows = [];

  filteredData.forEach(item => {
    const subtotal = parseFloat(item.subtotal_afterdiscount) || 0;
    const tax = parseFloat(item.tax) || 0;
    const grandTotal = parseFloat(item.grand_total) || 0;

    tableRows.push([
      item.id,
      format(parseISO(item.setup_date), "dd/MM/yyyy"),
      item.inv_time,
      item.table_number,
      subtotal.toFixed(2),
      tax.toFixed(2),
      grandTotal.toFixed(2),
      item.payment_mode,
    ]);
  });

  // Add total row
  tableRows.push([
    { content: "TOTAL", colSpan: 4, styles: { halign: "right", fontStyle: "bold" } },
    totalSubtotal.toFixed(2),
    totalTax.toFixed(2),
    totalAmount.toFixed(2),
    "" 
  ]);

  doc.autoTable({
    startY: 30,
    head: [tableColumn],
    body: tableRows,
    styles: { fontSize: 10 },
  });

  doc.save(`salereport-${dayjs().format("YYYY-MM-DD")}.pdf`);
};


  const handleViewItems = (row) => {
    setSelectedBill(row);
    setShowModal(true);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const monthlyData = (() => {
    const summary = {};
    (filteredData.length > 0 ? filteredData : data).forEach((item) => {
      const month = format(parseISO(item.setup_date), "MMM yyyy");
      const total = parseFloat(item.grand_total || 0);
      summary[month] = (summary[month] || 0) + total;
    });
    return Object.entries(summary).map(([month, total]) => ({ month, total }));
  })();

  const columns = [
    {
      label: "Inv. No.",
      field: "id",
      render: (row) => (
        <button className="btn btn-link p-0" onClick={() => handleViewItems(row)}>
          #{row.id}
        </button>
      ),
    },
    { label: "Inv Date", field: "inv_date" },
    { label: "Setup Date", field: "setup_date" },
    { label: "Time", field: "inv_time" },
    { label: "Table", field: "table_number" },
    { label: "Subtotal", field: "subtotal_afterdiscount" },
    { label: "Tax", field: "tax" },
    { label: "Grand Total", field: "grand_total" },
    { label: "Payment", field: "payment_mode" },
    {
      label: "Action",
      field: "actions",
      render: (row) => (
        <button className="btn btn-sm btn-info" onClick={() => handleViewItems(row)}>
          View Items
        </button>
      ),
    },
  ];

  // Navigation functions for cashiers
  const navigateToDashboard = () => {
    navigate('/dashboard');
  };

  const navigateBack = () => {
    navigate(-1);
  };

  // Calculate totals
  const totalAmount = filteredData.reduce((acc, item) => acc + parseFloat(item.grand_total || 0), 0);
  const totalSubtotal = filteredData.reduce((acc, item) => acc + parseFloat(item.subtotal_afterdiscount || 0), 0);
  const totalTax = filteredData.reduce((acc, item) => acc + parseFloat(item.tax || 0), 0);

  // Check if mobile device
  const isMobile = window.innerWidth <= 768;

  // Render content with Ant Design
  const renderContent = () => (
    <>
      {/* Cashier Navigation Header */}
      {isCashier && (
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={24}>
            <Card style={{ borderRadius: "8px" }}>
              <Space style={{ width: "100%", justifyContent: "space-between", display: "flex" }}>
                <Space>
                  <Button 
                    type="default" 
                    onClick={navigateBack} 
                    icon={<ArrowLeftOutlined />}
                  >
                    Back
                  </Button>
                  <h3 style={{ margin: 0 }}>Sales Reports</h3>
                </Space>
                <Button 
                  type="primary" 
                  onClick={navigateToDashboard} 
                  icon={<HomeOutlined />}
                >
                  Dashboard
                </Button>
              </Space>
            </Card>
          </Col>
        </Row>
      )}

      {/* Tab Section */}
      <Card style={{ marginBottom: 24 }}>
        <Tabs 
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: "active",
              label: (
                <span>
                  <Tag color="blue">Active Bills</Tag>
                </span>
              ),
            },
            {
              key: "cancelled",
              label: (
                <span>
                  <Tag color="red">Cancelled Bills</Tag>
                </span>
              ),
            },
          ]}
        />
      </Card>

      {/* Filter Section */}
      <Card style={{ marginBottom: 24 }} title={<><FilterOutlined /> Sale Filters</>}>
        {/* Primary Filters */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <div>
              <label style={{ fontWeight: 600, marginBottom: 8, display: "block" }}>Date Range</label>
              <DatePicker.RangePicker
                style={{ width: "100%" }}
                value={filters.startDate && filters.endDate ? [filters.startDate, filters.endDate] : null}
                onChange={(dates) => {
                  if (dates) {
                    handleFilterChange("startDate", dates[0]);
                    handleFilterChange("endDate", dates[1]);
                  } else {
                    handleFilterChange("startDate", null);
                    handleFilterChange("endDate", null);
                  }
                }}
                format="YYYY-MM-DD"
              />
            </div>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <div>
              <label style={{ fontWeight: 600, marginBottom: 8, display: "block" }}>Payment Mode</label>
              <Select
                placeholder="Select payment mode"
                allowClear
                value={filters.paymentMode || undefined}
                onChange={(value) => handleFilterChange("paymentMode", value || "")}
                options={[{ label: "All", value: "" }, ...PAYMENT_MODES]}
                style={{ width: "100%" }}
              />
            </div>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <div>
              <label style={{ fontWeight: 600, marginBottom: 8, display: "block" }}>Invoice No.</label>
              <Input
                placeholder="Search invoice"
                value={filters.invoiceNo}
                onChange={(e) => handleFilterChange("invoiceNo", e.target.value)}
                allowClear
              />
            </div>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <div>
              <label style={{ fontWeight: 600, marginBottom: 8, display: "block" }}>Table Number</label>
              <Input
                placeholder="Search table"
                value={filters.tableNumber}
                onChange={(e) => handleFilterChange("tableNumber", e.target.value)}
                allowClear
              />
            </div>
          </Col>
        </Row>

        {/* Advanced Filters */}
        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col xs={24} sm={12} md={6}>
            <div>
              <label style={{ fontWeight: 600, marginBottom: 8, display: "block" }}>Min Amount (฿)</label>
              <InputNumber
                placeholder="Minimum"
                style={{ width: "100%" }}
                value={filters.minAmount}
                onChange={(value) => handleFilterChange("minAmount", value)}
                precision={2}
              />
            </div>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <div>
              <label style={{ fontWeight: 600, marginBottom: 8, display: "block" }}>Max Amount (฿)</label>
              <InputNumber
                placeholder="Maximum"
                style={{ width: "100%" }}
                value={filters.maxAmount}
                onChange={(value) => handleFilterChange("maxAmount", value)}
                precision={2}
              />
            </div>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <div>
              <label style={{ fontWeight: 600, marginBottom: 8, display: "block" }}>Sort By</label>
              <Select
                value={filters.sortBy}
                onChange={(value) => handleFilterChange("sortBy", value)}
                options={[
                  { label: "Date & Time", value: "date" },
                  { label: "Amount", value: "amount" },
                  { label: "Table", value: "table" },
                  { label: "Invoice No.", value: "invoice" },
                ]}
                style={{ width: "100%" }}
              />
            </div>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <div>
              <label style={{ fontWeight: 600, marginBottom: 8, display: "block" }}>Sort Order</label>
              <Select
                value={filters.sortOrder}
                onChange={(value) => handleFilterChange("sortOrder", value)}
                options={[
                  { label: "Descending", value: "descend" },
                  { label: "Ascending", value: "ascend" },
                ]}
                style={{ width: "100%" }}
              />
            </div>
          </Col>
        </Row>

        {/* Action Buttons */}
        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col xs={24} sm={12} md={4}>
            <Button 
              type="primary" 
              danger 
              onClick={clearFilters}
              icon={<ClearOutlined />}
              block
              size="small"
            >
              Clear Filters
            </Button>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <CSVLink
              data={filteredData.length > 0 ? filteredData : data}
              filename={`salereport-${dayjs().format("YYYY-MM-DD")}.csv`}
              style={{ textDecoration: "none", display: "block" }}
            >
              <Button 
                type="primary" 
                icon={<FileExcelOutlined />}
                block
                size="small"
              >
                CSV
              </Button>
            </CSVLink>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Button 
              type="danger" 
              icon={<FilePdfOutlined />}
              onClick={exportPDF}
              block
              size="small"
            >
              PDF
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Data Table Section */}
      <Card style={{ marginBottom: 24 }} title="Sales Records">
        {filteredData.length === 0 ? (
          <Empty description="No records found" />
        ) : (
          <div style={{ overflowX: "auto" }}>
            <Table
              columns={[
                {
                  title: "Inv. No.",
                  dataIndex: "id",
                  key: "id",
                  width: 100,
                  render: (text, record) => (
                    <Button 
                      type="link" 
                      onClick={() => handleViewItems(record)}
                    >
                      #{text}
                    </Button>
                  ),
                  sorter: (a, b) => a.id - b.id,
                },
                {
                  title: "Date",
                  dataIndex: "setup_date",
                  key: "setup_date",
                  render: (text) => format(parseISO(text), "dd/MM/yyyy"),
                  sorter: (a, b) => new Date(a.setup_date) - new Date(b.setup_date),
                },
                {
                  title: "Time",
                  dataIndex: "inv_time",
                  key: "inv_time",
                  width: 80,
                },
                {
                  title: "Table",
                  dataIndex: "table_number",
                  key: "table_number",
                  render: (text) => <Tag color="cyan">{text}</Tag>,
                },
                {
                  title: "Subtotal",
                  dataIndex: "subtotal_afterdiscount",
                  key: "subtotal_afterdiscount",
                  render: (text) => `฿${parseFloat(text || 0).toFixed(2)}`,
                  align: "right",
                },
                {
                  title: "Tax",
                  dataIndex: "tax",
                  key: "tax",
                  render: (text) => `฿${parseFloat(text || 0).toFixed(2)}`,
                  align: "right",
                },
                {
                  title: "Grand Total",
                  dataIndex: "grand_total",
                  key: "grand_total",
                  render: (text) => <strong>฿{parseFloat(text || 0).toFixed(2)}</strong>,
                  align: "right",
                },
                {
                  title: "Payment",
                  dataIndex: "payment_mode",
                  key: "payment_mode",
                  render: (text) => {
                    const colorMap = {
                      "Cash": "green",
                      "Credit": "blue",
                      "Bank Transfer": "purple",
                      "UPI": "orange",
                      "QR Code": "red",
                      "Entertainment": "cyan",
                    };
                    return <Tag color={colorMap[text] || "default"}>{text}</Tag>;
                  },
                },
                {
                  title: "Action",
                  key: "action",
                  width: 80,
                  render: (_, record) => (
                    <AntTooltip title="View Items">
                      <Button 
                        type="primary" 
                        size="small"
                        icon={<EyeOutlined />}
                        onClick={() => handleViewItems(record)}
                      />
                    </AntTooltip>
                  ),
                },
              ]}
              dataSource={filteredData.map((item, index) => ({ ...item, key: index }))}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total}`,
              }}
              size="small"
              scroll={{ x: 1200 }}
            />
          </div>
        )}
      </Card>

      {/* Summary Cards */}
      <Card style={{ marginBottom: 24 }} title="Summary">
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Statistic
              title="Total Sale"
              value={totalAmount}
              prefix="฿"
              precision={2}
              valueStyle={{ color: "#52c41a" }}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Statistic
              title="Total Subtotal"
              value={totalSubtotal}
              prefix="฿"
              precision={2}
              valueStyle={{ color: "#1890ff" }}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Statistic
              title="Total Tax"
              value={totalTax}
              prefix="฿"
              precision={2}
              valueStyle={{ color: "#f5222d" }}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Statistic
              title="Records Count"
              value={filteredData.length}
              valueStyle={{ color: "#722ed1" }}
            />
          </Col>
        </Row>
      </Card>

      {/* Monthly Chart */}
      <Card title="Monthly Sales Summary">
        {monthlyData.length > 0 ? (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => `฿${value.toFixed(2)}`} />
              <Bar dataKey="total" fill="#1890ff" name="Total Sales" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <Empty description="No data to display" />
        )}
      </Card>

      {/* Modal */}
      {showModal && (
        <BillItemModal
          isOpen={showModal}
          bill={selectedBill}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );

  // Main return statement with conditional rendering
  return isCashier ? (
    <div style={{ 
      padding: "24px",
      backgroundColor: "#f0f2f5",
      minHeight: "100vh",
    }}>
      {renderContent()}
    </div>
  ) : (
    <Layout>
      <Header title="Sale Report" />
      {renderContent()}
    </Layout>
  );
}
