

// auth.js
const isAuthenticated = () => {
    return !!localStorage.getItem("token") || !!sessionStorage.getItem('token') ;
};

// Function to get the auth token (this can be modified based on where you store the token)
const getAuthToken = () => {
    return localStorage.getItem('token') || sessionStorage.getItem('token') ; // Or wherever you store your token
  };

  //Function to get usertype from localstorage
  const getUserType = () => {
     return localStorage.getItem('usertype') || sessionStorage.getItem('usertype'); // Or wherever you store your token
  };

  // Function to get user UUID from storage
  // UUID is stored in localStorage for device persistence
  const getUserUuid = () => {
    return localStorage.getItem('user_uuid');
  };

  // Function to set up headers
  const getHeaders = () => {
    const token = getAuthToken();
    return {
      headers: {
        Authorization: `Bearer ${token}`, // Assuming Bearer token
      },
    };
  };

const isTokenExpired=()=> {
  const expirationTime = localStorage.getItem("expirationTime") || sessionStorage.getItem("expirationTime");
  if (!expirationTime) return true;
  return Date.now() > parseInt(expirationTime);
}

const logout=() =>{
  localStorage.removeItem("token");
  localStorage.removeItem("expirationTime");
  localStorage.removeItem("uname");
  localStorage.removeItem("usertype");
  // ✅ Do NOT remove user_uuid - it persists for device identification

  sessionStorage.removeItem("token");
  sessionStorage.removeItem("expirationTime");
  sessionStorage.removeItem("uname");
  sessionStorage.removeItem("usertype");
  sessionStorage.removeItem("user_uuid"); // ✅ Clear from sessionStorage only
}

// Function to clear device UUID (Admin only - used in Device UUID Management page)
// ⚠️ WARNING: This should only be called from /setting/deviceuuidmanagement page
const clearDeviceUuid = () => {
  localStorage.removeItem("user_uuid");
  sessionStorage.removeItem("user_uuid");
  console.log("✅ Device UUID cleared by admin");
}

  export {
    isAuthenticated,
    getAuthToken,
    getHeaders,
    isTokenExpired,
    getUserType,
    getUserUuid, // ✅ Export the new function
    logout,
    clearDeviceUuid, // ✅ Export clear function
    
      }

