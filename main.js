const { app, BrowserWindow, screen, ipcMain } = require("electron");
const path = require("path");

let mainWindow, customerWindow;

// Enable live reload for development (commented out to avoid errors)
// if (process.env.NODE_ENV === 'development') {
//   require('electron-reload')(__dirname, {
//     electron: path.join(__dirname, '..', 'node_modules', '.bin', 'electron'),
//     hardResetMethod: 'exit'
//   });
// }

function createMainWindow() {
  // Main cashier window
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      // preload: path.join(__dirname, 'preload.js') // Optional - comment out for now
    },
    // icon: path.join(__dirname, 'public', 'logo.png'), // Optional - comment out for now
    show: false // Don't show until ready
  });

  // Load the React app
  const isDev = !app.isPackaged;
  
  if (isDev) {
    // Load from remote server for development
    mainWindow.loadURL("https://pind.livecloudnet.com/");
    mainWindow.webContents.openDevTools(); // Open dev tools in development
  } else {
    // In production, still use remote server or you can build locally
    mainWindow.loadURL("https://pind.livecloudnet.com/");
  }

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    createCustomerDisplay();
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function createCustomerDisplay() {
  // Get all displays
  const displays = screen.getAllDisplays();
  console.log('Available displays:', displays.length);
  
  // Find external display (secondary monitor)
  let externalDisplay = null;
  
  if (displays.length > 1) {
    // Method 1: Find display that's not the primary
    const primaryDisplay = screen.getPrimaryDisplay();
    externalDisplay = displays.find(display => display.id !== primaryDisplay.id);
    
    // Method 2: Alternative - find display with different bounds
    if (!externalDisplay) {
      externalDisplay = displays.find(display => 
        display.bounds.x !== 0 || display.bounds.y !== 0
      );
    }
    
    // Method 3: If still not found, use the second display
    if (!externalDisplay && displays.length > 1) {
      externalDisplay = displays[1];
    }
  }

  if (externalDisplay) {
    console.log('External display found:', externalDisplay);
    
    customerWindow = new BrowserWindow({
      x: externalDisplay.bounds.x,
      y: externalDisplay.bounds.y,
      width: externalDisplay.bounds.width,
      height: externalDisplay.bounds.height,
      fullscreen: true,
      frame: false, // Remove window frame for kiosk-like experience
      alwaysOnTop: true, // Keep customer display on top
      skipTaskbar: true, // Don't show in taskbar
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        enableRemoteModule: false,
        // preload: path.join(__dirname, 'preload.js') // Optional - comment out for now
      },
      show: false
    });

    const isDev = !app.isPackaged;
    
    if (isDev) {
      // In development, load customer display from remote server
      customerWindow.loadURL("https://pind.livecloudnet.com/customer-display");
    } else {
      // In production, also use remote server for customer display
      customerWindow.loadURL("https://pind.livecloudnet.com/customer-display");
    }

    // Show customer window when ready
    customerWindow.once('ready-to-show', () => {
      customerWindow.show();
      console.log('Customer display window created successfully');
    });

    // Handle customer window closed
    customerWindow.on('closed', () => {
      customerWindow = null;
    });

    // Ensure customer window stays fullscreen
    customerWindow.on('leave-full-screen', () => {
      customerWindow.setFullScreen(true);
    });

  } else {
    console.log('No external display found. Customer display will not be created.');
    console.log('Available displays:', displays.map(d => ({
      id: d.id,
      bounds: d.bounds,
      size: d.size,
      workArea: d.workArea
    })));
  }
}

// Handle display changes (monitor connected/disconnected)
function handleDisplayChanges() {
  // Close existing customer window
  if (customerWindow) {
    customerWindow.close();
    customerWindow = null;
  }
  
  // Recreate customer display with new configuration
  setTimeout(() => {
    createCustomerDisplay();
  }, 1000); // Small delay to ensure display is properly detected
}

app.whenReady().then(() => {
  createMainWindow();
  
  // Listen for display changes
  screen.on('display-added', handleDisplayChanges);
  screen.on('display-removed', handleDisplayChanges);
  screen.on('display-metrics-changed', handleDisplayChanges);
});

// Handle all windows closed
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Handle app activation (macOS)
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
  }
});

// IPC handlers for communication between main and renderer processes
ipcMain.handle('get-displays', () => {
  return screen.getAllDisplays().map(display => ({
    id: display.id,
    bounds: display.bounds,
    size: display.size,
    workArea: display.workArea,
    scaleFactor: display.scaleFactor
  }));
});

ipcMain.handle('refresh-customer-display', () => {
  if (customerWindow) {
    customerWindow.reload();
    return true;
  }
  return false;
});

ipcMain.handle('toggle-customer-display', () => {
  if (customerWindow) {
    if (customerWindow.isVisible()) {
      customerWindow.hide();
    } else {
      customerWindow.show();
    }
    return customerWindow.isVisible();
  }
  return false;
});

// Prevent new window creation (security measure)
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (navigationEvent, navigationURL) => {
    navigationEvent.preventDefault();
  });
});