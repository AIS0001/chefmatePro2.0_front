import axios from "axios";
import { getHeaders } from "../utility/getHeader";

/**
 * Printer Configuration API Service
 * Centralized API calls for printer configuration management
 */

const BASE_PRINTER_URL = "/printer";

const printerConfigService = {
  /**
   * Get all active printer configurations
   * @returns {Promise} Array of printer configurations
   */
  getAllPrinters: async () => {
    try {
      const response = await axios.get(`${BASE_PRINTER_URL}/config`, getHeaders());
      return response.data;
    } catch (error) {
      console.error("Error fetching all printers:", error);
      throw error;
    }
  },

  /**
   * Get printer configuration by terminal ID
   * @param {string} terminalId - Terminal ID
   * @returns {Promise} Printer configuration object
   */
  getPrinterByTerminalId: async (terminalId) => {
    try {
      const response = await axios.get(
        `${BASE_PRINTER_URL}/config/${terminalId}`,
        getHeaders()
      );
      return response.data;
    } catch (error) {
      console.error(`Error fetching printer ${terminalId}:`, error);
      throw error;
    }
  },

  /**
   * Get printers by location (kitchen or cashier)
   * @param {string} location - 'kitchen' or 'cashier'
   * @returns {Promise} Array of printer configurations
   */
  getPrintersByLocation: async (location) => {
    try {
      const response = await axios.get(
        `${BASE_PRINTER_URL}/config/location/${location}`,
        getHeaders()
      );
      return response.data;
    } catch (error) {
      console.error(`Error fetching ${location} printers:`, error);
      throw error;
    }
  },

  /**
   * Create new printer configuration
   * @param {Object} printerData - Printer configuration data
   * @returns {Promise} Created printer configuration
   */
  createPrinter: async (printerData) => {
    try {
      const response = await axios.post(
        `${BASE_PRINTER_URL}/config`,
        printerData,
        getHeaders()
      );
      return response.data;
    } catch (error) {
      console.error("Error creating printer:", error);
      throw error;
    }
  },

  /**
   * Update printer configuration
   * @param {string} terminalId - Terminal ID
   * @param {Object} printerData - Updated printer data
   * @returns {Promise} Updated printer configuration
   */
  updatePrinter: async (terminalId, printerData) => {
    try {
      const response = await axios.put(
        `${BASE_PRINTER_URL}/config/${terminalId}`,
        printerData,
        getHeaders()
      );
      return response.data;
    } catch (error) {
      console.error(`Error updating printer ${terminalId}:`, error);
      throw error;
    }
  },

  /**
   * Delete printer configuration
   * @param {string} terminalId - Terminal ID
   * @returns {Promise} Deletion confirmation
   */
  deletePrinter: async (terminalId) => {
    try {
      const response = await axios.delete(
        `${BASE_PRINTER_URL}/config/${terminalId}`,
        getHeaders()
      );
      return response.data;
    } catch (error) {
      console.error(`Error deleting printer ${terminalId}:`, error);
      throw error;
    }
  },

  /**
   * Validate IP address format
   * @param {string} ip - IP address to validate
   * @returns {boolean} True if valid, false otherwise
   */
  validateIPAddress: (ip) => {
    if (!ip) return false;
    const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipPattern.test(ip)) return false;
    const parts = ip.split(".");
    return parts.every((part) => parseInt(part) <= 255 && parseInt(part) >= 0);
  },

  /**
   * Test printer connection (basic ping-like check)
   * @param {string} printerIp - Printer IP address
   * @param {number} printerPort - Printer port
   * @returns {Promise} Connection test result
   */
  testPrinterConnection: async (printerIp, printerPort) => {
    // This would require a backend endpoint to test connectivity
    // Placeholder for future implementation
    return {
      success: true,
      message: "Connection test not implemented",
    };
  },
};

export default printerConfigService;
