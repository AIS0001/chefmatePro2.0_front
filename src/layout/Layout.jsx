import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { isTokenExpired, logout } from "../utility/auth";
import Topbar from "../components/Topbar";
import LeftSidebar from "./LeftSidebar";
import MainContent from "./MainContent";
import useAutoLogout from "../hooks/useAutoLogout";

export default function Layout({ children }) {
  const navigate = useNavigate();
  const [userType, setUserType] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true); // 👈 new state for sidebar

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

  useAutoLogout();

  if (!userType) {
    return null;
  }

  // 👇 Function to toggle sidebar
  const toggleSidebar = () => setSidebarOpen(prev => !prev);

  return (
    <div className="wrapper theme-4-active pimary-color-red">
      {/* 👇 Pass toggleSidebar to Topbar */}
     <Topbar onToggleSidebar={toggleSidebar} isSidebarOpen={sidebarOpen} />

<LeftSidebar usertype={userType} isOpen={sidebarOpen} />
      <MainContent isSidebarOpen={sidebarOpen}>
  {children}
</MainContent>

    </div>
  );
}
