import axios from 'axios';
import { message } from 'antd';

const LOCAL_PRINT_AGENT_URL =
  process.env.REACT_APP_LOCAL_PRINT_AGENT_URL || 'http://127.0.0.1:7001';

/**
 * Auto-detect ESC/POS printer and send KOT (Kitchen Order Ticket) print job
 * Uses backend printer detection API to find printer by location
 * Then sends print job to local printing agent
 */

const escPosAutoDetectService = {
  /**
   * Detect printer automatically based on location and print KOT
   * @param {Object} kotData - KOT data with order details
   * @param {string} location - 'kitchen' or 'cashier' (defaults to 'kitchen')
   * @returns {Promise<boolean>} - Success or failure
   */
  printKOT: async (kotData, location = 'kitchen') => {
    let messageKey = null;
    try {
      // Step 1: Show detecting message
      messageKey = 'detecting-printer';
      message.loading({
        content: '🔍 Detecting printer...',
        key: messageKey,
        duration: 0
      });

      // Step 2: Call backend to detect printer based on location
      console.log(`📍 Detecting ${location} printer...`);
      const printerResponse = await axios.get(
        `/printer/detect?type=${location}`
      );

      if (!printerResponse.data.success) {
        message.error({
          content: `❌ No ${location} printer configured!`,
          key: messageKey,
          duration: 4
        });
        console.error('❌ Printer detection failed:', printerResponse.data.message);
        return false;
      }

      const printerData = printerResponse.data.data;
      const { printer_ip, printer_port, terminal_id, mac_address, location: detectedLocation } = printerData;

      console.log(`✅ Printer detected:
        - Terminal ID: ${terminal_id}
        - Location: ${detectedLocation}
        - MAC: ${mac_address || 'N/A'}
        - IP: ${printer_ip}:${printer_port}
      `);

      // Step 3: Send print job to local printing agent
      message.loading({
        content: `🖨️ Printing to ${terminal_id}...`,
        key: messageKey,
        duration: 0
      });

      console.log(`📤 Sending print job to local agent (${printer_ip}:${printer_port})`);
      
      const printPayload = {
        printer_ip,
        printer_port,
        terminal_id,
        data: kotData,
        type: 'KOT', // Kitchen Order Ticket
        location: detectedLocation,
        mac_address: mac_address || null,
        timestamp: new Date().toISOString()
      };

      // Call local printing agent
      const printResponse = await axios.post(
        `${LOCAL_PRINT_AGENT_URL}/print-kot`,
        printPayload,
        {
          timeout: 7000
        }
      );

      if (printResponse.data.success) {
        message.success({
          content: `✅ KOT printed successfully to ${terminal_id}!`,
          key: messageKey,
          duration: 4
        });
        console.log('✅ Print successful');
        return true;
      } else {
        message.error({
          content: `❌ Print failed: ${printResponse.data.message}`,
          key: messageKey,
          duration: 4
        });
        console.error('❌ Print failed:', printResponse.data);
        return false;
      }

    } catch (error) {
      console.error('❌ Error during printing:', error);

      let errorMsg = 'Unknown error occurred';

      // Handle different error scenarios
      if (error.code === 'ECONNREFUSED') {
        errorMsg = `Local printing agent not running at ${LOCAL_PRINT_AGENT_URL}`;
      } else if (error.response?.status === 404) {
        errorMsg = `No printer configured for ${location} location`;
      } else if (error.response?.status === 400) {
        errorMsg = error.response.data.message || 'Invalid printer request';
      } else if (error.message === 'timeout of 10000ms exceeded') {
        errorMsg = 'Print job timed out - printer may be offline';
      } else if (error.message) {
        errorMsg = error.message;
      }

      message.error({
        content: `❌ ${errorMsg}`,
        key: messageKey,
        duration: 5
      });

      return false;
    }
  },

  /**
   * Print KOT by specific printer MAC address
   * @param {Object} kotData - KOT data
   * @param {string} macAddress - MAC address of target printer
   * @returns {Promise<boolean>} - Success or failure
   */
  printKOTByMac: async (kotData, macAddress) => {
    let messageKey = null;
    try {
      messageKey = 'print-by-mac';
      message.loading({
        content: `🔍 Finding printer (MAC: ${macAddress})...`,
        key: messageKey,
        duration: 0
      });

      // Get printer by MAC address using agent endpoint
      const printerResponse = await axios.get(
        `/printer/agent/detect?mac_address=${macAddress}`
      );

      if (!printerResponse.data.success) {
        message.error({
          content: `❌ No printer found for MAC: ${macAddress}`,
          key: messageKey,
          duration: 4
        });
        return false;
      }

      const printerData = printerResponse.data.data;
      const { printer_ip, printer_port, terminal_id, location } = printerData;

      message.loading({
        content: `🖨️ Printing to ${terminal_id}...`,
        key: messageKey,
        duration: 0
      });

      const printResponse = await axios.post(
        `${LOCAL_PRINT_AGENT_URL}/print-kot`,
        {
          printer_ip,
          printer_port,
          terminal_id,
          data: kotData,
          type: 'KOT',
          location,
          mac_address: macAddress,
          timestamp: new Date().toISOString()
        },
        { timeout: 7000 }
      );

      if (printResponse.data.success) {
        message.success({
          content: `✅ KOT printed to ${terminal_id}!`,
          key: messageKey,
          duration: 4
        });
        return true;
      } else {
        message.error({
          content: `❌ Print failed: ${printResponse.data.message}`,
          key: messageKey,
          duration: 4
        });
        return false;
      }

    } catch (error) {
      console.error('❌ Error printing by MAC:', error);
      message.error({
        content: `❌ Print error: ${error.message}`,
        key: messageKey,
        duration: 5
      });
      return false;
    }
  },

  /**
   * Print KOT directly to a specific printer by IP and Port
   * @param {Object} kotData - KOT data
   * @param {string} printerIp - Printer IP address
   * @param {number} printerPort - Printer port
   * @param {string} terminalId - Terminal/Printer ID for display
   * @returns {Promise<boolean>} - Success or failure
   */
  printToSpecificPrinter: async (kotData, printerIp, printerPort, terminalId = 'Printer') => {
    let messageKey = null;
    try {
      messageKey = 'print-specific';
      message.loading({
        content: `🖨️ Sending to ${printerIp}:${printerPort}...`,
        key: messageKey,
        duration: 0
      });

      console.log(`📤 Printing directly to ${printerIp}:${printerPort}`);

      const printPayload = {
        printer_ip: printerIp,
        printer_port: printerPort,
        terminal_id: terminalId,
        data: kotData,
        type: 'KOT',
        timestamp: new Date().toISOString()
      };

      // Call local printing agent with specific printer IP
      const printResponse = await axios.post(
        `${LOCAL_PRINT_AGENT_URL}/print-kot`,
        printPayload,
        {
          timeout: 7000
        }
      );

      if (printResponse.data.success) {
        message.success({
          content: `✅ KOT printed to ${terminalId}!`,
          key: messageKey,
          duration: 3
        });
        console.log('✅ Print to specific printer successful');
        return true;
      } else {
        message.error({
          content: `❌ Print failed: ${printResponse.data.message}`,
          key: messageKey,
          duration: 4
        });
        console.error('❌ Print failed:', printResponse.data);
        return false;
      }

    } catch (error) {
      console.error('❌ Error printing to specific printer:', error);

      let errorMsg = 'Unknown error occurred';

      if (error.code === 'ECONNREFUSED') {
        errorMsg = `Local printing agent not running at ${LOCAL_PRINT_AGENT_URL}`;
      } else if (error.message === 'timeout of 10000ms exceeded') {
        errorMsg = 'Printer not responding - may be offline';
      } else if (error.message) {
        errorMsg = error.message;
      }

      message.error({
        content: `❌ ${errorMsg}`,
        key: messageKey,
        duration: 5
      });

      return false;
    }
  },

  /**
   * Prepare KOT data from order
   * @param {Object} orderData - Order information
   * @returns {Object} - Formatted KOT data
   */
  prepareKOTData: (orderData) => {
    return {
      order_id: orderData.id || orderData.order_id,
      order_number: orderData.order_number || orderData.queue_number,
      table_number: orderData.table_number || orderData.table,
      customer_name: orderData.customer_name || orderData.customer || 'Walk-in',
      items: (orderData.items || []).map(item => ({
        item_name: item.item_name || item.name,
        quantity: item.quantity || item.qty,
        special_instructions: item.special_instructions || item.notes || '',
        category: item.category || item.item_group
      })),
      timestamp: new Date().toLocaleString(),
      special_notes: orderData.special_notes || orderData.notes || '',
      delivery_type: orderData.delivery_type || 'Dine-in'
    };
  }
};

export default escPosAutoDetectService;
