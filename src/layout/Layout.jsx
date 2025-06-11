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

  useEffect(() => {
    // Retrieve userType from localStorage or sessionStorage
    console.log(localStorage.getItem("usertype")); // should output cashier (no quotes)

    const storedUserType = localStorage.getItem("usertype") || sessionStorage.getItem("usertype");
    setUserType(storedUserType || "guest"); // fallback to guest or null if missing
  }, []);

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
//alert(userType);
  if (!userType) {
    // You can render a loader or nothing until userType is loaded
    return null;
  }

  return (
    <div className="wrapper theme-4-active pimary-color-red">
      <Topbar />
      <LeftSidebar usertype={userType} />
      <MainContent>{children}</MainContent>
    </div>
  );
}
