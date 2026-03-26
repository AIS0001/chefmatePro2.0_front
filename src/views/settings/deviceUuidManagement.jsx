import React, { useEffect, useState } from "react";
import {
  Card,
  Button,
  Alert,
  Space,
  Popconfirm,
  message,
  Tag,
  Typography,
  Table,
  Input,
} from "antd";
import {
  DeleteOutlined,
  ReloadOutlined,
  InfoCircleOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import Layout from "../../layout/Layout";
import Header from "../../components/Header";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import { getHeaders } from "../../utility/auth";

const { Text, Paragraph } = Typography;

export default function DeviceUuidManagement() {
  const [usersWithUuid, setUsersWithUuid] = useState([]);
  const [tableLoading, setTableLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");

  const fetchUsersWithUuid = async () => {
    setTableLoading(true);
    try {
      const response = await axios.get("/users-with-uuid", getHeaders());
      setUsersWithUuid(response?.data?.data || []);
    } catch (error) {
      message.error("Failed to load users with UUID");
    } finally {
      setTableLoading(false);
    }
  };

  useEffect(() => {
    fetchUsersWithUuid();
  }, []);

  const handleClearUserUuid = async (userId) => {
    setLoading(true);
    try {
      const response = await axios.delete(`/users/${userId}/uuid`, getHeaders());
      message.success(response?.data?.message || "User UUID cleared successfully");
      await fetchUsersWithUuid();
    } catch (error) {
      message.error(error?.response?.data?.message || "Failed to clear user UUID");
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: "User ID",
      dataIndex: "id",
      key: "id",
      width: 90,
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      width: 170,
      render: (value) => value || "-",
    },
    {
      title: "Username",
      dataIndex: "uname",
      key: "uname",
      width: 120,
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      width: 120,
      render: (type) => <Tag color="blue">{type || "-"}</Tag>,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 110,
      render: (status) => {
        const isActive = Number(status) === 1;
        return <Tag color={isActive ? "green" : "red"}>{isActive ? "Active" : "Inactive"}</Tag>;
      },
    },
    {
      title: "UUID",
      dataIndex: "user_uuid",
      key: "user_uuid",
      render: (uuid) => (
        <Text style={{ fontFamily: "monospace", fontSize: 12 }} copyable>
          {uuid}
        </Text>
      ),
    },
    {
      title: "Last Login",
      dataIndex: "last_loggedin",
      key: "last_loggedin",
      width: 170,
      render: (value) => value || "-",
    },
    {
      title: "Action",
      key: "action",
      width: 130,
      render: (_, record) => (
        <Popconfirm
          title="Clear this user UUID?"
          description={`User: ${record.uname} (${record.id})`}
          onConfirm={() => handleClearUserUuid(record.id)}
          okText="Yes, Clear"
          cancelText="Cancel"
          okButtonProps={{ danger: true }}
        >
          <Button danger icon={<DeleteOutlined />} loading={loading}>
            Clear UUID
          </Button>
        </Popconfirm>
      ),
    },
  ];

  const normalizedSearchText = searchText.trim().toLowerCase();
  const filteredUsersWithUuid = usersWithUuid.filter((user) => {
    if (!normalizedSearchText) return true;

    const userId = String(user.id || "").toLowerCase();
    const userName = String(user.name || "").toLowerCase();
    const username = String(user.uname || "").toLowerCase();
    const uuid = String(user.user_uuid || "").toLowerCase();

    return (
      userId.includes(normalizedSearchText) ||
      userName.includes(normalizedSearchText) ||
      username.includes(normalizedSearchText) ||
      uuid.includes(normalizedSearchText)
    );
  });

  return (
    <Layout>
      <Header title="Device UUID Management" />
      <ToastContainer />

      <div style={{ padding: "24px" }}>
        {/* Info Alert */}
        <Alert
          message="Admin Access Only"
          description="This page shows all users with registered UUID and allows admin to clear any user's UUID from database."
          type="warning"
          icon={<WarningOutlined />}
          showIcon
          style={{ marginBottom: 24 }}
        />

        <Card
          title={
            <Space>
              <InfoCircleOutlined />
              <span>Registered User UUID List</span>
            </Space>
          }
          extra={
            <Button
              icon={<ReloadOutlined />}
              onClick={fetchUsersWithUuid}
              loading={tableLoading}
              size="small"
            >
              Refresh
            </Button>
          }
        >
          <Input.Search
            placeholder="Quick search by ID, name, username, or UUID"
            allowClear
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ marginBottom: 16, maxWidth: 420 }}
          />

          <Table
            rowKey="id"
            columns={columns}
            dataSource={filteredUsersWithUuid}
            loading={tableLoading}
            pagination={{ pageSize: 10, showSizeChanger: false }}
            scroll={{ x: 1100 }}
          />
        </Card>

        <Card title="Notes" style={{ marginTop: 24 }} size="small">
          <Paragraph>
            <strong>When UUID is cleared:</strong>
            <ul>
              <li>User UUID becomes NULL in database</li>
              <li>New UUID is generated automatically on next successful login</li>
              <li>User may need to register the new device again (as per device policy)</li>
            </ul>
          </Paragraph>
        </Card>
      </div>
    </Layout>
  );
}
