// frontend/src/services/api.js
import axios from 'axios';
import { getHeaders } from '../utility/getHeader';



export const fetchComboData = async (tblname,groupby) => {
//   console.log("/combolist/"+tblname+"/"+groupby);
  try {
    const response = await axios.get("/combolist/"+tblname+"/"+groupby, getHeaders());
    return response.data;
  } catch (error) {
    throw new Error('Error fetching combo data');
  }
};

// Add more functions as needed for other endpoints
