import React, { useEffect, useState } from "react";
import {
  Card,
  Form,
  Switch,
  InputNumber,
  Button,
  Select,
  Space,
  Divider,
  Alert,
  Row,
  Col,
  message,
  Tabs,
  Tag,
} from "antd";
import {
  SaveOutlined,
  ReloadOutlined,
  SettingOutlined,
  GlobalOutlined,
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
const { TabPane } = Tabs;

export default function DeviceAuthSettings() {
  const [globalForm] = Form.useForm();
  const [userForm] = Form.useForm();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [globalSettings, setGlobalSettings] = useState(null);
  const [userSettings, setUserSettings] = useState(null);

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
      if (error.response?.status === 431) {
        console.error("Headers too large error:", error);
      }
      console.error("Error fetching users:", error);
    }
  };

  // Fetch global settings
  const fetchGlobalSettings = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/device/settings/global", getHeaders());
      if (response.data.success) {
        const settings = response.data.data;
        setGlobalSettings(settings);
        globalForm.setFieldsValue(settings);
      }
    } catch (error) {
      console.error("Error fetching global settings:", error);
      message.error("Failed to load global settings");
    } finally {
      setLoading(false);
    }
  };

  // Fetch user-specific settings
  const fetchUserSettings = async (userId) => {
    if (!userId) return;

    try {
      setLoading(true);
      const response = await axios.get(`/device/settings/${userId}`, getHeaders());
      if (response.data.success) {
        const settings = response.data.data;
        setUserSettings(settings);
        userForm.setFieldsValue(settings);
      }
    } catch (error) {
      console.error("Error fetching user settings:", error);
      message.error("Failed to load user settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchGlobalSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedUser) {
      fetchUserSettings(selectedUser);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUser]);

  // Save global settings
  const handleSaveGlobal = async (values) => {
    try {
      setLoading(true);
      const response = await axios.put(
        "/device/settings/global",
        values,
        getHeaders()
      );
      if (response.data.success) {
        message.success("Global settings updated successfully");
        fetchGlobalSettings();
      }
    } catch (error) {
      console.error("Error saving global settings:", error);
      message.error("Failed to save global settings");
    } finally {
      setLoading(false);
    }
  };

  // Save user settings
  const handleSaveUser = async (values) => {
    if (!selectedUser) return;

    try {
      setLoading(true);
      const response = await axios.put(
        `/device/settings/${selectedUser}`,
        values,
        getHeaders()
      );
      if (response.data.success) {
        message.success("User settings updated successfully");
        fetchUserSettings(selectedUser);
      }
    } catch (error) {
      console.error("Error saving user settings:", error);
      message.error("Failed to save user settings");
    } finally {
      setLoading(false);
    }
  };

  const settingsFormItems = (isGlobal = true) => (
    <>
      <Form.Item
        label="Enable MAC Authentication"
        name="enable_mac_auth"
        valuePropName="checked"
        tooltip="Master switch to enable/disable MAC address verification during login"
      >
        <Switch />
      </Form.Item>

      <Form.Item
        label="Allow Multiple Devices"
        name="allow_multiple_devices"
        valuePropName="checked"
        tooltip="Allow users to register and login from multiple devices"
      >
        <Switch />
      </Form.Item>

      <Form.Item
        label="Maximum Devices Per User"
        name="max_devices_per_user"
        tooltip="Maximum number of devices a user can register (-1 for unlimited)"
      >
        <InputNumber min={-1} max={20} style={{ width: "100%" }} />
      </Form.Item>

      <Form.Item
        label="Block New Devices"
        name="block_new_devices"
        valuePropName="checked"
        tooltip="Automatically block login attempts from unregistered devices"
      >
        <Switch />
      </Form.Item>

      <Form.Item
        label="Require First Device"
        name="require_first_device"
        valuePropName="checked"
        tooltip="User must login from their first registered device only"
      >
        <Switch />
      </Form.Item>

      <Form.Item
        label="Require Admin Approval"
        name="require_admin_approval"
        valuePropName="checked"
        tooltip="New devices require admin approval before activation"
      >
        <Switch />
      </Form.Item>

      <Form.Item
        label="Allow Device Override"
        name="allow_device_override"
        valuePropName="checked"
        tooltip="Allow users to register their own devices without admin"
      >
        <Switch />
      </Form.Item>

      <Form.Item
        label="Session Timeout (hours)"
        name="session_timeout_hours"
        tooltip="How long a session stays active before requiring re-login"
      >
        <InputNumber min={1} max={720} style={{ width: "100%" }} />
      </Form.Item>
    </>
  );

  return (
    <Layout>
      <Header title="Device Authentication Settings" />
      <ToastContainer />

      <div style={{ padding: "24px" }}>
        <Alert
          message="Device Authentication Configuration"
          description="Configure MAC address-based authentication to restrict user logins to specific devices. Global settings apply to all users unless overridden by user-specific settings."
          type="info"
          showIcon
          icon={<SafetyOutlined />}
          style={{ marginBottom: 24 }}
        />

        <Tabs defaultActiveKey="global">
          <TabPane
            tab={
              <span>
                <GlobalOutlined /> Global Settings
              </span>
            }
            key="global"
          >
            <Card
              title={
                <Space>
                  <SettingOutlined />
                  <span>Global Device Authentication Settings</span>
                </Space>
              }
              extra={
                <Button
                  icon={<ReloadOutlined />}
                  onClick={fetchGlobalSettings}
                  loading={loading}
                >
                  Refresh
                </Button>
              }
            >
              <Row gutter={24}>
                <Col xs={24} lg={16}>
                  <Form
                    form={globalForm}
                    layout="vertical"
                    onFinish={handleSaveGlobal}
                    initialValues={{
                      enable_mac_auth: false,
                      allow_multiple_devices: true,
                      max_devices_per_user: 3,
                      block_new_devices: false,
                      require_first_device: false,
                      require_admin_approval: false,
                      allow_device_override: false,
                      session_timeout_hours: 24,
                    }}
                  >
                    {settingsFormItems(true)}

                    <Divider />

                    <Form.Item>
                      <Space>
                        <Button
                          type="primary"
                          htmlType="submit"
                          icon={<SaveOutlined />}
                          loading={loading}
                        >
                          Save Global Settings
                        </Button>
                        <Button onClick={() => globalForm.resetFields()}>
                          Reset
                        </Button>
                      </Space>
                    </Form.Item>
                  </Form>
                </Col>
                <Col xs={24} lg={8}>
                  <Card size="small" style={{ backgroundColor: "#f0f2f5" }}>
                    <h4>Current Status</h4>
                    {globalSettings && (
                      <Space direction="vertical" size="small" style={{ width: "100%" }}>
                        <div>
                          <strong>MAC Auth:</strong>{" "}
                          <Tag color={globalSettings.enable_mac_auth ? "green" : "red"}>
                            {globalSettings.enable_mac_auth ? "Enabled" : "Disabled"}
                          </Tag>
                        </div>
                        <div>
                          <strong>Multiple Devices:</strong>{" "}
                          <Tag color={globalSettings.allow_multiple_devices ? "blue" : "orange"}>
                            {globalSettings.allow_multiple_devices ? "Allowed" : "Not Allowed"}
                          </Tag>
                        </div>
                        <div>
                          <strong>Max Devices:</strong>{" "}
                          <Tag>{globalSettings.max_devices_per_user}</Tag>
                        </div>
                        <div>
                          <strong>Session Timeout:</strong>{" "}
                          <Tag>{globalSettings.session_timeout_hours}h</Tag>
                        </div>
                      </Space>
                    )}
                  </Card>

                  <Card size="small" style={{ marginTop: 16, backgroundColor: "#fff7e6" }}>
                    <h4>⚠️ Important Notes</h4>
                    <ul style={{ fontSize: 12, paddingLeft: 20, margin: 0 }}>
                      <li>Disabling MAC auth allows all users to login from any device</li>
                      <li>User-specific settings override global settings</li>
                      <li>Changes take effect immediately</li>
                      <li>Blocked MACs are always denied, regardless of settings</li>
                    </ul>
                  </Card>
                </Col>
              </Row>
            </Card>
          </TabPane>

          <TabPane
            tab={
              <span>
                <UserOutlined /> User-Specific Settings
              </span>
            }
            key="user"
          >
            <Card
              title={
                <Space>
                  <UserOutlined />
                  <span>Per-User Device Authentication Settings</span>
                </Space>
              }
            >
              <Alert
                message="Override Global Settings"
                description="Configure device authentication rules for individual users. These settings will override global settings for the selected user."
                type="warning"
                showIcon
                style={{ marginBottom: 24 }}
              />

              <Row gutter={24}>
                <Col xs={24} lg={16}>
                  <Form.Item label="Select User" style={{ marginBottom: 24 }}>
                    <Select
                      showSearch
                      placeholder="Choose a user to configure"
                      style={{ width: "100%" }}
                      value={selectedUser}
                      onChange={setSelectedUser}
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
                  </Form.Item>

                  {selectedUser && (
                    <Form
                      form={userForm}
                      layout="vertical"
                      onFinish={handleSaveUser}
                      initialValues={{
                        enable_mac_auth: true,
                        allow_multiple_devices: true,
                        max_devices_per_user: 3,
                        block_new_devices: false,
                        require_first_device: false,
                        require_admin_approval: false,
                        allow_device_override: false,
                        session_timeout_hours: 24,
                      }}
                    >
                      {settingsFormItems(false)}

                      <Divider />

                      <Form.Item>
                        <Space>
                          <Button
                            type="primary"
                            htmlType="submit"
                            icon={<SaveOutlined />}
                            loading={loading}
                          >
                            Save User Settings
                          </Button>
                          <Button onClick={() => userForm.resetFields()}>
                            Reset
                          </Button>
                        </Space>
                      </Form.Item>
                    </Form>
                  )}

                  {!selectedUser && (
                    <Alert
                      message="No User Selected"
                      description="Please select a user from the dropdown above to configure their device authentication settings."
                      type="info"
                      showIcon
                    />
                  )}
                </Col>

                {selectedUser && userSettings && (
                  <Col xs={24} lg={8}>
                    <Card size="small" style={{ backgroundColor: "#f0f2f5" }}>
                      <h4>User Configuration</h4>
                      <Space direction="vertical" size="small" style={{ width: "100%" }}>
                        <div>
                          <strong>User:</strong> <Tag color="blue">{users.find(u => u.id === selectedUser)?.uname}</Tag>
                        </div>
                        <div>
                          <strong>MAC Auth:</strong>{" "}
                          <Tag color={userSettings.enable_mac_auth ? "green" : "red"}>
                            {userSettings.enable_mac_auth ? "Enabled" : "Disabled"}
                          </Tag>
                        </div>
                        <div>
                          <strong>Max Devices:</strong>{" "}
                          <Tag>{userSettings.max_devices_per_user}</Tag>
                        </div>
                      </Space>
                    </Card>
                  </Col>
                )}
              </Row>
            </Card>
          </TabPane>
        </Tabs>
      </div>
    </Layout>
  );
}
