

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

  // Function to set up headers
  const getHeaders = () => {
    const token = getAuthToken();
    return {
      headers: {
        Authorization: `Bearer ${token}`, // Assuming Bearer token
      },
    };
  };

   const isTokenExpired = (token) => {
    if (!token) return true;
    const expirationTime = localStorage.getItem('expirationTime');
 
    const currentTime = Date.now() / 1000; // Current time in seconds
  console.log(currentTime);
    // Check if token is expired
    return expirationTime < currentTime;
  };

 

  export {
    isAuthenticated,
    getAuthToken,
    getHeaders,
    isTokenExpired,
    getUserType,
    
      }

