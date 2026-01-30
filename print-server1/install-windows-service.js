const Service = require('node-windows').Service;
const path = require('path');

// Create a new service object
const svc = new Service({
  name: 'ChefMate Print Server',
  description: 'ChefMate KOT Thermal Print Server - Windows & Android compatible',
  script: path.join(__dirname, 'server-escpos.js'),
  nodeOptions: [
    '--harmony',
    '--max_old_space_size=4096'
  ],
  env: [
    {
      name: "NODE_ENV",
      value: "production"
    },
    {
      name: "PORT",
      value: "7001"
    }
  ]
});

// Listen for the "install" event, which indicates the
// process is available as a service.
svc.on('install', function() {
  console.log('✅ ChefMate Print Server installed successfully!');
  console.log('Starting service...');
  svc.start();
});

svc.on('alreadyinstalled', function() {
  console.log('⚠️  Service is already installed.');
  console.log('Please uninstall first using uninstall-windows-service.js');
});

svc.on('start', function() {
  console.log('✅ ChefMate Print Server started successfully!');
  console.log('Service is now running on port 7001');
  process.exit(0);
});

svc.on('error', function(err) {
  console.error('❌ Error:', err);
  process.exit(1);
});

console.log('Installing ChefMate Print Server as Windows Service...');
svc.install();
