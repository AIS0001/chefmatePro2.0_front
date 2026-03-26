import axios from 'axios';

// Create an Axios instance
const api = axios.create({
  baseURL: 'http://your-api-url.com',
});

// Intercept responses and check for token expiration
api.interceptors.response.use(
  response => response, // Handle valid responses
  error => {
    if (error.response && error.response.status === 401) {
      if (error.response.data.message === 'jwt expired') {
        // Token expired, clear localStorage/sessionStorage
       // Clear authentication data
       localStorage.removeItem('token');
       localStorage.removeItem('usertype');
       localStorage.removeItem('uname');
       localStorage.removeItem('expirationTime');

       // Optionally, you can clear sessionStorage as well
       sessionStorage.removeItem('token');
       sessionStorage.removeItem('expirationTime');
       sessionStorage.removeItem('usertype');
       sessionStorage.removeItem('uname');

       // Redirect to login page or home page
       navigate('/');

        // Redirect to login page
     
      }
    }
    return Promise.reject(error); // Always return rejected promise
  }
);

export default api;
