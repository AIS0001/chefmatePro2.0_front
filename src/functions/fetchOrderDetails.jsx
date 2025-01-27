import axios from "axios";
import { getHeaders } from "../utility/getHeader";

const fetchOrderDetails = async (table1, table2, tableNumber, setData) => {
    // Build the URL dynamically based on the provided parameters
    let url = `/getorderdetails/${table1}/${table2}`;

    // Append tableNumber as a query parameter if it's provided
    if (tableNumber) {
        url += `?tableNumber=${tableNumber}`;
    }

    console.log(url); // Optional: log the URL for debugging

    try {
        const response = await axios.get(url, getHeaders());

        // If a setData function is provided, update the state with the fetched data
        if (setData && typeof setData === 'function') {
          //  console.log(response.data.data);
            setData(response.data.data); // Assuming the response contains the full data
        }

        return response.data;
    } catch (error) {
        console.error("Error fetching order details:", error);
        // Optionally handle error state here (e.g., set an error state in your component)
    }
};

export default fetchOrderDetails;
