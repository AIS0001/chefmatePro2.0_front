import axios from "axios";
import { getHeaders } from "../utility/getHeader";


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
        const response = await axios.get(url, getHeaders());
        if (setData && typeof setData === 'function') {
            setData(response.data.data);
        }
        return response.data.data;
    } catch (error) {
        console.error('fetchData error:', error);
        if (setData && typeof setData === 'function') {
            setData([]);
        }
        // Optionally, return null or throw error if you want to handle it in the caller
        return null;
    }
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
    //console.log(url);
    // if(tblname==="final_bill")
    // {
    //     console.log("Fetch url data");
    //     console.log(url);

    // }
    
    const response = await axios.get(url, getHeaders());

    // If a setData function is provided, update the state with the fetched data
    if (setData && typeof setData === 'function') {
        setData(response.data.data)
      //  console.log(response.data.data);
    //     if(tblname==="final_bill")
    //         {
    //             console.log("getch final bill data:");
    //    console.log(response.data.data);
    //         }
    }
    return response.data.data;
}



// ✅ Named export
export default fetchData;

