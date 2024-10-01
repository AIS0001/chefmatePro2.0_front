import axios from "axios";
import { getHeaders } from "../utility/getHeader";


const deleteRecord  = async(tablename,colname,colval) => {
    //console.log(getHeaders());
    try{
        const res = await axios.delete( "/deletebyid/"+tablename+"/"+colname+"/"+colval,getHeaders());
        console.log(res.data);
    }
    catch(err)
    {
        console.log(err.message);
    }
  
   
  };
export default deleteRecord;