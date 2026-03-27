import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
    Layout,
    Row,
    Col,
    Card,
    Form,
    Input,
    Button,
    Checkbox,
    Typography,
    Space,
    Grid,
    Divider,
    Modal,
    Alert
} from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";
import axios from "axios";
import { getAuthToken, isTokenExpired, getUserType, logout } from "../../utility/auth";



export default function Login() {
    const [uname, unamechange] = useState("");
    const [pass, passchange] = useState("");
    const [keepLoggedIn, setKeepLoggedIn] = useState(false); // State for "Keep Me Logged In"
    const [paymentBlocked, setPaymentBlocked] = useState(false);
    const [paymentMessage, setPaymentMessage] = useState("");
    const [paymentDueDate, setPaymentDueDate] = useState(null);
    const [paymentStatus, setPaymentStatus] = useState(null);
    const navigate = useNavigate();
    const { Title, Text } = Typography;
    const { Content } = Layout;
    const screens = Grid.useBreakpoint();

    const handleSubmit = async () => {
        // Prepare basic login data
        let empdata = { 
          uname, 
          pass
        };

        // ✅ Try to get device MAC (optional, not required)
        try {
          const deviceMacResponse = await axios.get("/device/machine-mac", { timeout: 3000 });
          const macAddress = deviceMacResponse.data?.data?.mac;
          if (macAddress) {
            empdata.mac_address = macAddress;
            empdata.device_name = `${navigator.userAgent.split(' ').slice(-2).join(' ')}`;
            console.log('✅ Device MAC obtained:', macAddress);
          }
        } catch (macError) {
          console.warn('⚠️ Could not get device MAC (this is OK):', macError.message);
          // Continue without MAC address - backend will handle it
        }

        axios.post("/login", empdata)
          .then((res) => {
            if (res.status === 200) {
              const data = res.data;
              if (data.token) {
                const token = data.token;
                const usertype = data.data.type.toLowerCase(); // Normalize to lowercase
                const expirationTime = Date.now() + 3 * 60 * 60 * 1000; // 3 hours
                const userUuid = data.data.user_uuid; // Get UUID from response

                if (keepLoggedIn) {
                  localStorage.setItem("token", token);
                  localStorage.setItem("expirationTime", expirationTime);
                  localStorage.setItem("uname", data.data.uname);
                  localStorage.setItem("usertype", usertype);
                  if (data.data.shop_id) {
                    localStorage.setItem("shop_id", data.data.shop_id);
                  }
                  if (data.data.shop_name) {
                    localStorage.setItem("shop_name", data.data.shop_name);
                  }
                } else {
                  sessionStorage.setItem("token", token);
                  sessionStorage.setItem("expirationTime", expirationTime);
                  sessionStorage.setItem("uname", data.data.uname);
                  sessionStorage.setItem("usertype", usertype);
                  if (data.data.shop_id) {
                    sessionStorage.setItem("shop_id", data.data.shop_id);
                  }
                  if (data.data.shop_name) {
                    sessionStorage.setItem("shop_name", data.data.shop_name);
                  }
                }

                // ✅ Store UUID in localStorage (persists for device identification)
                if (userUuid) {
                  const existingUuid = localStorage.getItem("user_uuid");
                  if (!existingUuid || existingUuid !== userUuid) {
                    localStorage.setItem("user_uuid", userUuid);
                    console.log(`✅ UUID stored in localStorage: ${userUuid}`);
                  }
                }

                toast.success("Logged in Successfully");

                // Add delay before redirect
                setTimeout(() => {
                  if (usertype === "admin") {
                    navigate("/dashboard/analytics", { replace: true });
                  } else if (usertype === "account") {
                    navigate("/dashboard/account", { replace: true });
                  } else if (usertype === "cashier") {
                    navigate("/dashboard/cashier", { replace: true });
                  } else if (usertype === "manager") {
                    navigate("/dashboard/analytics", { replace: true });
                  } else {
                    navigate("/dashboard/analytics", { replace: true });
                  }
                }, 1000);

              } else {
                toast.error("Wrong username/Password");
              }
            } else if (res.status === 401) {
              toast.error("Wrong username/Password");
            }
          })
          .catch((err) => {
            // ✅ Check 401 FIRST - plain authentication failure
            if (err.response?.status === 401) {
              toast.error("Invalid Username or Password");
            }
            // 🔐 Check for device mismatch error (403)
            else if (err.response?.status === 403 && err.response?.data?.code === "DEVICE_MISMATCH") {
              toast.error(err.response.data.error);
            }
            // 💳 Check for payment/subscription error (403 + PAYMENT_BLOCKED)
            else if (err.response?.status === 403 && err.response?.data?.code === "PAYMENT_BLOCKED") {
              // Show subscription payment modal instead of toast
              const dueDate = err.response?.data?.dueDate
                ? new Date(err.response.data.dueDate)
                : null;
              setPaymentBlocked(true);
              setPaymentMessage(err.response?.data?.error || "Your subscription payment is overdue. Please renew your subscription to continue.");
              setPaymentDueDate(dueDate);
              setPaymentStatus(err.response?.data?.status || "PAYMENT_OVERDUE");
            }
            // Default error handling
            else {
              toast.error(err.response?.data?.error || "Invalid login credentials");
            }
            console.log('Login error:', err.message);
          });
    };
    useEffect(() => {
        const sessionExpiredNotice = sessionStorage.getItem('session_expired_notice');
        if (sessionExpiredNotice) {
            toast.error(sessionExpiredNotice);
            sessionStorage.removeItem('session_expired_notice');
        }

        const token = getAuthToken();
        const userType = getUserType();

        if (token && !isTokenExpired()) {
            const normalizedUserType = userType?.toLowerCase();
            switch (normalizedUserType) {
                case "admin":
                    navigate("/dashboard/admin", { replace: true });
                    break;
                case "account":
                    navigate("/dashboard/account", { replace: true });
                    break;
                case "cashier":
                    navigate("/dashboard/cashier", { replace: true });
                    break;
                case "manager":
                    navigate("/dashboard/admin", { replace: true });
                    break;
                default:
                    logout();
                    break;
            }
        }
    }, [navigate]);

    return (
        <Layout style={{ minHeight: "100vh", background: "linear-gradient(135deg, #1f2937 0%, #111827 100%)" }}>
            <Content style={{ padding: screens.md ? "48px" : "24px" }}>
                {/* ✅ Payment Blocked Modal Popup */}
                <Modal
                    title={null}
                    open={paymentBlocked}
                    onCancel={() => {
                        setPaymentBlocked(false);
                        setPaymentMessage("");
                        setPaymentDueDate(null);
                        setPaymentStatus(null);
                    }}
                    footer={null}
                    closable={true}
                    centered
                    width={520}
                    bodyStyle={{
                        padding: "40px",
                        textAlign: "center"
                    }}
                    style={{
                        top: "50%",
                        transform: "translateY(-50%)"
                    }}
                >
                    <Space direction="vertical" size="large" style={{ width: "100%" }}>
                        {/* Warning Icon */}
                        <div
                            style={{
                                width: 80,
                                height: 80,
                                margin: "0 auto",
                                borderRadius: "50%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                background: "#fef3c7",
                                boxShadow: "0 10px 24px rgba(217, 119, 6, 0.15)"
                            }}
                        >
                            <i className="fas fa-exclamation-triangle" style={{ fontSize: "2.5rem", color: "#d97706" }} />
                        </div>

                        {/* Main Message */}
                        <div>
                            <Title level={3} style={{ marginBottom: 8, color: "#1f2937" }}>
                                Payment Required
                            </Title>
                            <Text type="secondary" style={{ fontSize: 14, display: "block", marginBottom: 16 }}>
                                Your subscription payment is overdue
                            </Text>
                            <Alert
                                message={paymentMessage}
                                type="error"
                                showIcon
                                style={{ 
                                    marginBottom: 16,
                                    borderRadius: 6
                                }}
                            />
                        </div>

                        {/* Due Date Display */}
                        {paymentDueDate && (
                            <div style={{
                                background: "#fef3c7",
                                padding: "12px 16px",
                                borderRadius: "8px",
                                border: "1px solid #fcd34d"
                            }}>
                                <Text strong style={{ color: "#92400e", fontSize: 14 }}>
                                    Due Date: {paymentDueDate.toLocaleDateString('en-US', { 
                                        year: 'numeric', 
                                        month: 'long', 
                                        day: 'numeric' 
                                    })}
                                </Text>
                            </div>
                        )}

                        {/* Status Badge */}
                        {paymentStatus && (
                            <div style={{
                                background: "#fee2e2",
                                padding: "8px 12px",
                                borderRadius: "6px",
                                border: "1px solid #fecaca"
                            }}>
                                <Text style={{ color: "#991b1b", fontSize: 12 }}>
                                    Status: <strong>{paymentStatus.replace(/_/g, ' ')}</strong>
                                </Text>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <Space direction="vertical" style={{ width: "100%" }} size="small">
                            <Button 
                                type="primary" 
                                size="large" 
                                block
                                style={{
                                    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                                    border: "none",
                                    height: "40px",
                                    fontSize: "14px"
                                }}
                                onClick={() => {
                                    navigate('/subscription', { state: { fromLogin: true } });
                                }}
                            >
                                <i className="fas fa-credit-card" style={{ marginRight: 8 }} />
                                Renew Subscription Now
                            </Button>
                            
                            <Button 
                                size="large" 
                                block
                                style={{
                                    height: "40px",
                                    fontSize: "14px"
                                }}
                                onClick={() => {
                                    setPaymentBlocked(false);
                                    setPaymentMessage("");
                                    setPaymentDueDate(null);
                                    setPaymentStatus(null);
                                }}
                            >
                                Close
                            </Button>

                            <Divider style={{ margin: "12px 0" }} />

                            <Text type="secondary" style={{ fontSize: 12 }}>
                                <i className="fas fa-headset" style={{ marginRight: 6 }} />
                                Need help? <a href="mailto:support@chefmate.com">Contact Support</a>
                            </Text>
                        </Space>
                    </Space>
                </Modal>

                {/* ✅ Regular Login Form (Always Visible) */}
                <Row justify="center" align="middle" style={{ minHeight: "calc(100vh - 96px)" }}>
                    <Col xs={24} md={20} lg={16} xl={14}>
                        <Card
                            bordered={false}
                            style={{
                                borderRadius: 20,
                                overflow: "hidden",
                                boxShadow: "0 18px 40px rgba(15, 23, 42, 0.35)"
                            }}
                            bodyStyle={{ padding: 0 }}
                        >
                            <Row gutter={0}>
                                <Col xs={24} md={12} style={{ padding: screens.md ? "48px" : "32px" }}>
                                    <Space direction="vertical" size="large" style={{ width: "100%" }}>
                                        <div style={{ textAlign: "center" }}>
                                            <div
                                                style={{
                                                    width: 72,
                                                    height: 72,
                                                    margin: "0 auto 16px",
                                                    borderRadius: 18,
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    background: "linear-gradient(135deg, #4f46e5 0%, #0ea5e9 100%)",
                                                    boxShadow: "0 10px 24px rgba(79, 70, 229, 0.35)"
                                                }}
                                            >
                                                <i className="fas fa-utensils" style={{ fontSize: "2rem", color: "#fff" }} />
                                            </div>
                                            <Title level={2} style={{ marginBottom: 4 }}>chefmate Pro 2.0</Title>
                                            <Text type="secondary">Restaurant Management System</Text>
                                        </div>

                                        <Form layout="vertical" onFinish={handleSubmit}>
                                            <Form.Item label="User ID" required>
                                                <Input
                                                    size="large"
                                                    placeholder="Enter your username"
                                                    prefix={<UserOutlined />}
                                                    value={uname}
                                                    onChange={(e) => unamechange(e.target.value)}
                                                />
                                            </Form.Item>
                                            <Form.Item
                                                label={
                                                    <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
                                                        <span>Password</span>
                                                        <Link to="/forgot-password" style={{ fontSize: 12 }}>Forgot Password?</Link>
                                                    </div>
                                                }
                                                required
                                            >
                                                <Input.Password
                                                    size="large"
                                                    placeholder="Enter your password"
                                                    prefix={<LockOutlined />}
                                                    value={pass}
                                                    onChange={(e) => passchange(e.target.value)}
                                                />
                                            </Form.Item>
                                            <Form.Item>
                                                <Checkbox checked={keepLoggedIn} onChange={(e) => setKeepLoggedIn(e.target.checked)}>
                                                    Keep me logged in
                                                </Checkbox>
                                            </Form.Item>
                                            <Button
                                                type="primary"
                                                htmlType="submit"
                                                size="large"
                                                block
                                                style={{
                                                    background: "linear-gradient(135deg, #4f46e5 0%, #0ea5e9 100%)",
                                                    border: "none",
                                                    color: "#fff"
                                                }}
                                            >
                                                Sign In
                                            </Button>
                                        </Form>
                                    </Space>
                                </Col>

                                <Col
                                    xs={0}
                                    md={12}
                                    style={{
                                        padding: "48px",
                                        color: "#e5e7eb",
                                        background: "linear-gradient(135deg, #111827 0%, #1f2937 100%)",
                                        display: "flex",
                                        flexDirection: "column",
                                        justifyContent: "center"
                                    }}
                                >
                                    <Title level={2} style={{ color: "#f9fafb" }}>Welcome Back!</Title>
                                    <Text style={{ color: "rgba(229,231,235,0.8)", fontSize: 16 }}>
                                        Manage your restaurant operations with ease. Track sales, manage inventory, and provide exceptional service.
                                    </Text>
                                    <Space direction="vertical" size="middle" style={{ marginTop: 32 }}>
                                        <Text style={{ color: "rgba(229,231,235,0.8)" }}><i className="fas fa-chart-line" />&nbsp; Real-time Analytics</Text>
                                        <Text style={{ color: "rgba(229,231,235,0.8)" }}><i className="fas fa-box" />&nbsp; Inventory Management</Text>
                                        <Text style={{ color: "rgba(229,231,235,0.8)" }}><i className="fas fa-users" />&nbsp; Customer Insights</Text>
                                    </Space>
                                </Col>
                            </Row>
                        </Card>
                        )}
                    </Col>
                </Row>
            </Content>
        </Layout>
    );
}
