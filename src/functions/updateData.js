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

  try {
    const response = await axios.put(url, data, getHeaders());
    return response.data;
  } catch (error) {
    console.error('updateData error:', error);
    // Re-throw 401/unauthorized errors to propagate to caller for session handling
    if (error?.response?.status === 401 || (error?.response?.data?.message || '').toLowerCase().includes('invalid or expired token')) {
      throw error;
    }
    throw error; // Re-throw other errors as well
  }
};

export default updateData;
