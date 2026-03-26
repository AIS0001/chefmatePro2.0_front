import axios from "axios";
import { getHeaders } from "../utility/getHeader";

const deleteRecord = async (tablename, colname, colval) => {
    try {
        // Input validation
        if (!tablename || !colname || colval === undefined || colval === null) {
            console.error("❌ Invalid parameters:", { tablename, colname, colval });
            throw new Error('Missing required parameters: tablename, colname, or colval');
        }

        console.log(`🗑️ Attempting to delete from ${tablename} where ${colname} = ${colval}`);
        console.log("🔍 Parameter types:", {
            tablename: typeof tablename,
            colname: typeof colname, 
            colval: typeof colval
        });
        
        // Log the headers to ensure auth is working
        const headers = getHeaders();
        console.log("🔑 Headers:", headers);
        
        // URL encode parameters to handle special characters
        const encodedTablename = encodeURIComponent(tablename);
        const encodedColname = encodeURIComponent(colname);
        const encodedColval = encodeURIComponent(colval);
        
        // Log the full URL being called
        const url = `/deletebyid/${encodedTablename}/${encodedColname}/${encodedColval}`;
        console.log("🌐 DELETE URL:", url);
        console.log("🌐 Full URL with base:", `${axios.defaults.baseURL}${url}`);
        console.log("🌐 Original params:", { tablename, colname, colval });
        console.log("🌐 Encoded params:", { encodedTablename, encodedColname, encodedColval });

        const res = await axios.delete(url, headers);

        console.log("✅ Delete response status:", res.status);
        console.log("✅ Delete response data:", res.data);
        
        return res.data;
    } catch (err) {
        console.error(`❌ Delete error for ${tablename}:`, err);
        
        // Log more detailed error information
        if (err.response) {
            console.error("❌ Response status:", err.response.status);
            console.error("❌ Response data:", err.response.data);
            console.error("❌ Response headers:", err.response.headers);
            
            // Provide more specific error messages based on status codes
            let errorMessage = 'Delete operation failed';
            switch (err.response.status) {
                case 400:
                    // Check if it's a table whitelist issue
                    if (err.response.data?.message?.includes('Invalid table name')) {
                        errorMessage = `Table '${tablename}' is not allowed for deletion. Please contact administrator.`;
                    } else if (err.response.data?.message?.includes('Missing required parameters')) {
                        errorMessage = 'Invalid delete parameters provided';
                    } else {
                        errorMessage = err.response.data?.message || 'Bad request - check parameters';
                    }
                    break;
                case 401:
                    errorMessage = 'Unauthorized - please check your authentication';
                    break;
                case 403:
                    errorMessage = 'Forbidden - insufficient permissions';
                    break;
                case 404:
                    errorMessage = err.response.data?.message || 'Record not found or already deleted';
                    break;
                case 500:
                    errorMessage = err.response.data?.message || 'Server error occurred';
                    break;
                default:
                    errorMessage = err.response.data?.message || `HTTP ${err.response.status} error`;
            }
            
            console.error("❌ Parsed error message:", errorMessage);
            
            // Create enhanced error object
            const enhancedError = new Error(errorMessage);
            enhancedError.status = err.response.status;
            enhancedError.originalError = err;
            enhancedError.responseData = err.response.data;
            throw enhancedError;
            
        } else if (err.request) {
            console.error("❌ Request error (no response):", err.request);
            throw new Error('Network error - no response from server');
        } else {
            console.error("❌ Error message:", err.message);
            throw err;
        }
    }
};

// New bulk delete function
const deleteBulkRecords = async (tablename, colname, colvals) => {
    try {
        if (!tablename || !colname || !Array.isArray(colvals) || colvals.length === 0) {
            console.error("❌ Invalid bulk delete parameters:", { tablename, colname, colvals });
            throw new Error('Missing required parameters: tablename, colname, and non-empty colvals array');
        }

        console.log(`🗑️ Attempting bulk delete from ${tablename} where ${colname} in [${colvals.join(', ')}]`);

        const headers = getHeaders();
        console.log("🔑 Headers:", headers);

        const encodedTablename = encodeURIComponent(tablename);
        const url = `/deletebulk/${encodedTablename}`;
        const requestBody = {
            ids: colvals,
            columnName: colname,
        };

        console.log("🌐 BULK DELETE URL:", url);
        console.log("📦 BULK DELETE BODY:", requestBody);

        const res = await axios.post(url, requestBody, headers);
        
        console.log("✅ Bulk delete response status:", res.status);
        console.log("✅ Bulk delete response data:", res.data);
        
        return res.data;
    } catch (err) {
        console.error(`❌ Bulk delete error for ${tablename}:`, err);
        
        // Log more detailed error information
        if (err.response) {
            console.error("❌ Response status:", err.response.status);
            console.error("❌ Response data:", err.response.data);
            console.error("❌ Response headers:", err.response.headers);
        } else if (err.request) {
            console.error("❌ Request error (no response):", err.request);
        } else {
            console.error("❌ Error message:", err.message);
        }
        
        if (err.response) {
            let errorMessage = 'Bulk delete operation failed';
            switch (err.response.status) {
                case 400:
                    errorMessage = err.response.data?.message || 'Bad request - check table name or IDs';
                    break;
                case 401:
                    errorMessage = 'Unauthorized - please check your authentication';
                    break;
                case 403:
                    errorMessage = 'Forbidden - insufficient permissions';
                    break;
                case 404:
                    errorMessage = err.response.data?.message || 'No records found to delete';
                    break;
                case 500:
                    errorMessage = err.response.data?.message || 'Server error occurred';
                    break;
                default:
                    errorMessage = err.response.data?.message || `HTTP ${err.response.status} error`;
            }

            const enhancedError = new Error(errorMessage);
            enhancedError.status = err.response.status;
            enhancedError.originalError = err;
            enhancedError.responseData = err.response.data;
            throw enhancedError;
        }

        throw err;
    }
};

// Specific function for deleting items using /deleteitem/:id endpoint
const deleteItem = async (itemId) => {
    try {
        // Input validation
        if (!itemId) {
            console.error("❌ Invalid parameter: itemId is required");
            throw new Error('Missing required parameter: itemId');
        }

        console.log(`🗑️ Attempting to delete item with ID: ${itemId}`);
        
        // Log the headers to ensure auth is working
        const headers = getHeaders();
        console.log("🔑 Headers:", headers);
        
        // Create the URL for the specific item delete endpoint
        const url = `/deleteitem/${itemId}`;
        console.log("🌐 DELETE URL:", url);
        
        // Make the DELETE request with correct syntax
        const res = await axios.delete(url, headers);
        
        console.log("✅ Delete response status:", res.status);
        console.log("✅ Delete response data:", res.data);
        
        return res.data;
        
    } catch (err) {
        console.error(`❌ Delete item error:`, err);
        
        // Log more detailed error information
        if (err.response) {
            console.error("❌ Response status:", err.response.status);
            console.error("❌ Response data:", err.response.data);
            console.error("❌ Response headers:", err.response.headers);
            
            // Provide more specific error messages based on status codes
            let errorMessage = 'Delete item operation failed';
            switch (err.response.status) {
                case 400:
                    errorMessage = err.response.data?.message || 'Bad request - invalid item ID';
                    break;
                case 401:
                    errorMessage = 'Unauthorized - please check your authentication';
                    break;
                case 403:
                    errorMessage = 'Forbidden - insufficient permissions to delete items';
                    break;
                case 404:
                    errorMessage = err.response.data?.message || 'Item not found';
                    break;
                case 500:
                    errorMessage = err.response.data?.message || 'Server error occurred';
                    break;
                default:
                    errorMessage = err.response.data?.message || `HTTP ${err.response.status} error`;
            }
            
            console.error("❌ Parsed error message:", errorMessage);
            
            // Create enhanced error object
            const enhancedError = new Error(errorMessage);
            enhancedError.status = err.response.status;
            enhancedError.originalError = err;
            enhancedError.responseData = err.response.data;
            throw enhancedError;
            
        } else if (err.request) {
            console.error("❌ Request error (no response):", err.request);
            throw new Error('Network error - no response from server');
        } else {
            console.error("❌ Error message:", err.message);
            throw err;
        }
    }
};

// Bulk delete items function using /deleteitems/bulk endpoint
const deleteBulkItems = async (itemIds) => {
    try {
        // Input validation
        if (!itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
            console.error("❌ Invalid parameter: itemIds must be a non-empty array");
            throw new Error('Missing required parameter: itemIds (non-empty array)');
        }

        console.log(`🗑️ Attempting to bulk delete ${itemIds.length} items:`, itemIds);
        
        // Log the headers to ensure auth is working
        const headers = getHeaders();
        console.log("🔑 Headers:", headers);
        
        // Prepare the request body for the bulk delete API
        const requestBody = {
            ids: itemIds,
            columnName: 'id' // Using 'id' as the column name
        };
        
        // Create the URL for the bulk delete endpoint
        const url = `/deleteitems/bulk`;
        console.log("🌐 BULK DELETE URL:", url);
        console.log("📦 Request body:", requestBody);
        
        // Make the POST request (not DELETE) as per your API design
        const res = await axios.post(url, requestBody, headers);
        
        console.log("✅ Bulk delete response status:", res.status);
        console.log("✅ Bulk delete response data:", res.data);
        
        return res.data;
        
    } catch (err) {
        console.error(`❌ Bulk delete items error:`, err);
        
        // Log more detailed error information
        if (err.response) {
            console.error("❌ Response status:", err.response.status);
            console.error("❌ Response data:", err.response.data);
            console.error("❌ Response headers:", err.response.headers);
            
            // Provide more specific error messages based on status codes
            let errorMessage = 'Bulk delete operation failed';
            switch (err.response.status) {
                case 400:
                    errorMessage = err.response.data?.message || 'Bad request - check item IDs';
                    break;
                case 401:
                    errorMessage = 'Unauthorized - please check your authentication';
                    break;
                case 403:
                    errorMessage = 'Forbidden - insufficient permissions to delete items';
                    break;
                case 404:
                    errorMessage = err.response.data?.message || 'No items found to delete';
                    break;
                case 500:
                    errorMessage = err.response.data?.message || 'Server error occurred';
                    break;
                default:
                    errorMessage = err.response.data?.message || `HTTP ${err.response.status} error`;
            }
            
            console.error("❌ Parsed error message:", errorMessage);
            
            // Create enhanced error object
            const enhancedError = new Error(errorMessage);
            enhancedError.status = err.response.status;
            enhancedError.originalError = err;
            enhancedError.responseData = err.response.data;
            throw enhancedError;
            
        } else if (err.request) {
            console.error("❌ Request error (no response):", err.request);
            throw new Error('Network error - no response from server');
        } else {
            console.error("❌ Error message:", err.message);
            throw err;
        }
    }
};

// Test function to debug delete operations
const testDeleteRecord = async (tablename, colname, colval) => {
    console.log("🧪 TESTING DELETE OPERATION");
    console.log("🧪 Parameters:", { tablename, colname, colval });
    
    try {
        const result = await deleteRecord(tablename, colname, colval);
        console.log("✅ TEST RESULT: Success", result);
        return result;
    } catch (error) {
        console.log("❌ TEST RESULT: Failed", {
            message: error.message,
            status: error.status,
            responseData: error.responseData
        });
        throw error;
    }
};

// Test function to check if a table is allowed for deletion
const testTableAccess = async (tablename) => {
    try {
        console.log(`🧪 Testing table access for: ${tablename}`);
        
        // Try a dummy delete with invalid ID to test table whitelist
        const testUrl = `/deletebyid/${tablename}/id/999999`;
        const headers = getHeaders();
        
        await axios.delete(testUrl, headers);
    } catch (err) {
        if (err.response?.status === 400 && err.response.data?.message?.includes('Invalid table name')) {
            console.log(`❌ Table '${tablename}' is not in backend whitelist`);
            return { allowed: false, error: 'Table not in whitelist' };
        } else if (err.response?.status === 404) {
            console.log(`✅ Table '${tablename}' is allowed (record not found is expected)`);
            return { allowed: true, error: 'Table is allowed' };
        } else {
            console.log(`🤔 Unexpected response for table '${tablename}':`, err.response?.status, err.response?.data);
            return { allowed: true, error: 'Unknown - might be allowed' };
        }
    }
};

export default deleteRecord;
export { deleteBulkRecords, testDeleteRecord, deleteItem, deleteBulkItems, testTableAccess };