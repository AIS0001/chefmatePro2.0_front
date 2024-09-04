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
        alert(whereParams);
       
    }
   
    const response = await axios.get(url, getHeaders());

    // If a setData function is provided, update the state with the fetched data
    if (setData && typeof setData === 'function') {
        setData(response.data.data)
      
        console.log(response.data);
    }

}
export default   fetchData;

