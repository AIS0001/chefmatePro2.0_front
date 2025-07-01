import axios from "axios";
import { getHeaders } from "../utility/getHeader";

const updateData = async (tblname, updatedFields, where) => {
  let url = `/updatedata`;
  if (tblname) {
    url += `/${tblname}`;
  }

  const data = {
    updatedFields,
    where
  };

  console.log("🟨 URL:", url);
  console.log("🟨 Data:", data);

  const response = await axios.put(url, data, getHeaders());
  return response.data;
};

export default updateData;
