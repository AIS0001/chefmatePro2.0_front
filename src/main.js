const { app, BrowserWindow, screen } = require("electron");
const path = require("path");

let mainWindow, customerWindow;

app.whenReady().then(() => {
  const isDev = !app.isPackaged;

  // Main cashier window
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Always load from remote server for your cloud-based POS
  mainWindow.loadURL("https://pind.livecloudnet.com/");

  // Detect external display
  const displays = screen.getAllDisplays();
  const externalDisplay = displays.find(
    (d) => d.bounds.x !== 0 || d.bounds.y !== 0
  );

  if (externalDisplay) {
    customerWindow = new BrowserWindow({
      x: externalDisplay.bounds.x,
      y: externalDisplay.bounds.y,
      width: externalDisplay.bounds.width,
      height: externalDisplay.bounds.height,
      fullscreen: true,
      frame: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
      },
    });

    // Always load customer display from remote server
    customerWindow.loadURL("https://pind.livecloudnet.com/customer-display");
  }
});
