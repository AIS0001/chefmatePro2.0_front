import axios from "axios";
import { getHeaders } from "../utility/getHeader";


const getRunningTable = async (tblname, settableList) => {
    let url = `/getrunningtable`;
    if (tblname) {
        url += `/${tblname}`;
    }
     
   // console.log(url);
    try {
        const headers = getHeaders();
        const response = await axios.get(url, headers);

        if (settableList && typeof settableList === 'function') {
            settableList(response.data.data);
        }
        return response.data.data;
    } catch (error) {
        console.error('getRunningTable error:', error);
        // Re-throw 401/unauthorized errors to propagate to caller for session handling
        if (error?.response?.status === 401 || (error?.response?.data?.message || '').toLowerCase().includes('invalid or expired token')) {
            throw error;
        }
        if (settableList && typeof settableList === 'function') {
            settableList([]);
        }
        return null;
    }
}

export default  getRunningTable;

