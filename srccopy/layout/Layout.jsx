import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { isTokenExpired, logout } from "../utility/auth";
import Topbar from "../components/Topbar";
import LeftSidebar from "./LeftSidebar";
import MainContent from "./MainContent";
import useAutoLogout from "../hooks/useAutoLogout";
import "../styles/mobile-sidebar.css";

export default function Layout({ children }) {
  const navigate = useNavigate();
  const [userType, setUserType] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    const storedUserType = localStorage.getItem("usertype") || sessionStorage.getItem("usertype");
    setUserType(storedUserType || "guest");
  }, []);

  useEffect(() => {
    const checkExpiration = () => {
      if (isTokenExpired()) {
        logout();
        navigate("/", { replace: true });
      }
    };

    checkExpiration();
    const interval = setInterval(checkExpiration, 60000);
    return () => clearInterval(interval);
  }, [navigate]);

  // Check if mobile view
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Manage body class for mobile sidebar
  useEffect(() => {
    if (isMobile) {
      if (mobileSidebarOpen) {
        document.body.classList.add('sidebar-open');
      } else {
        document.body.classList.remove('sidebar-open');
      }
    } else {
      document.body.classList.remove('sidebar-open');
    }

    return () => {
      document.body.classList.remove('sidebar-open');
    };
  }, [isMobile, mobileSidebarOpen]);

  // Handle ESC key to close mobile sidebar
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape' && isMobile && mobileSidebarOpen) {
        setMobileSidebarOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => document.removeEventListener('keydown', handleEscKey);
  }, [isMobile, mobileSidebarOpen]);

  useAutoLogout();

  if (!userType) {
    return null;
  }

  // Function to toggle sidebar
  const toggleSidebar = () => {
    if (isMobile) {
      setMobileSidebarOpen(prev => !prev);
    } else {
      setSidebarOpen(prev => !prev);
    }
  };

  // Close mobile sidebar when clicking overlay
  const closeMobileSidebar = () => {
    setMobileSidebarOpen(false);
  };

  return (
    <div className="wrapper theme-4-active pimary-color-red">
      <Topbar onToggleSidebar={toggleSidebar} isSidebarOpen={sidebarOpen} />

      <LeftSidebar 
        usertype={userType} 
        isOpen={isMobile ? mobileSidebarOpen : sidebarOpen} 
        isMobile={isMobile}
        onClose={closeMobileSidebar}
      />
      
      {/* Mobile sidebar overlay */}
      {isMobile && mobileSidebarOpen && (
        <div 
          className="sidebar-overlay show"
          onClick={closeMobileSidebar}
        />
      )}

      <MainContent isSidebarOpen={isMobile ? false : sidebarOpen}>
        {children}
      </MainContent>
    </div>
  );
}
