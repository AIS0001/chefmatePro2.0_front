import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getAuthToken, getShopPlanName, getUserType, isTokenExpired } from './auth';

const STARTER_MANAGER_PATHS = [
  "/dashboard/analytics",
  "/dashboard/account",
  "/dashboard/manager",
  "/dashboard/admin",
  "/reports/billhistory",
  "/reports/dayclose",
  "/reports/cashdrawer",
  "/support/tickets",
  "/subscription",
  "/notifications",
  "/logout",
];

const PROFESSIONAL_MANAGER_PATHS = [
  ...STARTER_MANAGER_PATHS,
  "/vouchers/recieptvoucher",
  "/vouchers/paymentvoucher",
  "/expenses/suppliersexpenses",
  "/users/editprofile",
  "/master/loyalty-program",
  "/reports/itemwisesummaryvat",
  "/reports/itemwisesale",
  "/reports/itemwisesalegst",
  "/reports/daywise",
  "/reports/advanceorderreport",
  "/reports/advanceorderreportgst",
  "/reports/lowstockitems",
  "/reports/billeditlogs",
  "/reports/loginattempts",
  "/reports/entertainment",
  "/reports/groupwise",
  "/inventory/stockreports",
  "/inventory/stockreports-ant",
  "/quotation-history",
];

const normalizeManagerPlanTier = (planName) => {
  const normalized = String(planName || '').trim().toLowerCase();
  if (!normalized) return 'starter';
  if (normalized.includes('enterprise')) return 'enterprise';
  if (normalized.includes('professional') || normalized.includes('business') || normalized.includes('pro')) return 'professional';
  if (normalized.includes('starter') || normalized.includes('basic')) return 'starter';
  return 'starter';
};

const getManagerAllowedPaths = (planName) => {
  const tier = normalizeManagerPlanTier(planName);
  if (tier === 'enterprise') return 'all';
  if (tier === 'professional') return PROFESSIONAL_MANAGER_PATHS;
  return STARTER_MANAGER_PATHS;
};

const PLAN_GATED_ROLES = new Set(['manager', 'account']);

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
    "/support/tickets",
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
    "/support/tickets",
    "/subscription",
    "/logout",
  ],
  manager: [
    "/dashboard/manager",
    "/dashboard/admin",
  ],
  kds: [
    "/dashboard/kds",
    "/logout",
    "/changelog"
  ],
  admin: "all", // admin can access all routes
  // Add other roles here if needed
};

const sharedAuthenticatedPaths = [
  '/changelog',
];

const PrivateRoute = ({ children }) => {
  const location = useLocation();
  const token = getAuthToken();
  const userType = String(getUserType() || '').trim().toLowerCase();
  const storedPlanName = getShopPlanName();

  if (!token || isTokenExpired()) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  if (!userType) {
    return <Navigate to="/accessdenied" state={{ from: location }} replace />;
  }

  if (sharedAuthenticatedPaths.includes(location.pathname.toLowerCase())) {
    return children;
  }

  const allowedPaths = PLAN_GATED_ROLES.has(userType)
    ? getManagerAllowedPaths(storedPlanName)
    : roleBasedAccess[userType];

  if (!allowedPaths) {
    return <Navigate to="/accessdenied" replace />;
  }

  if (allowedPaths !== "all" && !allowedPaths.includes(location.pathname.toLowerCase())) {
    return <Navigate to="/accessdenied" replace />;
  }

  return children;
};

export default PrivateRoute;
