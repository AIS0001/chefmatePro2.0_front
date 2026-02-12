import axios from "axios";
import { getHeaders } from "../utility/getHeader";

/**
 * Cancels a record by updating its status to '2'
 * 
 * @param {string} tablename - Name of the table
 * @param {string} colname - Name of the identifying column (e.g., "id")
 * @param {string|number} colval - Value of the identifying column
 */
const updateRecord = async (tablename, colname, colval) => {
  try {
      if (!tablename || !colname || colval === undefined || colval === null) {
    console.error("Invalid arguments passed to cancelRecord");
    return;
  }
    const payload = {
      updatedFields: { status: "2" },
      where: { [colname]: colval },
    };

    const res = await axios.put(
      `/updatedata/${tablename}`,
      payload,
      getHeaders()
    );

    console.log("Cancelled:", res.data);
  } catch (err) {
    console.error("Cancel Error:", err.message);
  }
};

export default updateRecord;
