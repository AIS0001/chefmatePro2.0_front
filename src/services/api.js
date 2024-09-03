// frontend/src/services/api.js
import axios from 'axios';


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


export const fetchComboData = async (tblname,groupby) => {
   console.log("/combolist/"+tblname+"/"+groupby);
  try {
    const response = await axios.get("/combolist/"+tblname+"/"+groupby, getHeaders());
    return response.data;
  } catch (error) {
    throw new Error('Error fetching combo data');
  }
};

// Add more functions as needed for other endpoints
