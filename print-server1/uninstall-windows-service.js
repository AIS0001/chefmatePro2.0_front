const Service = require('node-windows').Service;
const path = require('path');

// Create a new service object
const svc = new Service({
  name: 'ChefMate Print Server',
  script: path.join(__dirname, 'server-windows.js')
});

// Listen for the "uninstall" event so we know when it's done.
svc.on('uninstall', function() {
  console.log('✅ ChefMate Print Server uninstalled successfully!');
  console.log('Service has been removed from Windows Services');
  process.exit(0);
});

svc.on('alreadyuninstalled', function() {
  console.log('⚠️  Service is not installed.');
  process.exit(0);
});

svc.on('error', function(err) {
  console.error('❌ Error:', err);
  process.exit(1);
});

console.log('Uninstalling ChefMate Print Server Windows Service...');
svc.uninstall();
