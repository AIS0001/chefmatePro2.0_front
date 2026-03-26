const express = require('express');
const cors = require('cors');
const net = require('net');
const app = express();
const PORT = 7001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Network printer configuration
const PRINTERS = [
  {
    name: 'Kitchen',
    ip: '192.168.1.217',
    port: 9100
  },
  {
    name: 'Cashier',
    ip: '192.168.1.216',
    port: 9100
  }
];

/**
 * Send raw ESC/POS data directly to network printer
 */
async function sendRawDataToPrinter(printerIp, printerPort, data) {
  return new Promise((resolve, reject) => {
    const client = new net.Socket();
    let timeout;

    // Set connection timeout
    timeout = setTimeout(() => {
      client.destroy();
      reject(new Error(`Connection timeout to ${printerIp}:${printerPort}`));
    }, 5000);

    client.connect(printerPort, printerIp, () => {
      clearTimeout(timeout);
      console.log(`✅ Connected to printer ${printerIp}:${printerPort}`);
      
      // Convert base64 to buffer if needed
      let buffer;
      if (typeof data === 'string') {
        try {
          buffer = Buffer.from(data, 'base64');
        } catch (e) {
          buffer = Buffer.from(data);
        }
      } else {
        buffer = data;
      }

      client.write(buffer, (err) => {
        if (err) {
          client.destroy();
          reject(err);
        }
      });
    });

    client.on('data', (response) => {
      console.log(`📥 Printer response: ${response.length} bytes`);
    });

    client.on('close', () => {
      clearTimeout(timeout);
      console.log(`🔌 Connection closed to ${printerIp}:${printerPort}`);
      resolve(`Printed successfully to ${printerIp}:${printerPort}`);
    });

    client.on('error', (err) => {
      clearTimeout(timeout);
      console.error(`❌ Printer error ${printerIp}:${printerPort}:`, err.message);
      reject(err);
    });

    // Close connection after sending
    setTimeout(() => {
      client.end();
    }, 1000);
  });
}

/**
 * POST /print - Print to specific or primary printer
 */
app.post('/print', async (req, res) => {
  try {
    const { data, printerIndex = 0 } = req.body;

    if (!data) {
      return res.status(400).json({
        success: false,
        error: 'Missing print data'
      });
    }

    console.log('=== SINGLE PRINT REQUEST ===');
    console.log(`Data length: ${data.length} chars`);
    console.log(`Printer Index: ${printerIndex}`);

    const printer = PRINTERS[printerIndex] || PRINTERS[0]; // Use specified printer or first
    console.log(`Using printer: ${printer.name} (${printer.ip}:${printer.port})`);
    
    try {
      const result = await sendRawDataToPrinter(printer.ip, printer.port, data);
      console.log(`✅ ${result}`);

      res.json({
        success: true,
        message: 'Print sent successfully',
        printer: printer.name
      });
    } catch (error) {
      console.error(`❌ Print failed:`, error.message);
      res.status(500).json({
        success: false,
        error: 'Print failed',
        details: error.message
      });
    }
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
});

/**
 * POST /print-multi - Print to multiple printers
 */
app.post('/print-multi', async (req, res) => {
  try {
    const { data, sequential = false } = req.body;

    if (!data) {
      return res.status(400).json({
        success: false,
        error: 'Missing print data'
      });
    }

    console.log('=== MULTI-PRINTER PRINT REQUEST ===');
    console.log(`Data length: ${data.length} chars`);
    console.log(`Mode: ${sequential ? 'Sequential' : 'Simultaneous'}`);

    const results = [];

    if (sequential) {
      // Print to each printer one by one
      for (const printer of PRINTERS) {
        try {
          const result = await sendRawDataToPrinter(printer.ip, printer.port, data);
          results.push({
            printer: printer.name,
            ip: printer.ip,
            port: printer.port,
            success: true,
            message: result
          });
          console.log(`✅ ${printer.name} - Success`);
        } catch (error) {
          results.push({
            printer: printer.name,
            ip: printer.ip,
            port: printer.port,
            success: false,
            error: error.message
          });
          console.log(`❌ ${printer.name} - Failed: ${error.message}`);
        }
      }
    } else {
      // Print to all printers simultaneously
      const printPromises = PRINTERS.map(async (printer) => {
        try {
          const result = await sendRawDataToPrinter(printer.ip, printer.port, data);
          return {
            printer: printer.name,
            ip: printer.ip,
            port: printer.port,
            success: true,
            message: result
          };
        } catch (error) {
          return {
            printer: printer.name,
            ip: printer.ip,
            port: printer.port,
            success: false,
            error: error.message
          };
        }
      });

      const settled = await Promise.allSettled(printPromises);
      results.push(...settled.map(r => r.status === 'fulfilled' ? r.value : r.reason));
    }

    const successCount = results.filter(r => r.success).length;
    const totalPrinters = results.length;

    console.log('=== MULTI-PRINTER RESULTS ===');
    console.log(`Success: ${successCount}/${totalPrinters}`);

    res.json({
      success: successCount > 0,
      message: `Printed to ${successCount}/${totalPrinters} printer(s)`,
      results: results,
      successCount: successCount,
      totalPrinters: totalPrinters
    });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
});

/**
 * GET /printers - List configured printers
 */
app.get('/printers', (req, res) => {
  res.json({
    success: true,
    printers: PRINTERS,
    count: PRINTERS.length
  });
});

/**
 * POST /test-print - Send test print
 */
app.post('/test-print', async (req, res) => {
  try {
    const { printerIndex = 0 } = req.body;

    if (printerIndex >= PRINTERS.length) {
      return res.status(400).json({
        success: false,
        error: 'Invalid printer index'
      });
    }

    const printer = PRINTERS[printerIndex];

    // Simple ESC/POS test receipt
    const escpos = Buffer.from([
      0x1B, 0x40,        // Initialize
      0x1B, 0x61, 0x01,  // Center align
      ...Buffer.from('*** TEST PRINT ***\n'),
      0x1B, 0x61, 0x00,  // Left align
      ...Buffer.from(`Printer: ${printer.name}\n`),
      ...Buffer.from(`IP: ${printer.ip}:${printer.port}\n`),
      ...Buffer.from(`Time: ${new Date().toLocaleString()}\n`),
      ...Buffer.from('\n\n\n\n\n\n'),  // Extra padding at bottom
      0x1D, 0x56, 0x42, 0x00  // Cut paper (full cut)
    ]);

    const base64Data = escpos.toString('base64');

    try {
      const result = await sendRawDataToPrinter(printer.ip, printer.port, base64Data);
      res.json({
        success: true,
        message: `Test print sent to ${printer.name}`,
        result: result
      });
    } catch (error) {
      res.json({
        success: false,
        error: `Test print failed for ${printer.name}`,
        details: error.message
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
});

/**
 * GET /health - Health check
 */
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Print server is running',
    timestamp: new Date().toISOString(),
    printers: PRINTERS
  });
});

/**
 * GET / - Root endpoint
 */
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'ChefMate ESC/POS Print Server',
    version: '3.0 - Network RAW Printing',
    timestamp: new Date().toISOString(),
    printers: PRINTERS,
    endpoints: [
      'POST /print - Print ESC/POS data to primary printer',
      'POST /print-multi - Print ESC/POS data to multiple printers',
      'GET /printers - List configured printers',
      'POST /test-print - Send test print',
      'GET /health - Health check'
    ]
  });
});

app.listen(PORT, () => {
  console.log(`🖨️  ESC/POS Print Server running on http://localhost:${PORT}`);
  console.log(`🔧 Configured ${PRINTERS.length} network printer(s):`);
  PRINTERS.forEach(p => {
    console.log(`   - ${p.name}: ${p.ip}:${p.port}`);
  });
  console.log('\n📡 Available endpoints:');
  console.log('  POST /print - Print to primary printer');
  console.log('  POST /print-multi - Print to multiple printers');
  console.log('  GET /printers - List configured printers');
  console.log('  POST /test-print - Send test print');
  console.log('  GET /health - Health check\n');
});
