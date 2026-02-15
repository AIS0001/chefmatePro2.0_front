import React, { useEffect, useMemo, useState } from "react";
import { Card, Col, DatePicker, Divider, Empty, Row, Space, Statistic, Table, Tag, Typography, Button, Spin } from "antd";
import { CalendarOutlined, ReloadOutlined, FilePdfOutlined, FileExcelOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import Layout from "../../layout/Layout";
import fetchData from "../../functions/fetchData";
import logo from "../../assets/logo.png";

const { RangePicker } = DatePicker;

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const formatCurrency = (value) => currencyFormatter.format(Number(value || 0));

const parseDate = (value) => {
  if (!value) return null;
  return dayjs(value, "YYYY-MM-DD", true).isValid()
    ? dayjs(value, "YYYY-MM-DD")
    : dayjs(value);
};

const getDateRangeLabel = (range) => {
  if (!range || range.length !== 2) return "all";
  const [start, end] = range;
  if (!start || !end) return "all";
  return `${start.format("YYYY-MM-DD")}_to_${end.format("YYYY-MM-DD")}`;
};

const summaryCardStyles = [
  { background: "#f0f7ff", borderColor: "#d6e8ff" },
  { background: "#f6f3ff", borderColor: "#e1d7ff" },
  { background: "#f0fffa", borderColor: "#c8f2e8" },
  { background: "#fff7e8", borderColor: "#ffe2b8" },
  { background: "#f1f7ff", borderColor: "#d9e8ff" },
  { background: "#fef4f4", borderColor: "#f7d6d6" },
  { background: "#f3fff5", borderColor: "#d4f0da" },
  { background: "#f9f6ff", borderColor: "#e3dbff" },
];

export default function DayWiseReports() {
  const [summaries, setSummaries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState(null);

  const loadSummaries = async () => {
    setLoading(true);
    try {
      const data = await fetchData("day_close_summary", null, "close_date", {});
      setSummaries(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load day-wise summaries", error);
      setSummaries([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSummaries();
  }, []);

  const filteredSummaries = useMemo(() => {
    if (!dateRange || dateRange.length !== 2) return summaries;
    const [start, end] = dateRange;
    if (!start || !end) return summaries;

    return summaries.filter((item) => {
      const closeDate = parseDate(item.close_date);
      if (!closeDate) return false;
      return closeDate.isSame(start, "day") || closeDate.isSame(end, "day") ||
        (closeDate.isAfter(start, "day") && closeDate.isBefore(end, "day"));
    });
  }, [summaries, dateRange]);

  const totals = useMemo(() => {
    return filteredSummaries.reduce(
      (acc, item) => {
        acc.totalSales += Number(item.total_sales || 0);
        acc.totalOrders += Number(item.total_orders || 0);
        acc.totalItems += Number(item.total_items_sold || 0);
        acc.cashSales += Number(item.cash_sales || 0);
        acc.upiSales += Number(item.upi_sales || 0);
        acc.cardSales += Number(item.card_sales || 0);
        acc.qrSales += Number(item.qr_sales || 0);
        acc.otherSales += Number(item.other_sales || 0);
        return acc;
      },
      {
        totalSales: 0,
        totalOrders: 0,
        totalItems: 0,
        cashSales: 0,
        upiSales: 0,
        cardSales: 0,
        qrSales: 0,
        otherSales: 0,
      }
    );
  }, [filteredSummaries]);

  const buildExportRows = () => {
    return filteredSummaries.map((item) => ({
      "Close Date": item.close_date ? dayjs(item.close_date).format("DD MMM YYYY") : "-",
      "Total Sales": Number(item.total_sales || 0),
      "Cash": Number(item.cash_sales || 0),
      "UPI": Number(item.upi_sales || 0),
      "Card": Number(item.card_sales || 0),
      "QR": Number(item.qr_sales || 0),
      "Other": Number(item.other_sales || 0),
      "Status": String(item.status || "open").toUpperCase(),
      "Closed By": item.closed_by || "-",
    }));
  };

  const buildTotalsRow = () => ({
    "Close Date": "TOTAL",
    "Total Sales": totals.totalSales,
    "Cash": totals.cashSales,
    "UPI": totals.upiSales,
    "Card": totals.cardSales,
    "QR": totals.qrSales,
    "Other": totals.otherSales,
    "Status": "",
    "Closed By": "",
  });

  const exportToExcel = () => {
    if (filteredSummaries.length === 0) return;
    try {
      const exportRows = [...buildExportRows(), buildTotalsRow()];
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportRows);
      XLSX.utils.book_append_sheet(wb, ws, "Day Wise Reports");
      const fileSuffix = getDateRangeLabel(dateRange);
      XLSX.writeFile(wb, `day_wise_reports_${fileSuffix}.xlsx`);
    } catch (error) {
      console.error("Excel export failed", error);
    }
  };

  const exportToPDF = () => {
    if (filteredSummaries.length === 0) return;
    try {
      const doc = new jsPDF("l", "pt", "a4");
      const fileSuffix = getDateRangeLabel(dateRange);
      const generatedAt = dayjs().format("dddd, DD MMM YYYY hh:mm A");
      doc.addImage(logo, "PNG", 705, 24, 80, 40);
      doc.setFontSize(14);
      doc.text("Day Wise Reports", 40, 40);
      doc.setFontSize(10);
      doc.text(`Date Range: ${fileSuffix.replace(/_/g, " ")}`, 40, 58);
      doc.setFont("helvetica", "bold");
      doc.text(`Generated: ${generatedAt}`, 40, 74);
      doc.setFont("helvetica", "normal");

      const exportRows = buildExportRows();
      const tableBody = exportRows.map((row) => [
        row["Close Date"],
        formatCurrency(row["Total Sales"]),
        formatCurrency(row["Cash"]),
        formatCurrency(row["UPI"]),
        formatCurrency(row["Card"]),
        formatCurrency(row["QR"]),
        formatCurrency(row["Other"]),
        row["Status"],
        row["Closed By"],
      ]);

      const totalsRow = buildTotalsRow();
      tableBody.push([
        totalsRow["Close Date"],
        formatCurrency(totalsRow["Total Sales"]),
        formatCurrency(totalsRow["Cash"]),
        formatCurrency(totalsRow["UPI"]),
        formatCurrency(totalsRow["Card"]),
        formatCurrency(totalsRow["QR"]),
        formatCurrency(totalsRow["Other"]),
        totalsRow["Status"],
        totalsRow["Closed By"],
      ]);

      doc.autoTable({
        startY: 90,
        head: [[
          "Close Date",
          "Total Sales",
          "Cash",
          "UPI",
          "Card",
          "QR",
          "Other",
          "Status",
          "Closed By",
        ]],
        body: tableBody,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [24, 144, 255] },
        didParseCell: (data) => {
          if (data.row.index === tableBody.length - 1) {
            data.cell.styles.fontStyle = "bold";
            data.cell.styles.fillColor = [240, 245, 255];
          }
        },
      });

      doc.save(`day_wise_reports_${fileSuffix}.pdf`);
    } catch (error) {
      console.error("PDF export failed", error);
    }
  };

  const columns = [
    {
      title: "Close Date",
      dataIndex: "close_date",
      key: "close_date",
      render: (value) => (value ? dayjs(value).format("DD MMM YYYY") : "-")
    },
    {
      title: "Total Sales",
      dataIndex: "total_sales",
      key: "total_sales",
      align: "right",
      render: (value) => formatCurrency(value)
    },
    {
      title: "Cash",
      dataIndex: "cash_sales",
      key: "cash_sales",
      align: "right",
      render: (value) => formatCurrency(value)
    },
    {
      title: "UPI",
      dataIndex: "upi_sales",
      key: "upi_sales",
      align: "right",
      render: (value) => formatCurrency(value)
    },
    {
      title: "Card",
      dataIndex: "card_sales",
      key: "card_sales",
      align: "right",
      render: (value) => formatCurrency(value)
    },
    {
      title: "QR",
      dataIndex: "qr_sales",
      key: "qr_sales",
      align: "right",
      render: (value) => formatCurrency(value)
    },
    {
      title: "Other",
      dataIndex: "other_sales",
      key: "other_sales",
      align: "right",
      render: (value) => formatCurrency(value)
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (value) => {
        const status = String(value || "open").toLowerCase();
        const color = status === "closed" ? "green" : "orange";
        return <Tag color={color}>{status.toUpperCase()}</Tag>;
      }
    },
    {
      title: "Closed By",
      dataIndex: "closed_by",
      key: "closed_by",
      render: (value) => value || "-"
    }
  ];

  return (
    <Layout>
      <div style={{ padding: "20px" }}>
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <Card>
            <Row align="middle" justify="space-between" gutter={[16, 16]}>
              <Col>
                <Space align="center">
                  <CalendarOutlined style={{ fontSize: 20 }} />
                  <Typography.Title level={4} style={{ margin: 0 }}>
                    Day Wise Reports
                  </Typography.Title>
                </Space>
                <Typography.Text type="secondary">
                  Track day-close summaries with payment split and totals.
                </Typography.Text>
              </Col>
              <Col>
                <Space wrap>
                  <RangePicker
                    value={dateRange}
                    onChange={(range) => setDateRange(range)}
                    allowClear
                  />
                  <Button icon={<ReloadOutlined />} onClick={loadSummaries}>
                    Refresh
                  </Button>
                  <Button icon={<FilePdfOutlined />} onClick={exportToPDF} disabled={filteredSummaries.length === 0}>
                    Export PDF
                  </Button>
                  <Button
                    type="primary"
                    icon={<FileExcelOutlined />}
                    onClick={exportToExcel}
                    disabled={filteredSummaries.length === 0}
                    style={{ background: "#52c41a", borderColor: "#52c41a" }}
                  >
                    Export Excel
                  </Button>
                  <Button
                    type="text"
                    onClick={() => setDateRange(null)}
                  >
                    Clear Filters
                  </Button>
                </Space>
              </Col>
            </Row>
          </Card>

          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} lg={6}>
              <Card style={summaryCardStyles[0]}>
                <Statistic title="Total Sales" value={formatCurrency(totals.totalSales)} />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card style={summaryCardStyles[1]}>
                <Statistic title="Total Orders" value={totals.totalOrders} />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card style={summaryCardStyles[2]}>
                <Statistic title="Items Sold" value={totals.totalItems} />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card style={summaryCardStyles[3]}>
                <Statistic title="Cash Sales" value={formatCurrency(totals.cashSales)} />
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} lg={6}>
              <Card style={summaryCardStyles[4]}>
                <Statistic title="UPI Sales" value={formatCurrency(totals.upiSales)} />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card style={summaryCardStyles[5]}>
                <Statistic title="Card Sales" value={formatCurrency(totals.cardSales)} />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card style={summaryCardStyles[6]}>
                <Statistic title="QR Sales" value={formatCurrency(totals.qrSales)} />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card style={summaryCardStyles[7]}>
                <Statistic title="Other Sales" value={formatCurrency(totals.otherSales)} />
              </Card>
            </Col>
          </Row>

          <Card>
            <Divider style={{ marginTop: 0 }} />
            <Spin spinning={loading}>
              {filteredSummaries.length === 0 ? (
                <Empty description="No day-close summaries found" />
              ) : (
                <Table
                  rowKey={(record) => `${record.id || record.close_date}`}
                  columns={columns}
                  dataSource={filteredSummaries}
                  pagination={{ pageSize: 10 }}
                  scroll={{ x: 1200 }}
                  summary={() => (
                    <Table.Summary.Row>
                      <Table.Summary.Cell index={0}><strong>Total</strong></Table.Summary.Cell>
                      <Table.Summary.Cell index={1} align="right"><strong>{formatCurrency(totals.totalSales)}</strong></Table.Summary.Cell>
                      <Table.Summary.Cell index={2} align="right"><strong>{formatCurrency(totals.cashSales)}</strong></Table.Summary.Cell>
                      <Table.Summary.Cell index={3} align="right"><strong>{formatCurrency(totals.upiSales)}</strong></Table.Summary.Cell>
                      <Table.Summary.Cell index={4} align="right"><strong>{formatCurrency(totals.cardSales)}</strong></Table.Summary.Cell>
                      <Table.Summary.Cell index={5} align="right"><strong>{formatCurrency(totals.qrSales)}</strong></Table.Summary.Cell>
                      <Table.Summary.Cell index={6} align="right"><strong>{formatCurrency(totals.otherSales)}</strong></Table.Summary.Cell>
                      <Table.Summary.Cell index={7} />
                      <Table.Summary.Cell index={8} />
                    </Table.Summary.Row>
                  )}
                />
              )}
            </Spin>
          </Card>
        </Space>
      </div>
    </Layout>
  );
}
