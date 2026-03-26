import axios from 'axios';
import { getHeaders } from '../utility/getHeader';

/**
 * Get the setup date based on the last day close date + 1 day, or current date if no data found
 * @returns {string} Setup date in YYYY-MM-DD format
 */
export const getNextSetupDate = async () => {
  try {
    // Get the latest closing date from day_close_summary table
    const response = await axios.get(
      '/fetchdata/day_close_summary/close_date/', // Get all records ordered by close_date
      getHeaders()
    );

    if (response.data && response.data.data && response.data.data.length > 0) {
      // Sort by close_date descending to get the latest one
      const sortedData = response.data.data.sort((a, b) => new Date(b.close_date) - new Date(a.close_date));
      const lastCloseDate = sortedData[0].close_date;
      
      // Add 1 day to the last close date
      const nextDate = new Date(lastCloseDate);
      nextDate.setDate(nextDate.getDate() + 1);
      
      // Format as YYYY-MM-DD
      return nextDate.toISOString().split('T')[0];
    } else {
      // If no day close records exist, use current date (no increment)
      return new Date().toISOString().split('T')[0];
    }
  } catch (error) {
    console.error('Error fetching last close date:', error);
    // Fallback to current date if there's an error (no increment)
    return new Date().toISOString().split('T')[0];
  }
};

/**
 * Get setup date for database insertion (includes time)
 * @returns {string} Setup date in YYYY-MM-DD HH:mm:ss format
 */
export const getSetupDateTime = async () => {
  const setupDate = await getNextSetupDate();
  const currentTime = new Date().toTimeString().split(' ')[0]; // Get HH:mm:ss
  return `${setupDate}`;
};
