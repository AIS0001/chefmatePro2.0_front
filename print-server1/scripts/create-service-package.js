const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

console.log('📦 Creating Windows Service Package...');

const distDir = path.join(__dirname, '..', 'dist');
const serviceDir = path.join(distDir, 'ChefMatePrintServer');

// Ensure directories exist
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}
if (fs.existsSync(serviceDir)) {
  fs.rmSync(serviceDir, { recursive: true });
}
fs.mkdirSync(serviceDir, { recursive: true });

// Copy necessary files
const filesToCopy = [
  { src: path.join(distDir, 'print-server.exe'), dest: 'print-server.exe' },
  { src: path.join(__dirname, '..', 'install.bat'), dest: 'install.bat' },
  { src: path.join(__dirname, '..', 'uninstall.bat'), dest: 'uninstall.bat' },
  { src: path.join(__dirname, '..', 'README.md'), dest: 'README.md' }
];

console.log('📄 Copying files...');
filesToCopy.forEach(file => {
  const srcPath = file.src;
  const destPath = path.join(serviceDir, file.dest);
  
  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, destPath);
    console.log(`  ✅ Copied ${file.dest}`);
  } else {
    console.log(`  ⚠️  Missing ${file.src}`);
  }
});

// Create installation instructions
const installInstructions = `
ChefMate Print Server - Windows Service Installation
====================================================

INSTALLATION STEPS:
-------------------

1. Copy this entire folder to: C:\\ChefMatePrintServer

2. Right-click on "install.bat" and select "Run as administrator"

3. The service will be installed and started automatically

4. Verify the service is running:
   - Open Services (services.msc)
   - Look for "ChefMate Print Server"
   - Status should show "Running"

5. Test the print server:
   - Open your browser
   - Go to: http://localhost:7001
   - You should see: "ChefMate Print Server is running!"

UNINSTALLATION:
--------------
Right-click on "uninstall.bat" and select "Run as administrator"

TROUBLESHOOTING:
---------------
- If service fails to start, check service.log file
- Ensure port 7001 is not used by another application
- Make sure Windows Firewall allows the service

SERVICE DETAILS:
---------------
Service Name: ChefMatePrintServer
Display Name: ChefMate Print Server
Port: 7001
Log File: service.log (in installation directory)

PRINTER CONFIGURATION:
---------------------
Edit the printer names in the server configuration if needed:
- Kitchen Printer: Configure in Windows
- Cashier Printer: Configure in Windows

For support, contact: support@chefmate.com
`;

fs.writeFileSync(
  path.join(serviceDir, 'INSTALLATION_GUIDE.txt'),
  installInstructions
);
console.log('  ✅ Created INSTALLATION_GUIDE.txt');

// Create ZIP archive
console.log('🗜️  Creating ZIP archive...');
const zipPath = path.join(distDir, 'ChefMatePrintServer-WindowsService.zip');
const output = fs.createWriteStream(zipPath);
const archive = archiver('zip', {
  zlib: { level: 9 }
});

output.on('close', function() {
  const sizeMB = (archive.pointer() / 1024 / 1024).toFixed(2);
  console.log(`\n✅ Package created successfully!`);
  console.log(`📦 File: ${zipPath}`);
  console.log(`📊 Size: ${sizeMB} MB`);
  console.log(`\nTo deploy:`);
  console.log(`1. Extract ChefMatePrintServer-WindowsService.zip`);
  console.log(`2. Copy to C:\\ChefMatePrintServer`);
  console.log(`3. Run install.bat as Administrator`);
});

output.on('error', function(err) {
  console.error('❌ Error creating ZIP:', err);
});

archive.on('error', function(err) {
  console.error('❌ Archive error:', err);
  throw err;
});

archive.pipe(output);
archive.directory(serviceDir, 'ChefMatePrintServer');
archive.finalize();
