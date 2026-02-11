import axios from "axios";
import { getHeaders } from "../utility/getHeader";

const fetchDataFromTwoTables = async (tblname1, tblname2, col1, col2, setData, orderby, where) => {
    // Build the URL dynamically based on the provided parameters
    let url = `/fetchdatafromtwotables/${tblname1}/${tblname2}/${col1}/${col2}/${orderby}`;
     // Convert 'where' object into query string format
     if (where) {
        const whereParams = Object.keys(where)
           
            .map(key => `${key}='${encodeURIComponent(where[key])}'`) // Wrap value in quotes
            .join(" AND "); // Join conditions with AND
        url += `?where=${whereParams}`;
    }
    
   // console.log("fetchDataFromTwoTables URL:", url);
    
    try {
        const headers = getHeaders();
        const response = await axios.get(url, headers);
        //console.log("fetchDataFromTwoTables response:", response.data);
        
        // If a setData function is provided, update the state with the fetched data
        if (setData && typeof setData === 'function') {
            setData(response.data.data);
         //  console.log(response.data.data);
        }

        return response.data.data;
    } catch (error) {
        console.error('fetchDataFromTwoTables error:', error);
        // Re-throw 401/unauthorized errors to propagate to caller for session handling
        if (error?.response?.status === 401 || (error?.response?.data?.message || '').toLowerCase().includes('invalid or expired token')) {
            throw error;
        }
        if (setData && typeof setData === 'function') {
            setData([]);
        }
        return null;
    }
};

export default fetchDataFromTwoTables;
