import axios from "axios";
import { getHeaders } from "../utility/getHeader";


const getRunningTable = async (tblname, settableList) => {
    let url = `/getrunningtable`;
    if (tblname) {
        url += `/${tblname}`;
    }
     
   // console.log(url);
    const headers = getHeaders();
    const response = await axios.get(url, headers);

    if (settableList && typeof settableList === 'function') {
        settableList(response.data.data);
    }
    return response.data.data;
}

export default  getRunningTable;

