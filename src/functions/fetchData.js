import axios from "axios";
import { getHeaders, getResolvedShopId } from "../utility/getHeader";


const fetchData = async (tblname, setData, orderby, where) => {
    let url = `/fetchdata`;
    if (tblname) {
        url += `/${tblname}`;
    }
    if (orderby) {
        url += `/${orderby}`;
    }
    if (where) {
        const whereParams = new URLSearchParams(where).toString();
        url += `/${whereParams}`;
    }
    try {
        const headers = getHeaders();
        const response = await axios.get(url, headers);
        if (setData && typeof setData === 'function') {
            setData(response.data.data);
        }
        return response.data.data;
    } catch (error) {
        console.error('fetchData error:', error);
        // Re-throw 401/unauthorized errors to propagate to caller for session handling
        if (error?.response?.status === 401 || (error?.response?.data?.message || '').toLowerCase().includes('invalid or expired token')) {
            throw error;
        }
        if (setData && typeof setData === 'function') {
            setData([]);
        }
        // Optionally, return null or throw error if you want to handle it in the caller
        return null;
    }
}

export const fetchShopScopedData = async (tblname, setData, orderby, where = {}) => {
    const shopId = getResolvedShopId();

    if (!shopId) {
        if (setData && typeof setData === 'function') {
            setData([]);
        }
        return [];
    }

    return fetchData(tblname, setData, orderby, {
        ...where,
        shop_id: shopId,
    });
}

const fetchdatanotequal = async (tblname, setData, orderby, where) => {
    // Build the URL dynamically based on the provided parameters
    let url = `/fetchdatanotequal`;
    if (tblname) {
        url += `/${tblname}`;
    }
    if (orderby) {
        url += `/${orderby}`;
    }
    if (where) {
        const whereParams = new URLSearchParams(where).toString();
        url += `/${whereParams}`;
        
       
    }
    try {
        const headers = getHeaders();
        const response = await axios.get(url, headers);

        // If a setData function is provided, update the state with the fetched data
        if (setData && typeof setData === 'function') {
            setData(response.data.data)
        }
        return response.data.data;
    } catch (error) {
        console.error('fetchdatanotequal error:', error);
        if (setData && typeof setData === 'function') {
            setData([]);
        }
        return null;
    }
}



// ✅ Named export
export default fetchData;

