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
  
    console.log(url);
    const headers = getHeaders();
    const response = await axios.get(url, headers);

    if (setmaxNumber && typeof setmaxNumber === 'function') {
        setmaxNumber(response.data.data);
    }
    return response.data.data;
}



export default  getMax;

