// frontend/src/services/api.js
import axios from 'axios';
import { getHeaders } from '../utility/getHeader';



 const fetchComboData = async (tblname,groupby) => {
//   console.log("/combolist/"+tblname+"/"+groupby);
  try {
    const response = await axios.get("/combolist/"+tblname+"/"+groupby, getHeaders());
    return response.data;
  } catch (error) {
    throw new Error('Error fetching combo data');
  }
};

const fetchComboDataWithWhere = async (tblname, groupby, where) => {
  try {
   
    let url = `/combolistwithWhere/${tblname}/${groupby}`;
    if (where) {
      const whereParams = Object.keys(where)
         
          .map(key => `${key}='${encodeURIComponent(where[key])}'`) // Wrap value in quotes
          .join(" AND "); // Join conditions with AND
      url += `?where=${whereParams}`;
  }
  const response = await axios.get(url, getHeaders());
  //  console.log(url);
    return response.data;
  } catch (error) {
    throw new Error('Error fetching combo data with where condition');
  }

};
export {
  fetchComboData,
  fetchComboDataWithWhere

}

// Add more functions as needed for other endpoints
