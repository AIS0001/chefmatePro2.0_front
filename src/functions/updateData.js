import axios from "axios";
import { getHeaders } from "../utility/getHeader";

const updateData = async (tblname, updatedFields, where) => {
    // Build the URL dynamically based on the provided table name
    let url = `/updatedata`;
    if (tblname) {
        url += `/${tblname}`;
    }

    // Prepare the request body with both updated fields and where conditions
    const data = {
        updatedFields, // Fields to be updated
        where          // Dynamic WHERE conditions
    };

    console.log(url); // Check the generated URL
    console.log(data); // Check the request data

    // Make the PUT request with the updated fields and where conditions as the body
    const response = await axios.put(url, data, getHeaders());

    // Return the response data for further processing if needed
    return response.data;
};

export default updateData;
