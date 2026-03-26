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
  Divider,
  Radio,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  PrinterOutlined,
  SettingOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  ApiOutlined,
} from "@ant-design/icons";
import axios from "axios";
import { getHeaders } from "../../utility/getHeader";
import Layout from "../../layout/Layout";
import Header from "../../components/Header";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const { Option } = Select;

export default function PrinterConfiguration() {
  const [printers, setPrinters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isViewModalVisible, setIsViewModalVisible] = useState(false);
  const [editingPrinter, setEditingPrinter] = useState(null);
  const [viewingPrinter, setViewingPrinter] = useState(null);
  const [filterLocation, setFilterLocation] = useState("all");
  const [pingLoading, setPingLoading] = useState(null);
  const [usersWithUuid, setUsersWithUuid] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [form] = Form.useForm();

  // Fetch all users with UUID
  const fetchUsersWithUuid = async () => {
    try {
      setLoadingUsers(true);
      const response = await axios.get("/printer/users-with-uuid", getHeaders());
      if (response.data.success) {
        setUsersWithUuid(response.data.data || []);
      } else {
        message.error("Failed to fetch registered machines");
      }
    } catch (error) {
      console.error("Error fetching users with UUID:", error);
      if (error.response?.status === 404) {
        message.warning("MACHINE NOT REGISTERED yet. Please login to generate UUID.");
        setUsersWithUuid([]);
      } else {
        message.error("Error loading registered machines");
      }
    } finally {
      setLoadingUsers(false);
    }
  };

  // Fetch all printers
  const fetchPrinters = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/printer/config", getHeaders());
      if (response.data.success) {
        setPrinters(response.data.data || []);
      } else {
        message.error("Failed to fetch printer configurations");
      }
    } catch (error) {
      console.error("Error fetching printers:", error);
      message.error("Error loading printer configurations");
    } finally {
      setLoading(false);
    }
  };

  // Fetch printers by location
  const fetchPrintersByLocation = async (location) => {
    try {
      setLoading(true);
      const response = await axios.get(
        `/printer/config/location/${location}`,
        getHeaders()
      );
      if (response.data.success) {
        setPrinters(response.data.data || []);
      }
    } catch (error) {
      console.error("Error fetching printers by location:", error);
      message.error("Error loading printers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrinters();
    fetchUsersWithUuid();
  }, []);

  // Handle location filter change
  const handleLocationFilterChange = (location) => {
    setFilterLocation(location);
    if (location === "all") {
      fetchPrinters();
    } else {
      fetchPrintersByLocation(location);
    }
  };

  const fetchMachineUuid = () => {
    // Get UUID from localStorage (set during login)
    const uuid = localStorage.getItem("user_uuid");
    if (uuid) {
      return uuid;
    }
    return null;
  };

  // Show add/edit modal
  const showModal = async (printer = null) => {
    setEditingPrinter(printer);
    if (printer) {
      form.setFieldsValue({
        terminal_id: printer.terminal_id,
        machine_uuid: printer.machine_uuid,
        location: printer.location,
        printer_ip: printer.printer_ip,
        printer_port: printer.printer_port,
        printer_name: printer.printer_name,
        status: printer.status,
      });
    } else {
      form.resetFields();
      // Auto-detect current machine UUID for new printer
      const detectedUuid = fetchMachineUuid();
      if (detectedUuid) {
        form.setFieldsValue({ machine_uuid: detectedUuid });
        message.success("Current machine UUID detected automatically");
      } else {
        message.warning("Could not auto-detect machine UUID");
      }
    }
    setIsModalVisible(true);
  };

  // Show view modal
  const showViewModal = (printer) => {
    setViewingPrinter(printer);
    setIsViewModalVisible(true);
  };

  // Handle form submission
  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      if (editingPrinter) {
        // Update existing printer
        const response = await axios.put(
          `/printer/config/${editingPrinter.terminal_id}`,
          values,
          getHeaders()
        );
        if (response.data.success) {
          message.success("Printer configuration updated successfully");
          setIsModalVisible(false);
          form.resetFields();
          fetchPrinters();
        }
      } else {
        // Create new printer
        const response = await axios.post(
          "/printer/config",
          values,
          getHeaders()
        );
        if (response.data.success) {
          message.success("Printer configuration created successfully");
          setIsModalVisible(false);
          form.resetFields();
          fetchPrinters();
        }
      }
    } catch (error) {
      console.error("Error saving printer:", error);
      if (error.response?.data?.message) {
        message.error(error.response.data.message);
      } else {
        message.error("Failed to save printer configuration");
      }
    } finally {
      setLoading(false);
    }
  };

  // Delete printer
  const handleDelete = async (terminal_id) => {
    try {
      setLoading(true);
      const response = await axios.delete(
        `/printer/config/${terminal_id}`,
        getHeaders()
      );
      if (response.data.success) {
        message.success("Printer configuration deleted successfully");
        fetchPrinters();
      }
    } catch (error) {
      console.error("Error deleting printer:", error);
      message.error("Failed to delete printer configuration");
    } finally {
      setLoading(false);
    }
  };

  // Ping printer to check connectivity
  const handlePingPrinter = async (printer) => {
    try {
      setPingLoading(printer.terminal_id);
      const { printer_ip, printer_port, terminal_id } = printer;
      
      message.loading(`Pinging ${printer_ip}:${printer_port}...`, 0);
      
      // Attempt to connect using a simple HTTP request with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000); // Increased to 6 seconds for network latency
      
      try {
        // Try to make a request to the printer IP
        const response = await fetch(`http://${printer_ip}:${printer_port}`, {
          signal: controller.signal,
          mode: 'no-cors', // Allow cross-origin
          method: 'GET',
        });
        
        clearTimeout(timeoutId);
        message.destroy();
        
        // Check if response is ok (any status code means printer responded)
        console.log('Printer response status:', response.status, response.type);
        message.success({
          content: (
            <span>
              ✅ <strong>{terminal_id}</strong> is reachable at {printer_ip}:{printer_port}
            </span>
          ),
          duration: 4,
        });
      } catch (fetchError) {
        clearTimeout(timeoutId);
        console.error('Fetch error name:', fetchError.name, 'message:', fetchError.message);
        
        // Network error might mean printer is not reachable
        if (fetchError.name === 'AbortError') {
          message.destroy();
          message.error({
            content: (
              <span>
                ❌ <strong>{terminal_id}</strong> - Connection timeout (6+ seconds). Printer may be offline or unreachable.
              </span>
            ),
            duration: 5,
          });
        } else {
          // CORS or network reached means printer might be there
          message.destroy();
          message.warning({
            content: (
              <span>
                ⚠️ <strong>{terminal_id}</strong> - Network response from {printer_ip}:{printer_port}. 
                Printer may be reachable but doesn't support HTTP. Error: {fetchError.message}
              </span>
            ),
            duration: 5,
          });
        }
      }
    } catch (error) {
      message.destroy();
      console.error('Ping error:', error);
      message.error({
        content: `Failed to ping printer: ${error.message}`,
        duration: 4,
      });
    } finally {
      setPingLoading(null);
    }
  };

  // Validate IP address
  const validateIP = (_, value) => {
    if (!value) {
      return Promise.reject(new Error("Please enter printer IP address"));
    }
    const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipPattern.test(value)) {
      return Promise.reject(new Error("Invalid IP address format"));
    }
    const parts = value.split(".");
    const isValid = parts.every((part) => parseInt(part) <= 255);
    if (!isValid) {
      return Promise.reject(
        new Error("IP address parts must be between 0-255")
      );
    }
    return Promise.resolve();
  };

  const normalizeTerminalId = (value) => {
    if (!value) return value;
    return value.toUpperCase().replace(/[–—]/g, "-").trim();
  };

  // Table columns
  const columns = [
    {
      title: "Terminal ID",
      dataIndex: "terminal_id",
      key: "terminal_id",
      fixed: "left",
      width: 150,
      render: (text) => (
        <span style={{ fontWeight: 500, color: "#1890ff" }}>{text}</span>
      ),
    },
    {
      title: "Location",
      dataIndex: "location",
      key: "location",
      width: 120,
      render: (location) => (
        <Tag color={location === "kitchen" ? "orange" : "blue"}>
          {location.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: "Machine UUID",
      dataIndex: "machine_uuid",
      key: "machine_uuid",
      width: 280,
      render: (uuid) =>
        uuid ? (
          <span style={{ fontFamily: "monospace", fontSize: "12px" }}>{uuid}</span>
        ) : (
          <span style={{ color: "#999" }}>N/A</span>
        ),
    },
    {
      title: "Printer Name",
      dataIndex: "printer_name",
      key: "printer_name",
      width: 200,
      render: (text) => text || <span style={{ color: "#999" }}>N/A</span>,
    },
    {
      title: "IP Address",
      dataIndex: "printer_ip",
      key: "printer_ip",
      width: 150,
      render: (ip) => (
        <span style={{ fontFamily: "monospace", fontSize: "13px" }}>{ip}</span>
      ),
    },
    {
      title: "Port",
      dataIndex: "printer_port",
      key: "printer_port",
      width: 100,
      align: "center",
      render: (port) => (
        <Tag color="cyan">{port}</Tag>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 100,
      align: "center",
      render: (status) => (
        <Badge
          status={status === "active" ? "success" : "error"}
          text={status === "active" ? "Active" : "Inactive"}
        />
      ),
    },
    {
      title: "Created At",
      dataIndex: "created_at",
      key: "created_at",
      width: 180,
      render: (date) =>
        date ? new Date(date).toLocaleString() : "N/A",
    },
    {
      title: "Actions",
      key: "actions",
      fixed: "right",
      width: 250,
      align: "center",
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Ping IP - Test Connectivity">
            <Button
              type="default"
              icon={<ApiOutlined />}
              size="small"
              onClick={() => handlePingPrinter(record)}
              loading={pingLoading === record.terminal_id}
              style={{ color: '#52c41a', borderColor: '#52c41a' }}
            />
          </Tooltip>
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
            title="Are you sure you want to delete this printer configuration?"
            onConfirm={() => handleDelete(record.terminal_id)}
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

  // Statistics cards
  const getStatistics = () => {
    const total = printers.length;
    const kitchen = printers.filter((p) => p.location === "kitchen").length;
    const cashier = printers.filter((p) => p.location === "cashier").length;
    const active = printers.filter((p) => p.status === "active").length;
    const inactive = printers.filter((p) => p.status === "inactive").length;

    return { total, kitchen, cashier, active, inactive };
  };

  const stats = getStatistics();

  return (
    <Layout>
      <Header title="Printer Configuration" />
      <ToastContainer />

      <div style={{ padding: "24px" }}>
        {/* Statistics Cards */}
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} md={8} lg={4}>
            <Card>
              <div style={{ textAlign: "center" }}>
                <PrinterOutlined style={{ fontSize: 24, color: "#1890ff" }} />
                <h3 style={{ margin: "8px 0", fontSize: 24 }}>{stats.total}</h3>
                <p style={{ margin: 0, color: "#666" }}>Total Printers</p>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8} lg={4}>
            <Card>
              <div style={{ textAlign: "center" }}>
                <PrinterOutlined style={{ fontSize: 24, color: "#ff7a00" }} />
                <h3 style={{ margin: "8px 0", fontSize: 24 }}>{stats.kitchen}</h3>
                <p style={{ margin: 0, color: "#666" }}>Kitchen</p>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8} lg={4}>
            <Card>
              <div style={{ textAlign: "center" }}>
                <PrinterOutlined style={{ fontSize: 24, color: "#1890ff" }} />
                <h3 style={{ margin: "8px 0", fontSize: 24 }}>{stats.cashier}</h3>
                <p style={{ margin: 0, color: "#666" }}>Cashier</p>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8} lg={4}>
            <Card>
              <div style={{ textAlign: "center" }}>
                <CheckCircleOutlined
                  style={{ fontSize: 24, color: "#52c41a" }}
                />
                <h3 style={{ margin: "8px 0", fontSize: 24 }}>{stats.active}</h3>
                <p style={{ margin: 0, color: "#666" }}>Active</p>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8} lg={4}>
            <Card>
              <div style={{ textAlign: "center" }}>
                <CloseCircleOutlined
                  style={{ fontSize: 24, color: "#ff4d4f" }}
                />
                <h3 style={{ margin: "8px 0", fontSize: 24 }}>{stats.inactive}</h3>
                <p style={{ margin: 0, color: "#666" }}>Inactive</p>
              </div>
            </Card>
          </Col>
        </Row>

        {/* Main Content Card */}
        <Card
          title={
            <Space>
              <SettingOutlined />
              <span>Printer Configurations</span>
            </Space>
          }
          extra={
            <Space>
              <Radio.Group
                value={filterLocation}
                onChange={(e) => handleLocationFilterChange(e.target.value)}
                buttonStyle="solid"
              >
                <Radio.Button value="all">All</Radio.Button>
                <Radio.Button value="kitchen">Kitchen</Radio.Button>
                <Radio.Button value="cashier">Cashier</Radio.Button>
              </Radio.Group>
              <Button
                icon={<ReloadOutlined />}
                onClick={fetchPrinters}
                loading={loading}
              >
                Refresh
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => showModal()}
              >
                Add Printer
              </Button>
            </Space>
          }
        >
          <Table
            columns={columns}
            dataSource={printers}
            rowKey="id"
            loading={loading}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `Total ${total} printers`,
            }}
            scroll={{ x: 1500 }}
            bordered
          />
        </Card>

        {/* Add/Edit Modal */}
        <Modal
          title={
            <Space>
              <PrinterOutlined />
              <span>
                {editingPrinter ? "Edit Printer Configuration" : "Add New Printer"}
              </span>
            </Space>
          }
          open={isModalVisible}
          onCancel={() => {
            setIsModalVisible(false);
            form.resetFields();
            setEditingPrinter(null);
          }}
          footer={null}
          width={600}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={{
              printer_port: 9100,
              status: "active",
            }}
          >
            <Form.Item
              label="Terminal ID"
              name="terminal_id"
              normalize={normalizeTerminalId}
              rules={[
                { required: true, message: "Please enter terminal ID" },
                {
                  pattern: /^[A-Z0-9-_]+$/,
                  message: "Use uppercase letters, numbers, hyphens and underscores only",
                },
              ]}
              tooltip="Unique identifier for the terminal/machine (e.g., KITCHEN-001)"
            >
              <Input
                placeholder="KITCHEN-001"
                disabled={!!editingPrinter}
                style={{ textTransform: "uppercase" }}
              />
            </Form.Item>

            <Form.Item
              label="Location"
              name="location"
              rules={[{ required: true, message: "Please select location" }]}
            >
              <Select placeholder="Select printer location">
                <Option value="kitchen">Kitchen</Option>
                <Option value="cashier">Cashier</Option>
              </Select>
            </Form.Item>

            <Row gutter={8}>
              <Col span={24}>
                <Form.Item
                  label="Machine UUID"
                  name="machine_uuid"
                  rules={[
                    {
                      required: true,
                      message: "Please select a registered machine"
                    }
                  ]}
                  tooltip="Select the machine/device that will use this printer"
                >
                  <Select
                    placeholder="Select Machine (Username/ID - UUID)"
                    showSearch
                    loading={loadingUsers}
                    optionFilterProp="children"
                    filterOption={(input, option) =>
                      option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                    }
                    notFoundContent={
                      loadingUsers ? (
                        <div style={{ textAlign: "center", padding: "12px" }}>
                          <ReloadOutlined spin /> Loading machines...
                        </div>
                      ) : (
                        <div style={{ textAlign: "center", padding: "12px", color: "#ff4d4f" }}>
                          ❌ MACHINE NOT REGISTERED yet
                          <div style={{ fontSize: "12px", marginTop: "4px" }}>
                            Please login to generate UUID first
                          </div>
                        </div>
                      )
                    }
                  >
                    {usersWithUuid.map((user) => (
                      <Option key={user.user_uuid} value={user.user_uuid}>
                        {user.name} ({user.uname}) - {user.user_uuid}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              label="Printer Name"
              name="printer_name"
              tooltip="Friendly name for the printer (optional)"
            >
              <Input placeholder="Main Kitchen Printer" />
            </Form.Item>

            <Row gutter={16}>
              <Col span={16}>
                <Form.Item
                  label="Printer IP Address"
                  name="printer_ip"
                  rules={[{ validator: validateIP }]}
                  tooltip="IPv4 address of the network printer"
                >
                  <Input placeholder="192.168.1.100" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  label="Port"
                  name="printer_port"
                  rules={[
                    { required: true, message: "Port required" },
                    {
                      pattern: /^\d+$/,
                      message: "Must be a number",
                    },
                  ]}
                  tooltip="Network port (default: 9100 for ESC/POS)"
                >
                  <Input placeholder="9100" type="number" />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              label="Status"
              name="status"
              rules={[{ required: true, message: "Please select status" }]}
            >
              <Select>
                <Option value="active">Active</Option>
                <Option value="inactive">Inactive</Option>
              </Select>
            </Form.Item>

            <Form.Item style={{ marginBottom: 0, textAlign: "right" }}>
              <Space>
                <Button
                  onClick={() => {
                    setIsModalVisible(false);
                    form.resetFields();
                    setEditingPrinter(null);
                  }}
                >
                  Cancel
                </Button>
                <Button type="primary" htmlType="submit" loading={loading}>
                  {editingPrinter ? "Update" : "Create"}
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
              <span>Printer Details</span>
            </Space>
          }
          open={isViewModalVisible}
          onCancel={() => setIsViewModalVisible(false)}
          footer={[
            <Button
              key="ping"
              icon={<ApiOutlined />}
              onClick={() => {
                handlePingPrinter(viewingPrinter);
              }}
              loading={pingLoading === viewingPrinter?.terminal_id}
              style={{ color: '#52c41a', borderColor: '#52c41a' }}
            >
              Test Connection
            </Button>,
            <Button key="close" onClick={() => setIsViewModalVisible(false)}>
              Close
            </Button>,
            <Button
              key="edit"
              type="primary"
              icon={<EditOutlined />}
              onClick={() => {
                setIsViewModalVisible(false);
                showModal(viewingPrinter);
              }}
            >
              Edit
            </Button>,
          ]}
          width={600}
        >
          {viewingPrinter && (
            <div>
              <Row gutter={[16, 16]}>
                <Col span={24}>
                  <Card size="small" style={{ backgroundColor: "#f5f5f5" }}>
                    <h3 style={{ margin: 0 }}>
                      <PrinterOutlined /> {viewingPrinter.printer_name || "Unnamed Printer"}
                    </h3>
                  </Card>
                </Col>
                <Col span={12}>
                  <strong>Terminal ID:</strong>
                  <div style={{ marginTop: 4 }}>
                    <Tag color="blue">{viewingPrinter.terminal_id}</Tag>
                  </div>
                </Col>
                <Col span={12}>
                  <strong>Location:</strong>
                  <div style={{ marginTop: 4 }}>
                    <Tag
                      color={
                        viewingPrinter.location === "kitchen" ? "orange" : "blue"
                      }
                    >
                      {viewingPrinter.location.toUpperCase()}
                    </Tag>
                  </div>
                </Col>
                <Col span={12}>
                  <strong>IP Address:</strong>
                  <div style={{ marginTop: 4, fontFamily: "monospace" }}>
                    {viewingPrinter.printer_ip}
                  </div>
                </Col>
                <Col span={12}>
                  <strong>Machine UUID:</strong>
                  <div style={{ marginTop: 4, fontFamily: "monospace", fontSize: "11px" }}>
                    {viewingPrinter.machine_uuid || "N/A"}
                  </div>
                </Col>
                <Col span={12}>
                  <strong>Port:</strong>
                  <div style={{ marginTop: 4 }}>
                    <Tag color="cyan">{viewingPrinter.printer_port}</Tag>
                  </div>
                </Col>
                <Col span={12}>
                  <strong>Status:</strong>
                  <div style={{ marginTop: 4 }}>
                    <Badge
                      status={
                        viewingPrinter.status === "active" ? "success" : "error"
                      }
                      text={
                        viewingPrinter.status === "active" ? "Active" : "Inactive"
                      }
                    />
                  </div>
                </Col>
                <Col span={12}>
                  <strong>Created:</strong>
                  <div style={{ marginTop: 4, fontSize: 12 }}>
                    {viewingPrinter.created_at
                      ? new Date(viewingPrinter.created_at).toLocaleString()
                      : "N/A"}
                  </div>
                </Col>
                <Col span={12}>
                  <strong>Last Updated:</strong>
                  <div style={{ marginTop: 4, fontSize: 12 }}>
                    {viewingPrinter.updated_at
                      ? new Date(viewingPrinter.updated_at).toLocaleString()
                      : "N/A"}
                  </div>
                </Col>
              </Row>
              <Divider />
              <div style={{ backgroundColor: "#f0f2f5", padding: 12, borderRadius: 4 }}>
                <strong>Connection String:</strong>
                <div
                  style={{
                    marginTop: 8,
                    fontFamily: "monospace",
                    fontSize: 13,
                    backgroundColor: "white",
                    padding: 8,
                    borderRadius: 4,
                  }}
                >
                  {viewingPrinter.printer_ip}:{viewingPrinter.printer_port}
                </div>
                <div style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
                  <ApiOutlined style={{ marginRight: 4 }} />
                  Use the "Test Connection" button to verify if the printer is reachable on the network.
                </div>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </Layout>
  );
}
