import axios from "axios";
import { getHeaders } from "../utility/getHeader";


const fetchData = async (tblname, setData, orderby, where) => {
    // Build the URL dynamically based on the provided parameters
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
    if(tblname==="final_bill")
    {
        console.log("Fetch url data");
        console.log(url);

    }
    
    const response = await axios.get(url, getHeaders());

    // If a setData function is provided, update the state with the fetched data
    if (setData && typeof setData === 'function') {
        setData(response.data.data)
        if(tblname==="final_bill")
            {
                console.log("getch final bill data:");
       console.log(response.data.data);
            }
    }
    return response.data.data;
}


export default   fetchData;

