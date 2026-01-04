const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

async function createAndroidPackage() {
  console.log('📱 Creating Android Package...');
  
  const distDir = path.join(__dirname, '..', 'dist');
  const androidDir = path.join(distDir, 'ChefMate-PrintServer-Android');
  
  // Create android directory
  if (!fs.existsSync(androidDir)) {
    fs.mkdirSync(androidDir, { recursive: true });
  }
  
  // Create Android-specific server file
  const androidServerContent = `const express = require('express');
const cors = require('cors');
const { execSync, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Configuration for thermal printers (Android compatible)
const PRINTER_CONFIG = {
  kitchen: process.env.KITCHEN_PRINTER || 'USB_PRINTER',
  cashier: process.env.CASHIER_PRINTER || 'USB_PRINTER'
};

// Ensure temp directory exists
const tempDir = path.join(__dirname, 'temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// Android-specific printer detection
function getAvailablePrinters() {
  try {
    if (os.platform() === 'android' || process.env.TERMUX_VERSION) {
      return [
        { name: 'USB_PRINTER', status: 'Available' },
        { name: 'BLUETOOTH_PRINTER', status: 'Available' }
      ];
    } else {
      return [{ name: 'DEFAULT_PRINTER', status: 'Available' }];
    }
  } catch (error) {
    console.error('Error getting printers:', error);
    return [];
  }
}

// Android-compatible KOT formatting
function formatKOT(orderData) {
  const { table, items, orderNumber, timestamp, total } = orderData;
  
  let kot = '';
  kot += '================================\\n';
  kot += '       KITCHEN ORDER TICKET     \\n';
  kot += '================================\\n';
  kot += \`Order #: \${orderNumber}\\n\`;
  kot += \`Table: \${table}\\n\`;
  kot += \`Time: \${timestamp}\\n\`;
  kot += '--------------------------------\\n';
  
  items.forEach(item => {
    const itemName = (item.item_name || item.name || 'Item').substring(0, 20);
    kot += \`\${itemName} x\${item.quantity}\\n\`;
    
    if (item.notes) {
      kot += \`  Note: \${item.notes}\\n\`;
    }
  });
  
  kot += '--------------------------------\\n';
  if (total) {
    kot += \`Total: \${total}\\n\`;
    kot += '--------------------------------\\n';
  }
  kot += '       ** KITCHEN COPY **       \\n';
  kot += '================================\\n';
  kot += '\\n\\n\\n';
  
  return kot;
}

// Android-compatible printing
async function printToThermalPrinter(printerName, content) {
  return new Promise((resolve, reject) => {
    try {
      console.log(\`Attempting to print to \${printerName}...\`);
      
      const tempFile = path.join(tempDir, \`kot-\${Date.now()}.txt\`);
      fs.writeFileSync(tempFile, content, 'utf8');
      
      if (os.platform() === 'android' || process.env.TERMUX_VERSION) {
        const printCommand = \`cat "\${tempFile}" > /dev/usb/lp0 2>/dev/null || echo "USB printer not available"\`;
        
        exec(printCommand, (error, stdout, stderr) => {
          setTimeout(() => {
            try { fs.unlinkSync(tempFile); } catch (e) {}
          }, 5000);
          
          if (error) {
            console.log('USB print failed, saving to Downloads...');
            const downloadsPath = path.join(os.homedir(), 'storage', 'downloads', \`kot-\${Date.now()}.txt\`);
            try {
              fs.copyFileSync(tempFile, downloadsPath);
              resolve(\`Saved print file to Downloads: \${downloadsPath}\`);
            } catch (saveError) {
              reject(new Error(\`Print failed: \${error.message}\`));
            }
          } else {
            resolve(\`Successfully printed to \${printerName}\`);
          }
        });
      } else {
        console.log('Non-Android platform, saving print job...');
        resolve(\`Print job saved: \${tempFile}\`);
      }
      
    } catch (error) {
      console.error(\`Print error for \${printerName}:\`, error);
      reject(error);
    }
  });
}

// API Routes
app.get('/', (req, res) => {
  res.json({ 
    success: true, 
    message: 'ChefMate Print Server (Android) is running',
    version: '1.0-android',
    platform: os.platform(),
    termux: !!process.env.TERMUX_VERSION,
    timestamp: new Date().toISOString(),
    printers: PRINTER_CONFIG
  });
});

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
    const orderData = { table, items, orderNumber: orderNumber || 'N/A', timestamp, total };
    
    const kotContent = formatKOT(orderData);
    
    try {
      const result = await printToThermalPrinter(PRINTER_CONFIG.kitchen, kotContent);
      res.json({
        success: true,
        message: 'KOT printed successfully',
        result: result
      });
    } catch (error) {
      res.json({
        success: false,
        error: error.message
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

app.post('/test-print', async (req, res) => {
  try {
    const { printerName } = req.body;
    
    if (!printerName) {
      return res.status(400).json({
        success: false,
        error: 'Printer name is required'
      });
    }
    
    const testContent = \`TEST PRINT\\nPrinter: \${printerName}\\nTime: \${new Date().toLocaleString()}\\n\\n\\n\`;
    
    try {
      const result = await printToThermalPrinter(printerName, testContent);
      res.json({
        success: true,
        message: \`Test print sent to \${printerName}\`,
        result: result
      });
    } catch (error) {
      res.json({
        success: false,
        error: \`Test print failed: \${error.message}\`
      });
    }
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Test print failed',
      details: error.message
    });
  }
});

app.get('/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Print server is running',
    platform: os.platform(),
    timestamp: new Date().toISOString(),
    printers: PRINTER_CONFIG
  });
});

app.listen(PORT, () => {
  console.log(\`🖨️ ChefMate Print Server (Android) running on port \${PORT}\`);
  console.log(\`📱 Platform: \${os.platform()}\`);
  console.log(\`🔧 Configured printers:\`, PRINTER_CONFIG);
});`;

  fs.writeFileSync(path.join(androidDir, 'server-android.js'), androidServerContent);
  
  // Create Android package.json
  const androidPackageJson = {
    name: "chefmate-print-server-android",
    version: "1.0.0",
    description: "ChefMate Print Server for Android/Termux",
    main: "server-android.js",
    scripts: {
      start: "node server-android.js",
      "start:background": "nohup node server-android.js > server.log 2>&1 &"
    },
    dependencies: {
      express: "^4.18.2",
      cors: "^2.8.5"
    },
    engines: {
      node: ">=14.0.0"
    }
  };
  
  fs.writeFileSync(
    path.join(androidDir, 'package.json'), 
    JSON.stringify(androidPackageJson, null, 2)
  );
  
  // Create simple install script
  const installScript = `#!/bin/bash
echo "ChefMate Print Server - Android Setup"
echo "===================================="

pkg update -y
pkg install nodejs -y
npm install
termux-setup-storage

echo "Setup complete! Run: ./start.sh"
`;

  fs.writeFileSync(path.join(androidDir, 'install.sh'), installScript);
  
  // Create start script
  const startScript = `#!/bin/bash
echo "Starting ChefMate Print Server..."
mkdir -p temp
node server-android.js
`;

  fs.writeFileSync(path.join(androidDir, 'start.sh'), startScript);
  
  // Copy test file
  const testHtmlPath = path.join(__dirname, '..', 'test.html');
  if (fs.existsSync(testHtmlPath)) {
    fs.copyFileSync(testHtmlPath, path.join(androidDir, 'test.html'));
  }
  
  // Create README
  const readme = `# ChefMate Print Server - Android

## Installation (Termux)
1. Install Termux
2. Run: chmod +x install.sh && ./install.sh

## Usage
./start.sh

## Access
http://localhost:5000
`;

  fs.writeFileSync(path.join(androidDir, 'README.md'), readme);
  
  // Create temp directory
  const tempDir2 = path.join(androidDir, 'temp');
  if (!fs.existsSync(tempDir2)) {
    fs.mkdirSync(tempDir2);
  }
  
  console.log('✅ Android package created in:', androidDir);
  
  // Create ZIP
  const zipPath = path.join(distDir, 'ChefMate-PrintServer-Android.zip');
  const output = fs.createWriteStream(zipPath);
  const archive = archiver('zip', { zlib: { level: 9 } });
  
  return new Promise((resolve, reject) => {
    output.on('close', () => {
      console.log(`✅ Android ZIP created: ${zipPath} (${archive.pointer()} bytes)`);
      resolve();
    });
    
    archive.on('error', reject);
    archive.pipe(output);
    archive.directory(androidDir, 'ChefMate-PrintServer-Android');
    archive.finalize();
  });
}

if (require.main === module) {
  createAndroidPackage().catch(console.error);
}

module.exports = createAndroidPackage;
