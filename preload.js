const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Display management
  getDisplays: () => ipcRenderer.invoke('get-displays'),
  refreshCustomerDisplay: () => ipcRenderer.invoke('refresh-customer-display'),
  toggleCustomerDisplay: () => ipcRenderer.invoke('toggle-customer-display'),
  
  // System info
  platform: process.platform,
  
  // Event listeners
  onDisplayChanged: (callback) => {
    ipcRenderer.on('display-changed', callback);
  },
  
  // Remove listeners
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  }
});

// Log that preload script has loaded
console.log('Electron preload script loaded successfully');