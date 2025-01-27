import axios from "axios";
import { getHeaders } from "../utility/getHeader";


const getMax = async (tblname, setmaxNumber, col1, val1,field) => {
    // Build the URL dynamically based on the provided parameters
    let url = `/getmaxordernumber`;
    if (tblname) {
        url += `/${tblname}`;
    }
    if (col1) {
        url += `/${col1}/${val1}/${field}`;
    }
  
    console.log(url);
    const response = await axios.get(url, getHeaders());

    // If a setData function is provided, update the state with the fetched data
    if (setmaxNumber && typeof setmaxNumber === 'function') {
        setmaxNumber(response.data.data)
      
      // console.log(response.data.data);
    }
    return response.data.data;
}


export default   getMax;

