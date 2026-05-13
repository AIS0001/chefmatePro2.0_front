

// auth.js
const STORAGE_AREAS = [localStorage, sessionStorage];

const getStorageSession = (storage) => {
  const token = storage.getItem("token");
  const expirationTime = storage.getItem("expirationTime");

  if (!token) {
    return null;
  }

  const parsedExpirationTime = Number.parseInt(expirationTime || "", 10);
  const hasValidExpiration = Number.isFinite(parsedExpirationTime);

  return {
    storage,
    token,
    expirationTime: parsedExpirationTime,
    isExpired: !hasValidExpiration || Date.now() > parsedExpirationTime,
  };
};

const getActiveAuthSession = () => {
  const sessions = STORAGE_AREAS.map(getStorageSession).filter(Boolean);

  if (!sessions.length) {
    return null;
  }

  return sessions.find((session) => !session.isExpired) || sessions[0];
};

const isAuthenticated = () => {
  return !!getActiveAuthSession();
};

// Function to get the auth token (this can be modified based on where you store the token)
const getAuthToken = () => {
  return getActiveAuthSession()?.token || null;
};

// Function to get usertype from active auth storage
const getUserType = () => {
  const activeSession = getActiveAuthSession();
  if (activeSession) {
    return activeSession.storage.getItem("usertype");
  }

  return localStorage.getItem("usertype") || sessionStorage.getItem("usertype");
};

// Function to get plan name from active auth storage
const getShopPlanName = () => {
  const activeSession = getActiveAuthSession();
  if (activeSession) {
    return activeSession.storage.getItem("shop_plan_name") || '';
  }

  return localStorage.getItem('shop_plan_name') || sessionStorage.getItem('shop_plan_name') || '';
};

  // Function to get user UUID from storage
  // UUID is stored in localStorage for device persistence
  const getUserUuid = () => {
    return localStorage.getItem('user_uuid');
  };

  // Function to get the shop_id bound to the logged-in user
  const getShopId = () => {
    const activeSession = getActiveAuthSession();
    if (activeSession) {
      return activeSession.storage.getItem("shop_id");
    }

    return localStorage.getItem('shop_id') || sessionStorage.getItem('shop_id');
  };

  // Function to set up headers
  const getHeaders = () => {
    const token = getAuthToken();
    const selectedShopId = sessionStorage.getItem('selected_shop_id');
    const userShopId = getShopId();
    const shopId = selectedShopId || userShopId;

    return {
      headers: {
        Authorization: `Bearer ${token}`, // Assuming Bearer token
      },
      ...(shopId ? { params: { shop_id: shopId } } : {}),
    };
  };

const isTokenExpired = () => {
  const activeSession = getActiveAuthSession();

  if (!activeSession) {
    return true;
  }

  return activeSession.isExpired;
};

const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("expirationTime");
  localStorage.removeItem("uname");
  localStorage.removeItem("usertype");
  localStorage.removeItem("user_id");
  localStorage.removeItem("username");
  localStorage.removeItem("shop_id");
  localStorage.removeItem("shop_name");
  localStorage.removeItem("shop_plan_name");
  // ✅ Do NOT remove user_uuid - it persists for device identification

  sessionStorage.removeItem("token");
  sessionStorage.removeItem("expirationTime");
  sessionStorage.removeItem("uname");
  sessionStorage.removeItem("usertype");
  sessionStorage.removeItem("user_id");
  sessionStorage.removeItem("username");
  sessionStorage.removeItem("shop_id");
  sessionStorage.removeItem("shop_name");
  sessionStorage.removeItem("shop_plan_name");
  sessionStorage.removeItem("user_uuid"); // ✅ Clear from sessionStorage only
};

// Function to clear device UUID (Admin only - used in Device UUID Management page)
// ⚠️ WARNING: This should only be called from /setting/deviceuuidmanagement page
const clearDeviceUuid = () => {
  localStorage.removeItem("user_uuid");
  sessionStorage.removeItem("user_uuid");
  console.log("✅ Device UUID cleared by admin");
};

  export {
    isAuthenticated,
    getAuthToken,
    getHeaders,
    isTokenExpired,
    getUserType,
    getShopPlanName,
    getUserUuid, // ✅ Export the new function
    getShopId, // ✅ Get shop_id for tenant scoping
    logout,
    clearDeviceUuid, // ✅ Export clear function
    
      }

