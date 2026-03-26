import axios from "axios";
import { getHeaders } from "../utility/getHeader";

/**
 * Device Authentication API Service
 * Centralized API calls for MAC address-based device authentication
 */

const BASE_DEVICE_URL = "/device";

const deviceAuthService = {
  /**
   * Register new device for a user
   * @param {Object} deviceData - Device registration data
   * @returns {Promise}
   */
  registerDevice: async (deviceData) => {
    try {
      const response = await axios.post(
        `${BASE_DEVICE_URL}/register`,
        deviceData,
        getHeaders()
      );
      return response.data;
    } catch (error) {
      console.error("Error registering device:", error);
      throw error;
    }
  },

  /**
   * Get all devices for a specific user
   * @param {number} userId - User ID
   * @returns {Promise}
   */
  getUserDevices: async (userId) => {
    try {
      const response = await axios.get(
        `${BASE_DEVICE_URL}/user/${userId}`,
        getHeaders()
      );
      return response.data;
    } catch (error) {
      console.error(`Error fetching devices for user ${userId}:`, error);
      throw error;
    }
  },

  /**
   * Verify MAC address for user (Core authentication function)
   * @param {number} userId - User ID
   * @param {string} macAddress - MAC address to verify
   * @returns {Promise}
   */
  verifyMacAddress: async (userId, macAddress) => {
    try {
      const response = await axios.post(
        `${BASE_DEVICE_URL}/verify-mac`,
        { user_id: userId, mac_address: macAddress },
        getHeaders()
      );
      return response.data;
    } catch (error) {
      console.error("Error verifying MAC address:", error);
      throw error;
    }
  },

  /**
   * Update device information
   * @param {number} deviceId - Device ID
   * @param {Object} deviceData - Updated device data
   * @returns {Promise}
   */
  updateDevice: async (deviceId, deviceData) => {
    try {
      const response = await axios.put(
        `${BASE_DEVICE_URL}/${deviceId}`,
        deviceData,
        getHeaders()
      );
      return response.data;
    } catch (error) {
      console.error(`Error updating device ${deviceId}:`, error);
      throw error;
    }
  },

  /**
   * Delete device
   * @param {number} deviceId - Device ID
   * @returns {Promise}
   */
  deleteDevice: async (deviceId) => {
    try {
      const response = await axios.delete(
        `${BASE_DEVICE_URL}/${deviceId}`,
        getHeaders()
      );
      return response.data;
    } catch (error) {
      console.error(`Error deleting device ${deviceId}:`, error);
      throw error;
    }
  },

  /**
   * Get device authentication settings
   * @param {number|string} userId - User ID or 'global'
   * @returns {Promise}
   */
  getDeviceAuthSettings: async (userId = "global") => {
    try {
      const response = await axios.get(
        `${BASE_DEVICE_URL}/settings/${userId}`,
        getHeaders()
      );
      return response.data;
    } catch (error) {
      console.error(`Error fetching settings for ${userId}:`, error);
      throw error;
    }
  },

  /**
   * Update device authentication settings
   * @param {number|string} userId - User ID or 'global'
   * @param {Object} settings - Settings to update
   * @returns {Promise}
   */
  updateDeviceAuthSettings: async (userId = "global", settings) => {
    try {
      const response = await axios.put(
        `${BASE_DEVICE_URL}/settings/${userId}`,
        settings,
        getHeaders()
      );
      return response.data;
    } catch (error) {
      console.error(`Error updating settings for ${userId}:`, error);
      throw error;
    }
  },

  /**
   * Block MAC address globally
   * @param {string} macAddress - MAC address to block
   * @param {string} reason - Reason for blocking
   * @param {number} blockedByUserId - Admin user ID
   * @returns {Promise}
   */
  blockMacAddress: async (macAddress, reason, blockedByUserId) => {
    try {
      const response = await axios.post(
        `${BASE_DEVICE_URL}/block-mac`,
        {
          mac_address: macAddress,
          reason,
          blocked_by_user_id: blockedByUserId,
        },
        getHeaders()
      );
      return response.data;
    } catch (error) {
      console.error("Error blocking MAC address:", error);
      throw error;
    }
  },

  /**
   * Get login attempt logs
   * @param {number} userId - User ID (optional, omit for all users)
   * @param {Object} params - Query parameters (limit, status, etc.)
   * @returns {Promise}
   */
  getLoginAttempts: async (userId = null, params = {}) => {
    try {
      const url = userId
        ? `${BASE_DEVICE_URL}/logs/${userId}`
        : `${BASE_DEVICE_URL}/logs`;
      
      const queryParams = new URLSearchParams(params).toString();
      const fullUrl = queryParams ? `${url}?${queryParams}` : url;

      const response = await axios.get(fullUrl, getHeaders());
      return response.data;
    } catch (error) {
      console.error("Error fetching login attempts:", error);
      throw error;
    }
  },

  /**
   * Validate MAC address format
   * @param {string} mac - MAC address to validate
   * @returns {boolean}
   */
  validateMacAddress: (mac) => {
    if (!mac) return false;
    const macPattern = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
    return macPattern.test(mac);
  },

  /**
   * Format MAC address to standard format (XX:XX:XX:XX:XX:XX)
   * @param {string} mac - MAC address
   * @returns {string}
   */
  formatMacAddress: (mac) => {
    if (!mac) return null;
    
    // Remove any hyphens and convert to colons
    let formatted = mac.replace(/-/g, ':').toUpperCase();
    
    // Validate
    if (deviceAuthService.validateMacAddress(formatted)) {
      return formatted;
    }
    
    return null;
  },

  /**
   * Get MAC address from client (browser-based detection)
   * Note: This is limited in browsers. Better to use Electron or manual entry.
   * @returns {Promise<string|null>}
   */
  getClientMacAddress: async () => {
    // This is a placeholder - actual implementation depends on your platform
    // For Electron apps, you'd use IPC to get MAC from main process
    // For web apps, user would need to enter manually
    
    if (window.ipcRenderer) {
      // Electron app
      try {
        return await window.ipcRenderer.invoke('get-mac');
      } catch (error) {
        console.error("Error getting MAC from Electron:", error);
        return null;
      }
    }
    
    // Web browser - check localStorage
    return localStorage.getItem('deviceMac') || null;
  },

  /**
   * Save client MAC to localStorage
   * @param {string} mac - MAC address
   */
  saveClientMac: (mac) => {
    if (deviceAuthService.validateMacAddress(mac)) {
      localStorage.setItem('deviceMac', mac.toUpperCase());
      return true;
    }
    return false;
  },
};

export default deviceAuthService;
