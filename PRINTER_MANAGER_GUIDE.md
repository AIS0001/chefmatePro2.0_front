# Multi-Printer Management Guide

## Overview

The `PrinterManager` service provides a flexible way to manage multiple thermal printers in your ChefMate system. It handles:

- ✅ Sending commands to multiple printers simultaneously or sequentially
- ✅ Automatic retry logic with exponential backoff
- ✅ Error handling and fallback strategies
- ✅ Toast notifications for user feedback
- ✅ Print queue management
- ✅ Printer health checks

## Architecture

```
┌─────────────────────────────────────────┐
│         React Component                  │
└──────────────────┬──────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────┐
│      PrinterManager Service              │
│  (Multi-printer orchestration)           │
└──────────────────┬──────────────────────┘
                   │
        ┌──────────┼──────────┐
        ▼          ▼          ▼
    ┌────────┐ ┌────────┐ ┌────────┐
    │ Cashier│ │Kitchen │ │ Kiosk  │
    │Printer │ │Printer │ │Printer │
    └────────┘ └────────┘ └────────┘
        │          │          │
        └──────────┼──────────┘
                   ▼
      Print Server (Port 5000)
```

## Usage Examples

### 1. Initialize Printer Manager

```javascript
import printerManager from '../../services/printerManager';

// In your component useEffect or when loading settings:
useEffect(() => {
  const printerSettings = {
    cashier_printer_ip: '192.168.1.100',
    kitchen_printer_ip: '192.168.1.101',
    kiosk_printer_ip: '192.168.1.102',
  };
  
  printerManager.initializePrinters(printerSettings);
}, []);
```

### 2. Send KOT to Kitchen and Cashier (Simultaneous)

```javascript
// Send KOT to both kitchen and cashier at the same time
const kotData = {
  table: 'Table 5',
  items: [
    { item_name: 'Biryani', quantity: 2 },
    { item_name: 'Naan', quantity: 3 }
  ],
  orderNumber: 1001,
  total: 450
};

const result = await printerManager.printKOTToKitchenAndCashier(kotData, {
  sequential: false  // Send to both at same time
});

if (result.success) {
  console.log('✅ KOT sent to all printers');
} else if (result.successful > 0) {
  console.log(`⚠️ KOT sent to ${result.successful} printers`);
} else {
  console.log('❌ Failed to send KOT');
}
```

### 3. Send KOT to Kitchen and Cashier (Sequential)

```javascript
// Send to kitchen first, then cashier (useful to avoid network congestion)
const result = await printerManager.printKOTToKitchenAndCashier(kotData, {
  sequential: true,  // Send one after another
  stopOnError: false // Continue even if one fails
});
```

### 4. Send to Multiple Printers Simultaneously

```javascript
// Send custom command to specific printers
const printerTypes = ['kitchen', 'cashier', 'kiosk'];
const command = {
  table: 'Table 5',
  items: cartItems,
  orderNumber: 1001
};

const result = await printerManager.sendToMultiplePrinters(
  printerTypes,
  command,
  {
    stopOnFirstError: false,  // Don't stop if one fails
    showProgress: true,        // Show toast notification
    timeout: 30000            // 30 second timeout
  }
);
```

### 5. Send to Multiple Printers Sequentially

```javascript
// One by one with delays between prints
const result = await printerManager.sendToMultiplePrintersSequential(
  ['kitchen', 'cashier'],
  kotData,
  {
    stopOnFirstError: false,
    delay: 1000,  // 1 second between prints
    showProgress: true
  }
);
```

### 6. Send to Single Printer

```javascript
// Direct single printer command
const result = await printerManager.sendToPrinter(
  'kitchen',
  kotData,
  {
    retryAttempts: 3,
    showError: true,
    showSuccess: true
  }
);
```

### 7. Print Invoice to Cashier and Kiosk

```javascript
const invoiceData = {
  billId: 'INV-001',
  queueNumber: 'Table 5',
  items: cartItems,
  total: 450
};

const result = await printerManager.printInvoiceToCashierAndKiosk(
  invoiceData,
  { sequential: false }
);
```

### 8. Test Printer Connection

```javascript
// Test single printer
const isConnected = await printerManager.testPrinterConnection('kitchen');

// Test all configured printers
const results = await printerManager.testAllPrinters();
results.forEach(test => {
  console.log(`${test.printer}: ${test.status ? '✅ Connected' : '❌ Failed'}`);
});
```

### 9. Get Printer Status

```javascript
const status = printerManager.getPrinterStatus();
console.log(status);
// Output:
// {
//   cashier: { ip: '192.168.1.100', configured: true },
//   kitchen: { ip: '192.168.1.101', configured: true },
//   kiosk: { ip: '192.168.1.102', configured: true }
// }
```

### 10. Queue Print Jobs (Batch Processing)

```javascript
// Queue multiple print jobs
printerManager.queuePrintJob({
  type: 'kot',
  data: kotData1,
  sequential: false
});

printerManager.queuePrintJob({
  type: 'invoice',
  data: invoiceData1,
  sequential: false
});

// Process entire queue
await printerManager.processPrintQueue();
```

## Real-World Example: POS System

```javascript
const handlePlaceOrder = async () => {
  try {
    // 1. Save order to database
    const orderResponse = await axios.post('/api/orders', orderData);
    const orderId = orderResponse.data.id;
    
    // 2. Prepare KOT
    const kotData = {
      table: selectedTable,
      items: cart,
      orderNumber: orderId
    };
    
    // 3. Initialize printers from settings
    const settings = await fetchData('printersetting', null, 'id', {});
    if (settings && settings.length > 0) {
      printerManager.initializePrinters(settings[0]);
    }
    
    // 4. Send KOT to kitchen and cashier simultaneously
    const printResult = await printerManager.printKOTToKitchenAndCashier(kotData, {
      sequential: false  // Fast parallel printing
    });
    
    if (printResult.success) {
      toast.success('Order placed and KOT sent to all printers!');
    } else if (printResult.successful > 0) {
      toast.warning(`Order placed. KOT sent to ${printResult.successful} printer(s)`);
    } else {
      toast.error('Order saved but printer communication failed');
    }
    
    // Clear cart
    setCart([]);
    
  } catch (error) {
    toast.error('Error placing order: ' + error.message);
  }
};
```

## Error Handling Strategies

### Strategy 1: Fail Fast
```javascript
// Stop on first error
const result = await printerManager.sendToMultiplePrinters(
  ['kitchen', 'cashier'],
  kotData,
  { stopOnFirstError: true }
);
```

### Strategy 2: Partial Success
```javascript
// Continue even if some fail
const result = await printerManager.sendToMultiplePrinters(
  ['kitchen', 'cashier', 'kiosk'],
  kotData,
  { stopOnFirstError: false }
);

// Check which ones succeeded
console.log(`Sent to: ${result.successful}/${result.total}`);
result.results.forEach(r => {
  if (!r.success) {
    console.error(`${r.printer} failed: ${r.error}`);
  }
});
```

### Strategy 3: Retry with Fallback
```javascript
// Automatic retry (2 attempts by default)
const result = await printerManager.sendToPrinter(
  'kitchen',
  kotData,
  { retryAttempts: 3 }
);

// If all retries fail, manually retry with different settings
if (!result.success) {
  const fallbackResult = await printerManager.sendToPrinter(
    'kitchen',
    kotData,
    { retryAttempts: 1 }  // One more attempt
  );
}
```

## Configuration

To change default configuration:

```javascript
// In your app initialization
printerManager.config = {
  timeout: 10000,        // 10 second timeout
  retryAttempts: 3,      // Retry 3 times
  retryDelay: 1000,      // 1 second between retries
  printServerUrl: 'http://localhost:5000'
};
```

## Printer Types

- **cashier**: For bills and receipts (customer-facing)
- **kitchen**: For order tickets (kitchen staff)
- **kiosk**: For self-service terminals

## Response Format

All printer operations return a response object:

```javascript
{
  success: boolean,              // Overall success
  total: number,                 // Total printers targeted
  successful: number,            // Printers that succeeded
  failed: number,                // Printers that failed
  results: [
    {
      success: boolean,
      printer: string,           // 'kitchen', 'cashier', 'kiosk'
      data: object,              // Response from print server
      error: string              // Error message if failed
    }
  ],
  message: string                // Human-readable summary
}
```

## Print Server API

Your print server should support:

- `POST /print-kot` - Print KOT
- `POST /print-invoice` - Print invoice
- `POST /test-print` - Test printer connection
- `GET /health` - Health check
- `GET /printers` - List available printers

## Troubleshooting

### Problem: All printers fail
```javascript
// 1. Check if printers are initialized
console.log(printerManager.getPrinterStatus());

// 2. Test connection
const tests = await printerManager.testAllPrinters();

// 3. Check print server
fetch('http://localhost:5000/health')
  .then(r => r.json())
  .then(console.log);
```

### Problem: Partial failures
```javascript
// Check which specific printer failed
const result = await printerManager.printKOTToKitchenAndCashier(kotData);

result.results.forEach(r => {
  if (!r.success) {
    console.error(`${r.printer}: ${r.error}`);
  }
});
```

### Problem: Timeouts
```javascript
// Increase timeout
const result = await printerManager.sendToMultiplePrinters(
  printerTypes,
  data,
  { timeout: 60000 }  // 60 seconds
);
```

## Best Practices

1. **Always initialize printers** before using them
2. **Use sequential printing** for slow network connections
3. **Test connections** before going live
4. **Handle partial failures** gracefully
5. **Log errors** for debugging
6. **Use toast notifications** to inform users
7. **Implement fallback printers** for critical operations
8. **Queue print jobs** during high traffic periods
9. **Test retry logic** with network delays
10. **Monitor print queue** for stuck jobs

## Integration with Print Settings Page

```javascript
// In PrintSetting.jsx
import printerManager from '../../services/printerManager';

const handleSaveSettings = async (settings) => {
  // Save to database
  await saveSettings(settings);
  
  // Initialize in manager
  printerManager.initializePrinters(settings);
  
  // Test all printers
  const tests = await printerManager.testAllPrinters();
  
  // Show results to user
  showTestResults(tests);
};
```

## Performance Tips

- Use **simultaneous** printing when printers are on the same network
- Use **sequential** printing when printers are slow or network is congested
- Set appropriate **timeouts** based on printer speed
- Use **print queue** during peak hours
- Monitor **retry attempts** to find optimal values
