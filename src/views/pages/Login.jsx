import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
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
import appPackage from "../../../package.json";



export default function Login() {
    const appVersion = appPackage?.version || "";
    const [uname, unamechange] = useState("");
    const [pass, passchange] = useState("");
    const [keepLoggedIn, setKeepLoggedIn] = useState(false); // State for "Keep Me Logged In"
    const [paymentBlocked, setPaymentBlocked] = useState(false);
    const [paymentMessage, setPaymentMessage] = useState("");
    const [paymentDueDate, setPaymentDueDate] = useState(null);
    const [paymentStatus, setPaymentStatus] = useState(null);
    const navigate = useNavigate();
    const { Title, Text } = Typography;
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
                    .then(async (res) => {
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
                                    if (data.data.plan_name) {
                                        localStorage.setItem("shop_plan_name", data.data.plan_name);
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
                                    if (data.data.plan_name) {
                                        sessionStorage.setItem("shop_plan_name", data.data.plan_name);
                                    }
                }

                                // Fetch latest plan_name for plan-aware manager permissions.
                                if (data.data.shop_id) {
                                    try {
                                        const profileResponse = await axios.get('/shop/profile', {
                                            headers: {
                                                Authorization: `Bearer ${token}`
                                            }
                                        });
                                        const planName = profileResponse?.data?.data?.plan_name;
                                        if (planName) {
                                            if (keepLoggedIn) {
                                                localStorage.setItem('shop_plan_name', planName);
                                            } else {
                                                sessionStorage.setItem('shop_plan_name', planName);
                                            }
                                        }
                                    } catch (planError) {
                                        console.warn('Could not fetch shop plan at login:', planError?.message || planError);
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

    const pageStyle = {
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0a0e1a 0%, #0f172a 50%, #1a1035 100%)",
        position: "relative",
        display: "flex",
        flexDirection: "column",
    };

    const patternStyle = {
        position: "fixed",
        inset: 0,
        zIndex: 0,
        backgroundImage: `
            linear-gradient(rgba(249,115,22,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(249,115,22,0.04) 1px, transparent 1px)
        `,
        backgroundSize: "40px 40px",
        pointerEvents: "none",
    };

    const topBarStyle = {
        position: "relative",
        zIndex: 2,
        padding: "14px 32px",
        display: "flex",
        alignItems: "center",
        gap: 14,
        background: "rgba(255,255,255,0.03)",
        borderBottom: "1px solid rgba(249,115,22,0.15)",
        backdropFilter: "blur(8px)",
    };

    return (
        <div style={pageStyle}>
            <div style={patternStyle} />

            {/* Top brand bar */}
            <div style={topBarStyle}>
                <img
                    src="/assets/img/logo/3840x2160logo.png"
                    alt="CloudNet Softwares"
                    style={{ height: 52, width: "auto", objectFit: "contain" }}
                />
                <div style={{ borderLeft: "1px solid rgba(249,115,22,0.3)", paddingLeft: 14 }}>
                    <div style={{ color: "#f97316", fontWeight: 700, fontSize: 13, letterSpacing: 1 }}>
                        CLOUDNET SOFTWARES
                    </div>
                    <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 11 }}>
                        Restaurant Technology Solutions
                    </div>
                </div>
            </div>

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
                bodyStyle={{ padding: "40px", textAlign: "center" }}
            >
                <Space direction="vertical" size="large" style={{ width: "100%" }}>
                    <div style={{
                        width: 80, height: 80, margin: "0 auto",
                        borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                        background: "#fef3c7", boxShadow: "0 10px 24px rgba(217,119,6,0.15)"
                    }}>
                        <i className="fas fa-exclamation-triangle" style={{ fontSize: "2.5rem", color: "#d97706" }} />
                    </div>
                    <div>
                        <Title level={3} style={{ marginBottom: 8, color: "#1f2937" }}>Payment Required</Title>
                        <Text type="secondary" style={{ fontSize: 14, display: "block", marginBottom: 16 }}>
                            Your subscription payment is overdue
                        </Text>
                        <Alert message={paymentMessage} type="error" showIcon style={{ marginBottom: 16, borderRadius: 6 }} />
                    </div>
                    {paymentDueDate && (
                        <div style={{ background: "#fef3c7", padding: "12px 16px", borderRadius: 8, border: "1px solid #fcd34d" }}>
                            <Text strong style={{ color: "#92400e", fontSize: 14 }}>
                                Due Date: {paymentDueDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                            </Text>
                        </div>
                    )}
                    {paymentStatus && (
                        <div style={{ background: "#fee2e2", padding: "8px 12px", borderRadius: 6, border: "1px solid #fecaca" }}>
                            <Text style={{ color: "#991b1b", fontSize: 12 }}>
                                Status: <strong>{paymentStatus.replace(/_/g, ' ')}</strong>
                            </Text>
                        </div>
                    )}
                    <Space direction="vertical" style={{ width: "100%" }} size="small">
                        <Button type="primary" size="large" block
                            style={{ background: "linear-gradient(135deg, #10b981 0%, #059669 100%)", border: "none", height: 40, fontSize: 14 }}
                            onClick={() => navigate('/subscription', { state: { fromLogin: true } })}
                        >
                            <i className="fas fa-credit-card" style={{ marginRight: 8 }} />
                            Renew Subscription Now
                        </Button>
                        <Button size="large" block style={{ height: 40, fontSize: 14 }}
                            onClick={() => { setPaymentBlocked(false); setPaymentMessage(""); setPaymentDueDate(null); setPaymentStatus(null); }}
                        >
                            Close
                        </Button>
                        <Divider style={{ margin: "12px 0" }} />
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            <i className="fas fa-headset" style={{ marginRight: 6 }} />
                            Need help? <a href="mailto:support@cloudnetsoftwares.com">Contact Support</a>
                        </Text>
                    </Space>
                </Space>
            </Modal>

            {/* Main content */}
            <div style={{
                flex: 1, position: "relative", zIndex: 1,
                display: "flex", alignItems: "center", justifyContent: "center",
                padding: screens.md ? "40px 24px" : "24px 16px"
            }}>
                <div style={{ width: "100%", maxWidth: 960 }}>
                    <div style={{
                        display: "flex", borderRadius: 20, overflow: "hidden",
                        boxShadow: "0 24px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(249,115,22,0.12)"
                    }}>
                        {/* LEFT — Login Form */}
                        <div style={{
                            flex: screens.md ? "0 0 420px" : "1 1 100%",
                            padding: screens.md ? "48px 44px" : "32px 24px",
                            background: "#ffffff",
                        }}>
                            <div style={{ textAlign: "center", marginBottom: 32 }}>
                                <div style={{
                                    width: 64, height: 64, margin: "0 auto 14px",
                                    borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center",
                                    background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
                                    boxShadow: "0 8px 20px rgba(249,115,22,0.35)"
                                }}>
                                    <i className="fas fa-utensils" style={{ fontSize: "1.7rem", color: "#fff" }} />
                                </div>
                                <Title level={3} style={{ marginBottom: 2, color: "#0f172a" }}>ChefMate Pro 2.0</Title>
                                <Text style={{ color: "#64748b", fontSize: 13 }}>Restaurant Management System</Text>
                            </div>

                            <Form layout="vertical" onFinish={handleSubmit}>
                                <Form.Item label={<span style={{ color: "#374151", fontWeight: 600 }}>User ID</span>} required>
                                    <Input
                                        size="large"
                                        placeholder="Enter your username"
                                        prefix={<UserOutlined style={{ color: "#f97316" }} />}
                                        value={uname}
                                        onChange={(e) => unamechange(e.target.value)}
                                        style={{ borderRadius: 8 }}
                                    />
                                </Form.Item>
                                <Form.Item
                                    label={
                                        <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
                                            <span style={{ color: "#374151", fontWeight: 600 }}>Password</span>
                                            <Link to="/forgot-password" style={{ fontSize: 12, color: "#f97316" }}>Forgot Password?</Link>
                                        </div>
                                    }
                                    required
                                >
                                    <Input.Password
                                        size="large"
                                        placeholder="Enter your password"
                                        prefix={<LockOutlined style={{ color: "#f97316" }} />}
                                        value={pass}
                                        onChange={(e) => passchange(e.target.value)}
                                        style={{ borderRadius: 8 }}
                                    />
                                </Form.Item>
                                <Form.Item>
                                    <Checkbox checked={keepLoggedIn} onChange={(e) => setKeepLoggedIn(e.target.checked)}>
                                        <span style={{ color: "#374151", fontSize: 13 }}>Keep me logged in</span>
                                    </Checkbox>
                                </Form.Item>
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    size="large"
                                    block
                                    style={{
                                        background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
                                        border: "none",
                                        color: "#fff",
                                        height: 46,
                                        fontSize: 15,
                                        fontWeight: 600,
                                        borderRadius: 8,
                                        boxShadow: "0 4px 14px rgba(249,115,22,0.4)"
                                    }}
                                >
                                    Sign In
                                </Button>
                            </Form>

                            <div style={{ marginTop: 24, textAlign: "center" }}>
                                <Text style={{ color: "#94a3b8", fontSize: 12 }}>
                                    Powered by <span style={{ color: "#f97316", fontWeight: 600 }}>CloudNet Softwares</span>
                                </Text>
                            </div>
                        </div>

                        {/* RIGHT — CloudNet Showcase (hidden on mobile) */}
                        {screens.md && (
                            <div style={{
                                flex: 1,
                                padding: "48px 44px",
                                background: "linear-gradient(145deg, #0f172a 0%, #1e1040 60%, #0f172a 100%)",
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "center",
                                position: "relative",
                                overflow: "hidden",
                            }}>
                                {/* Decorative glow */}
                                <div style={{
                                    position: "absolute", top: -60, right: -60,
                                    width: 220, height: 220, borderRadius: "50%",
                                    background: "radial-gradient(circle, rgba(249,115,22,0.18) 0%, transparent 70%)",
                                    pointerEvents: "none"
                                }} />
                                <div style={{
                                    position: "absolute", bottom: -40, left: -40,
                                    width: 160, height: 160, borderRadius: "50%",
                                    background: "radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)",
                                    pointerEvents: "none"
                                }} />

                                {/* Logo */}
                                <div style={{ marginBottom: 28 }}>
                                    <img
                                        src="/assets/img/logo/3840x2160logo.png"
                                        alt="CloudNet Softwares"
                                        style={{ height: 56, width: "auto", objectFit: "contain" }}
                                    />
                                </div>

                                <div style={{ marginBottom: 10 }}>
                                    <span style={{
                                        display: "inline-block",
                                        background: "rgba(249,115,22,0.15)",
                                        border: "1px solid rgba(249,115,22,0.3)",
                                        color: "#f97316",
                                        fontSize: 11,
                                        fontWeight: 700,
                                        letterSpacing: 1.5,
                                        padding: "3px 10px",
                                        borderRadius: 20,
                                    }}>
                                        CHEFMATE PRO 2.0
                                    </span>
                                </div>

                                <Title level={2} style={{ color: "#f8fafc", marginBottom: 10, lineHeight: 1.2 }}>
                                    Welcome Back!
                                </Title>
                                <Text style={{ color: "rgba(203,213,225,0.8)", fontSize: 14, lineHeight: 1.7, display: "block", marginBottom: 28 }}>
                                    Complete restaurant management — POS, inventory, analytics & staff controls, all in one platform.
                                </Text>

                                {/* Feature list */}
                                {[
                                    { icon: "fa-cash-register", color: "#f97316", label: "POS & Order Management" },
                                    { icon: "fa-chart-bar", color: "#3b82f6", label: "Real-time Sales Analytics" },
                                    { icon: "fa-boxes", color: "#10b981", label: "Stock & Inventory Control" },
                                    { icon: "fa-print", color: "#a78bfa", label: "ESC/POS Thermal Printing" },
                                    { icon: "fa-users-cog", color: "#f59e0b", label: "Multi-role Staff Access" },
                                ].map((f) => (
                                    <div key={f.icon} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                                        <div style={{
                                            width: 34, height: 34, borderRadius: 8, flexShrink: 0,
                                            background: `${f.color}22`,
                                            border: `1px solid ${f.color}44`,
                                            display: "flex", alignItems: "center", justifyContent: "center"
                                        }}>
                                            <i className={`fas ${f.icon}`} style={{ color: f.color, fontSize: 14 }} />
                                        </div>
                                        <Text style={{ color: "rgba(226,232,240,0.9)", fontSize: 13 }}>{f.label}</Text>
                                    </div>
                                ))}

                                {/* Contact strip */}
                                <div style={{
                                    marginTop: 28,
                                    padding: "16px 18px",
                                    borderRadius: 10,
                                    background: "rgba(255,255,255,0.04)",
                                    border: "1px solid rgba(249,115,22,0.15)",
                                }}>
                                    <Text style={{ color: "#f97316", fontSize: 11, fontWeight: 700, letterSpacing: 1, display: "block", marginBottom: 10 }}>
                                        CLOUDNET SOFTWARES — SUPPORT
                                    </Text>
                                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                        <a href="tel:+66948712350" style={{ color: "rgba(203,213,225,0.8)", fontSize: 12, textDecoration: "none" }}>
                                            <i className="fas fa-phone" style={{ color: "#f97316", marginRight: 8, width: 14 }} />
                                            +66948712350 / +66952477020
                                        </a>
                                        <a href="mailto:support@cloudnetsoftwares.com" style={{ color: "rgba(203,213,225,0.8)", fontSize: 12, textDecoration: "none" }}>
                                            <i className="fas fa-envelope" style={{ color: "#3b82f6", marginRight: 8, width: 14 }} />
                                            support@cloudnetsoftwares.com
                                        </a>
                                        <a href="https://www.cloudnetsoftwares.com" target="_blank" rel="noreferrer" style={{ color: "rgba(203,213,225,0.8)", fontSize: 12, textDecoration: "none" }}>
                                            <i className="fas fa-globe" style={{ color: "#10b981", marginRight: 8, width: 14 }} />
                                            www.cloudnetsoftwares.com
                                        </a>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div style={{
                position: "relative", zIndex: 1,
                padding: "14px 32px",
                borderTop: "1px solid rgba(249,115,22,0.1)",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}>
                <Text style={{ color: "rgba(255,255,255,0.25)", fontSize: 11 }}>
                    © 2026 CloudNet Softwares. All rights reserved. &nbsp;|&nbsp; ChefMate Pro2 SAAS v{appVersion}
                </Text>
            </div>
        </div>
    );
}
