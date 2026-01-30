const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

async function createPortablePackage() {
  console.log('📦 Creating Windows Portable Package...');
  
  const distDir = path.join(__dirname, '..', 'dist');
  const portableDir = path.join(distDir, 'ChefMate-PrintServer-Portable');
  
  // Create portable directory
  if (!fs.existsSync(portableDir)) {
    fs.mkdirSync(portableDir, { recursive: true });
  }
  
  // Copy essential files
  const filesToCopy = [
    'server-windows.js',
    'package.json',
    'test.html',
    'README.md',
    'start-server.bat'
  ];
  
  filesToCopy.forEach(file => {
    const srcPath = path.join(__dirname, '..', file);
    const destPath = path.join(portableDir, file);
    if (fs.existsSync(srcPath)) {
      fs.copyFileSync(srcPath, destPath);
      console.log(`✅ Copied ${file}`);
    }
  });
  
  // Copy node_modules (only production dependencies)
  const nodeModulesDir = path.join(portableDir, 'node_modules');
  if (!fs.existsSync(nodeModulesDir)) {
    fs.mkdirSync(nodeModulesDir, { recursive: true });
  }
  
  // Create a simplified package.json for portable version
  const portablePackageJson = {
    name: "chefmate-print-server-portable",
    version: "1.0.0",
    main: "server-windows.js",
    scripts: {
      start: "node server-windows.js"
    },
    dependencies: {
      express: "^4.18.2",
      cors: "^2.8.5"
    }
  };
  
  fs.writeFileSync(
    path.join(portableDir, 'package.json'), 
    JSON.stringify(portablePackageJson, null, 2)
  );
  
  // Create run script for portable version
  const runScript = `@echo off
echo ChefMate Print Server - Portable Version
echo ========================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    echo.
    pause
    exit /b 1
)

REM Install dependencies if node_modules doesn't exist
if not exist "node_modules" (
    echo Installing dependencies...
    npm install --production
    echo.
)

REM Create temp directory
if not exist "temp" mkdir temp

echo Starting ChefMate Print Server...
echo Server will be available at: http://localhost:5000
echo Test interface at: test.html
echo.
node server-windows.js
pause`;

  fs.writeFileSync(path.join(portableDir, 'run.bat'), runScript);
  
  // Create install script
  const installScript = `@echo off
echo ChefMate Print Server - First Time Setup
echo ========================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo Installing dependencies...
npm install --production

echo.
echo Setup complete! Use run.bat to start the server.
pause`;

  fs.writeFileSync(path.join(portableDir, 'install.bat'), installScript);
  
  // Create temp directory
  const tempDir = path.join(portableDir, 'temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
  }
  
  console.log('✅ Portable package created in:', portableDir);
  
  // Create ZIP archive
  console.log('📦 Creating ZIP archive...');
  const zipPath = path.join(distDir, 'ChefMate-PrintServer-Portable.zip');
  const output = fs.createWriteStream(zipPath);
  const archive = archiver('zip', { zlib: { level: 9 } });
  
  return new Promise((resolve, reject) => {
    output.on('close', () => {
      console.log(`✅ ZIP created: ${zipPath} (${archive.pointer()} bytes)`);
      resolve();
    });
    
    archive.on('error', reject);
    archive.pipe(output);
    archive.directory(portableDir, 'ChefMate-PrintServer-Portable');
    archive.finalize();
  });
}

if (require.main === module) {
  createPortablePackage().catch(console.error);
}

module.exports = createPortablePackage;
