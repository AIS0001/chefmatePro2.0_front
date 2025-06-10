import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { isTokenExpired, logout } from "../utility/auth";
import Topbar from "../components/Topbar";
import LeftSidebar from "./LeftSidebar";
import MainContent from "./MainContent";
import useAutoLogout from "../hooks/useAutoLogout";



export default function Layout({ children }) {
  const navigate = useNavigate();

  useEffect(() => {
    const checkExpiration = () => {
      if (isTokenExpired()) {
        logout();
        navigate("/", { replace: true });
      }
    };

    checkExpiration();
    const interval = setInterval(checkExpiration, 60000); // Check every 1 minute
    return () => clearInterval(interval);
  }, [navigate]);
  useAutoLogout(); // Automatically triggers logout when token expires
  return (
    <div className="wrapper theme-4-active pimary-color-red">
      <Topbar />
      <LeftSidebar />
      <MainContent>{children}</MainContent>
    </div>
  );
}
