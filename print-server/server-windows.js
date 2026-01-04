const express = require('express');
const cors = require('cors');
const { execSync, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// Configuration for your thermal printers
const PRINTER_CONFIG = {
  kitchen: '3 CP-Q1UN PINGU', // Kitchen printer name
  cashier: '3 CP-Q1UN PINGU'  // Cashier printer name (same as kitchen for now)
};

// Ensure temp directory exists
const tempDir = path.join(__dirname, 'temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// Get list of available printers using Windows command
function getAvailablePrinters() {
  try {
    const output = execSync('wmic printer list brief', { encoding: 'utf8' });
    const lines = output.split('\n').filter(line => line.trim());
    const printers = [];
    
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].trim().split(/\s+/);
      if (parts.length > 0 && parts[0] !== 'Name') {
        const name = parts.slice(1).join(' ').trim();
        if (name) {
          printers.push({
            name: name,
            status: parts[0] || 'Unknown'
          });
        }
      }
    }
    
    return printers;
  } catch (error) {
    console.error('Error getting printers:', error);
    return [];
  }
}

// Format KOT for thermal printer (58mm or 80mm)
function formatKOT(orderData) {
  const { table, items, orderNumber, timestamp, total } = orderData;
  
  let kot = '';
  
  // Add some control characters for thermal printers
  kot += '\x1B\x40'; // Initialize printer
  kot += '\x1B\x61\x01'; // Center alignment
  
  kot += '================================\n';
  kot += '       KITCHEN ORDER TICKET     \n';
  kot += '================================\n';
  
  kot += '\x1B\x61\x00'; // Left alignment
  kot += `Order #: ${orderNumber}\n`;
  kot += `Table: ${table}\n`;
  kot += `Time: ${timestamp}\n`;
  kot += '--------------------------------\n';
  
  items.forEach(item => {
    const itemName = (item.item_name || item.name || 'Item').substring(0, 20).padEnd(20);
    const qty = `x${item.quantity}`.padStart(8);
    kot += `${itemName}${qty}\n`;
    
    // Add special instructions if any
    if (item.notes) {
      kot += `  Note: ${item.notes}\n`;
    }
  });
  
  kot += '--------------------------------\n';
  if (total) {
    kot += `Total: ${total}\n`;
    kot += '--------------------------------\n';
  }
  
  kot += '\x1B\x61\x01'; // Center alignment
  kot += '       ** KITCHEN COPY **       \n';
  kot += '================================\n';
  kot += '\x1B\x61\x00'; // Left alignment
  
  // Add form feed and cut commands for thermal printers
  kot += '\n\n\n'; // Extra lines for tear-off
  kot += '\x1D\x56\x42\x00'; // Partial cut command
  
  return kot;
}

// Format simple KOT for basic printing (fallback)
function formatSimpleKOT(orderData) {
  const { table, items, orderNumber, timestamp, total } = orderData;
  
  let kot = '';
  kot += '================================\r\n';
  kot += '       KITCHEN ORDER TICKET     \r\n';
  kot += '================================\r\n';
  kot += `Order #: ${orderNumber}\r\n`;
  kot += `Table: ${table}\r\n`;
  kot += `Time: ${timestamp}\r\n`;
  kot += '--------------------------------\r\n';
  
  items.forEach(item => {
    const itemName = (item.item_name || item.name || 'Item').substring(0, 20);
    kot += `${itemName} x${item.quantity}\r\n`;
    
    if (item.notes) {
      kot += `  Note: ${item.notes}\r\n`;
    }
  });
  
  kot += '--------------------------------\r\n';
  if (total) {
    kot += `Total: ${total}\r\n`;
    kot += '--------------------------------\r\n';
  }
  kot += '       ** KITCHEN COPY **       \r\n';
  kot += '================================\r\n';
  kot += '\r\n\r\n\r\n'; // Extra lines for tear-off
  
  return kot;
}

// Print to thermal printer using Windows commands only
async function printToThermalPrinter(printerName, content, useSimpleFormat = false) {
  return new Promise((resolve, reject) => {
    try {
      console.log(`Attempting to print to ${printerName}...`);
      console.log(`Content length: ${content.length} characters`);
      console.log(`Content preview: ${content.substring(0, 100)}...`);
      
      // Create temp file
      const tempFile = path.join(tempDir, `kot-${Date.now()}.txt`);
      
      // Write content with different encoding for thermal printers
      if (useSimpleFormat) {
        fs.writeFileSync(tempFile, content, 'ascii');
      } else {
        fs.writeFileSync(tempFile, content, 'utf8');
      }
      
      console.log(`Temp file created: ${tempFile}`);
      
      // Try Windows print command first
      const printCommand = `print /D:"${printerName}" "${tempFile}"`;
      console.log(`Executing: ${printCommand}`);
      
      exec(printCommand, (error, stdout, stderr) => {
        if (error) {
          console.log(`Windows print failed for ${printerName}: ${error.message}`);
          console.log(`Trying PowerShell method...`);
          
          // If Windows print fails, try PowerShell method
          const psCommand = `powershell "Get-Content '${tempFile}' | Out-Printer -Name '${printerName}'"`;
          console.log(`Executing PowerShell: ${psCommand}`);
          
          exec(psCommand, (psError, psStdout, psStderr) => {
            // Clean up temp file
            setTimeout(() => {
              try { fs.unlinkSync(tempFile); } catch (e) {}
            }, 5000);
            
            if (psError) {
              console.error(`PowerShell print also failed for ${printerName}:`, psError.message);
              reject(new Error(`Both print methods failed: ${error.message} | ${psError.message}`));
            } else {
              console.log(`Successfully printed to ${printerName} using PowerShell`);
              console.log(`PowerShell stdout: ${psStdout}`);
              resolve(`Successfully printed to ${printerName} using PowerShell`);
            }
          });
        } else {
          // Clean up temp file
          setTimeout(() => {
            try { fs.unlinkSync(tempFile); } catch (e) {}
          }, 5000);
          
          console.log(`Successfully printed to ${printerName} using Windows print command`);
          console.log(`Windows stdout: ${stdout}`);
          resolve(`Successfully printed to ${printerName} using Windows print command`);
        }
      });
      
    } catch (error) {
      console.error(`Print error for ${printerName}:`, error);
      reject(error);
    }
  });
}

// API endpoint to print KOT
app.post('/print-kot', async (req, res) => {
  try {
    const { table, items, orderNumber, total } = req.body;
    
    if (!table || !items || items.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required data: table and items' 
      });
    }
    
    const timestamp = new Date().toLocaleString();
    const orderData = {
      table,
      items,
      orderNumber: orderNumber || 'N/A',
      timestamp,
      total
    };
    
    console.log('=== KOT PRINT REQUEST ===');
    console.log('Order Data:', JSON.stringify(orderData, null, 2));
    
    // Try enhanced thermal format first
    let kotContent = formatKOT(orderData);
    console.log('Enhanced KOT Content Length:', kotContent.length);
    
    const results = [];
    
    // Print to kitchen printer
    try {
      console.log('--- Attempting Kitchen Print (Enhanced Format) ---');
      const kitchenResult = await printToThermalPrinter(PRINTER_CONFIG.kitchen, kotContent, false);
      results.push({ printer: 'kitchen', success: true, message: kitchenResult, format: 'enhanced' });
      console.log('Kitchen print successful:', kitchenResult);
    } catch (error) {
      console.log('--- Kitchen Print Failed, Trying Simple Format ---');
      console.error('Kitchen print error (enhanced):', error.message);
      
      // Try simple format as fallback
      try {
        const simpleKotContent = formatSimpleKOT(orderData);
        console.log('Simple KOT Content Length:', simpleKotContent.length);
        const simpleResult = await printToThermalPrinter(PRINTER_CONFIG.kitchen, simpleKotContent, true);
        results.push({ printer: 'kitchen', success: true, message: simpleResult, format: 'simple' });
        console.log('Kitchen print successful (simple format):', simpleResult);
      } catch (simpleError) {
        results.push({ printer: 'kitchen', success: false, error: simpleError.message, format: 'both_failed' });
        console.error('Kitchen print failed (both formats):', simpleError.message);
      }
    }
    
    // Print to cashier printer (only if different from kitchen)
    if (PRINTER_CONFIG.cashier !== PRINTER_CONFIG.kitchen) {
      try {
        console.log('--- Attempting Cashier Print ---');
        const cashierResult = await printToThermalPrinter(PRINTER_CONFIG.cashier, kotContent, false);
        results.push({ printer: 'cashier', success: true, message: cashierResult, format: 'enhanced' });
        console.log('Cashier print successful:', cashierResult);
      } catch (error) {
        try {
          const simpleKotContent = formatSimpleKOT(orderData);
          const simpleResult = await printToThermalPrinter(PRINTER_CONFIG.cashier, simpleKotContent, true);
          results.push({ printer: 'cashier', success: true, message: simpleResult, format: 'simple' });
          console.log('Cashier print successful (simple format):', simpleResult);
        } catch (simpleError) {
          results.push({ printer: 'cashier', success: false, error: simpleError.message, format: 'both_failed' });
          console.error('Cashier print failed (both formats):', simpleError.message);
        }
      }
    } else {
      console.log('Cashier printer same as kitchen - skipping duplicate print');
    }
    
    const successCount = results.filter(r => r.success).length;
    
    console.log('=== KOT PRINT RESULTS ===');
    console.log('Results:', JSON.stringify(results, null, 2));
    
    res.json({
      success: successCount > 0,
      message: `KOT printed to ${successCount} printer(s)`,
      results: results,
      debug: {
        orderData: orderData,
        contentLength: kotContent.length,
        timestamp: new Date().toISOString()
      }
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

// Get available printers
app.get('/printers', (req, res) => {
  try {
    const printers = getAvailablePrinters();
    res.json({
      success: true,
      printers: printers,
      count: printers.length,
      configured: PRINTER_CONFIG
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get printers',
      details: error.message
    });
  }
});

// Test print endpoint
app.post('/test-print', async (req, res) => {
  try {
    const { printerName } = req.body;
    
    if (!printerName) {
      return res.status(400).json({
        success: false,
        error: 'Printer name is required'
      });
    }
    
    const testContent = `
*** PRINTER TEST ***
Printer: ${printerName}
Date: ${new Date().toLocaleString()}
Test Number: ${Math.floor(Math.random() * 1000)}
Status: Testing...
*** END TEST ***
`;

    try {
      const result = await printToThermalPrinter(printerName, testContent);
      res.json({
        success: true,
        message: `Test print sent to ${printerName}`,
        result: result
      });
    } catch (error) {
      res.json({
        success: false,
        error: `Test print failed: ${error.message}`
      });
    }
    
  } catch (error) {
    console.error('Test print error:', error);
    res.status(500).json({
      success: false,
      error: 'Test print failed',
      details: error.message
    });
  }
});

// Simple text print test
app.post('/test-simple', async (req, res) => {
  try {
    const { printerName } = req.body;
    
    if (!printerName) {
      return res.status(400).json({
        success: false,
        error: 'Printer name is required'
      });
    }
    
    // Very simple text that should print on any printer
    const simpleText = `TEST PRINT\r\nDate: ${new Date().toLocaleString()}\r\nHello World!\r\n\r\n\r\n`;

    try {
      const result = await printToThermalPrinter(printerName, simpleText, true);
      res.json({
        success: true,
        message: `Simple test print sent to ${printerName}`,
        result: result,
        content: simpleText
      });
    } catch (error) {
      res.json({
        success: false,
        error: `Simple test print failed: ${error.message}`
      });
    }
    
  } catch (error) {
    console.error('Simple test print error:', error);
    res.status(500).json({
      success: false,
      error: 'Simple test print failed',
      details: error.message
    });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Print server is running',
    timestamp: new Date().toISOString(),
    printers: PRINTER_CONFIG
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    success: true, 
    message: 'ChefMate Print Server is running',
    version: '2.0 - Simplified',
    timestamp: new Date().toISOString(),
    printers: PRINTER_CONFIG,
    endpoints: [
      'POST /print-kot - Print KOT to thermal printers',
      'GET /printers - List available printers', 
      'POST /test-print - Send test print',
      'GET /health - Health check'
    ]
  });
});

app.listen(PORT, () => {
  console.log(`🖨️  Print server running on http://localhost:${PORT}`);
  console.log(`🔧 Configured printers:`, PRINTER_CONFIG);
  console.log(`📁 Temp directory: ${tempDir}`);
  console.log('Available endpoints:');
  console.log('  POST /print-kot - Print KOT to thermal printers');
  console.log('  GET /printers - List available printers');
  console.log('  POST /test-print - Send test print');
  console.log('  GET /health - Health check');
});
