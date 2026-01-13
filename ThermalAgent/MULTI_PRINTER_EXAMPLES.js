/**
 * Multi-Printer Usage Examples
 * How to use the PrinterManager with two or more network printers
 */

const PrinterManager = require('./printer');

// ============================================
// EXAMPLE 1: Initialize with two IP addresses
// ============================================

const printer = new PrinterManager({
  printerType: 'network',
  // Multi-printer configuration
  printer1IP: '192.168.1.216',
  printer1Port: 9100,
  printer2IP: '192.168.1.217',
  printer2Port: 9100
});

// Or using environment variables:
// PRINTER_1_IP=192.168.1.216
// PRINTER_1_PORT=9100
// PRINTER_2_IP=192.168.1.217
// PRINTER_2_PORT=9100

// ============================================
// EXAMPLE 2: Print to two IPs simultaneously
// ============================================

async function example2_PrintSimultaneously() {
  try {
    const escposData = Buffer.from([
      0x1b, 0x40,           // Initialize
      0x1b, 0x61, 0x01,     // Center align
      0x1d, 0x21, 0x11,     // Large font
    ]);

    const result = await printer.printToTwoIPAddresses(
      escposData.toString('base64'),
      '192.168.1.216',  // Kitchen Printer
      '192.168.1.217',  // Cashier Printer
      9100,             // Port for printer 1
      9100              // Port for printer 2
    );

    console.log('Result:', result);
    /*
    Output:
    {
      success: true/false,
      totalPrinters: 2,
      successCount: 2,
      failureCount: 0,
      results: [
        { success: true, printerIndex: 1, ip: '192.168.1.216', ... },
        { success: true, printerIndex: 2, ip: '192.168.1.217', ... }
      ],
      message: '✅ All printers printed successfully'
    }
    */
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// ============================================
// EXAMPLE 3: Print to configured printers
// ============================================

async function example3_PrintToConfigured() {
  try {
    const escposData = Buffer.from('...');
    
    // Uses printer1IP and printer2IP from constructor config
    const result = await printer.printToMultiplePrinters(
      escposData.toString('base64')
    );

    console.log('Success:', result.success);
    console.log('Message:', result.message);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// ============================================
// EXAMPLE 4: Sequential printing (one by one)
// ============================================

async function example4_SequentialPrinting() {
  try {
    const escposData = Buffer.from('...');
    
    // Print to first, then second (prevents network congestion)
    const result = await printer.printToMultiplePrintersSequential(
      escposData.toString('base64')
    );

    console.log('Sequential Results:', result);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// ============================================
// EXAMPLE 5: Print to custom printer list
// ============================================

async function example5_CustomPrinterList() {
  try {
    const escposData = Buffer.from('...');
    
    const customPrinters = [
      { ip: '192.168.1.216', port: 9100 },
      { ip: '192.168.1.217', port: 9100 }
    ];

    const result = await printer.printToMultiplePrinters(
      escposData.toString('base64'),
      customPrinters
    );

    console.log('Result:', result);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// ============================================
// EXAMPLE 6: Error handling - Partial failures
// ============================================

async function example6_ErrorHandling() {
  try {
    const escposData = Buffer.from('...');
    
    const result = await printer.printToTwoIPAddresses(
      escposData.toString('base64'),
      '192.168.1.216',  // Kitchen Printer
      '192.168.1.217'   // Cashier Printer
    );

    if (result.success) {
      console.log('✅ All printers printed');
    } else if (result.successCount > 0) {
      console.log(`⚠️  Partial success: ${result.successCount}/${result.totalPrinters}`);
      
      // Log failed printers
      result.results.forEach(r => {
        if (!r.success) {
          console.log(`   ❌ ${r.ip} - ${r.error}`);
        }
      });
    } else {
      console.log('❌ All printers failed');
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// ============================================
// EXAMPLE 7: Real-world KOT printing
// ============================================

async function example7_PrintKOT() {
  try {
    // Create ESC/POS formatted KOT
    const kotContent = `
    ========== KITCHEN ORDER TICKET ==========
    Order #: 1001
    Table: 5
    ==========================================
    Biryani              x2
    Naan                 x3
    Samosa               x1
    ==========================================
    `;

    const printerWithMulti = new PrinterManager({
      printerType: 'network',
      printer1IP: '192.168.1.216',  // Kitchen Printer
      printer1Port: 9100,
      printer2IP: '192.168.1.217',  // Cashier Printer
      printer2Port: 9100
    });

    // Convert text to ESC/POS and send to both printers
    const escposBuffer = Buffer.from(kotContent);
    
    const result = await printerWithMulti.printToMultiplePrinters(
      escposBuffer.toString('base64')
    );

    if (result.success) {
      console.log('✅ KOT sent to all printers');
    } else {
      console.log(`⚠️  KOT partially sent: ${result.successCount}/${result.totalPrinters}`);
    }
  } catch (error) {
    console.error('Error printing KOT:', error.message);
  }
}

// ============================================
// EXAMPLE 8: Get configured printers info
// ============================================

function example8_GetPrinterInfo() {
  const configured = printer.getConfiguredPrinters();
  console.log('Configured Printers:', configured);
  /*
  Output:
  Configured Printers: [
    { ip: '192.168.1.216', port: 9100, name: 'Printer 1' },
    { ip: '192.168.1.217', port: 9100, name: 'Printer 2' }
  ]
  */
}

// ============================================
// EXAMPLE 9: Express.js API endpoint
// ============================================

const express = require('express');
const app = express();
app.use(express.json());

const printerManager = new PrinterManager({
  printerType: 'network',
  printer1IP: process.env.PRINTER_1_IP || '192.168.1.216',
  printer1Port: process.env.PRINTER_1_PORT || 9100,
  printer2IP: process.env.PRINTER_2_IP || '192.168.1.217',
  printer2Port: process.env.PRINTER_2_PORT || 9100
});

// Print to both printers
app.post('/api/print/kot', async (req, res) => {
  try {
    const { escposData, sequential = false } = req.body;

    if (!escposData) {
      return res.status(400).json({ error: 'ESCpos data required' });
    }

    let result;
    if (sequential) {
      result = await printerManager.printToMultiplePrintersSequential(escposData);
    } else {
      result = await printerManager.printToMultiplePrinters(escposData);
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Print to specific IPs
app.post('/api/print/custom', async (req, res) => {
  try {
    const { escposData, ip1, ip2, port1 = 9100, port2 = 9100 } = req.body;

    if (!escposData || !ip1 || !ip2) {
      return res.status(400).json({ error: 'ESCpos data and both IPs required' });
    }

    const result = await printerManager.printToTwoIPAddresses(
      escposData,
      ip1,
      ip2,
      port1,
      port2
    );

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get printer status
app.get('/api/printers/status', (req, res) => {
  const printers = printerManager.getConfiguredPrinters();
  res.json({
    configured: printers.length > 0,
    printers: printers
  });
});

// ============================================
// EXAMPLE 10: Client-side API call
// ============================================

async function example10_ClientSideCall() {
  // Send KOT to two printers
  const response = await fetch('/api/print/kot', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      escposData: Buffer.from('...').toString('base64'),
      sequential: false  // Simultaneous printing
    })
  });

  const result = await response.json();
  console.log('Print Result:', result);
}

// ============================================
// Configuration via Environment Variables
// ============================================

/*
Add to .env file:

PRINTER_TYPE=network

# Printer 1 Configuration (Kitchen)
PRINTER_1_IP=192.168.1.216
PRINTER_1_PORT=9100

# Printer 2 Configuration (Cashier)
PRINTER_2_IP=192.168.1.217
PRINTER_2_PORT=9100

Then initialize:
const printer = new PrinterManager({
  printerType: process.env.PRINTER_TYPE,
  printer1IP: process.env.PRINTER_1_IP,
  printer1Port: parseInt(process.env.PRINTER_1_PORT),
  printer2IP: process.env.PRINTER_2_IP,
  printer2Port: parseInt(process.env.PRINTER_2_PORT)
});
*/

module.exports = {
  example2_PrintSimultaneously,
  example3_PrintToConfigured,
  example4_SequentialPrinting,
  example5_CustomPrinterList,
  example6_ErrorHandling,
  example7_PrintKOT,
  example8_GetPrinterInfo,
  example10_ClientSideCall
};
