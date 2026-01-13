require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const PrinterManager = require('./printer');

const app = express();
const PORT = process.env.PORT || 5001;

// Setup logging to file for service debugging
const logFile = path.join(process.cwd(), 'service.log');
const originalLog = console.log;
const originalError = console.error;

console.log = function(...args) {
  const timestamp = new Date().toISOString();
  const message = `[${timestamp}] ${args.join(' ')}\n`;
  fs.appendFileSync(logFile, message, 'utf8');
  originalLog.apply(console, args);
};

console.error = function(...args) {
  const timestamp = new Date().toISOString();
  const message = `[${timestamp}] ERROR: ${args.join(' ')}\n`;
  fs.appendFileSync(logFile, message, 'utf8');
  originalError.apply(console, args);
};

console.log('🚀 Service starting...');
console.log('Working directory:', process.cwd());
console.log('Node version:', process.version);

// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Initialize printer manager
let printerManager;
try {
  printerManager = new PrinterManager({
    printerType: process.env.PRINTER_TYPE || 'network',
    printerIP: process.env.PRINTER_IP || '192.168.1.123',
    printerPort: parseInt(process.env.PRINTER_PORT) || 9100,
    printerName: process.env.PRINTER_NAME || null,
    // Multi-printer configuration
    printer1IP: process.env.PRINTER_1_IP || null,
    printer1Port: parseInt(process.env.PRINTER_1_PORT) || 9100,
    printer2IP: process.env.PRINTER_2_IP || null,
    printer2Port: parseInt(process.env.PRINTER_2_PORT) || 9100,
    printer3IP: process.env.PRINTER_3_IP || null,
    printer3Port: parseInt(process.env.PRINTER_3_PORT) || 9100
  });
  console.log('✅ Printer manager initialized');
  
  // Log configured printers
  const configuredPrinters = printerManager.getConfiguredPrinters();
  if (configuredPrinters.length > 0) {
    console.log(`📋 Configured printers: ${configuredPrinters.length}`);
    configuredPrinters.forEach((p, i) => {
      console.log(`   ${i + 1}. ${p.ip}:${p.port}`);
    });
  }
} catch (error) {
  console.error('❌ Failed to initialize printer manager:', error.message);
  printerManager = null;
}

// Logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

/**
 * Health check endpoint
 */
app.get('/', (req, res) => {
  res.json({
    status: 'running',
    service: 'Thermal Printer Agent',
    version: '1.0.0',
    endpoints: {
      health: 'GET /',
      print: 'POST /print',
      printers: 'GET /printers'
    }
  });
});

/**
 * List available printers
 */
app.get('/printers', (req, res) => {
  try {
    if (!printerManager) {
      return res.status(500).json({
        success: false,
        error: 'Printer manager not initialized'
      });
    }
    const printerList = printerManager.listPrinters();
    res.json({
      success: true,
      ...printerList
    });
  } catch (error) {
    console.error('❌ Error listing printers:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Print endpoint
 * Accepts: { data: "<base64 escpos>" }
 */
app.post('/print', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { data } = req.body;

    // Validate input
    if (!data) {
      console.error('❌ No data provided in request');
      return res.status(400).json({
        success: false,
        error: 'Missing "data" field in request body',
        usage: 'POST /print with JSON body: { "data": "<base64 escpos>" }'
      });
    }

    // Validate base64
    if (!isValidBase64(data)) {
      console.error('❌ Invalid base64 data');
      return res.status(400).json({
        success: false,
        error: 'Invalid base64 data provided'
      });
    }

    console.log(`📄 Received print job (${data.length} chars base64)`);

    if (!printerManager) {
      throw new Error('Printer manager not initialized');
    }

    // Print the data
    const result = await printerManager.print(data);
    const duration = Date.now() - startTime;

    console.log(`✅ Print completed in ${duration}ms`);

    res.json({
      success: true,
      message: 'Print job sent successfully',
      duration: `${duration}ms`,
      ...result
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ Print failed after ${duration}ms:`, error.message);
    
    res.status(500).json({
      success: false,
      error: error.message,
      duration: `${duration}ms`
    });
  }
});

/**
 * Multi-Printer endpoint - Print to configured printers simultaneously
 */
app.post('/print-multi', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { data, sequential = false } = req.body;

    if (!data) {
      return res.status(400).json({
        success: false,
        error: 'Missing "data" field in request body'
      });
    }

    if (!isValidBase64(data)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid base64 data provided'
      });
    }

    if (!printerManager) {
      throw new Error('Printer manager not initialized');
    }

    console.log(`📄 Received multi-printer job (${data.length} chars base64)`);
    console.log(`⚙️  Mode: ${sequential ? 'sequential' : 'simultaneous'}`);

    let result;
    if (sequential) {
      result = await printerManager.printToMultiplePrintersSequential(data);
    } else {
      result = await printerManager.printToMultiplePrinters(data);
    }

    const duration = Date.now() - startTime;
    console.log(`✅ Multi-print completed in ${duration}ms`);

    res.json({
      success: result.success,
      duration: `${duration}ms`,
      ...result
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ Multi-print failed after ${duration}ms:`, error.message);
    
    res.status(500).json({
      success: false,
      error: error.message,
      duration: `${duration}ms`
    });
  }
});

/**
 * Print to two specific IP addresses
 */
app.post('/print-two-ip', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { data, ip1, ip2, port1 = 9100, port2 = 9100 } = req.body;

    if (!data || !ip1 || !ip2) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: data, ip1, ip2'
      });
    }

    if (!isValidBase64(data)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid base64 data provided'
      });
    }

    if (!printerManager) {
      throw new Error('Printer manager not initialized');
    }

    console.log(`📄 Print to two IPs: ${ip1}:${port1} and ${ip2}:${port2}`);

    const result = await printerManager.printToTwoIPAddresses(
      data,
      ip1,
      ip2,
      port1,
      port2
    );

    const duration = Date.now() - startTime;

    res.json({
      success: result.success,
      duration: `${duration}ms`,
      ...result
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ Two-IP print failed after ${duration}ms:`, error.message);
    
    res.status(500).json({
      success: false,
      error: error.message,
      duration: `${duration}ms`
    });
  }
});

/**
 * Get printer configuration status
 */
app.get('/status', (req, res) => {
  try {
    const configured = printerManager ? printerManager.getConfiguredPrinters() : [];
    
    res.json({
      success: true,
      printerManagerInitialized: !!printerManager,
      printerType: process.env.PRINTER_TYPE || 'network',
      configuredPrinters: configured.length,
      printers: configured,
      environment: {
        printer1: {
          ip: process.env.PRINTER_1_IP || 'not configured',
          port: process.env.PRINTER_1_PORT || 9100
        },
        printer2: {
          ip: process.env.PRINTER_2_IP || 'not configured',
          port: process.env.PRINTER_2_PORT || 9100
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Validate base64 string
 */
function isValidBase64(str) {
  if (!str || typeof str !== 'string') return false;
  
  try {
    return Buffer.from(str, 'base64').toString('base64') === str;
  } catch (err) {
    return false;
  }
}

/**
 * Error handler
 */
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: err.message
  });
});

/**
 * Start server
 */
app.listen(PORT, () => {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🖨️  THERMAL PRINTER AGENT SERVER');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🌐 http://localhost:${PORT}`);
  console.log(`📋 Printer Type: ${process.env.PRINTER_TYPE || 'usb'}`);
  if (process.env.PRINTER_TYPE === 'network') {
    console.log(`🌐 Primary Printer IP: ${process.env.PRINTER_IP || '192.168.1.80'}`);
  }
  
  const configured = printerManager ? printerManager.getConfiguredPrinters() : [];
  if (configured.length > 0) {
    console.log(`\n🔗 Configured Multi-Printers:`);
    configured.forEach((p, i) => {
      console.log(`   ${i + 1}. ${p.ip}:${p.port}`);
    });
  }
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📡 Endpoints:');
  console.log('   GET  /            - Health check');
  console.log('   GET  /printers    - List available printers');
  console.log('   GET  /status      - Get printer configuration status');
  console.log('   POST /print       - Print single (ESC/POS data)');
  console.log('   POST /print-multi - Print multi-printer (simultaneous/sequential)');
  console.log('   POST /print-two-ip- Print to two specific IP addresses');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('⚠️  SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\n⚠️  SIGINT received, shutting down gracefully...');
  process.exit(0);
});

// Handle uncaught exceptions to prevent service crashes
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  console.error('Stack:', error.stack);
  // Don't exit - keep service running
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit - keep service running
});
