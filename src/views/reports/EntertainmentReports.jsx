import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Col,
  DatePicker,
  Empty,
  Row,
  Select,
  Space,
  Spin,
  Statistic,
  Table,
  Typography,
  message,
} from "antd";
import {
  FileExcelOutlined,
  FilePdfOutlined,
  InfoCircleOutlined,
  ReloadOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import axios from "axios";
import dayjs from "dayjs";
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import Layout from "../../layout/Layout";
import { getHeaders } from "../../utility/getHeader";
import logo from "../../assets/logo.png";

const { RangePicker } = DatePicker;

const GROUP_OPTIONS = [
  { label: "Food", value: "Food" },
  { label: "Bar", value: "Bar" },
  { label: "Shisha", value: "Shisha" },
];

const GROUP_META = {
  Food: {
    title: "Food Entertainment",
    quantityKey: "FoodQty",
    background: "#fffbe6",
    borderColor: "#ffe58f",
  },
  Bar: {
    title: "Bar Entertainment",
    quantityKey: "BarQty",
    background: "#fff1f0",
    borderColor: "#ffa39e",
  },
  Shisha: {
    title: "Shisha Entertainment",
    quantityKey: "ShishaQty",
    background: "#f9f0ff",
    borderColor: "#efdbff",
  },
};

const grandTotalCardStyle = {
  background: "#fff7e6",
  borderColor: "#ffd591",
};

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const quantityFormatter = new Intl.NumberFormat("en-IN", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const formatCurrency = (value) => currencyFormatter.format(Number(value || 0));
const formatQuantity = (value) => quantityFormatter.format(Number(value || 0));

const getDateRangeLabel = (range) => {
  if (!range || range.length !== 2 || !range[0] || !range[1]) {
    return "all_dates";
  }

  return `${range[0].format("YYYY-MM-DD")}_to_${range[1].format("YYYY-MM-DD")}`;
};

const buildApiParams = (range) => {
  if (!range || range.length !== 2 || !range[0] || !range[1]) {
    return {};
  }

  return {
    startDate: range[0].format("YYYY-MM-DD"),
    endDate: range[1].format("YYYY-MM-DD"),
  };
};

export default function EntertainmentReports() {
  const [loading, setLoading] = useState(false);
  const [reportRows, setReportRows] = useState([]);
  const [dateRange, setDateRange] = useState(null);
  const [selectedGroups, setSelectedGroups] = useState(["Food", "Bar", "Shisha"]);

  const loadReport = async (range = dateRange) => {
    setLoading(true);
    try {
      const response = await axios.get("/entertainment-report", {
        ...getHeaders(),
        params: buildApiParams(range),
      });

      setReportRows(Array.isArray(response?.data?.data) ? response.data.data : []);
    } catch (error) {
      console.error("Failed to load entertainment report", error);
      setReportRows([]);
      message.error("Failed to load entertainment report");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport(null);
  }, []);

  const activeGroups = selectedGroups.length > 0 ? selectedGroups : ["Food", "Bar", "Shisha"];

  const totals = useMemo(() => {
    return reportRows.reduce(
      (accumulator, row) => {
        accumulator.Food += Number(row.Food || 0);
        accumulator.Bar += Number(row.Bar || 0);
        accumulator.Shisha += Number(row.Shisha || 0);
        accumulator.FoodQty += Number(row.FoodQty || 0);
        accumulator.BarQty += Number(row.BarQty || 0);
        accumulator.ShishaQty += Number(row.ShishaQty || 0);
        return accumulator;
      },
      {
        Food: 0,
        Bar: 0,
        Shisha: 0,
        FoodQty: 0,
        BarQty: 0,
        ShishaQty: 0,
      }
    );
  }, [reportRows]);

  const visibleRows = useMemo(() => {
    return reportRows.map((row) => ({
      ...row,
      totalAmount: activeGroups.reduce((sum, group) => sum + Number(row[group] || 0), 0),
    }));
  }, [activeGroups, reportRows]);

  const visibleTotals = useMemo(() => {
    return activeGroups.reduce((sum, group) => sum + Number(totals[group] || 0), 0);
  }, [activeGroups, totals]);

  const columns = useMemo(() => {
    const groupColumns = activeGroups.map((group) => ({
      title: `Item Group (${group})`,
      dataIndex: group,
      key: group,
      align: "right",
      render: (value, record) => (
        <Space direction="vertical" size={0} style={{ width: "100%" }}>
          <Typography.Text style={{ width: "100%", textAlign: "right" }}>
            {formatCurrency(value)}
          </Typography.Text>
          <Typography.Text type="secondary" style={{ fontSize: 12, width: "100%", textAlign: "right" }}>
            Qty: {formatQuantity(record[GROUP_META[group].quantityKey])}
          </Typography.Text>
        </Space>
      ),
    }));

    return [
      {
        title: "Date",
        dataIndex: "date",
        key: "date",
        render: (value) => (value ? dayjs(value).format("DD MMM YYYY") : "-"),
      },
      ...groupColumns,
      {
        title: "Total Amount",
        dataIndex: "totalAmount",
        key: "totalAmount",
        align: "right",
        render: (value) => <strong>{formatCurrency(value)}</strong>,
      },
    ];
  }, [activeGroups]);

  const buildExportRows = () => {
    return visibleRows.map((row) => {
      const exportRow = {
        Date: row.date ? dayjs(row.date).format("DD MMM YYYY") : "-",
      };

      activeGroups.forEach((group) => {
        exportRow[`${group} Sale`] = Number(row[group] || 0);
        exportRow[`${group} Qty`] = Number(row[GROUP_META[group].quantityKey] || 0);
      });

      exportRow["Total Amount"] = Number(row.totalAmount || 0);
      return exportRow;
    });
  };

  const exportToExcel = () => {
    if (visibleRows.length === 0) {
      return;
    }

    try {
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet([
        ...buildExportRows(),
        (() => {
          const totalRow = { Date: "TOTAL" };
          activeGroups.forEach((group) => {
            totalRow[`${group} Sale`] = Number(totals[group] || 0);
            totalRow[`${group} Qty`] = Number(totals[GROUP_META[group].quantityKey] || 0);
          });
          totalRow["Total Amount"] = Number(visibleTotals || 0);
          return totalRow;
        })(),
      ]);
      XLSX.utils.book_append_sheet(workbook, worksheet, "Entertainment Report");
      XLSX.writeFile(workbook, `entertainment_report_${getDateRangeLabel(dateRange)}.xlsx`);
    } catch (error) {
      console.error("Failed to export entertainment report to Excel", error);
      message.error("Failed to export Excel");
    }
  };

  const exportToPDF = () => {
    if (visibleRows.length === 0) {
      return;
    }

    try {
      const doc = new jsPDF("l", "pt", "a4");
      const dateLabel = dateRange && dateRange[0] && dateRange[1]
        ? `${dateRange[0].format("DD MMM YYYY")} - ${dateRange[1].format("DD MMM YYYY")}`
        : "All Dates";

      doc.addImage(logo, "PNG", 705, 24, 80, 40);
      doc.setFontSize(14);
      doc.text("Entertainment Report", 40, 40);
      doc.setFontSize(10);
      doc.text(`Date Range: ${dateLabel}`, 40, 58);
      doc.text(`Groups: ${activeGroups.join(", ")}`, 40, 74);

      const head = [["Date"]];
      activeGroups.forEach((group) => {
        head[0].push(`${group} Sale`);
        head[0].push(`${group} Qty`);
      });
      head[0].push("Total Amount");

      const body = visibleRows.map((row) => {
        const rowData = [row.date ? dayjs(row.date).format("DD MMM YYYY") : "-"];
        activeGroups.forEach((group) => {
          rowData.push(formatCurrency(row[group]));
          rowData.push(formatQuantity(row[GROUP_META[group].quantityKey]));
        });
        rowData.push(formatCurrency(row.totalAmount));
        return rowData;
      });

      const totalRow = ["TOTAL"];
      activeGroups.forEach((group) => {
        totalRow.push(formatCurrency(totals[group]));
        totalRow.push(formatQuantity(totals[GROUP_META[group].quantityKey]));
      });
      totalRow.push(formatCurrency(visibleTotals));
      body.push(totalRow);

      doc.autoTable({
        startY: 90,
        head,
        body,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [250, 140, 22] },
        didParseCell: (data) => {
          if (data.row.index === body.length - 1) {
            data.cell.styles.fontStyle = "bold";
            data.cell.styles.fillColor = [255, 247, 230];
          }
        },
      });

      doc.save(`entertainment_report_${getDateRangeLabel(dateRange)}.pdf`);
    } catch (error) {
      console.error("Failed to export entertainment report to PDF", error);
      message.error("Failed to export PDF");
    }
  };

  return (
    <Layout>
      <div style={{ padding: 20 }}>
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <Card>
            <Row align="middle" justify="space-between" gutter={[16, 16]}>
              <Col>
                <Space align="center">
                  <WarningOutlined style={{ fontSize: 20 }} />
                  <Typography.Title level={4} style={{ margin: 0 }}>
                    Entertainment Report
                  </Typography.Title>
                </Space>
              </Col>
              <Col>
                <Space wrap>
                  <RangePicker value={dateRange} onChange={(range) => setDateRange(range)} allowClear />
                  <Select
                    mode="multiple"
                    value={selectedGroups}
                    onChange={(value) => setSelectedGroups(value.length > 0 ? value : ["Food", "Bar", "Shisha"])}
                    options={GROUP_OPTIONS}
                    style={{ minWidth: 220 }}
                    maxTagCount="responsive"
                  />
                  <Button icon={<ReloadOutlined />} onClick={() => loadReport(dateRange)}>
                    Refresh
                  </Button>
                  <Button icon={<FilePdfOutlined />} danger onClick={exportToPDF} disabled={visibleRows.length === 0}>
                    Export PDF
                  </Button>
                  <Button
                    type="primary"
                    icon={<FileExcelOutlined />}
                    onClick={exportToExcel}
                    disabled={visibleRows.length === 0}
                    style={{ background: "#52c41a", borderColor: "#52c41a" }}
                  >
                    Export Excel
                  </Button>
                  <Button
                    onClick={() => {
                      setDateRange(null);
                      setSelectedGroups(["Food", "Bar", "Shisha"]);
                      loadReport(null);
                    }}
                  >
                    Clear
                  </Button>
                </Space>
              </Col>
            </Row>
          </Card>

          <Row gutter={[16, 16]}>
            {GROUP_OPTIONS.map((option) => (
              <Col xs={24} sm={12} lg={6} key={option.value}>
                <Card
                  style={{
                    background: GROUP_META[option.value].background,
                    borderColor: GROUP_META[option.value].borderColor,
                    opacity: activeGroups.includes(option.value) ? 1 : 0.55,
                  }}
                >
                  <Statistic title={GROUP_META[option.value].title} value={formatCurrency(totals[option.value])} />
                </Card>
              </Col>
            ))}
            <Col xs={24} sm={12} lg={6}>
              <Card style={grandTotalCardStyle}>
                <Statistic title="Entertainment Total" value={formatCurrency(visibleTotals)} />
              </Card>
            </Col>
          </Row>

          <Card>
            <Spin spinning={loading}>
              {visibleRows.length === 0 ? (
                <Empty description="No entertainment category records found" />
              ) : (
                <Table
                  rowKey={(record) => record.key || record.date}
                  columns={columns}
                  dataSource={visibleRows}
                  pagination={{ pageSize: 10 }}
                  scroll={{ x: 1100 }}
                  summary={() => {
                    let cellIndex = 0;
                    return (
                      <Table.Summary.Row>
                        <Table.Summary.Cell index={cellIndex}>
                          <strong>Total</strong>
                        </Table.Summary.Cell>
                        {activeGroups.map((group) => {
                          cellIndex += 1;
                          return (
                            <Table.Summary.Cell key={group} index={cellIndex} align="right">
                              <Space direction="vertical" size={0} style={{ width: "100%" }}>
                                <Typography.Text strong style={{ width: "100%", textAlign: "right" }}>
                                  {formatCurrency(totals[group])}
                                </Typography.Text>
                                <Typography.Text type="secondary" style={{ fontSize: 12, width: "100%", textAlign: "right" }}>
                                  Qty: {formatQuantity(totals[GROUP_META[group].quantityKey])}
                                </Typography.Text>
                              </Space>
                            </Table.Summary.Cell>
                          );
                        })}
                        <Table.Summary.Cell index={cellIndex + 1} align="right">
                          <strong>{formatCurrency(visibleTotals)}</strong>
                        </Table.Summary.Cell>
                      </Table.Summary.Row>
                    );
                  }}
                />
              )}
            </Spin>
          </Card>
        </Space>
      </div>
    </Layout>
  );
}
