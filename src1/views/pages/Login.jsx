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
    Grid
} from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";
import axios from "axios";
import { getAuthToken, isTokenExpired, getUserType, logout } from "../../utility/auth";



export default function Login() {
    const [uname, unamechange] = useState("");
    const [pass, passchange] = useState("");
    const [keepLoggedIn, setKeepLoggedIn] = useState(false); // State for "Keep Me Logged In"
    const navigate = useNavigate();
    const { Title, Text } = Typography;
    const { Content } = Layout;
    const screens = Grid.useBreakpoint();

    const handleSubmit = () => {
        const empdata = { uname, pass };

  axios.post("/login", empdata)
    .then((res) => {
      if (res.status === 200) {
        const data = res.data;
        if (data.token) {
          const token = data.token;
          const usertype = data.data.type.toLowerCase(); // Normalize to lowercase
          const expirationTime = Date.now() + 3 * 60 * 60 * 1000; // 3 hours

          if (keepLoggedIn) {
            localStorage.setItem("token", token);
            localStorage.setItem("expirationTime", expirationTime);
            localStorage.setItem("uname", data.data.uname);
            localStorage.setItem("usertype", usertype); // Store normalized usertype
          } else {
            sessionStorage.setItem("token", token);
            sessionStorage.setItem("expirationTime", expirationTime);
            sessionStorage.setItem("uname", data.data.uname);
            sessionStorage.setItem("usertype", usertype); // Store normalized usertype
          }

          toast.success("Logged in Successfully");

          // Add delay before redirect
          setTimeout(() => {
            console.log("Redirecting user with type:", usertype); // Debug log
            if (usertype === "admin") {
              navigate("/dashboard/analytics", { replace: true });
            } else if (usertype === "account") {
              navigate("/dashboard/account", { replace: true });
            } else if (usertype === "cashier") {
              navigate("/dashboard/cashier", { replace: true }); // Use existing cashier dashboard
            } else if (usertype === "manager") {
              navigate("/dashboard/analytics", { replace: true }); // Redirect managers to analytics dashboard
            } else {
              console.warn("Unknown user type:", usertype);
              navigate("/dashboard/analytics", { replace: true }); // Default fallback to admin dashboard
            }
          }, 1000); // Increased delay

        } else {
          toast.error("Wrong username/Password");
        }
      } else if (res.status === 401) {
        toast.error("Wrong username/Password");
      }
    })
    .catch((err) => {
      toast.error("Wrong username/Password");
      console.log(err.message);
    });
    };
    useEffect(() => {
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
                                            <Title level={2} style={{ marginBottom: 4 }}>chefmate Pro</Title>
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
                    </Col>
                </Row>
            </Content>
        </Layout>
    );
}
