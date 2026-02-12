import React, { useState, useEffect } from "react";
import { Card, Table, Button, DatePicker, Space, Tag, Empty, Row, Col, Statistic, Select, Result } from "antd";
import { ReloadOutlined, EyeOutlined, FileExcelOutlined, FilePdfOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { CSVLink } from "react-csv";
import jsPDF from "jspdf";
import "jspdf-autotable";
import fetchData from "../../functions/fetchData";
import Layout from "../../layout/Layout";
import Header from "../../components/Header";
import { getUserType } from "../../utility/auth";
import logo from "../../assets/logo.png";

const { RangePicker } = DatePicker;

export default function BillEditLogs() {
  const navigate = useNavigate();
  const userType = getUserType();
  const isAdmin = (userType || "").toLowerCase() === "admin";

  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState([dayjs().startOf("day"), dayjs().endOf("day")]);
  const [actionFilter, setActionFilter] = useState("all");
  const [userFilter, setUserFilter] = useState("all");
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetchLogs();
    fetchUsers();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [logs, dateRange, actionFilter, userFilter]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await fetchData("bill_edit_logs", null, "modified_at", {});
      if (Array.isArray(data)) {
        // Sort by newest first
        const sortedData = data.sort((a, b) => new Date(b.modified_at) - new Date(a.modified_at));
        setLogs(sortedData);
      } else {
        setLogs([]);
      }
    } catch (error) {
      console.error("Error fetching bill edit logs:", error);
      toast.error("Failed to fetch edit logs");
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const data = await fetchData("users", null, "id", {});
      if (Array.isArray(data)) {
        setUsers(data);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const getUserFullName = (userName) => {
    if (!userName) return "-";
    const user = users.find(u => u.uname === userName);
    return user ? user.name : userName;
  };

  const getUserDisplayName = (userName) => {
    if (!userName) return "-";
    const user = users.find(u => u.uname === userName);
    if (user) {
      return `${user.name} (${user.uname})`;
    }
    return userName;
  };

  const applyFilters = () => {
    let filtered = [...logs];

    // Date filter
    if (dateRange && dateRange[0] && dateRange[1]) {
      const start = dateRange[0].startOf("day").toDate();
      const end = dateRange[1].endOf("day").toDate();
      filtered = filtered.filter((log) => {
        const logDate = new Date(log.modified_at);
        return logDate >= start && logDate <= end;
      });
    }

    // Action filter
    if (actionFilter !== "all") {
      filtered = filtered.filter((log) => log.action === actionFilter);
    }

    // User filter
    if (userFilter !== "all") {
      filtered = filtered.filter((log) => log.user_name === userFilter);
    }

    setFilteredLogs(filtered);
  };

  const getActionColor = (action) => {
    switch (action) {
      case "update":
        return "blue";
      case "delete":
        return "red";
      case "discount_update":
        return "orange";
      default:
        return "default";
    }
  };

  const getUserTypes = () => {
    const users = [...new Set(logs.map((log) => log.user_name).filter(Boolean))];
    return users;
  };

  const columns = [
    {
      title: "Date/Time",
      dataIndex: "modified_at",
      key: "modified_at",
      width: 150,
      render: (text) => {
        const date = dayjs(text);
        return (
          <div>
            <div>{date.format("DD/MM/YYYY")}</div>
            <div style={{ fontSize: 12, color: "#888" }}>{date.format("HH:mm:ss")}</div>
          </div>
        );
      },
      sorter: (a, b) => new Date(b.modified_at) - new Date(a.modified_at),
    },
    {
      title: "Bill ID",
      dataIndex: "bill_id",
      key: "bill_id",
      width: 80,
      render: (text) => <Tag color="cyan">#{text}</Tag>,
    },
    {
      title: "Action",
      dataIndex: "action",
      key: "action",
      width: 120,
      render: (text) => <Tag color={getActionColor(text)}>{text.toUpperCase()}</Tag>,
      filters: [
        { text: "Update", value: "update" },
        { text: "Delete", value: "delete" },
        { text: "Discount Update", value: "discount_update" },
      ],
      onFilter: (value, record) => record.action === value,
    },
    {
      title: "Item ID",
      dataIndex: "order_item_id",
      key: "order_item_id",
      width: 80,
      render: (text) => (text ? <Tag>{text}</Tag> : <span style={{ color: "#ccc" }}>-</span>),
    },
    {
      title: "Changes",
      key: "changes",
      render: (_, record) => {
        if (record.action === "update") {
          return (
            <div style={{ fontSize: 12 }}>
              <div>
                Qty: <strong>{record.old_qty}</strong> → <strong style={{ color: "#1890ff" }}>{record.new_qty}</strong>
              </div>
              <div>
                Total: ฿<strong>{record.old_total}</strong> → ฿<strong style={{ color: "#1890ff" }}>{record.new_total}</strong>
              </div>
            </div>
          );
        } else if (record.action === "delete") {
          return (
            <div style={{ fontSize: 12 }}>
              <div>
                Deleted Qty: <strong style={{ color: "#ff4d4f" }}>{record.old_qty}</strong>
              </div>
              <div>
                Amount: ฿<strong style={{ color: "#ff4d4f" }}>{record.old_total}</strong>
              </div>
            </div>
          );
        } else if (record.action === "discount_update") {
          return (
            <div style={{ fontSize: 12 }}>
              <div>
                Type: <strong>{record.old_discount_type}</strong> → <strong style={{ color: "#1890ff" }}>{record.new_discount_type}</strong>
              </div>
              <div>
                Value: <strong>{record.old_discount_value}</strong> → <strong style={{ color: "#1890ff" }}>{record.new_discount_value}</strong>
              </div>
            </div>
          );
        }
        return "-";
      },
    },
    {
      title: "Bill Totals",
      key: "totals",
      render: (_, record) => (
        <div style={{ fontSize: 11, lineHeight: 1.4 }}>
          <div>
            Grand Total: ฿{record.old_grand_total} → ฿<strong style={{ color: "#1890ff" }}>{record.new_grand_total}</strong>
          </div>
          <div style={{ color: "#888" }}>
            Tax: ฿{record.old_tax} → ฿{record.new_tax}
          </div>
        </div>
      ),
    },
    {
      title: "User",
      key: "user",
      width: 120,
      render: (_, record) => (
        <div style={{ fontSize: 12 }}>
          <div>
            <strong>{getUserFullName(record.user_name)}</strong>
          </div>
          <div style={{ color: "#888" }}>({record.user_name || "-"})</div>
          <div style={{ color: "#888", fontSize: 11 }}>{record.user_type || "-"}</div>
        </div>
      ),
      filters: getUserTypes().map((user) => ({ text: user, value: user })),
      onFilter: (value, record) => record.user_name === value,
    },
    {
      title: "Terminal/IP",
      key: "terminal",
      width: 100,
      render: (_, record) => (
        <div style={{ fontSize: 11, color: "#666" }}>
          <div>{record.terminal_id || "-"}</div>
          <div>{record.ip_address || "-"}</div>
        </div>
      ),
    },
  ];

  const expandedRowRender = (record) => {
    return (
      <div style={{ padding: "12px", backgroundColor: "#fafafa", borderRadius: 4 }}>
        <Row gutter={[16, 8]}>
          <Col span={8}>
            <div style={{ fontSize: 12 }}>
              <strong>Old Subtotal:</strong> ฿{record.old_subtotal}
            </div>
          </Col>
          <Col span={8}>
            <div style={{ fontSize: 12 }}>
              <strong>New Subtotal:</strong> ฿{record.new_subtotal}
            </div>
          </Col>
          <Col span={8}>
            <div style={{ fontSize: 12 }}>
              <strong>Discount:</strong> {record.old_discount_type} ({record.old_discount_value}) → {record.new_discount_type} ({record.new_discount_value})
            </div>
          </Col>
          <Col span={8}>
            <div style={{ fontSize: 12 }}>
              <strong>Old Subtotal After Discount:</strong> ฿{record.old_subtotal_afterdiscount}
            </div>
          </Col>
          <Col span={8}>
            <div style={{ fontSize: 12 }}>
              <strong>New Subtotal After Discount:</strong> ฿{record.new_subtotal_afterdiscount}
            </div>
          </Col>
          <Col span={8}>
            <div style={{ fontSize: 12 }}>
              <strong>Round Off:</strong> ฿{record.old_round_off} → ฿{record.new_round_off}
            </div>
          </Col>
        </Row>
      </div>
    );
  };

  const totalUpdates = filteredLogs.filter((log) => log.action === "update").length;
  const totalDeletes = filteredLogs.filter((log) => log.action === "delete").length;
  const totalDiscountUpdates = filteredLogs.filter((log) => log.action === "discount_update").length;

  const exportPDF = () => {
    const doc = new jsPDF();
    
    // Add logo
    doc.addImage(logo, "PNG", 150, 10, 40, 15);
    
    // Add title
    doc.setFontSize(16);
    doc.text("Bill Edit Logs Report", 14, 20);
    
    // Add generated date/time
    doc.setFontSize(10);
    const generatedDate = dayjs().format("DD/MM/YYYY HH:mm:ss");
    doc.text(`Generated: ${generatedDate}`, 14, 28);
    
    // Table columns
    const tableColumn = ["Date/Time", "Bill ID", "Action", "Item ID", "Old Qty", "New Qty", "Old Total", "New Total", "User"];
    const tableRows = [];

    filteredLogs.forEach(log => {
      const date = dayjs(log.modified_at).format("DD/MM/YYYY HH:mm");
      tableRows.push([
        date,
        log.bill_id || "-",
        log.action || "-",
        log.order_item_id || "-",
        log.old_qty || "-",
        log.new_qty || "-",
        log.old_total || "-",
        log.new_total || "-",
        getUserDisplayName(log.user_name)
      ]);
    });

    doc.autoTable({
      startY: 35,
      head: [tableColumn],
      body: tableRows,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [22, 160, 133] }
    });

    doc.save(`bill-edit-logs-${dayjs().format("YYYY-MM-DD-HHmmss")}.pdf`);
  };

  const csvData = filteredLogs.map(log => ({
    "Date/Time": dayjs(log.modified_at).format("DD/MM/YYYY HH:mm:ss"),
    "Bill ID": log.bill_id || "-",
    "Action": log.action || "-",
    "Item ID": log.order_item_id || "-",
    "Old Qty": log.old_qty || "-",
    "New Qty": log.new_qty || "-",
    "Old Total": log.old_total || "-",
    "New Total": log.new_total || "-",
    "Old Grand Total": log.old_grand_total || "-",
    "New Grand Total": log.new_grand_total || "-",
    "Discount Type (Old)": log.old_discount_type || "-",
    "Discount Type (New)": log.new_discount_type || "-",
    "Discount Value (Old)": log.old_discount_value || "-",
    "Discount Value (New)": log.new_discount_value || "-",
    "User Name": getUserFullName(log.user_name),
    "User ID": log.user_name || "-",
    "User Type": log.user_type || "-",
    "Terminal ID": log.terminal_id || "-",
    "IP Address": log.ip_address || "-"
  }));

  // Admin-only access check
  if (!isAdmin) {
    return (
      <Layout>
        <Header title="Bill Edit Logs" />
        <div style={{ padding: "24px" }}>
          <Result
            status="403"
            title="Access Denied"
            subTitle="Sorry, only administrators can access this page."
            extra={
              <Button type="primary" onClick={() => navigate("/dashboard")}>
                Back to Dashboard
              </Button>
            }
          />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Header title="Bill Edit Logs" />
      <div style={{ padding: "24px", backgroundColor: "#f0f2f5", minHeight: "100vh" }}>
      <Card
        title="Bill Edit Logs"
        extra={
          <Space>
            <CSVLink
              data={csvData}
              filename={`bill-edit-logs-${dayjs().format("YYYY-MM-DD-HHmmss")}.csv`}
              style={{ textDecoration: "none" }}
            >
              <Button icon={<FileExcelOutlined />} type="primary">
                Excel
              </Button>
            </CSVLink>
            <Button icon={<FilePdfOutlined />} onClick={exportPDF} type="primary" danger>
              PDF
            </Button>
            <Button icon={<ReloadOutlined />} onClick={fetchLogs} loading={loading}>
              Refresh
            </Button>
          </Space>
        }
        style={{ marginBottom: 24 }}
      >
        <Space direction="vertical" size="middle" style={{ width: "100%" }}>
          <Row gutter={16}>
            <Col xs={24} sm={12} md={8}>
              <RangePicker
                value={dateRange}
                onChange={(dates) => setDateRange(dates)}
                format="DD/MM/YYYY"
                style={{ width: "100%" }}
              />
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Select
                value={actionFilter}
                onChange={setActionFilter}
                style={{ width: "100%" }}
                placeholder="Filter by Action"
              >
                <Select.Option value="all">All Actions</Select.Option>
                <Select.Option value="update">Update</Select.Option>
                <Select.Option value="delete">Delete</Select.Option>
                <Select.Option value="discount_update">Discount Update</Select.Option>
              </Select>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Select
                value={userFilter}
                onChange={setUserFilter}
                style={{ width: "100%" }}
                placeholder="Filter by User"
              >
                <Select.Option value="all">All Users</Select.Option>
                {getUserTypes().map((user) => (
                  <Select.Option key={user} value={user}>
                    {user}
                  </Select.Option>
                ))}
              </Select>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={8}>
              <Statistic title="Total Updates" value={totalUpdates} prefix={<EyeOutlined />} valueStyle={{ color: "#1890ff" }} />
            </Col>
            <Col xs={24} sm={8}>
              <Statistic title="Total Deletes" value={totalDeletes} prefix={<EyeOutlined />} valueStyle={{ color: "#ff4d4f" }} />
            </Col>
            <Col xs={24} sm={8}>
              <Statistic title="Discount Updates" value={totalDiscountUpdates} prefix={<EyeOutlined />} valueStyle={{ color: "#faad14" }} />
            </Col>
          </Row>
        </Space>
      </Card>

      <Card>
        {filteredLogs.length === 0 ? (
          <Empty description="No edit logs found" />
        ) : (
          <Table
            columns={columns}
            dataSource={filteredLogs.map((log, index) => ({ ...log, key: index }))}
            loading={loading}
            pagination={{
              pageSize: 20,
              showSizeChanger: true,
              showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} logs`,
            }}
            scroll={{ x: 1400 }}
            expandable={{
              expandedRowRender,
              expandIcon: ({ expanded, onExpand, record }) =>
                expanded ? (
                  <Button size="small" onClick={(e) => onExpand(record, e)}>
                    Hide
                  </Button>
                ) : (
                  <Button size="small" type="link" onClick={(e) => onExpand(record, e)}>
                    Details
                  </Button>
                ),
            }}
          />
        )}
      </Card>
      </div>
    </Layout>
  );
}
