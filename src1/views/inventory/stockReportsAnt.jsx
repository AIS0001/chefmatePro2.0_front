import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Card,
  Tabs,
  Table,
  Row,
  Col,
  Statistic,
  Button,
  DatePicker,
  Select,
  Space,
  message,
  Spin,
  Tag,
  Typography,
  Empty,
  Divider,
  Alert
} from "antd";
import {
  DownloadOutlined,
  PrinterOutlined,
  ReloadOutlined,
  DollarOutlined,
  ShoppingCartOutlined,
  CheckCircleOutlined
} from "@ant-design/icons";
import Layout from "../../layout/Layout";
import Header from "../../components/Header";
import { getHeaders } from "../../utility/getHeader";
import fetchData from "../../functions/fetchData";
import dayjs from "dayjs";
import jsPDF from "jspdf";
import "jspdf-autotable";

const { Option } = Select;
const { Text } = Typography;
const { RangePicker } = DatePicker;

export default function StockReportsAnt() {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("closing-stock");

  // Closing Stock Report States
  const [closingStockData, setClosingStockData] = useState([]);
  const [closingStockSummary, setClosingStockSummary] = useState(null);

  // Purchase Reconciliation States
  const [reconcileData, setReconcileData] = useState([]);
  const [reconcileSummary, setReconcileSummary] = useState(null);
  const [dateRange, setDateRange] = useState(null);
  const [productFilter, setProductFilter] = useState("");
  const [products, setProducts] = useState([]);

  // Closing Stock Columns
  const closingStockColumns = [
    {
      title: "Product",
      dataIndex: "product_name",
      key: "product_name",
      width: 200,
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: "Unit",
      dataIndex: "unit_name",
      key: "unit_name",
      render: (text) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: "ML Capacity",
      dataIndex: "ml_capacity",
      key: "ml_capacity",
      render: (ml) => ml ? `${ml}ML` : "-",
      width: 100,
    },
    {
      title: "Current Qty",
      dataIndex: "current_quantity",
      key: "current_quantity",
      render: (qty) => parseFloat(qty || 0).toFixed(2),
      align: "right",
      width: 120,
    },
    {
      title: "Reserved",
      dataIndex: "reserved_quantity",
      key: "reserved_quantity",
      render: (qty) => <Text type="warning">{parseFloat(qty || 0).toFixed(2)}</Text>,
      align: "right",
      width: 100,
    },
    {
      title: "Available",
      dataIndex: "available_quantity",
      key: "available_quantity",
      render: (qty) => <Text type="success" strong>{parseFloat(qty || 0).toFixed(2)}</Text>,
      align: "right",
      width: 100,
    },
    {
      title: "Purchase Price",
      dataIndex: "purchase_price",
      key: "purchase_price",
      render: (price) => `฿${parseFloat(price || 0).toFixed(2)}`,
      align: "right",
      width: 120,
    },
    {
      title: "Selling Price",
      dataIndex: "selling_price",
      key: "selling_price",
      render: (price) => `฿${parseFloat(price || 0).toFixed(2)}`,
      align: "right",
      width: 120,
    },
    {
      title: "Cost Value",
      dataIndex: "stock_value_cost",
      key: "stock_value_cost",
      render: (value) => <Text type="danger">฿{parseFloat(value || 0).toFixed(2)}</Text>,
      align: "right",
      width: 130,
    },
    {
      title: "Selling Value",
      dataIndex: "stock_value_selling",
      key: "stock_value_selling",
      render: (value) => <Text type="success">฿{parseFloat(value || 0).toFixed(2)}</Text>,
      align: "right",
      width: 130,
    },
    {
      title: "Status",
      dataIndex: "stock_status",
      key: "stock_status",
      render: (status) => {
        const colors = {
          "OUT_OF_STOCK": "red",
          "LOW_STOCK": "orange",
          "OK": "green"
        };
        return <Tag color={colors[status]}>{status}</Tag>;
      },
      width: 100,
    },
  ];

  // Purchase Reconciliation Columns
  const reconcileColumns = [
    {
      title: "Product",
      dataIndex: "product_name",
      key: "product_name",
      width: 200,
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: "Unit",
      dataIndex: "unit_name",
      key: "unit_name",
      render: (text) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: "Total Purchased",
      dataIndex: "total_purchased",
      key: "total_purchased",
      render: (qty) => <Text type="success">{parseFloat(qty || 0).toFixed(2)}</Text>,
      align: "right",
      width: 120,
    },
    {
      title: "Purchase Value",
      dataIndex: "purchase_value",
      key: "purchase_value",
      render: (value) => `฿${parseFloat(value || 0).toFixed(2)}`,
      align: "right",
      width: 130,
    },
    {
      title: "Total Sold",
      dataIndex: "total_sold",
      key: "total_sold",
      render: (qty) => <Text type="warning">{parseFloat(qty || 0).toFixed(2)}</Text>,
      align: "right",
      width: 100,
    },
    {
      title: "Total Wasted",
      dataIndex: "total_wasted",
      key: "total_wasted",
      render: (qty) => <Text type="danger">{parseFloat(qty || 0).toFixed(2)}</Text>,
      align: "right",
      width: 100,
    },
    {
      title: "Adj. In",
      dataIndex: "adjustments_in",
      key: "adjustments_in",
      render: (qty) => parseFloat(qty || 0).toFixed(2),
      align: "right",
      width: 80,
    },
    {
      title: "Adj. Out",
      dataIndex: "adjustments_out",
      key: "adjustments_out",
      render: (qty) => parseFloat(qty || 0).toFixed(2),
      align: "right",
      width: 80,
    },
    {
      title: "Current Stock",
      dataIndex: "current_quantity",
      key: "current_quantity",
      render: (qty) => <Text strong>{parseFloat(qty || 0).toFixed(2)}</Text>,
      align: "right",
      width: 110,
    },
    {
      title: "Last Purchase",
      dataIndex: "last_purchase_date",
      key: "last_purchase_date",
      render: (date) => date ? dayjs(date).format("DD/MM/YYYY") : "-",
      width: 110,
    },
  ];

  // Fetch data on mount
  useEffect(() => {
    fetchProducts();
  }, []);

  // Re-fetch when tab changes
  useEffect(() => {
    if (activeTab === "closing-stock") {
      fetchClosingStockReport();
    } else {
      fetchPurchaseReconciliationReport();
    }
  }, [activeTab]);

  const fetchProducts = async () => {
    try {
      const items = await fetchData("items", null, "id", { isstockable: "1" });
      if (Array.isArray(items)) setProducts(items);
    } catch (error) {
      console.error("Failed to fetch products:", error);
    }
  };

  const fetchClosingStockReport = async () => {
    try {
      setLoading(true);
      const headers = getHeaders();
      console.log("Stock Report Auth:", headers);
      const response = await axios.get(`/stock/reports/closing-stock`, headers);

      if (response.data?.success) {
        setClosingStockData(response.data.data.items || []);
        setClosingStockSummary(response.data.data.summary || {});
        message.success("Closing stock report loaded");
      }
    } catch (error) {
      message.error("Failed to fetch closing stock report: " + (error.response?.data?.message || error.message));
      console.error("Closing stock error:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPurchaseReconciliationReport = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      if (dateRange && dateRange[0] && dateRange[1]) {
        params.append("startDate", dateRange[0].format("YYYY-MM-DD"));
        params.append("endDate", dateRange[1].format("YYYY-MM-DD"));
      }

      if (productFilter) params.append("productId", productFilter);

      const headers = getHeaders();
      console.log("Purchase Report Auth:", headers);
      const response = await axios.get(`/stock/reports/purchase-reconciliation?${params.toString()}`, headers);

      if (response.data?.success) {
        setReconcileData(response.data.data.items || []);
        setReconcileSummary(response.data.data.summary || {});
        message.success("Purchase reconciliation report loaded");
      }
    } catch (error) {
      message.error("Failed to fetch purchase reconciliation report: " + (error.response?.data?.message || error.message));
      console.error("Purchase reconciliation error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleReconciliationDateChange = (dates) => {
    setDateRange(dates);
  };

  const handleReconciliationProductChange = (value) => {
    setProductFilter(value);
  };

  const exportToPDF = (reportName, columns, data, summary) => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // Title
      doc.setFontSize(16);
      doc.text(`${reportName}`, pageWidth / 2, 15, { align: "center" });

      // Summary Section
      if (summary) {
        doc.setFontSize(10);
        let yPosition = 25;
        const summaryKeys = Object.keys(summary).slice(0, 4);

        summaryKeys.forEach((key, index) => {
          const value = summary[key];
          if (typeof value === "number") {
            doc.text(`${key}: ${parseFloat(value).toFixed(2)}`, 20 + (index % 2) * 90, yPosition + Math.floor(index / 2) * 8);
          }
        });

        yPosition += 20;
        doc.line(20, yPosition, pageWidth - 20, yPosition);
      }

      // Table
      doc.autoTable({
        columns: columns.map(col => ({ header: col.title, dataKey: col.dataIndex })),
        body: data.map(row =>
          columns.map(col => {
            const value = row[col.dataIndex];
            if (typeof value === "number") return value.toFixed(2);
            return value || "-";
          })
        ),
        startY: 50,
        margin: { top: 10, left: 10, right: 10 },
        styles: { fontSize: 9 }
      });

      doc.save(`${reportName}_${dayjs().format("YYYY-MM-DD")}.pdf`);
      message.success("PDF exported successfully");
    } catch (error) {
      message.error("Failed to export PDF: " + error.message);
    }
  };

  const exportToCSV = (reportName, columns, data) => {
    try {
      const csvContent = [
        columns.map(col => col.title).join(","),
        ...data.map(row =>
          columns.map(col => {
            const value = row[col.dataIndex];
            if (typeof value === "number") return value.toFixed(2);
            return `"${value || ""}"`;
          }).join(",")
        )
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${reportName}_${dayjs().format("YYYY-MM-DD")}.csv`;
      link.click();
      message.success("CSV exported successfully");
    } catch (error) {
      message.error("Failed to export CSV: " + error.message);
    }
  };

  return (
    <Layout>
      <Header title="Stock Reports" />

      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: "closing-stock",
              label: "📊 Closing Stock Report",
              children: (
                <Spin spinning={loading}>
                  {/* Closing Stock Filters */}
                  <Card type="inner" title="🔍 Filters" style={{ marginBottom: 16 }}>
                    <Row gutter={16}>
                      <Col xs={24} sm={24} md={24}>
                        <Space>
                          <Button
                            type="primary"
                            icon={<ReloadOutlined />}
                            onClick={fetchClosingStockReport}
                          >
                            Load Report
                          </Button>
                          <Button
                            icon={<DownloadOutlined />}
                            onClick={() => exportToCSV("Closing_Stock", closingStockColumns, closingStockData)}
                            disabled={closingStockData.length === 0}
                          >
                            Export CSV
                          </Button>
                          <Button
                            icon={<PrinterOutlined />}
                            onClick={() => exportToPDF("Closing_Stock_Report", closingStockColumns, closingStockData, closingStockSummary)}
                            disabled={closingStockData.length === 0}
                          >
                            Export PDF
                          </Button>
                        </Space>
                      </Col>
                    </Row>
                  </Card>

                  {/* Summary Statistics */}
                  {closingStockSummary && (
                    <Card type="inner" title="📈 Summary" style={{ marginBottom: 16 }}>
                      <Row gutter={16}>
                        <Col xs={24} sm={12} md={6}>
                          <Statistic
                            title="Total Items"
                            value={closingStockSummary.totalItems}
                            prefix={<CheckCircleOutlined />}
                          />
                        </Col>
                        <Col xs={24} sm={12} md={6}>
                          <Statistic
                            title="Stock Value (Cost)"
                            value={closingStockSummary.totalStockValueCost}
                            prefix="฿"
                            precision={2}
                            valueStyle={{ color: "#ff4d4f" }}
                          />
                        </Col>
                        <Col xs={24} sm={12} md={6}>
                          <Statistic
                            title="Stock Value (Selling)"
                            value={closingStockSummary.totalStockValueSelling}
                            prefix="฿"
                            precision={2}
                            valueStyle={{ color: "#52c41a" }}
                          />
                        </Col>
                        <Col xs={24} sm={12} md={6}>
                          <Space direction="vertical" size={0}>
                            <Statistic
                              title="Out of Stock"
                              value={closingStockSummary.outOfStock}
                              valueStyle={{ color: "#ff4d4f", fontSize: "20px" }}
                            />
                            <Statistic
                              title="Low Stock"
                              value={closingStockSummary.lowStock}
                              valueStyle={{ color: "#faad14", fontSize: "20px" }}
                            />
                          </Space>
                        </Col>
                      </Row>
                    </Card>
                  )}

                  {/* Closing Stock Table */}
                  <Card type="inner" title="📦 Stock Inventory">
                    {closingStockData.length > 0 ? (
                      <Table
                        columns={closingStockColumns}
                        dataSource={closingStockData}
                        rowKey="id"
                        pagination={{ pageSize: 20, showSizeChanger: true }}
                        scroll={{ x: 1500 }}
                        size="small"
                      />
                    ) : (
                      <Empty description="No data available" />
                    )}
                  </Card>
                </Spin>
              )
            },
            {
              key: "purchase-reconciliation",
              label: "🛒 Purchase Reconciliation",
              children: (
                <Spin spinning={loading}>
                  {/* Reconciliation Filters */}
                  <Card type="inner" title="🔍 Filters" style={{ marginBottom: 16 }}>
                    <Row gutter={16}>
                      <Col xs={24} sm={12} md={8}>
                        <label>Date Range</label>
                        <RangePicker
                          value={dateRange}
                          onChange={handleReconciliationDateChange}
                          style={{ width: "100%" }}
                        />
                      </Col>

                      <Col xs={24} sm={12} md={8}>
                        <label>Product</label>
                        <Select
                          placeholder="All Products"
                          value={productFilter}
                          onChange={handleReconciliationProductChange}
                          allowClear
                          style={{ width: "100%" }}
                          showSearch
                          optionFilterProp="children"
                        >
                          {products.map(prod => (
                            <Option key={prod.id} value={prod.id}>
                              {prod.product_name || prod.iname}
                            </Option>
                          ))}
                        </Select>
                      </Col>

                      <Col xs={24} sm={12} md={8}>
                        <Space>
                          <Button
                            type="primary"
                            icon={<ReloadOutlined />}
                            onClick={fetchPurchaseReconciliationReport}
                          >
                            Load Report
                          </Button>
                          <Button
                            icon={<DownloadOutlined />}
                            onClick={() => exportToCSV("Purchase_Reconciliation", reconcileColumns, reconcileData)}
                            disabled={reconcileData.length === 0}
                          >
                            CSV
                          </Button>
                          <Button
                            icon={<PrinterOutlined />}
                            onClick={() => exportToPDF("Purchase_Reconciliation", reconcileColumns, reconcileData, reconcileSummary)}
                            disabled={reconcileData.length === 0}
                          >
                            PDF
                          </Button>
                        </Space>
                      </Col>
                    </Row>
                  </Card>

                  {/* Reconciliation Summary */}
                  {reconcileSummary && (
                    <Card type="inner" title="📊 Summary" style={{ marginBottom: 16 }}>
                      <Alert
                        message={`Report Period: ${reconcileSummary.period?.startDate} to ${reconcileSummary.period?.endDate}`}
                        type="info"
                        style={{ marginBottom: 16 }}
                      />
                      <Row gutter={16}>
                        <Col xs={24} sm={12} md={6}>
                          <Statistic
                            title="Total Purchased"
                            value={reconcileSummary.totalPurchased}
                            valueStyle={{ color: "#1890ff" }}
                          />
                        </Col>
                        <Col xs={24} sm={12} md={6}>
                          <Statistic
                            title="Purchase Value"
                            value={reconcileSummary.totalPurchaseValue}
                            prefix="฿"
                            precision={2}
                            valueStyle={{ color: "#13c2c2" }}
                          />
                        </Col>
                        <Col xs={24} sm={12} md={6}>
                          <Statistic
                            title="Total Sold"
                            value={reconcileSummary.totalSold}
                            valueStyle={{ color: "#52c41a" }}
                          />
                        </Col>
                        <Col xs={24} sm={12} md={6}>
                          <Statistic
                            title="Total Wasted"
                            value={reconcileSummary.totalWasted}
                            valueStyle={{ color: "#ff4d4f" }}
                          />
                        </Col>
                      </Row>
                    </Card>
                  )}

                  {/* Reconciliation Table */}
                  <Card type="inner" title="📋 Purchase Records">
                    {reconcileData.length > 0 ? (
                      <Table
                        columns={reconcileColumns}
                        dataSource={reconcileData}
                        rowKey="product_id"
                        pagination={{ pageSize: 20, showSizeChanger: true }}
                        scroll={{ x: 1500 }}
                        size="small"
                      />
                    ) : (
                      <Empty description="No data available" />
                    )}
                  </Card>
                </Spin>
              )
            }
          ]}
        />
      </Card>
    </Layout>
  );
}
