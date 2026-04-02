import React from 'react';
import ReactDOM from 'react-dom/client';
// Import FontAwesome CSS in your entry point file, usually index.js or App.js
import '@fortawesome/fontawesome-free/css/all.min.css';
import axios from "axios";
import App from './App';
import reportWebVitals from './reportWebVitals';
import { getUserType, isTokenExpired, logout } from './utility/auth';

// export const baseURL = "https://sharmachefapi.cloudnetsoftwares.com";  // Use export
// axios.defaults.baseURL = "https://sharmachefapi.cloudnetsoftwares.com/api/";

// export const baseURL = "https://www.chefmateapi.cloudnetsoftwares.com";  // Use export
// axios.defaults.baseURL = "https://www.chefmateapi.cloudnetsoftwares.com/api/";

//  export const baseURL = "https://www.pindapi.livecloudnet.com";  // Use export
//  axios.defaults.baseURL = "https://www.pindapi.livecloudnet.com/api";

  export const baseURL = "https://www.chefmateproapi.livecloudnet.com";  // Use export
  axios.defaults.baseURL = "https://www.chefmateproapi.livecloudnet.com/api";

// export const baseURL = "http://localhost:4402";  // Use export
// axios.defaults.baseURL = "http://localhost:4402/api";

let isRedirectingToLogin = false;

const redirectToLogin = () => {
  if (isRedirectingToLogin) return;
  isRedirectingToLogin = true;
  sessionStorage.setItem('session_expired_notice', 'Your session has expired. Please log in again.');
  const redirectPath = getUserType() === 'super_admin' ? '/superadmin-login' : '/login';
  logout();
  window.location.replace(redirectPath);
};

const resolveShopIdForRequest = () => {
  const selectedShopId = sessionStorage.getItem('selected_shop_id');
  const userShopId = localStorage.getItem('shop_id') || sessionStorage.getItem('shop_id');
  return selectedShopId || userShopId || null;
};

const isAbsoluteUrl = (url) => /^https?:\/\//i.test((url || '').toString());

const shouldAttachShopId = (config) => {
  const requestUrl = (config?.url || '').toString().toLowerCase();
  if (!requestUrl || requestUrl.includes('/login') || requestUrl.includes('/super-admin')) {
    return false;
  }
  return !isAbsoluteUrl(requestUrl);
};

const withShopIdParams = (config) => {
  const shopId = resolveShopIdForRequest();
  if (!shopId || !shouldAttachShopId(config)) {
    return config;
  }

  if (config.params instanceof URLSearchParams) {
    if (!config.params.has('shop_id')) {
      config.params.append('shop_id', shopId);
    }
    return config;
  }

  if (!config.params || config.params.shop_id == null) {
    config.params = {
      ...(config.params || {}),
      shop_id: shopId,
    };
  }

  return config;
};

axios.interceptors.request.use(
  (config) => {
    // Skip interceptor processing for FormData requests to preserve multipart boundary
    const isFormData = config.data instanceof FormData;
    if (!isFormData) {
      withShopIdParams(config);
    }

    const requestUrl = (config?.url || '').toString().toLowerCase();
    const isLoginRequest = requestUrl.includes('/login');
    const hasToken = !!(localStorage.getItem('token') || sessionStorage.getItem('token'));

    if (!isLoginRequest && hasToken && isTokenExpired()) {
      redirectToLogin();
      return Promise.reject(new axios.Cancel('Session expired'));
    }

    return config;
  },
  (error) => Promise.reject(error)
);

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const message = (error?.response?.data?.message || '').toString().toLowerCase();
    const requestUrl = (error?.config?.url || '').toString().toLowerCase();
    const isLoginRequest = requestUrl.includes('/login');
    const hasToken = !!(localStorage.getItem('token') || sessionStorage.getItem('token'));
    const isExpiredMessage =
      message.includes('jwt expired') ||
      message.includes('token expired') ||
      message.includes('invalid or expired token') ||
      message.includes('session expired');

    if (!isLoginRequest && hasToken && (status === 401 || status === 403 || isExpiredMessage)) {
      redirectToLogin();
    }

    return Promise.reject(error);
  }
);


const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
