import axios from "axios";
import { getHeaders } from "../utility/getHeader";

const getMax = async (tblname, setmaxNumber, col1, val1, field) => {
    let url = `/getmaxordernumber`;
    if (tblname) {
        url += `/${tblname}`;
    }
    if (col1) {
        url += `/${col1}/${val1}/${field}`;
    }
  
   // console.log(url);
    try {
        const headers = getHeaders();
        const response = await axios.get(url, headers);

        if (setmaxNumber && typeof setmaxNumber === 'function') {
            setmaxNumber(response.data.data);
        }
        return response.data.data;
    } catch (error) {
        console.error('getMax error:', error);
        // Re-throw 401/unauthorized errors to propagate to caller for session handling
        if (error?.response?.status === 401 || (error?.response?.data?.message || '').toLowerCase().includes('invalid or expired token')) {
            throw error;
        }
        if (setmaxNumber && typeof setmaxNumber === 'function') {
            setmaxNumber(0);
        }
        return null;
    }
}



export default  getMax;

