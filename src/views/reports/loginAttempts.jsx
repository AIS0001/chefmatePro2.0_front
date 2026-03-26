import React, { useEffect, useState } from "react";
import {
  Table,
  Card,
  Select,
  Space,
  Button,
  Row,
  Col,
  Statistic,
  Alert,
  Badge,
  Tooltip,
} from "antd";
import {
  ReloadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  HistoryOutlined,
  UserOutlined,
  LaptopOutlined,
  EnvironmentOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import axios from "axios";
import { getHeaders } from "../../utility/getHeader";
import Layout from "../../layout/Layout";
import Header from "../../components/Header";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const { Option } = Select;

export default function LoginAttempts() {
  const [logs, setLogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [limit, setLimit] = useState(100);

  // Fetch users
  const fetchUsers = async () => {
    try {
      const response = await axios.get("/users", getHeaders());
      let userData = [];
      if (Array.isArray(response.data)) {
        userData = response.data;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        userData = response.data.data;
      } else if (response.data) {
        userData = Array.isArray(response.data) ? response.data : [];
      }
      setUsers(userData || []);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  // Fetch login attempts
  const fetchLogs = async () => {
    try {
      setLoading(true);
      let url = selectedUser ? `/device/logs/${selectedUser}` : "/device/logs";
      const params = new URLSearchParams();
      params.append("limit", limit);
      if (statusFilter !== "all") {
        params.append("status", statusFilter);
      }

      const response = await axios.get(`${url}?${params.toString()}`, getHeaders());
      if (response.data.success) {
        setLogs(response.data.data || []);
      }
    } catch (error) {
      console.error("Error fetching logs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUser, statusFilter, limit]);

  // Table columns
  const columns = [
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 150,
      fixed: "left",
      render: (status) => {
        const config = {
          success: {
            color: "success",
            icon: <CheckCircleOutlined />,
            text: "Success",
          },
          failed_invalid_mac: {
            color: "error",
            icon: <CloseCircleOutlined />,
            text: "Invalid MAC",
          },
          failed_no_mac: {
            color: "warning",
            icon: <CloseCircleOutlined />,
            text: "No MAC",
          },
          failed_blocked_mac: {
            color: "error",
            icon: <CloseCircleOutlined />,
            text: "Blocked MAC",
          },
          failed_credentials: {
            color: "error",
            icon: <CloseCircleOutlined />,
            text: "Bad Credentials",
          },
          failed_other: {
            color: "default",
            icon: <CloseCircleOutlined />,
            text: "Other",
          },
        };

        const cfg = config[status] || config.failed_other;
        return (
          <Badge status={cfg.color} text={<span>{cfg.icon} {cfg.text}</span>} />
        );
      },
    },
    {
      title: "Username",
      dataIndex: "username",
      key: "username",
      width: 150,
      render: (username) => (
        <span>
          <UserOutlined /> {username}
        </span>
      ),
    },
    {
      title: "MAC Address",
      dataIndex: "mac_address",
      key: "mac_address",
      width: 180,
      render: (mac) => (
        <span style={{ fontFamily: "monospace", fontSize: "12px" }}>
          {mac || <span style={{ color: "#999" }}>N/A</span>}
        </span>
      ),
    },
    {
      title: "IP Address",
      dataIndex: "ip_address",
      key: "ip_address",
      width: 140,
      render: (ip) => (
        <span style={{ fontFamily: "monospace", fontSize: "12px" }}>
          <EnvironmentOutlined /> {ip || "N/A"}
        </span>
      ),
    },
    {
      title: "Device Name",
      dataIndex: "device_name",
      key: "device_name",
      width: 180,
      render: (name) => (
        <span>
          <LaptopOutlined /> {name || <span style={{ color: "#999" }}>Unknown</span>}
        </span>
      ),
    },
    {
      title: "Error Message",
      dataIndex: "error_message",
      key: "error_message",
      width: 250,
      ellipsis: true,
      render: (msg) => (
        <Tooltip title={msg}>
          <span style={{ color: "#666" }}>{msg || "-"}</span>
        </Tooltip>
      ),
    },
    {
      title: "Timestamp",
      dataIndex: "created_at",
      key: "created_at",
      width: 180,
      render: (date) => (
        <span>
          <ClockCircleOutlined /> {new Date(date).toLocaleString()}
        </span>
      ),
    },
  ];

  // Statistics
  const getStatistics = () => {
    const total = logs.length;
    const success = logs.filter((l) => l.status === "success").length;
    const failed = logs.filter((l) => l.status !== "success").length;
    const invalidMAC = logs.filter((l) => l.status === "failed_invalid_mac").length;
    const blockedMAC = logs.filter((l) => l.status === "failed_blocked_mac").length;
    return { total, success, failed, invalidMAC, blockedMAC };
  };

  const stats = getStatistics();

  return (
    <Layout>
      <Header title="Login Attempts Log" />
      <ToastContainer />

      <div style={{ padding: "24px" }}>
        <Alert
          message="Login Audit Trail"
          description="Monitor all login attempts with detailed device and MAC address information. Use filters to analyze security patterns."
          type="info"
          showIcon
          icon={<HistoryOutlined />}
          style={{ marginBottom: 24 }}
        />

        {/* Statistics */}
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col xs={12} sm={6} md={4}>
            <Card>
              <Statistic
                title="Total Attempts"
                value={stats.total}
                prefix={<HistoryOutlined />}
                valueStyle={{ fontSize: 20 }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6} md={4}>
            <Card>
              <Statistic
                title="Success"
                value={stats.success}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: "#3f8600", fontSize: 20 }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6} md={4}>
            <Card>
              <Statistic
                title="Failed"
                value={stats.failed}
                prefix={<CloseCircleOutlined />}
                valueStyle={{ color: "#cf1322", fontSize: 20 }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6} md={4}>
            <Card>
              <Statistic
                title="Invalid MAC"
                value={stats.invalidMAC}
                prefix={<LaptopOutlined />}
                valueStyle={{ fontSize: 20 }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6} md={4}>
            <Card>
              <Statistic
                title="Blocked MAC"
                value={stats.blockedMAC}
                prefix={<CloseCircleOutlined />}
                valueStyle={{ color: "#ff4d4f", fontSize: 20 }}
              />
            </Card>
          </Col>
        </Row>

        {/* Main Table */}
        <Card
          title={
            <Space>
              <HistoryOutlined />
              <span>Login Attempts History</span>
            </Space>
          }
          extra={
            <Button
              icon={<ReloadOutlined />}
              onClick={fetchLogs}
              loading={loading}
            >
              Refresh
            </Button>
          }
        >
          {/* Filters */}
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col xs={24} sm={12} md={8}>
              <Space direction="vertical" style={{ width: "100%" }}>
                <label style={{ fontWeight: 500, fontSize: 13 }}>Filter by User</label>
                <Select
                  showSearch
                  placeholder="All users"
                  style={{ width: "100%" }}
                  value={selectedUser}
                  onChange={setSelectedUser}
                  allowClear
                  optionFilterProp="children"
                  filterOption={(input, option) =>
                    option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                  }
                >
                  {users.map((user) => (
                    <Option key={user.id} value={user.id}>
                      {user.uname} ({user.usertype})
                    </Option>
                  ))}
                </Select>
              </Space>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Space direction="vertical" style={{ width: "100%" }}>
                <label style={{ fontWeight: 500, fontSize: 13 }}>Filter by Status</label>
                <Select
                  style={{ width: "100%" }}
                  value={statusFilter}
                  onChange={setStatusFilter}
                >
                  <Option value="all">All Statuses</Option>
                  <Option value="success">Success Only</Option>
                  <Option value="failed_invalid_mac">Invalid MAC</Option>
                  <Option value="failed_blocked_mac">Blocked MAC</Option>
                  <Option value="failed_no_mac">No MAC</Option>
                  <Option value="failed_credentials">Bad Credentials</Option>
                </Select>
              </Space>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Space direction="vertical" style={{ width: "100%" }}>
                <label style={{ fontWeight: 500, fontSize: 13 }}>Limit Results</label>
                <Select style={{ width: "100%" }} value={limit} onChange={setLimit}>
                  <Option value={50}>Last 50</Option>
                  <Option value={100}>Last 100</Option>
                  <Option value={500}>Last 500</Option>
                  <Option value={1000}>Last 1000</Option>
                </Select>
              </Space>
            </Col>
          </Row>

          <Table
            columns={columns}
            dataSource={logs}
            rowKey="id"
            loading={loading}
            pagination={{
              pageSize: 20,
              showSizeChanger: true,
              showTotal: (total) => `Total ${total} attempts`,
            }}
            scroll={{ x: 1300 }}
            bordered
            size="small"
          />
        </Card>
      </div>
    </Layout>
  );
}
