import React, { useEffect, useState } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Space,
  Tag,
  Popconfirm,
  Card,
  Row,
  Col,
  message,
  Tooltip,
  Badge,
  Descriptions,
  Alert,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  LaptopOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  StopOutlined,
  EyeOutlined,
  UserOutlined,
  SafetyOutlined,
} from "@ant-design/icons";
import axios from "axios";
import { getHeaders } from "../../utility/getHeader";
import Layout from "../../layout/Layout";
import Header from "../../components/Header";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const { Option } = Select;

export default function DeviceManagement() {
  const [devices, setDevices] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isViewModalVisible, setIsViewModalVisible] = useState(false);
  const [editingDevice, setEditingDevice] = useState(null);
  const [viewingDevice, setViewingDevice] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [form] = Form.useForm();

  // Fetch all users for dropdown
  const fetchUsers = async () => {
    try {
      const response = await axios.get("/users", getHeaders());
      console.log("Users response full:", JSON.stringify(response.data, null, 2));
      
      let userData = [];
      if (Array.isArray(response.data)) {
        // Response is directly an array
        userData = response.data;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        // Response is wrapped: { data: [...] }
        userData = response.data.data;
      } else if (response.data) {
        // Try to handle other structures
        userData = Array.isArray(response.data) ? response.data : [];
      }
      
      console.log("Users parsed:", userData);
      setUsers(userData || []);
    } catch (error) {
      console.error("Error fetching users:", error);
      if (error.response?.status === 431) {
        message.error("Request headers too large. Try clearing browser cache.");
      } else {
        message.error("Failed to fetch users");
      }
    }
  };

  // Fetch devices for specific user
  const fetchDevices = async (userId) => {
    if (!userId) return;
    
    try {
      setLoading(true);
      const response = await axios.get(`/device/user/${userId}`, getHeaders());
      if (response.data.success) {
        setDevices(response.data.data || []);
      } else {
        message.error("Failed to fetch devices");
      }
    } catch (error) {
      console.error("Error fetching devices:", error);
      message.error("Error loading devices");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (selectedUser) {
      fetchDevices(selectedUser);
    } else {
      setDevices([]);
    }
  }, [selectedUser]);

  // Fetch client MAC address from backend
  const fetchClientMacAddress = async () => {
    try {
      message.loading("Detecting machine MAC address...", 0);
      const response = await axios.get("/device/machine-mac", getHeaders());
      
      console.log("Machine MAC response:", response.data);
      
      // Response format: { success: true, data: { mac_address: "AA:BB:CC:DD:EE:FF", ip: "...", source: "..." } }
      if (response.data?.success && response.data?.data?.mac_address) {
        message.destroy();
        const macAddress = response.data.data.mac_address;
        console.log("MAC address detected:", macAddress, "from", response.data.data.source);
        return macAddress;
      } else {
        message.destroy();
        message.warning("MAC address not detected. Please enter manually.");
      }
    } catch (error) {
      message.destroy();
      console.error("Error fetching machine MAC:", error);
      message.warning("Could not auto-fetch MAC address. Please enter manually.");
    }
    return null;
  };

  // Show add/edit modal
  const showModal = async (device = null) => {
    setEditingDevice(device);
    if (device) {
      // Edit mode - populate with existing data
      form.setFieldsValue({
        mac_address: device.mac_address,
        device_name: device.device_name,
        device_type: device.device_type,
        status: device.status,
      });
    } else {
      // Create mode - reset form and auto-fetch MAC
      form.resetFields();
      const macAddress = await fetchClientMacAddress();
      if (macAddress) {
        form.setFieldsValue({
          mac_address: macAddress,
        });
      }
    }
    setIsModalVisible(true);
  };

  // Show view modal
  const showViewModal = (device) => {
    setViewingDevice(device);
    setIsViewModalVisible(true);
  };

  // Handle form submission
  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      if (editingDevice) {
        // Update existing device
        const response = await axios.put(
          `/device/${editingDevice.id}`,
          values,
          getHeaders()
        );
        if (response.data.success) {
          message.success("Device updated successfully");
          setIsModalVisible(false);
          form.resetFields();
          fetchDevices(selectedUser);
        }
      } else {
        // Register new device
        const response = await axios.post(
          "/device/register",
          {
            ...values,
            user_id: selectedUser,
          },
          getHeaders()
        );
        if (response.data.success) {
          message.success("Device registered successfully");
          setIsModalVisible(false);
          form.resetFields();
          fetchDevices(selectedUser);
        }
      }
    } catch (error) {
      console.error("Error saving device:", error);
      if (error.response?.data?.message) {
        message.error(error.response.data.message);
      } else {
        message.error("Failed to save device");
      }
    } finally {
      setLoading(false);
    }
  };

  // Delete device
  const handleDelete = async (deviceId) => {
    try {
      setLoading(true);
      const response = await axios.delete(`/device/${deviceId}`, getHeaders());
      if (response.data.success) {
        message.success("Device deleted successfully");
        fetchDevices(selectedUser);
      }
    } catch (error) {
      console.error("Error deleting device:", error);
      message.error("Failed to delete device");
    } finally {
      setLoading(false);
    }
  };

  // Table columns
  const columns = [
    {
      title: "MAC Address",
      dataIndex: "mac_address",
      key: "mac_address",
      fixed: "left",
      width: 180,
      render: (mac) => (
        <span style={{ fontFamily: "monospace", fontSize: "13px", fontWeight: 500 }}>
          {mac}
        </span>
      ),
    },
    {
      title: "Device Name",
      dataIndex: "device_name",
      key: "device_name",
      width: 200,
      render: (text) => text || <span style={{ color: "#999" }}>N/A</span>,
    },
    {
      title: "Device Type",
      dataIndex: "device_type",
      key: "device_type",
      width: 120,
      render: (type) => {
        const icons = {
          desktop: <LaptopOutlined />,
          laptop: <LaptopOutlined />,
          tablet: <LaptopOutlined />,
          mobile: <LaptopOutlined />,
          other: <LaptopOutlined />,
        };
        const colors = {
          desktop: "blue",
          laptop: "cyan",
          tablet: "purple",
          mobile: "orange",
          other: "default",
        };
        return (
          <Tag icon={icons[type]} color={colors[type]}>
            {type?.toUpperCase()}
          </Tag>
        );
      },
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 120,
      align: "center",
      render: (status) => {
        const config = {
          active: { status: "success", text: "Active", icon: <CheckCircleOutlined /> },
          inactive: { status: "warning", text: "Inactive", icon: <CloseCircleOutlined /> },
          blocked: { status: "error", text: "Blocked", icon: <StopOutlined /> },
        };
        const { status: badgeStatus, text, icon } = config[status] || config.active;
        return (
          <Badge status={badgeStatus} text={<span>{icon} {text}</span>} />
        );
      },
    },
    {
      title: "Last Login",
      dataIndex: "last_login_at",
      key: "last_login_at",
      width: 180,
      render: (date) =>
        date ? new Date(date).toLocaleString() : <span style={{ color: "#999" }}>Never</span>,
    },
    {
      title: "Created At",
      dataIndex: "created_at",
      key: "created_at",
      width: 180,
      render: (date) => (date ? new Date(date).toLocaleString() : "N/A"),
    },
    {
      title: "Actions",
      key: "actions",
      fixed: "right",
      width: 200,
      align: "center",
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="View Details">
            <Button
              type="default"
              icon={<EyeOutlined />}
              size="small"
              onClick={() => showViewModal(record)}
            />
          </Tooltip>
          <Tooltip title="Edit">
            <Button
              type="primary"
              icon={<EditOutlined />}
              size="small"
              onClick={() => showModal(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Are you sure you want to delete this device?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
            okButtonProps={{ danger: true }}
          >
            <Tooltip title="Delete">
              <Button
                type="primary"
                danger
                icon={<DeleteOutlined />}
                size="small"
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // Statistics
  const getStatistics = () => {
    const total = devices.length;
    const active = devices.filter((d) => d.status === "active").length;
    const inactive = devices.filter((d) => d.status === "inactive").length;
    const blocked = devices.filter((d) => d.status === "blocked").length;
    return { total, active, inactive, blocked };
  };

  const stats = getStatistics();

  return (
    <Layout>
      <Header title="Device Management" />
      <ToastContainer />

      <div style={{ padding: "24px" }}>
        {/* User Selection */}
        <Card style={{ marginBottom: 24 }}>
          <Row gutter={16} align="middle">
            <Col flex="auto">
              <Space direction="vertical" style={{ width: "100%" }}>
                <label style={{ fontWeight: 500, fontSize: 14 }}>
                  <UserOutlined /> Select User to Manage Devices
                </label>
                <Select
                  showSearch
                  placeholder="Choose a user"
                  style={{ width: "100%", maxWidth: 400 }}
                  value={selectedUser}
                  onChange={setSelectedUser}
                  optionFilterProp="children"
                  filterOption={(input, option) =>
                    option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                  }
                >
                  {users.map((user) => (
                    <Option key={user.id} value={user.id}>
                      {user.uname} [{user.id}] - {user.name || user.display_name || "N/A"} ({user.usertype})
                    </Option>
                  ))}
                </Select>
              </Space>
            </Col>
            {selectedUser && (
              <Col>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => showModal()}
                >
                  Register New Device
                </Button>
              </Col>
            )}
          </Row>
        </Card>

        {selectedUser && (
          <>
            {/* Statistics Cards */}
            <Row gutter={16} style={{ marginBottom: 24 }}>
              <Col xs={24} sm={12} md={6}>
                <Card>
                  <div style={{ textAlign: "center" }}>
                    <LaptopOutlined style={{ fontSize: 24, color: "#1890ff" }} />
                    <h3 style={{ margin: "8px 0", fontSize: 24 }}>{stats.total}</h3>
                    <p style={{ margin: 0, color: "#666" }}>Total Devices</p>
                  </div>
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card>
                  <div style={{ textAlign: "center" }}>
                    <CheckCircleOutlined style={{ fontSize: 24, color: "#52c41a" }} />
                    <h3 style={{ margin: "8px 0", fontSize: 24 }}>{stats.active}</h3>
                    <p style={{ margin: 0, color: "#666" }}>Active</p>
                  </div>
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card>
                  <div style={{ textAlign: "center" }}>
                    <CloseCircleOutlined style={{ fontSize: 24, color: "#faad14" }} />
                    <h3 style={{ margin: "8px 0", fontSize: 24 }}>{stats.inactive}</h3>
                    <p style={{ margin: 0, color: "#666" }}>Inactive</p>
                  </div>
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card>
                  <div style={{ textAlign: "center" }}>
                    <StopOutlined style={{ fontSize: 24, color: "#ff4d4f" }} />
                    <h3 style={{ margin: "8px 0", fontSize: 24 }}>{stats.blocked}</h3>
                    <p style={{ margin: 0, color: "#666" }}>Blocked</p>
                  </div>
                </Card>
              </Col>
            </Row>

            {/* Main Content Card */}
            <Card
              title={
                <Space>
                  <SafetyOutlined />
                  <span>Registered Devices</span>
                </Space>
              }
              extra={
                <Button
                  icon={<ReloadOutlined />}
                  onClick={() => fetchDevices(selectedUser)}
                  loading={loading}
                >
                  Refresh
                </Button>
              }
            >
              <Table
                columns={columns}
                dataSource={devices}
                rowKey="id"
                loading={loading}
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  showTotal: (total) => `Total ${total} devices`,
                }}
                scroll={{ x: 1200 }}
                bordered
              />
            </Card>
          </>
        )}

        {!selectedUser && (
          <Card>
            <Alert
              message="Select a User"
              description="Please select a user from the dropdown above to view and manage their registered devices."
              type="info"
              showIcon
              icon={<UserOutlined />}
            />
          </Card>
        )}

        {/* Add/Edit Modal */}
        <Modal
          title={
            <Space>
              <LaptopOutlined />
              <span>{editingDevice ? "Edit Device" : "Register New Device"}</span>
            </Space>
          }
          open={isModalVisible}
          onCancel={() => {
            setIsModalVisible(false);
            form.resetFields();
            setEditingDevice(null);
          }}
          footer={null}
          width={600}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={{
              device_type: "desktop",
              status: "active",
            }}
          >
            <Form.Item
              label="MAC Address"
              name="mac_address"
              tooltip="Device MAC address (auto-detected)"
            >
              <Input
                placeholder="Loading MAC address..."
                readOnly
                style={{ fontFamily: "monospace", textTransform: "uppercase" }}
              />
            </Form.Item>

            <Form.Item
              label="Device Name"
              name="device_name"
              rules={[{ required: true, message: "Please enter device name" }]}
              tooltip="Friendly name for the device"
            >
              <Input placeholder="Kitchen-POS-1" />
            </Form.Item>

            <Form.Item
              label="Device Type"
              name="device_type"
              rules={[{ required: true, message: "Please select device type" }]}
            >
              <Select>
                <Option value="desktop">Desktop</Option>
                <Option value="laptop">Laptop</Option>
                <Option value="tablet">Tablet</Option>
                <Option value="mobile">Mobile</Option>
                <Option value="other">Other</Option>
              </Select>
            </Form.Item>

            <Form.Item
              label="Status"
              name="status"
              rules={[{ required: true, message: "Please select status" }]}
            >
              <Select>
                <Option value="active">Active</Option>
                <Option value="inactive">Inactive</Option>
                <Option value="blocked">Blocked</Option>
              </Select>
            </Form.Item>

            <Form.Item style={{ marginBottom: 0, textAlign: "right" }}>
              <Space>
                <Button
                  onClick={() => {
                    setIsModalVisible(false);
                    form.resetFields();
                    setEditingDevice(null);
                  }}
                >
                  Cancel
                </Button>
                <Button type="primary" htmlType="submit" loading={loading}>
                  {editingDevice ? "Update" : "Register"}
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>

        {/* View Details Modal */}
        <Modal
          title={
            <Space>
              <EyeOutlined />
              <span>Device Details</span>
            </Space>
          }
          open={isViewModalVisible}
          onCancel={() => setIsViewModalVisible(false)}
          footer={[
            <Button key="close" onClick={() => setIsViewModalVisible(false)}>
              Close
            </Button>,
            <Button
              key="edit"
              type="primary"
              icon={<EditOutlined />}
              onClick={() => {
                setIsViewModalVisible(false);
                showModal(viewingDevice);
              }}
            >
              Edit
            </Button>,
          ]}
          width={600}
        >
          {viewingDevice && (
            <Descriptions bordered column={1}>
              <Descriptions.Item label="MAC Address">
                <span style={{ fontFamily: "monospace", fontWeight: 500 }}>
                  {viewingDevice.mac_address}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="Device Name">
                {viewingDevice.device_name || "N/A"}
              </Descriptions.Item>
              <Descriptions.Item label="Device Type">
                <Tag color="blue">{viewingDevice.device_type?.toUpperCase()}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                <Badge
                  status={
                    viewingDevice.status === "active"
                      ? "success"
                      : viewingDevice.status === "blocked"
                      ? "error"
                      : "warning"
                  }
                  text={viewingDevice.status?.toUpperCase()}
                />
              </Descriptions.Item>
              <Descriptions.Item label="Last Login">
                {viewingDevice.last_login_at
                  ? new Date(viewingDevice.last_login_at).toLocaleString()
                  : "Never"}
              </Descriptions.Item>
              <Descriptions.Item label="Created At">
                {viewingDevice.created_at
                  ? new Date(viewingDevice.created_at).toLocaleString()
                  : "N/A"}
              </Descriptions.Item>
              <Descriptions.Item label="Updated At">
                {viewingDevice.updated_at
                  ? new Date(viewingDevice.updated_at).toLocaleString()
                  : "N/A"}
              </Descriptions.Item>
            </Descriptions>
          )}
        </Modal>
      </div>
    </Layout>
  );
}
