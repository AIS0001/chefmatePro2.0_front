/**
 * SUPER ADMIN API UTILITIES
 * Helper functions for making API calls to super admin endpoints
 */

import axios from 'axios';

const normalizeBaseUrl = (value) => String(value || '').trim().replace(/\/+$/, '');

const resolveApiOrigin = () => {
  // Prefer axios global baseURL so this module always targets the same backend as the rest of the app.
  const axiosBaseUrl = normalizeBaseUrl(axios?.defaults?.baseURL);
  if (axiosBaseUrl) {
    return axiosBaseUrl.replace(/\/api$/i, '');
  }

  const envBaseUrl = normalizeBaseUrl(process.env.REACT_APP_API_URL);
  if (envBaseUrl) {
    return envBaseUrl;
  }

  return 'http://localhost:4402';
};

const API_BASE = resolveApiOrigin();

const getAuthHeaders = () => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');

  if (!token) {
    return {
      'Content-Type': 'application/json'
    };
  }

  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

/**
 * SHOPS MANAGEMENT APIs
 */
export const shopsAPI = {
  getAll: (params) =>
    axios.get(`${API_BASE}/api/super-admin/shops`, {
      headers: getAuthHeaders(),
      params
    }),

  getById: (shopId) =>
    axios.get(`${API_BASE}/api/super-admin/shops/${shopId}`, {
      headers: getAuthHeaders()
    }),

  create: (data) =>
    axios.post(`${API_BASE}/api/super-admin/shops`, data, {
      headers: getAuthHeaders()
    }),

  update: (shopId, data) =>
    axios.put(`${API_BASE}/api/super-admin/shops/${shopId}`, data, {
      headers: getAuthHeaders()
    }),

  toggleStatus: (shopId, status) =>
    axios.patch(`${API_BASE}/api/super-admin/shops/${shopId}/status`, { status }, {
      headers: getAuthHeaders()
    }),

  delete: (shopId) =>
    axios.delete(`${API_BASE}/api/super-admin/shops/${shopId}`, {
      headers: getAuthHeaders()
    })
};

/**
 * BILLING APIs
 */
export const billingAPI = {
  getShopBilling: (shopId, params) =>
    axios.get(`${API_BASE}/api/super-admin/shops/${shopId}/billing`, {
      headers: getAuthHeaders(),
      params
    }),

  getRevenueAnalytics: (period) =>
    axios.get(`${API_BASE}/api/super-admin/analytics/revenue`, {
      headers: getAuthHeaders(),
      params: { period }
    })
};

/**
 * DASHBOARD & ANALYTICS APIs
 */
export const dashboardAPI = {
  getStats: () =>
    axios.get(`${API_BASE}/api/super-admin/dashboard/stats`, {
      headers: getAuthHeaders()
    }),

  getSystemHealth: () =>
    axios.get(`${API_BASE}/api/super-admin/analytics/system-health`, {
      headers: getAuthHeaders()
    }),

  getShopComparison: () =>
    axios.get(`${API_BASE}/api/super-admin/analytics/shops-comparison`, {
      headers: getAuthHeaders()
    })
};

/**
 * SUBSCRIPTION PLANS APIs
 */
export const plansAPI = {
  getAll: () =>
    axios.get(`${API_BASE}/api/super-admin/subscription-plans`, {
      headers: getAuthHeaders()
    }),

  create: (data) =>
    axios.post(`${API_BASE}/api/super-admin/subscription-plans`, data, {
      headers: getAuthHeaders()
    }),

  update: (planId, data) =>
    axios.put(`${API_BASE}/api/super-admin/subscription-plans/${planId}`, data, {
      headers: getAuthHeaders()
    }),

  delete: (planId) =>
    axios.delete(`${API_BASE}/api/super-admin/subscription-plans/${planId}`, {
      headers: getAuthHeaders()
    })
};

/**
 * USER MANAGEMENT APIs (users table - shop users)
 */
export const usersAPI = {
  // Get all shop users across all shops
  getAll: (params) =>
    axios.get(`${API_BASE}/api/super-admin/users/all`, {
      headers: getAuthHeaders(),
      params
    }),

  // Create a new shop user (requires shop_id)
  create: (data) =>
    axios.post(`${API_BASE}/api/super-admin/users`, data, {
      headers: getAuthHeaders()
    }),

  // Update a shop user
  update: (userId, data) =>
    axios.put(`${API_BASE}/api/super-admin/users/${userId}`, data, {
      headers: getAuthHeaders()
    }),

  // Delete a shop user (terminate)
  delete: (userId) =>
    axios.delete(`${API_BASE}/api/super-admin/users/${userId}`, {
      headers: getAuthHeaders()
    }),

  // Legacy: super admin user endpoints
  getAllAdmins: () =>
    axios.get(`${API_BASE}/api/super-admin/users/super-admins`, {
      headers: getAuthHeaders()
    }),

  createAdmin: (data) =>
    axios.post(`${API_BASE}/api/super-admin/users/super-admins`, data, {
      headers: getAuthHeaders()
    }),

  updateAdmin: (userId, data) =>
    axios.put(`${API_BASE}/api/super-admin/users/super-admins/${userId}`, data, {
      headers: getAuthHeaders()
    }),

  deleteAdmin: (userId) =>
    axios.delete(`${API_BASE}/api/super-admin/users/super-admins/${userId}`, {
      headers: getAuthHeaders()
    })
};

/**
 * AUDIT LOGS APIs
 */
export const auditLogsAPI = {
  getAll: (params) =>
    axios.get(`${API_BASE}/api/super-admin/audit-logs`, {
      headers: getAuthHeaders(),
      params
    })
};

/**
 * SHOP USER MANAGEMENT APIs (users table - per shop)
 */
export const shopUsersAPI = {
  getAll: (shopId) =>
    axios.get(`${API_BASE}/api/super-admin/shops/${shopId}/users`, {
      headers: getAuthHeaders()
    }),

  create: (shopId, data) =>
    axios.post(`${API_BASE}/api/super-admin/shops/${shopId}/users`, data, {
      headers: getAuthHeaders()
    }),

  update: (shopId, userId, data) =>
    axios.put(`${API_BASE}/api/super-admin/shops/${shopId}/users/${userId}`, data, {
      headers: getAuthHeaders()
    }),

  delete: (shopId, userId) =>
    axios.delete(`${API_BASE}/api/super-admin/shops/${shopId}/users/${userId}`, {
      headers: getAuthHeaders()
    })
};

/**
 * SHOP MANAGEMENT APIs (for shop admin)
 */
export const shopManagementAPI = {
  getProfile: () =>
    axios.get(`${API_BASE}/api/shop/profile`, {
      headers: getAuthHeaders()
    }),

  updateProfile: (data) =>
    axios.put(`${API_BASE}/api/shop/profile`, data, {
      headers: getAuthHeaders()
    }),

  getStaff: (params) =>
    axios.get(`${API_BASE}/api/shop/staff`, {
      headers: getAuthHeaders(),
      params
    }),

  addStaff: (data) =>
    axios.post(`${API_BASE}/api/shop/staff`, data, {
      headers: getAuthHeaders()
    }),

  removeStaff: (staffId) =>
    axios.delete(`${API_BASE}/api/shop/staff/${staffId}`, {
      headers: getAuthHeaders()
    }),

  getAnalytics: () =>
    axios.get(`${API_BASE}/api/shop/analytics`, {
      headers: getAuthHeaders()
    }),

  upgradeSubscription: (planId) =>
    axios.post(`${API_BASE}/api/shop/subscription/upgrade`, { plan_id: planId }, {
      headers: getAuthHeaders()
    })
};

const superAdminApi = {
  shopsAPI,
  billingAPI,
  dashboardAPI,
  plansAPI,
  usersAPI,
  auditLogsAPI,
  shopManagementAPI
};

export default superAdminApi;
