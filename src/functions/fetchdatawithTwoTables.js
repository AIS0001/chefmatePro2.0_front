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
    
    const response = await axios.get(url, getHeaders());
   // console.log(url);
    // If a setData function is provided, update the state with the fetched data
    if (setData && typeof setData === 'function') {
        setData(response.data.data);
       console.log(response.data.data);
    }

    return response.data.data;
};

export default fetchDataFromTwoTables;
