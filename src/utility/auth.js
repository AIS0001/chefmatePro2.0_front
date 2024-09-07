// auth.js
const isAuthenticated = () => {
    return !!localStorage.getItem("token") || sessionStorage.getItem('token') ;
};

// Function to get the auth token (this can be modified based on where you store the token)
const getAuthToken = () => {
    return localStorage.getItem('token') || sessionStorage.getItem('token') ; // Or wherever you store your token
  };

  //Function to get usertype from localstorage
  const getUserType = () => {
     return localStorage.getItem('usertype') || sessionStorage.getItem('usertype'); // Or wherever you store your token
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

  const isTokenExpired = () => {
    const expirationTime = localStorage.getItem('expirationTime');
    if (!expirationTime) return true; // No expiration time means token is invalid

    const currentTime = Date.now();
    return currentTime > expirationTime; // Check if the current time has passed the expiration time
};

  export {
    isAuthenticated,
    getAuthToken,
    getHeaders,
    isTokenExpired,
    getUserType,
    
      }

