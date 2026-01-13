const escpos = require('escpos');
const USB = require('escpos-usb');
const Network = require('escpos-network');
const { execSync } = require('child_process');
const WindowsPrinter = require('./windows-printer');

// Printer module is optional - not required for USB/Network ESC/POS printing
let pdfToPrinter;
try {
  pdfToPrinter = require('pdf-to-printer');
} catch (err) {
  console.warn('⚠️  pdf-to-printer not available (optional fallback)');
  pdfToPrinter = null;
}

/**
 * Printer utility module
 * Handles printer detection and printing for USB, Network, and fallback methods
 */

class PrinterManager {
  constructor(config = {}) {
    this.config = {
      printerType: config.printerType || process.env.PRINTER_TYPE || 'windows',
      printerIP: config.printerIP || process.env.PRINTER_IP || '192.168.1.123',
      printerPort: config.printerPort || process.env.PRINTER_PORT || 9100,
      printerName: config.printerName || process.env.PRINTER_NAME || null
    };
    
    // Support for multiple network printers
    this.multiPrinterConfig = config.multiPrinters || {
      printer1: {
        ip: config.printer1IP || process.env.PRINTER_1_IP || null,
        port: config.printer1Port || process.env.PRINTER_1_PORT || 9100
      },
      printer2: {
        ip: config.printer2IP || process.env.PRINTER_2_IP || null,
        port: config.printer2Port || process.env.PRINTER_2_PORT || 9100
      }
    };
    
    this.windowsPrinter = new WindowsPrinter();
  }

  /**
   * Print to multiple network printers simultaneously
   * @param {string} base64Data - Base64 encoded ESC/POS data
   * @param {Array} printerList - Array of printer objects with {ip, port}
   * @returns {Promise} Result with success status for each printer
   */
  async printToMultiplePrinters(base64Data, printerList = null) {
    if (!base64Data) {
      throw new Error('No data provided for printing');
    }

    // Use provided printer list or default multi-printer config
    const printers = printerList || this.getConfiguredPrinters();
    
    if (printers.length === 0) {
      throw new Error('No printers configured for multi-printer printing');
    }

    console.log(`📤 Sending to ${printers.length} printer(s)...`);
    
    const results = [];
    const promises = printers.map((printer, index) => 
      this.printToSingleNetworkPrinter(base64Data, printer, index + 1)
        .then(result => {
          results.push(result);
          return result;
        })
        .catch(error => {
          results.push({
            success: false,
            printerIndex: index + 1,
            ip: printer.ip,
            port: printer.port,
            error: error.message
          });
          return { success: false, error: error.message };
        })
    );

    await Promise.allSettled(promises);
    
    return this.summarizeMultiPrinterResults(results);
  }

  /**
   * Print to a single network printer
   * @param {string} base64Data - Base64 encoded ESC/POS data
   * @param {object} printer - Printer config {ip, port}
   * @param {number} printerIndex - Index for logging
   */
  async printToSingleNetworkPrinter(base64Data, printer, printerIndex = 1) {
    if (!printer.ip) {
      throw new Error(`Printer ${printerIndex}: No IP address configured`);
    }

    return new Promise((resolve, reject) => {
      try {
        console.log(`🔌 Connecting to printer ${printerIndex} at ${printer.ip}:${printer.port}...`);
        const device = new Network(printer.ip, printer.port);
        const buffer = Buffer.from(base64Data, 'base64');

        device.open((err) => {
          if (err) {
            console.error(`❌ Printer ${printerIndex}: Failed to open device:`, err.message);
            return reject(new Error(`Failed to open printer ${printerIndex}: ${err.message}`));
          }

          try {
            const printerInstance = new escpos.Printer(device);
            
            // Send raw ESC/POS buffer
            printerInstance.raw(buffer);
            
            // Close the printer connection
            printerInstance.close(() => {
              console.log(`✅ Printer ${printerIndex} (${printer.ip}): Print job sent successfully`);
              resolve({
                success: true,
                printerIndex: printerIndex,
                ip: printer.ip,
                port: printer.port,
                message: `Printer ${printerIndex} (${printer.ip}) printed successfully`
              });
            });
          } catch (printErr) {
            console.error(`❌ Printer ${printerIndex}: Print error:`, printErr.message);
            reject(new Error(`Print error on printer ${printerIndex}: ${printErr.message}`));
          }
        });
      } catch (error) {
        console.error(`❌ Printer ${printerIndex}: Connection error:`, error.message);
        reject(new Error(`Connection error on printer ${printerIndex}: ${error.message}`));
      }
    });
  }

  /**
   * Print to two specific IP addresses
   * @param {string} base64Data - Base64 encoded ESC/POS data
   * @param {string} ip1 - First printer IP address
   * @param {string} ip2 - Second printer IP address
   * @param {number} port1 - First printer port (default 9100)
   * @param {number} port2 - Second printer port (default 9100)
   */
  async printToTwoIPAddresses(base64Data, ip1, ip2, port1 = 9100, port2 = 9100) {
    if (!ip1 || !ip2) {
      throw new Error('Both IP addresses must be provided');
    }

    console.log(`\n📋 Multi-Printer Job Starting`);
    console.log(`   Printer 1: ${ip1}:${port1}`);
    console.log(`   Printer 2: ${ip2}:${port2}\n`);

    const printers = [
      { ip: ip1, port: port1, name: 'Printer 1' },
      { ip: ip2, port: port2, name: 'Printer 2' }
    ];

    return this.printToMultiplePrinters(base64Data, printers);
  }

  /**
   * Get list of configured printers from multiPrinterConfig
   */
  getConfiguredPrinters() {
    const printers = [];
    
    if (this.multiPrinterConfig.printer1 && this.multiPrinterConfig.printer1.ip) {
      printers.push({
        ip: this.multiPrinterConfig.printer1.ip,
        port: this.multiPrinterConfig.printer1.port || 9100,
        name: 'Printer 1'
      });
    }
    
    if (this.multiPrinterConfig.printer2 && this.multiPrinterConfig.printer2.ip) {
      printers.push({
        ip: this.multiPrinterConfig.printer2.ip,
        port: this.multiPrinterConfig.printer2.port || 9100,
        name: 'Printer 2'
      });
    }

    return printers;
  }

  /**
   * Summarize results from multi-printer operations
   */
  summarizeMultiPrinterResults(results) {
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    const summary = {
      success: failed.length === 0,
      totalPrinters: results.length,
      successCount: successful.length,
      failureCount: failed.length,
      results: results,
      message: this.generateMultiPrinterMessage(successful, failed),
      timestamp: new Date().toISOString()
    };

    console.log(`\n📊 Multi-Printer Job Summary:`);
    console.log(`   Total: ${summary.totalPrinters}`);
    console.log(`   Success: ${summary.successCount}`);
    console.log(`   Failed: ${summary.failureCount}`);
    console.log(`   ${summary.message}\n`);

    return summary;
  }

  /**
   * Generate summary message
   */
  generateMultiPrinterMessage(successful, failed) {
    if (failed.length === 0) {
      return `✅ All printers printed successfully`;
    } else if (successful.length > 0) {
      const successIPs = successful.map(r => r.ip).join(', ');
      const failedIPs = failed.map(r => r.ip).join(', ');
      return `⚠️  Partial success - Success: [${successIPs}], Failed: [${failedIPs}]`;
    } else {
      const failedIPs = failed.map(r => r.ip).join(', ');
      return `❌ All printers failed - [${failedIPs}]`;
    }
  }

  /**
   * Print with sequential execution (one after another)
   * Useful for slow network or to prevent congestion
   */
  async printToMultiplePrintersSequential(base64Data, printerList = null) {
    if (!base64Data) {
      throw new Error('No data provided for printing');
    }

    const printers = printerList || this.getConfiguredPrinters();
    
    if (printers.length === 0) {
      throw new Error('No printers configured');
    }

    console.log(`📤 Sequential printing to ${printers.length} printer(s)...`);
    
    const results = [];

    for (let i = 0; i < printers.length; i++) {
      const printer = printers[i];
      try {
        console.log(`\n⏳ Processing printer ${i + 1}/${printers.length}...`);
        const result = await this.printToSingleNetworkPrinter(base64Data, printer, i + 1);
        results.push(result);
        
        // Delay between prints
        if (i < printers.length - 1) {
          console.log('⏸️  Waiting 500ms before next printer...');
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      } catch (error) {
        results.push({
          success: false,
          printerIndex: i + 1,
          ip: printer.ip,
          port: printer.port,
          error: error.message
        });
      }
    }

    return this.summarizeMultiPrinterResults(results);
  }

  /**
   * Auto-detect and get printer device
   */
  async getDevice() {
    const type = this.config.printerType.toLowerCase();

    try {
      if (type === 'usb') {
        console.log('🔍 Detecting USB printer...');
        const devices = USB.findPrinter();
        
        if (devices && devices.length > 0) {
          console.log(`✅ Found ${devices.length} USB printer(s)`);
          const device = devices[0];
          console.log(`📌 Using USB printer: VID=${device.deviceDescriptor.idVendor}, PID=${device.deviceDescriptor.idProduct}`);
          return new USB(device.deviceDescriptor.idVendor, device.deviceDescriptor.idProduct);
        } else {
          throw new Error('No USB printer found');
        }
      } else if (type === 'network' || type === 'lan') {
        console.log(`🔍 Connecting to network printer at ${this.config.printerIP}:${this.config.printerPort}...`);
        const device = new Network(this.config.printerIP, this.config.printerPort);
        console.log('✅ Network printer device created');
        return device;
      } else {
        throw new Error(`Unknown printer type: ${type}`);
      }
    } catch (error) {
      console.error('❌ Printer detection failed:', error.message);
      throw error;
    }
  }

  /**
   * Print ESC/POS data using escpos library
   */
  async printWithEscpos(base64Data) {
    try {
      const device = await this.getDevice();
      const buffer = Buffer.from(base64Data, 'base64');

      return new Promise((resolve, reject) => {
        device.open((err) => {
          if (err) {
            console.error('❌ Failed to open device:', err);
            return reject(err);
          }

          try {
            const printerInstance = new escpos.Printer(device);
            
            // Send raw ESC/POS buffer
            printerInstance.raw(buffer);
            
            // Close the printer connection
            printerInstance.close(() => {
              console.log('✅ Print job sent successfully via escpos');
              resolve({ success: true, method: 'escpos', type: this.config.printerType });
            });
          } catch (printErr) {
            console.error('❌ Print error:', printErr);
            reject(printErr);
          }
        });
      });
    } catch (error) {
      console.error('❌ escpos printing failed:', error.message);
      throw error;
    }
  }

  /**
   * Fallback: Print using Windows printing (if available)
   */
  async printWithFallback(base64Data) {
    if (process.platform !== 'win32') {
      throw new Error('Windows printer fallback only available on Windows');
    }

    try {
      console.log('🔄 Using Windows printer fallback...');
      const buffer = Buffer.from(base64Data, 'base64');
      return await this.windowsPrinter.print(buffer, this.config.printerName);
    } catch (error) {
      console.error('❌ Windows printer fallback failed:', error.message);
      throw error;
    }
  }

  /**
   * Print directly to Windows printer (default method)
   */
  async printWithWindows(base64Data) {
    if (process.platform !== 'win32') {
      throw new Error('Windows printing only available on Windows');
    }

    console.log('🖨️  Using Windows printer...');
    const buffer = Buffer.from(base64Data, 'base64');
    return await this.windowsPrinter.print(buffer, this.config.printerName);
  }

  /**
   * Main print method with automatic fallback
   */
  async print(base64Data) {
    if (!base64Data) {
      throw new Error('No data provided for printing');
    }

    const type = this.config.printerType.toLowerCase();

    // Route to appropriate printing method
    try {
      if (type === 'windows') {
        return await this.printWithWindows(base64Data);
      } else if (type === 'usb') {
        return await this.printWithEscpos(base64Data);
      } else if (type === 'network' || type === 'lan') {
        return await this.printWithEscpos(base64Data);
      } else {
        throw new Error(`Unknown printer type: ${type}`);
      }
    } catch (primaryError) {
      console.log('⚠️  Primary method failed, trying fallback...');
      
      // Try Windows printer as fallback
      if (type !== 'windows' && process.platform === 'win32') {
        try {
          return await this.printWithWindows(base64Data);
        } catch (fallbackError) {
          console.error('❌ All printing methods failed');
          throw new Error(`Primary: ${primaryError.message}, Fallback: ${fallbackError.message}`);
        }
      }
      
      throw primaryError;
    }
  }

  /**
   * List available printers
   */
  listPrinters() {
    const result = {
      system: [],
      usb: [],
      config: {
        type: this.config.printerType,
        ip: this.config.printerIP,
        port: this.config.printerPort
      }
    };

    // List Windows system printers
    try {
      if (process.platform === 'win32') {
        const output = execSync('powershell -Command "Get-Printer | Select-Object Name, DriverName, PortName, PrinterStatus | ConvertTo-Json"', {
          encoding: 'utf8',
          timeout: 5000
        });
        
        const printers = JSON.parse(output);
        const printerArray = Array.isArray(printers) ? printers : [printers];
        
        result.system = printerArray.map(p => ({
          name: p.Name,
          driver: p.DriverName,
          port: p.PortName,
          status: p.PrinterStatus
        }));
      } else {
        // Linux/Unix
        try {
          const output = execSync('lpstat -p -d', { encoding: 'utf8', timeout: 5000 });
          const lines = output.split('\n').filter(l => l.startsWith('printer'));
          result.system = lines.map(line => {
            const match = line.match(/printer\s+(\S+)/);
            return match ? { name: match[1], status: line.includes('enabled') ? 'enabled' : 'unknown' } : null;
          }).filter(Boolean);
        } catch (err) {
          console.warn('Could not list Linux printers:', err.message);
        }
      }
    } catch (error) {
      console.error('❌ Error listing system printers:', error.message);
      result.systemError = error.message;
    }

    // List USB ESC/POS printers
    try {
      const devices = USB.findPrinter();
      if (devices && devices.length > 0) {
        result.usb = devices.map((device, index) => ({
          index,
          vendorId: device.deviceDescriptor.idVendor,
          productId: device.deviceDescriptor.idProduct,
          manufacturer: device.manufacturer || 'Unknown',
          product: device.product || 'Unknown'
        }));
      }
    } catch (error) {
      console.error('❌ Error listing USB printers:', error.message);
      result.usbError = error.message;
    }

    return result;
  }
}

module.exports = PrinterManager;
