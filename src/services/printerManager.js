/**
 * Printer Manager Service
 * Handles multi-printer operations with error handling and fallback strategies
 * Supports simultaneous or sequential printing to multiple printers
 */

import axios from 'axios';
import { toast } from 'react-toastify';

// Default print server configuration
const PRINT_SERVER_URL =
  process.env.REACT_APP_LOCAL_PRINT_AGENT_URL || 'http://127.0.0.1:7001';

class PrinterManager {
  constructor() {
    this.printers = {
      cashier: null,
      kitchen: null,
      kiosk: null,
    };
    this.printQueue = [];
    this.isProcessing = false;
    this.config = {
      timeout: 5000,
      retryAttempts: 2,
      retryDelay: 500,
      printServerUrl: PRINT_SERVER_URL,
    };
  }

  /**
   * Initialize printers from settings
   */
  async initializePrinters(printerSettings) {
    if (!printerSettings) {
      console.warn('No printer settings provided');
      return false;
    }

    this.printers = {
      cashier: printerSettings.cashier_printer_ip || null,
      kitchen: printerSettings.kitchen_printer_ip || null,
      kiosk: printerSettings.kiosk_printer_ip || null,
    };

    console.log('Printers initialized:', this.printers);
    return true;
  }

  /**
   * Send command to a single printer
   * @param {string} printerType - 'cashier', 'kitchen', or 'kiosk'
   * @param {string} command - The command/data to send
   * @param {object} options - Additional options
   */
  async sendToPrinter(printerType, command, options = {}) {
    const printerIp = this.printers[printerType];

    if (!printerIp) {
      console.error(`Printer ${printerType} not configured`);
      throw new Error(`Printer ${printerType} is not configured`);
    }

    const {
      retryAttempts = this.config.retryAttempts,
      showError = true,
      showSuccess = false,
    } = options;

    let lastError = null;

    for (let attempt = 1; attempt <= retryAttempts; attempt++) {
      try {
        console.log(
          `📤 Sending to ${printerType} (${printerIp}) - Attempt ${attempt}/${retryAttempts}`
        );

        const response = await axios.post(
          `${this.config.printServerUrl}/print-kot`,
          command,
          { timeout: this.config.timeout }
        );

        if (response.data.success) {
          console.log(
            `✅ ${printerType} printer success:`,
            response.data.message
          );
          if (showSuccess) {
            toast.success(`${printerType} printer: ${response.data.message}`);
          }
          return { success: true, printer: printerType, data: response.data };
        }
      } catch (error) {
        lastError = error;
        console.error(
          `❌ ${printerType} printer error (Attempt ${attempt}):`,
          error.message
        );

        if (attempt < retryAttempts) {
          console.log(
            `⏳ Retrying in ${this.config.retryDelay}ms...`
          );
          await this.delay(this.config.retryDelay);
        }
      }
    }

    if (showError) {
      toast.error(
        `Failed to send to ${printerType} printer after ${retryAttempts} attempts`
      );
    }

    return {
      success: false,
      printer: printerType,
      error: lastError?.message || 'Unknown error',
    };
  }

  /**
   * Send command to multiple printers simultaneously
   * @param {Array<string>} printerTypes - Array of printer types to send to
   * @param {string|object} command - The command/data to send
   * @param {object} options - Options like { stopOnFirstError: false, showProgress: true }
   */
  async sendToMultiplePrinters(printerTypes, command, options = {}) {
    const {
      stopOnFirstError = false,
      showProgress = true,
      timeout = 30000,
    } = options;

    const results = [];

    if (showProgress) {
      toast.info(
        `Sending to ${printerTypes.length} printer(s)...`
      );
    }

    // Send to all printers simultaneously
    const promises = printerTypes.map((printerType) =>
      this.sendToPrinter(printerType, command, {
        showError: false,
        showSuccess: false,
      })
        .then((result) => {
          results.push(result);
          return result;
        })
        .catch((error) => {
          results.push({ success: false, printer: printerType, error });
          if (stopOnFirstError) throw error;
        })
    );

    try {
      await Promise.race([
        Promise.allSettled(promises),
        this.timeoutPromise(timeout),
      ]);
    } catch (error) {
      console.error('Multi-printer send error:', error);
    }

    return this.summarizeResults(results, printerTypes);
  }

  /**
   * Send command to multiple printers sequentially
   * @param {Array<string>} printerTypes - Array of printer types
   * @param {string|object} command - The command/data to send
   * @param {object} options - Options
   */
  async sendToMultiplePrintersSequential(printerTypes, command, options = {}) {
    const { stopOnFirstError = false, delay = 500, showProgress = true } =
      options;

    const results = [];

    if (showProgress) {
      toast.info(
        `Sending to ${printerTypes.length} printer(s) sequentially...`
      );
    }

    for (let i = 0; i < printerTypes.length; i++) {
      const printerType = printerTypes[i];

      try {
        const result = await this.sendToPrinter(printerType, command, {
          showError: false,
          showSuccess: false,
        });
        results.push(result);

        if (!result.success && stopOnFirstError) {
          throw new Error(`Failed to send to ${printerType}`);
        }

        // Delay between prints
        if (i < printerTypes.length - 1) {
          await this.delay(delay);
        }
      } catch (error) {
        results.push({ success: false, printer: printerType, error });
        if (stopOnFirstError) throw error;
      }
    }

    return this.summarizeResults(results, printerTypes);
  }

  /**
   * Print KOT to Kitchen and Cashier
   * (Most common use case)
   */
  async printKOTToKitchenAndCashier(kotData, options = {}) {
    const { sequential = false, stopOnError = false } = options;

    const printerTypes = [];
    if (this.printers.kitchen) printerTypes.push('kitchen');
    if (this.printers.cashier) printerTypes.push('cashier');

    if (printerTypes.length === 0) {
      toast.error('No printers configured');
      return { success: false, message: 'No printers configured' };
    }

    if (sequential) {
      return this.sendToMultiplePrintersSequential(printerTypes, kotData, {
        stopOnFirstError: stopOnError,
        showProgress: true,
      });
    } else {
      return this.sendToMultiplePrinters(printerTypes, kotData, {
        stopOnFirstError: stopOnError,
        showProgress: true,
      });
    }
  }

  /**
   * Print Invoice to Cashier and Kiosk
   */
  async printInvoiceToCashierAndKiosk(invoiceData, options = {}) {
    const { sequential = false, stopOnError = false } = options;

    const printerTypes = [];
    if (this.printers.cashier) printerTypes.push('cashier');
    if (this.printers.kiosk) printerTypes.push('kiosk');

    if (printerTypes.length === 0) {
      toast.error('No invoice printers configured');
      return { success: false, message: 'No invoice printers configured' };
    }

    if (sequential) {
      return this.sendToMultiplePrintersSequential(printerTypes, invoiceData, {
        stopOnFirstError: stopOnError,
        showProgress: true,
      });
    } else {
      return this.sendToMultiplePrinters(printerTypes, invoiceData, {
        stopOnFirstError: stopOnError,
        showProgress: true,
      });
    }
  }

  /**
   * Test printer connection
   */
  async testPrinterConnection(printerType) {
    const printerIp = this.printers[printerType];

    if (!printerIp) {
      toast.error(`${printerType} printer not configured`);
      return false;
    }

    try {
      const response = await axios.post(
        `${this.config.printServerUrl}/test-print`,
        { printerName: printerType },
        { timeout: 5000 }
      );

      if (response.data.success) {
        toast.success(`✅ ${printerType} printer is connected!`);
        return true;
      } else {
        toast.error(`❌ ${printerType} printer test failed`);
        return false;
      }
    } catch (error) {
      toast.error(
        `Connection error: ${error.message}`
      );
      return false;
    }
  }

  /**
   * Test all configured printers
   */
  async testAllPrinters() {
    const tests = [];
    const printerTypes = Object.keys(this.printers).filter(
      (type) => this.printers[type]
    );

    for (const printerType of printerTypes) {
      tests.push(this.testPrinterConnection(printerType));
    }

    const results = await Promise.allSettled(tests);
    const summary = results.map((result, index) => ({
      printer: printerTypes[index],
      status: result.status === 'fulfilled' ? result.value : false,
    }));

    console.log('Printer test summary:', summary);
    return summary;
  }

  /**
   * Get printer status
   */
  getPrinterStatus() {
    return {
      cashier: {
        ip: this.printers.cashier,
        configured: !!this.printers.cashier,
      },
      kitchen: {
        ip: this.printers.kitchen,
        configured: !!this.printers.kitchen,
      },
      kiosk: {
        ip: this.printers.kiosk,
        configured: !!this.printers.kiosk,
      },
    };
  }

  /**
   * Queue a print job
   */
  queuePrintJob(job) {
    this.printQueue.push({
      ...job,
      timestamp: new Date(),
      id: Math.random().toString(36).substr(2, 9),
    });
  }

  /**
   * Process print queue
   */
  async processPrintQueue() {
    if (this.isProcessing || this.printQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.printQueue.length > 0) {
      const job = this.printQueue.shift();
      console.log(`Processing print job: ${job.id}`);

      try {
        if (job.type === 'kot') {
          await this.printKOTToKitchenAndCashier(job.data, {
            sequential: job.sequential || false,
          });
        } else if (job.type === 'invoice') {
          await this.printInvoiceToCashierAndKiosk(job.data, {
            sequential: job.sequential || false,
          });
        } else if (job.printerTypes) {
          if (job.sequential) {
            await this.sendToMultiplePrintersSequential(
              job.printerTypes,
              job.data
            );
          } else {
            await this.sendToMultiplePrinters(job.printerTypes, job.data);
          }
        }
      } catch (error) {
        console.error(`Error processing job ${job.id}:`, error);
      }

      await this.delay(500);
    }

    this.isProcessing = false;
  }

  // ==================== Utility Methods ====================

  /**
   * Delay execution
   */
  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Timeout promise
   */
  timeoutPromise(ms) {
    return new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Operation timeout')), ms)
    );
  }

  /**
   * Summarize results
   */
  summarizeResults(results, printerTypes) {
    const successful = results.filter((r) => r.success);
    const failed = results.filter((r) => !r.success);

    const summary = {
      success: failed.length === 0,
      total: results.length,
      successful: successful.length,
      failed: failed.length,
      results: results,
      message: this.generateResultMessage(successful, failed, printerTypes),
    };

    // Show appropriate toast message
    if (summary.success) {
      toast.success(
        `✅ Sent to ${successful.length}/${printerTypes.length} printers`
      );
    } else if (successful.length > 0) {
      toast.warning(
        `⚠️ Sent to ${successful.length}/${printerTypes.length} printers. ${failed.length} failed.`
      );
    } else {
      toast.error(`❌ Failed to send to all printers`);
    }

    console.log('Print operation summary:', summary);
    return summary;
  }

  /**
   * Generate result message
   */
  generateResultMessage(successful, failed, printerTypes) {
    if (failed.length === 0) {
      return `Successfully sent to all ${printerTypes.length} printers`;
    } else if (successful.length > 0) {
      return `Sent to ${successful.map((r) => r.printer).join(', ')}. Failed: ${failed.map((r) => r.printer).join(', ')}`;
    } else {
      return `Failed to send to all printers: ${failed.map((r) => r.printer).join(', ')}`;
    }
  }
}

// Export singleton instance
export default new PrinterManager();
