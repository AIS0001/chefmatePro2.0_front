const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

async function buildAll() {
  console.log('🚀 ChefMate Print Server - Build All Packages');
  console.log('===============================================');
  
  const distDir = path.join(__dirname, '..', 'dist');
  
  // Clean dist directory
  if (fs.existsSync(distDir)) {
    console.log('🧹 Cleaning dist directory...');
    fs.rmSync(distDir, { recursive: true, force: true });
  }
  fs.mkdirSync(distDir, { recursive: true });
  
  try {
    // Install dev dependencies if not present
    console.log('📦 Installing build dependencies...');
    execSync('npm install', { stdio: 'inherit' });
    
    // Build Windows Executable
    console.log('\n🪟 Building Windows Executable...');
    try {
      execSync('npm run build:windows', { stdio: 'inherit' });
      console.log('✅ Windows executable created!');
    } catch (error) {
      console.log('⚠️  Windows executable build failed, creating portable version instead...');
    }
    
    // Create Portable Package
    console.log('\n📦 Creating Windows Portable Package...');
    const createPortable = require('./create-portable');
    await createPortable();
    console.log('✅ Windows portable package created!');
    
    // Create Android Package
    console.log('\n📱 Creating Android Package...');
    const createAndroid = require('./create-android-package');
    await createAndroid();
    console.log('✅ Android package created!');
    
    // Create summary
    console.log('\n📋 Build Summary');
    console.log('================');
    
    const files = fs.readdirSync(distDir);
    files.forEach(file => {
      const filePath = path.join(distDir, file);
      const stats = fs.statSync(filePath);
      const size = stats.isFile() ? `(${(stats.size / 1024 / 1024).toFixed(2)} MB)` : '(folder)';
      console.log(`✅ ${file} ${size}`);
    });
    
    console.log('\n🎉 All packages built successfully!');
    console.log('\n📂 Packages location: ./dist/');
    
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  buildAll().catch(console.error);
}

module.exports = buildAll;
