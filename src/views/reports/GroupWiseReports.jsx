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
  BarChartOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
  InfoCircleOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import axios from "axios";
import dayjs from "dayjs";
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import Layout from "../../layout/Layout";
import { getHeaders } from "../../utility/getHeader";
import fetchData from "../../functions/fetchData";
import logo from "../../assets/logo.png";

const { RangePicker } = DatePicker;

const GROUP_OPTIONS = [
  { label: "Food", value: "Food" },
  { label: "Bar", value: "Bar" },
  { label: "Shisha", value: "Shisha" },
];

const GROUP_META = {
  Food: {
    title: "Food Sale",
    quantityKey: "FoodQty",
    background: "#f6ffed",
    borderColor: "#d9f7be",
  },
  Bar: {
    title: "Bar Sale",
    quantityKey: "BarQty",
    background: "#fff7e6",
    borderColor: "#ffd591",
  },
  Shisha: {
    title: "Shisha Sale",
    quantityKey: "ShishaQty",
    background: "#f9f0ff",
    borderColor: "#efdbff",
  },
};

const grandTotalCardStyle = {
  background: "#f0f5ff",
  borderColor: "#adc6ff",
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
const getEntertainmentAmount = (value) => Number(value || 0);

const buildDiscountMapFromBills = (bills, range) => {
  const discountMap = new Map();
  const hasRange = Array.isArray(range) && range.length === 2 && range[0] && range[1];

  (Array.isArray(bills) ? bills : []).forEach((bill) => {
    const billDateValue = bill?.setup_date;
    const billDate = dayjs(billDateValue);
    if (!billDate.isValid()) {
      return;
    }

    if (hasRange) {
      const [start, end] = range;
      if (billDate.isBefore(start, "day") || billDate.isAfter(end, "day")) {
        return;
      }
    }

    const dateKey = billDate.format("YYYY-MM-DD");
    const discountAmount = Number(bill?.discount_amount || 0);
    discountMap.set(dateKey, Number((Number(discountMap.get(dateKey) || 0) + discountAmount).toFixed(2)));
  });

  return discountMap;
};

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

export default function GroupWiseReports() {
  const [loading, setLoading] = useState(false);
  const [reportRows, setReportRows] = useState([]);
  const [dateRange, setDateRange] = useState(null);
  const [selectedGroups, setSelectedGroups] = useState(["Food", "Bar", "Shisha"]);

  const loadReport = async (range = dateRange) => {
    setLoading(true);
    try {
      const [response, finalBills] = await Promise.all([
        axios.get("/groupwise-daywise-report", {
          ...getHeaders(),
          params: buildApiParams(range),
        }),
        fetchData("final_bill", null, "id", {}),
      ]);

      const rows = Array.isArray(response?.data?.data) ? response.data.data : [];
      const discountMap = buildDiscountMapFromBills(finalBills, range);
      const normalizedRows = rows.map((row) => {
        const totalAmount = Number(row?.totalAmount || 0);
        const discountAmount = Number(discountMap.get(String(row?.date || "")) || 0);
        return {
          ...row,
          discountAmount,
          netSale: Number((totalAmount - discountAmount).toFixed(2)),
        };
      });

      setReportRows(normalizedRows);
    } catch (error) {
      console.error("Failed to load group wise report", error);
      setReportRows([]);
      message.error("Failed to load group wise report");
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
        accumulator.discountAmount += Number(row.discountAmount || 0);
        return accumulator;
      },
      {
        Food: 0,
        Bar: 0,
        Shisha: 0,
        FoodQty: 0,
        BarQty: 0,
        ShishaQty: 0,
        discountAmount: 0,
      }
    );
  }, [reportRows]);

  const visibleRows = useMemo(() => {
    return reportRows.map((row) => {
      const totalAmount = activeGroups.reduce((sum, group) => sum + Number(row[group] || 0), 0);
      const discountAmount = Number(row.discountAmount || 0);
      return {
        ...row,
        totalAmount,
        discountAmount,
        netSale: Number((totalAmount - discountAmount).toFixed(2)),
      };
    });
  }, [activeGroups, reportRows]);

  const visibleTotals = useMemo(() => {
    return activeGroups.reduce(
      (sum, group) => sum + Number(totals[group] || 0),
      0
    );
  }, [activeGroups, totals]);

  const totalDiscount = useMemo(() => Number(totals.discountAmount || 0), [totals]);
  const totalNetSale = useMemo(() => Number((visibleTotals - totalDiscount).toFixed(2)), [visibleTotals, totalDiscount]);

  const summaryCards = useMemo(() => {
    return GROUP_OPTIONS.map((option) => ({
      key: option.value,
      title: GROUP_META[option.value].title,
      value: totals[option.value],
      hidden: !activeGroups.includes(option.value),
      style: {
        background: GROUP_META[option.value].background,
        borderColor: GROUP_META[option.value].borderColor,
      },
    }));
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
        title: "Total Sale",
        dataIndex: "totalAmount",
        key: "totalAmount",
        align: "right",
        render: (value) => <strong>{formatCurrency(value)}</strong>,
      },
      {
        title: "Discount",
        dataIndex: "discountAmount",
        key: "discountAmount",
        align: "right",
        render: (value) => formatCurrency(value),
      },
      {
        title: "Net Sale",
        dataIndex: "netSale",
        key: "netSale",
        align: "right",
        render: (value) => <strong>{formatCurrency(value)}</strong>,
      },
      {
        title: "Note",
        dataIndex: "note",
        key: "note",
        render: (_, record) => {
          const entertainmentAmount = getEntertainmentAmount(record.entertainmentAmount);
          if (entertainmentAmount <= 0) {
            return "-";
          }

          return (
            <Space direction="vertical" size={0}>
              <Typography.Text type="warning">
                Entertainment excluded
              </Typography.Text>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                Amount: {formatCurrency(entertainmentAmount)}
              </Typography.Text>
            </Space>
          );
        },
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

      exportRow["Total Sale"] = Number(row.totalAmount || 0);
      exportRow["Discount"] = Number(row.discountAmount || 0);
      exportRow["Net Sale"] = Number(row.netSale || 0);
      exportRow["Note"] = row.note || "-";
      return exportRow;
    });
  };

  const buildTotalsRow = () => {
    const totalRow = { Date: "TOTAL" };

    activeGroups.forEach((group) => {
      totalRow[`${group} Sale`] = Number(totals[group] || 0);
      totalRow[`${group} Qty`] = Number(totals[GROUP_META[group].quantityKey] || 0);
    });

    totalRow["Total Amount"] = Number(visibleTotals || 0);
    totalRow["Discount"] = Number(totalDiscount || 0);
    totalRow["Net Sale"] = Number(totalNetSale || 0);
    totalRow["Note"] = "";
    return totalRow;
  };

  const exportToExcel = () => {
    if (visibleRows.length === 0) {
      return;
    }

    try {
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet([...buildExportRows(), buildTotalsRow()]);
      XLSX.utils.book_append_sheet(workbook, worksheet, "Group Wise Report");
      XLSX.writeFile(workbook, `group_wise_report_${getDateRangeLabel(dateRange)}.xlsx`);
    } catch (error) {
      console.error("Failed to export group wise report to Excel", error);
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
      doc.text("Group Wise Report", 40, 40);
      doc.setFontSize(10);
      doc.text(`Date Range: ${dateLabel}`, 40, 58);
      doc.text(`Groups: ${activeGroups.join(", ")}`, 40, 74);

      const head = [["Date"]];
      activeGroups.forEach((group) => {
        head[0].push(`${group} Sale`);
        head[0].push(`${group} Qty`);
      });
      head[0].push("Total Amount");
      head[0].push("Discount");
      head[0].push("Net Sale");
      head[0].push("Note");

      const body = visibleRows.map((row) => {
        const rowData = [row.date ? dayjs(row.date).format("DD MMM YYYY") : "-"];
        activeGroups.forEach((group) => {
          rowData.push(formatCurrency(row[group]));
          rowData.push(formatQuantity(row[GROUP_META[group].quantityKey]));
        });
        rowData.push(formatCurrency(row.totalAmount));
        rowData.push(formatCurrency(row.discountAmount));
        rowData.push(formatCurrency(row.netSale));
        rowData.push(row.note || "-");
        return rowData;
      });

      const totalsRow = ["TOTAL"];
      activeGroups.forEach((group) => {
        totalsRow.push(formatCurrency(totals[group]));
        totalsRow.push(formatQuantity(totals[GROUP_META[group].quantityKey]));
      });
      totalsRow.push(formatCurrency(visibleTotals));
      totalsRow.push(formatCurrency(totalDiscount));
      totalsRow.push(formatCurrency(totalNetSale));
      totalsRow.push("");
      body.push(totalsRow);

      doc.autoTable({
        startY: 90,
        head,
        body,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [24, 144, 255] },
        didParseCell: (data) => {
          if (data.row.index === body.length - 1) {
            data.cell.styles.fontStyle = "bold";
            data.cell.styles.fillColor = [240, 245, 255];
          }
        },
      });

      doc.save(`group_wise_report_${getDateRangeLabel(dateRange)}.pdf`);
    } catch (error) {
      console.error("Failed to export group wise report to PDF", error);
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
                  <BarChartOutlined style={{ fontSize: 20 }} />
                  <Typography.Title level={4} style={{ margin: 0 }}>
                    Item Category Summary
                  </Typography.Title>
                </Space>
                <Typography.Text type="secondary">
                  Compare daily Food, Bar, and Shisha sales from order_items where status is 0, excluding bills marked as Entertainment.
                </Typography.Text>
              </Col>
              <Col>
                <Space wrap>
                  <RangePicker
                    value={dateRange}
                    onChange={(range) => setDateRange(range)}
                    allowClear
                  />
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
            {summaryCards.map((card) => (
              <Col xs={24} sm={12} lg={6} key={card.key}>
                <Card
                  style={{
                    ...card.style,
                    opacity: card.hidden ? 0.55 : 1,
                  }}
                >
                  <Statistic title={card.title} value={formatCurrency(card.value)} />
                </Card>
              </Col>
            ))}
            <Col xs={24} sm={12} lg={6}>
              <Card style={grandTotalCardStyle}>
                <Statistic title="Grand Total" value={formatCurrency(visibleTotals)} />
              </Card>
            </Col>
          </Row>

          <Card>
            <Spin spinning={loading}>
              {visibleRows.length === 0 ? (
                <Empty description="No group wise sales found" />
              ) : (
                <Table
                  rowKey={(record) => record.key || record.date}
                  columns={columns}
                  dataSource={visibleRows}
                  pagination={{ pageSize: 10 }}
                  scroll={{ x: 1600 }}
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
                        <Table.Summary.Cell index={cellIndex + 2} align="right">
                          <strong>{formatCurrency(totalDiscount)}</strong>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={cellIndex + 3} align="right">
                          <strong>{formatCurrency(totalNetSale)}</strong>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={cellIndex + 4} />
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
