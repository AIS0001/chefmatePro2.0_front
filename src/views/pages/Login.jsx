import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import { getAuthToken, isTokenExpired, getUserType, logout } from "../../utility/auth";



export default function Login() {
    const [uname, unamechange] = useState("");
    const [pass, passchange] = useState("");
    const [keepLoggedIn, setKeepLoggedIn] = useState(false); // State for "Keep Me Logged In"
    const navigate = useNavigate();
const handleSubmit = (e) => {
  e.preventDefault();
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
              navigate("/dashboard/admin", { replace: true });
            } else if (usertype === "account") {
              navigate("/dashboard/account", { replace: true });
            } else if (usertype === "cashier") {
              navigate("/dashboard/cashier", { replace: true }); // Use existing cashier dashboard
            } else if (usertype === "manager") {
              navigate("/dashboard/admin", { replace: true }); // Redirect managers to admin dashboard
            } else {
              console.warn("Unknown user type:", usertype);
              navigate("/dashboard/admin", { replace: true }); // Default fallback to admin dashboard
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
  console.log("Token:", token);
  console.log("Is expired:", isTokenExpired());
  console.log("User type:", userType);

  if (token && !isTokenExpired()) {
    const normalizedUserType = userType?.toLowerCase();
    console.log("Normalized user type:", normalizedUserType);
    
    switch (normalizedUserType) {
      case "admin":
        navigate("/dashboard/admin", { replace: true });
        break;
      case "account":
        navigate("/dashboard/account", { replace: true });
        break;
      case "cashier":
        navigate("/dashboard/cashier", { replace: true }); // Use existing cashier dashboard
        break;
      case "manager":
        navigate("/dashboard/admin", { replace: true }); // Redirect managers to admin dashboard
        break;
      default:
        console.warn("Unknown user type, staying on login");
        logout(); // Clear invalid session
        break;
    }
  }
}, [navigate]);

    return (
        <>
            <ToastContainer />
            <div className="login-page" style={{
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #ff6b35 0%, #1a1a1a 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
            }}>
                {/* Background Pattern */}
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundImage: `
                        radial-gradient(circle at 20% 20%, rgba(255,255,255,0.1) 0%, transparent 50%),
                        radial-gradient(circle at 80% 80%, rgba(255,255,255,0.1) 0%, transparent 50%)
                    `,
                    pointerEvents: 'none'
                }} />
                
                <div className="login-container" style={{
                    position: 'relative',
                    zIndex: 1,
                    width: '100%',
                    maxWidth: '1200px',
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    borderRadius: '20px',
                    overflow: 'hidden',
                    boxShadow: '0 25px 50px rgba(0, 0, 0, 0.2)',
                    background: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(10px)',
                    minHeight: '600px'
                }}>
                    {/* Left Column - Login Form */}
                    <div className="login-form-section" style={{
                        padding: '60px 50px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        background: 'rgba(255, 255, 255, 0.98)'
                    }}>
                        <div className="form-header" style={{ textAlign: 'center', marginBottom: '40px' }}>
                            <div style={{
                                width: '80px',
                                height: '80px',
                                background: 'linear-gradient(135deg, #ff6b35 0%, #1a1a1a 100%)',
                                borderRadius: '20px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 20px',
                                boxShadow: '0 10px 30px rgba(255, 107, 53, 0.3)'
                            }}>
                                <i className="fas fa-utensils" style={{ fontSize: '2rem', color: 'white' }}></i>
                            </div>
                            <h1 style={{
                                fontSize: '2.5rem',
                                fontWeight: '700',
                              
                                WebkitBackgroundClip: 'text',
                                
                                margin: '0 0 8px 0'
                            }}>ChefMate</h1>
                            <p style={{
                                color: '#6c757d',
                                fontSize: '1.1rem',
                                margin: 0
                            }}>Restaurant Management System</p>
                        </div>

                        <form className="login-form" onSubmit={handleSubmit} style={{ width: '100%' }}>
                            <div className="form-group" style={{ marginBottom: '25px' }}>
                                <label style={{
                                    display: 'block',
                                    marginBottom: '8px',
                                    fontSize: '0.95rem',
                                    fontWeight: '500',
                                    color: '#495057'
                                }}>User ID</label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type="text"
                                        className="form-control"
                                        required
                                        id="uname"
                                        value={uname}
                                        onChange={(e) => unamechange(e.target.value)}
                                        placeholder="Enter your username"
                                        style={{
                                            width: '100%',
                                            padding: '15px 20px 15px 50px',
                                            border: '2px solid #e9ecef',
                                            borderRadius: '12px',
                                            fontSize: '1rem',
                                            transition: 'all 0.3s ease',
                                            backgroundColor: '#f8f9fa',
                                            outline: 'none'
                                        }}
                                        onFocus={(e) => {
                                            e.target.style.borderColor = '#ff6b35';
                                            e.target.style.backgroundColor = '#fff';
                                            e.target.style.boxShadow = '0 0 0 3px rgba(255, 107, 53, 0.1)';
                                        }}
                                        onBlur={(e) => {
                                            e.target.style.borderColor = '#e9ecef';
                                            e.target.style.backgroundColor = '#f8f9fa';
                                            e.target.style.boxShadow = 'none';
                                        }}
                                    />
                                    <i className="fas fa-user" style={{
                                        position: 'absolute',
                                        left: '18px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        color: '#6c757d',
                                        fontSize: '1.1rem'
                                    }}></i>
                                </div>
                            </div>

                            <div className="form-group" style={{ marginBottom: '25px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                    <label style={{
                                        fontSize: '0.95rem',
                                        fontWeight: '500',
                                        color: '#495057'
                                    }}>Password</label>
                                    <Link to="/forgot-password" style={{
                                        fontSize: '0.9rem',
                                        color: '#ff6b35',
                                        textDecoration: 'none',
                                        fontWeight: '500'
                                    }}>Forgot password?</Link>
                                </div>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type="password"
                                        className="form-control"
                                        required
                                        id="pass"
                                        value={pass}
                                        onChange={(e) => passchange(e.target.value)}
                                        placeholder="Enter your password"
                                        style={{
                                            width: '100%',
                                            padding: '15px 20px 15px 50px',
                                            border: '2px solid #e9ecef',
                                            borderRadius: '12px',
                                            fontSize: '1rem',
                                            transition: 'all 0.3s ease',
                                            backgroundColor: '#f8f9fa',
                                            outline: 'none'
                                        }}
                                        onFocus={(e) => {
                                            e.target.style.borderColor = '#ff6b35';
                                            e.target.style.backgroundColor = '#fff';
                                            e.target.style.boxShadow = '0 0 0 3px rgba(255, 107, 53, 0.1)';
                                        }}
                                        onBlur={(e) => {
                                            e.target.style.borderColor = '#e9ecef';
                                            e.target.style.backgroundColor = '#f8f9fa';
                                            e.target.style.boxShadow = 'none';
                                        }}
                                    />
                                    <i className="fas fa-lock" style={{
                                        position: 'absolute',
                                        left: '18px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        color: '#6c757d',
                                        fontSize: '1.1rem'
                                    }}></i>
                                </div>
                            </div>

                            <div className="form-group" style={{ marginBottom: '30px' }}>
                                <label style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    cursor: 'pointer',
                                    fontSize: '0.95rem',
                                    color: '#495057'
                                }}>
                                    <input
                                        type="checkbox"
                                        checked={keepLoggedIn}
                                        onChange={() => setKeepLoggedIn(!keepLoggedIn)}
                                        style={{
                                            marginRight: '12px',
                                            width: '18px',
                                            height: '18px',
                                            cursor: 'pointer'
                                        }}
                                    />
                                    Keep me logged in
                                </label>
                            </div>

                            <button 
                                type="submit" 
                                style={{
                                    width: '100%',
                                    padding: '15px',
                                    background: 'linear-gradient(135deg, #ff6b35 0%, #1a1a1a 100%)',
                                    border: 'none',
                                    borderRadius: '12px',
                                    color: 'white',
                                    fontSize: '1.1rem',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease',
                                    boxShadow: '0 4px 15px rgba(255, 107, 53, 0.4)',
                                    transform: 'translateY(0)'
                                }}
                                onMouseEnter={(e) => {
                                    e.target.style.transform = 'translateY(-2px)';
                                    e.target.style.boxShadow = '0 6px 20px rgba(255, 107, 53, 0.6)';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.transform = 'translateY(0)';
                                    e.target.style.boxShadow = '0 4px 15px rgba(255, 107, 53, 0.4)';
                                }}
                            >
                                Sign In
                            </button>
                        </form>
                    </div>

                    {/* Right Column - Feature Showcase */}
                    <div className="feature-section" style={{
                        background: 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)',
                        padding: '60px 50px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        color: 'white',
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        {/* Background Pattern */}
                        <div style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundImage: `
                                radial-gradient(circle at 30% 30%, rgba(255,255,255,0.1) 0%, transparent 50%),
                                radial-gradient(circle at 70% 70%, rgba(255,255,255,0.1) 0%, transparent 50%)
                            `,
                            pointerEvents: 'none'
                        }} />
                        
                        <div style={{ position: 'relative', zIndex: 1 }}>
                            <h2 style={{
                                fontSize: '2.5rem',
                                fontWeight: '700',
                                marginBottom: '20px',
                                textAlign: 'center'
                            }}>
                                Welcome Back!
                            </h2>
                            <p style={{
                                fontSize: '1.2rem',
                                marginBottom: '40px',
                                textAlign: 'center',
                                opacity: 0.9
                            }}>
                                Access your restaurant management dashboard
                            </p>
                            
                            <div className="features-list" style={{ marginTop: '40px' }}>
                                {[
                                    { icon: 'fas fa-chart-line', title: 'Real-time Analytics', desc: 'Track sales, inventory, and performance metrics' },
                                    { icon: 'fas fa-users', title: 'Staff Management', desc: 'Manage employees, roles, and permissions' },
                                    { icon: 'fas fa-receipt', title: 'POS System', desc: 'Process orders and payments efficiently' },
                                    { icon: 'fas fa-warehouse', title: 'Inventory Control', desc: 'Monitor stock levels and supply chain' }
                                ].map((feature, index) => (
                                    <div key={index} style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        marginBottom: '25px',
                                        padding: '15px',
                                        background: 'rgba(255, 255, 255, 0.1)',
                                        borderRadius: '12px',
                                        backdropFilter: 'blur(10px)'
                                    }}>
                                        <div style={{
                                            width: '50px',
                                            height: '50px',
                                            background: 'rgba(255, 255, 255, 0.2)',
                                            borderRadius: '12px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            marginRight: '15px',
                                            flexShrink: 0
                                        }}>
                                            <i className={feature.icon} style={{ fontSize: '1.3rem' }}></i>
                                        </div>
                                        <div>
                                            <h4 style={{ margin: '0 0 5px 0', fontSize: '1.1rem', fontWeight: '600' }}>
                                                {feature.title}
                                            </h4>
                                            <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.8 }}>
                                                {feature.desc}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Mobile Responsive Styles */}
                <style jsx>{`
                    @media (max-width: 768px) {
                        .login-container {
                            grid-template-columns: 1fr !important;
                            max-width: 400px !important;
                        }
                        .feature-section {
                            display: none !important;
                        }
                        .login-form-section {
                            padding: 40px 30px !important;
                        }
                    }
                `}</style>
            </div>
        </>
    );
}
