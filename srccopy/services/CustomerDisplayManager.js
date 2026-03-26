// Customer Display Manager - Enhanced for Electron
class CustomerDisplayManager {
  constructor() {
    this.customerWindow = null;
    this.isConnected = false;
    this.isElectronEnvironment = this.detectElectronEnvironment();
  }

  // Detect if running in Electron environment
  detectElectronEnvironment() {
    return (
      typeof window !== 'undefined' && 
      window.electronAPI !== undefined
    );
  }

  // Open customer display window
  openCustomerDisplay() {
    if (this.isElectronEnvironment) {
      return this.openElectronCustomerDisplay();
    } else {
      return this.openBrowserCustomerDisplay();
    }
  }

  // Open customer display in Electron environment
  openElectronCustomerDisplay() {
    try {
      // In Electron, the customer display is automatically handled by main process
      // We just need to check if it's available and refresh it
      if (window.electronAPI) {
        window.electronAPI.refreshCustomerDisplay().then((success) => {
          if (success) {
            this.isConnected = true;
            console.log('Electron customer display activated');
            this.sendWelcomeMessage();
          } else {
            console.log('No external display found for customer display');
            // Fallback to browser method
            this.openBrowserCustomerDisplay();
          }
        });
      }
    } catch (error) {
      console.error('Error opening Electron customer display:', error);
      // Fallback to browser method
      this.openBrowserCustomerDisplay();
    }
  }

  // Original browser-based customer display (fallback)
  openBrowserCustomerDisplay() {
    if (this.customerWindow && !this.customerWindow.closed) {
      this.customerWindow.focus();
      return;
    }

    // Calculate window position for second screen
    const screenWidth = window.screen.availWidth;
    const screenHeight = window.screen.availHeight;
    
    // Try to open on second monitor if available
    const leftPosition = screenWidth > 1920 ? screenWidth / 2 : 0;
    
    const windowFeatures = `
      width=${screenWidth > 1920 ? screenWidth / 2 : screenWidth},
      height=${screenHeight},
      left=${leftPosition},
      top=0,
      toolbar=no,
      menubar=no,
      scrollbars=no,
      resizable=yes,
      location=no,
      directories=no,
      status=no,
      fullscreen=yes
    `;

    this.customerWindow = window.open(
      '/customer-display',
      'CustomerDisplay',
      windowFeatures
    );

    if (this.customerWindow) {
      this.isConnected = true;
      
      // Handle window close
      this.customerWindow.addEventListener('beforeunload', () => {
        this.isConnected = false;
        this.customerWindow = null;
      });

      // Send initial data after window loads
      this.customerWindow.addEventListener('load', () => {
        this.sendWelcomeMessage();
      });
    }
  }

  // Open customer display specifically for sale system
  openSaleCustomerDisplay() {
    if (this.customerWindow && !this.customerWindow.closed) {
      this.customerWindow.focus();
      return;
    }

    // Auto-detect dual screen setup
    const screenWidth = window.screen.width;
    const screenHeight = window.screen.height;
    
    // Position on right half for dual monitors, or left half for single monitor
    const leftPosition = screenWidth > 1920 ? screenWidth / 2 : 0;
    
    const windowFeatures = `
      width=${screenWidth > 1920 ? screenWidth / 2 : screenWidth},
      height=${screenHeight},
      left=${leftPosition},
      top=0,
      toolbar=no,
      menubar=no,
      scrollbars=no,
      resizable=yes,
      location=no,
      directories=no,
      status=no,
      fullscreen=yes
    `;

    this.customerWindow = window.open(
      '/sale-customer-display',
      'SaleCustomerDisplay',
      windowFeatures
    );

    if (this.customerWindow) {
      this.isConnected = true;
      
      // Handle window close
      this.customerWindow.addEventListener('beforeunload', () => {
        this.isConnected = false;
        this.customerWindow = null;
      });

      // Send initial data after window loads
      this.customerWindow.addEventListener('load', () => {
        this.sendWelcomeMessage();
      });
    }
  }

  // Close customer display window
  closeCustomerDisplay() {
    if (this.isElectronEnvironment && window.electronAPI) {
      // In Electron, hide the customer display window
      window.electronAPI.toggleCustomerDisplay().then((isVisible) => {
        if (!isVisible) {
          this.isConnected = false;
          console.log('Electron customer display hidden');
        }
      });
    } else {
      // Browser fallback
      if (this.customerWindow && !this.customerWindow.closed) {
        this.customerWindow.close();
      }
      this.isConnected = false;
      this.customerWindow = null;
    }
  }

  // Send cart updates to customer display
  updateCart(cart, total) {
    if (this.isElectronEnvironment) {
      this.sendElectronEvent('cartUpdated', { cart, total });
    } else if (this.isConnected && this.customerWindow && !this.customerWindow.closed) {
      try {
        // Send cart data via custom event
        const event = new CustomEvent('cartUpdated', {
          detail: { cart, total }
        });
        this.customerWindow.dispatchEvent(event);
      } catch (error) {
        console.error('Error updating customer display:', error);
        this.isConnected = false;
      }
    }
  }

  // Send company info to customer display
  updateCompanyInfo(companyInfo) {
    if (this.isElectronEnvironment) {
      this.sendElectronEvent('companyInfoUpdated', companyInfo);
    } else if (this.isConnected && this.customerWindow && !this.customerWindow.closed) {
      try {
        const event = new CustomEvent('companyInfoUpdated', {
          detail: companyInfo
        });
        this.customerWindow.dispatchEvent(event);
      } catch (error) {
        console.error('Error updating company info:', error);
      }
    }
  }

  // Send welcome message
  sendWelcomeMessage() {
    if (this.isElectronEnvironment) {
      this.sendElectronEvent('welcomeCustomer', { message: 'Welcome to our store!' });
    } else if (this.isConnected && this.customerWindow && !this.customerWindow.closed) {
      try {
        const event = new CustomEvent('welcomeCustomer', {
          detail: { message: 'Welcome to our store!' }
        });
        this.customerWindow.dispatchEvent(event);
      } catch (error) {
        console.error('Error sending welcome message:', error);
      }
    }
  }

  // Enhanced method for sending events in Electron
  sendElectronEvent(eventType, data) {
    try {
      // Store the event data in localStorage for the customer display window to pick up
      const eventData = {
        type: eventType,
        data: data,
        timestamp: Date.now()
      };
      
      localStorage.setItem('customerDisplayEvent', JSON.stringify(eventData));
      
      // Trigger a storage event for cross-window communication
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'customerDisplayEvent',
        newValue: JSON.stringify(eventData)
      }));
      
      console.log(`Sent Electron event: ${eventType}`, data);
    } catch (error) {
      console.error('Error sending Electron event:', error);
    }
  }

  // Check if customer display is connected
  isDisplayConnected() {
    if (this.isElectronEnvironment) {
      // In Electron, customer display is always available if external monitor exists
      return this.isConnected;
    }
    return this.isConnected && this.customerWindow && !this.customerWindow.closed;
  }

  // Get display information (Electron only)
  async getDisplayInfo() {
    if (this.isElectronEnvironment && window.electronAPI) {
      try {
        const displays = await window.electronAPI.getDisplays();
        return displays;
      } catch (error) {
        console.error('Error getting display info:', error);
        return [];
      }
    }
    return [];
  }

  // Get environment type
  getEnvironmentType() {
    return this.isElectronEnvironment ? 'electron' : 'browser';
  }

  // Send transaction complete message
  sendTransactionComplete(billDetails) {
    if (this.isConnected && this.customerWindow && !this.customerWindow.closed) {
      try {
        const event = new CustomEvent('transactionComplete', {
          detail: billDetails
        });
        this.customerWindow.dispatchEvent(event);
      } catch (error) {
        console.error('Error sending transaction complete:', error);
      }
    }
  }

  // Send bill confirmation to customer display
  sendBillConfirmation(billSummary) {
    if (this.isConnected && this.customerWindow && !this.customerWindow.closed) {
      try {
        const event = new CustomEvent('billConfirmationUpdated', {
          detail: billSummary
        });
        this.customerWindow.dispatchEvent(event);
      } catch (error) {
        console.error('Error sending bill confirmation:', error);
      }
    }
  }

  // Send custom message to display
  sendCustomMessage(message, type = 'info') {
    if (this.isConnected && this.customerWindow && !this.customerWindow.closed) {
      try {
        const event = new CustomEvent('customMessage', {
          detail: { message, type }
        });
        this.customerWindow.dispatchEvent(event);
      } catch (error) {
        console.error('Error sending custom message:', error);
      }
    }
  }

  // Clear customer display and return to welcome screen
  clearCustomerDisplay() {
    if (this.isConnected && this.customerWindow && !this.customerWindow.closed) {
      try {
        const event = new CustomEvent('clearDisplay');
        this.customerWindow.dispatchEvent(event);
      } catch (error) {
        console.error('Error clearing customer display:', error);
      }
    }
  }
}

// Create singleton instance
const customerDisplayManager = new CustomerDisplayManager();

export default customerDisplayManager;
