import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { isTokenExpired } from './auth';

// Define allowed paths per userType (all lowercase)
const roleBasedAccess = {
  super_admin: "all", // super admin can access all routes
  cashier: [
    "/dashboard/cashier",
    "/sale/posgst",
    "/sale/newpos",
    "/sale/pos",
    "/sale/newsale",
    "/sale/vatsale",
    "/reports/billhistory",
    "/reports/saleledger",
    "/vouchers/recieptvoucher",
    "/vouchers/paymentvoucher",
    "/subscription",
    "/logout",
  ],
  account: [
    "/dashboard/analytics",
    "/dashboard/account",
    "/reports/billhistory",
    "/reports/billeditlogs",
    "/reports/advanceorderreport",
    "/reports/itemwisesummaryvat",
    "/reports/lowstockitems",
    "/reports/dayclose",
    "/reports/daywise",
    "/reports/saleledger",
    "/reports/supplierledger",
    "/inventory/stockreports",
    "/quotation-history",
    "/vouchers/recieptvoucher",
    "/vouchers/paymentvoucher",
    "/expenses/suppliersexpenses",
    "/subscription",
    "/logout",
  ],
  manager: [
    "/dashboard/manager",
    "/dashboard/admin", // Managers can also access admin dashboard
    "/reports/billhistory",
    "/reports/saleledger", 
    "/reports/supplierledger",
    "/inventory/stockreports",
    "/reports/lowstockitems",
    "/vouchers/recieptvoucher",
    "/vouchers/paymentvoucher",
    "/subscription",
    "/logout",
  ],
  admin: "all", // admin can access all routes
  // Add other roles here if needed
};

const PrivateRoute = ({ children }) => {
  const location = useLocation();
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  const userType = (localStorage.getItem('usertype') || sessionStorage.getItem('usertype') || '').toLowerCase();

  if (!token || isTokenExpired()) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  if (!userType) {
    return <Navigate to="/accessdenied" state={{ from: location }} replace />;
  }

  const allowedPaths = roleBasedAccess[userType];

  if (allowedPaths !== "all" && !allowedPaths.includes(location.pathname.toLowerCase())) {
    return <Navigate to="/accessdenied" replace />;
  }

  return children;
};

export default PrivateRoute;
