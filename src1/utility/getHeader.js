
  // Function to get the auth token from session storage
// Function to get the auth token from either localStorage or sessionStorage
const getAuthToken = () => {
  let token = localStorage.getItem('token') || sessionStorage.getItem('token');

  // Check if token is found in either storage
  if (!token) {
    console.error("Auth token not found in localStorage or sessionStorage.");
    return null;
  }

  // Remove extra quotes if present
  token = token.replace(/^"(.*)"$/, '$1'); // Removes surrounding quotes if they exist

  return token;
};


// Function to set up headers
const getHeaders = () => {
  let token = getAuthToken();

  // Ensure 'Bearer' is not added twice
  if (!token.startsWith('Bearer ')) {
    token = `Bearer ${token}`;
  }

  return {
    headers: {
      Authorization: token,
    },
  };
};



  export {
getAuthToken,
getHeaders,

  }