/* eslint-disable no-undef */
import React from "react";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import CardComponent from "../../components/cards/CardComponent";
import { FaCashRegister, FaChartBar, FaSignOutAlt, FaStore } from "react-icons/fa";

export default function CashierDashboard() {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Clear auth tokens
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    localStorage.removeItem('uname');
    sessionStorage.removeItem('uname');
    
    toast.success("Logged out successfully!");
    
    // Navigate to login page
    setTimeout(() => {
      navigate('/login');
    }, 1000);
  };

  const navigateToPage = (path) => {
    navigate(path);
  };

  // Responsive styles
  const containerStyle = {
    width: '100vw', 
    height: '100vh', 
    backgroundColor: '#f8f9fa',
    position: 'relative',
    overflow: 'auto',
    display: 'flex',
    flexDirection: 'column'
  };

  const headerStyle = {
    backgroundColor: '#bd510aff',
    color: 'white',
    padding: '20px',
    textAlign: 'center',
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
  };

  const mainContentStyle = {
    flex: 1,
    padding: '40px 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  };

  const cardContentStyle = {
    padding: '30px 20px'
  };

  const buttonStyle = {
    width: '100%',
    padding: '12px 24px',
    fontSize: '16px',
    fontWeight: '600',
    borderRadius: '8px',
    border: 'none',
    transition: 'all 0.3s ease'
  };

  const footerStyle = {
    backgroundColor: '#6c757d',
    color: 'white',
    padding: '15px 20px',
    textAlign: 'center',
    fontSize: '14px'
  };

  // Responsive adjustments
  const isMobile = window.innerWidth <= 768;
  
  if (isMobile) {
    mainContentStyle.padding = '20px 15px';
    cardContentStyle.padding = '20px 15px';
    buttonStyle.fontSize = '14px';
    buttonStyle.padding = '10px 20px';
  }

  return (
    <>
      {/* ✅ Full Screen Cashier Dashboard Container */}
      <div style={containerStyle}>
        
        {/* ✅ Dashboard Header */}
        <div style={headerStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <FaStore size={isMobile ? 20 : 24} />
            <h2 style={{ margin: 0, fontWeight: 'bold', fontSize: isMobile ? '1.5rem' : '2rem' }}>ChefMate Cashier Dashboard</h2>
          </div>
          <p style={{ margin: '5px 0 0 0', opacity: 0.8, fontSize: isMobile ? '14px' : '16px' }}>Welcome back! Select an option below to continue</p>
        </div>

        <ToastContainer />
        
        {/* ✅ Main Content Area */}
        <div style={mainContentStyle}>
          
          {/* ✅ Navigation Cards Container */}
          <div className="container">
            <div className="row justify-content-center">
              
              {/* POS Page Card */}
              <div className="col-lg-4 col-md-6 col-sm-12 mb-4">
                <CardComponent
                  title="Point of Sale (POS)"
                  headerColor="primary"
                  pull="center"
                  bodyClass="text-center"
                  style={{ height: '100%' }}
                >
                  <div style={cardContentStyle}>
                    <FaCashRegister 
                      size={isMobile ? 50 : 60} 
                      style={{ 
                        color: '#007bff', 
                        marginBottom: '20px',
                        display: 'block',
                        margin: '0 auto 20px auto'
                      }} 
                    />
                    <h5 style={{ fontWeight: 'bold', marginBottom: '15px', color: '#333', fontSize: isMobile ? '1.1rem' : '1.25rem' }}>
                      POS System
                    </h5>
                    <p style={{ color: '#666', marginBottom: '25px', fontSize: isMobile ? '13px' : '14px' }}>
                      Process sales, manage orders, and handle customer transactions
                    </p>
                    <button 
                      className="btn btn-primary btn-lg"
                      onClick={() => navigateToPage('/sale/pos')}
                      style={{ 
                        ...buttonStyle,
                        background: 'linear-gradient(45deg, #007bff, #0056b3)',
                        boxShadow: '0 4px 12px rgba(0,123,255,0.3)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-2px)";
                        e.currentTarget.style.boxShadow = "0 6px 16px rgba(0,123,255,0.4)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,123,255,0.3)";
                      }}
                    >
                      Open POS
                    </button>
                  </div>
                </CardComponent>
              </div>

              {/* Sale Reports Card */}
              <div className="col-lg-4 col-md-6 col-sm-12 mb-4">
                <CardComponent
                  title="Sales Reports"
                  headerColor="success"
                  pull="center"
                  bodyClass="text-center"
                  style={{ height: '100%' }}
                >
                  <div style={cardContentStyle}>
                    <FaChartBar 
                      size={isMobile ? 50 : 60} 
                      style={{ 
                        color: '#28a745', 
                        marginBottom: '20px',
                        display: 'block',
                        margin: '0 auto 20px auto'
                      }} 
                    />
                    <h5 style={{ fontWeight: 'bold', marginBottom: '15px', color: '#333', fontSize: isMobile ? '1.1rem' : '1.25rem' }}>
                      Sales Reports
                    </h5>
                    <p style={{ color: '#666', marginBottom: '25px', fontSize: isMobile ? '13px' : '14px' }}>
                      View sales analytics, daily reports, and transaction history
                    </p>
                    <button 
                      className="btn btn-success btn-lg"
                      onClick={() => navigateToPage('/reports/billhistory')}
                      style={{ 
                        ...buttonStyle,
                        background: 'linear-gradient(45deg, #28a745, #1e7e34)',
                        boxShadow: '0 4px 12px rgba(40,167,69,0.3)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-2px)";
                        e.currentTarget.style.boxShadow = "0 6px 16px rgba(40,167,69,0.4)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "0 4px 12px rgba(40,167,69,0.3)";
                      }}
                    >
                      View Reports
                    </button>
                  </div>
                </CardComponent>
              </div>

              {/* Logout Card */}
              <div className="col-lg-4 col-md-6 col-sm-12 mb-4">
                <CardComponent
                  title="Account"
                  headerColor="danger"
                  pull="center"
                  bodyClass="text-center"
                  style={{ height: '100%' }}
                >
                  <div style={cardContentStyle}>
                    <FaSignOutAlt 
                      size={isMobile ? 50 : 60} 
                      style={{ 
                        color: '#dc3545', 
                        marginBottom: '20px',
                        display: 'block',
                        margin: '0 auto 20px auto'
                      }} 
                    />
                    <h5 style={{ fontWeight: 'bold', marginBottom: '15px', color: '#333', fontSize: isMobile ? '1.1rem' : '1.25rem' }}>
                      Logout
                    </h5>
                    <p style={{ color: '#666', marginBottom: '25px', fontSize: isMobile ? '13px' : '14px' }}>
                      End your session and return to the login screen
                    </p>
                    <button 
                      className="btn btn-danger btn-lg"
                      onClick={handleLogout}
                      style={{ 
                        ...buttonStyle,
                        background: 'linear-gradient(45deg, #dc3545, #c82333)',
                        boxShadow: '0 4px 12px rgba(220,53,69,0.3)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-2px)";
                        e.currentTarget.style.boxShadow = "0 6px 16px rgba(220,53,69,0.4)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "0 4px 12px rgba(220,53,69,0.3)";
                      }}
                    >
                      Logout
                    </button>
                  </div>
                </CardComponent>
              </div>

            </div>
          </div>
          
        </div> {/* ✅ Close main content area */}
        
        {/* ✅ Footer */}
        <div style={footerStyle}>
          <p style={{ margin: 0 }}>
            © 2025 ChefMate POS System | Cashier Station | 
            <span style={{ marginLeft: '10px', opacity: 0.8 }}>
              {new Date().toLocaleDateString()}
            </span>
          </p>
        </div>
        
      </div> {/* ✅ Close full screen container */}
    </>
  );
}
