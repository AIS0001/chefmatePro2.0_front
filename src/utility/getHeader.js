// Function to get the auth token (this can be modified based on where you store the token)
const getAuthToken = () => {
    return localStorage.getItem('token'); // Or wherever you store your token
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

  export {
getAuthToken,
getHeaders,

  }