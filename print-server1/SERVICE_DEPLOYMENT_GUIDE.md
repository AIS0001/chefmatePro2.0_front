# ChefMate Print Server - Windows Service Deployment Guide

## Overview
ChefMate Print Server is a Windows service that enables thermal printing for KOT (Kitchen Order Tickets) and invoices from any machine on your network.

## Package Contents
```
ChefMatePrintServer/
├── print-server.exe          # Main executable
├── install.bat               # Service installation script
├── uninstall.bat            # Service removal script
├── INSTALLATION_GUIDE.txt   # Quick start guide
└── README.md                # This file
```

## Installation Methods

### Method 1: Using Batch Scripts (Recommended)

1. **Copy to Target Location**
   ```
   Copy the entire ChefMatePrintServer folder to: C:\ChefMatePrintServer
   ```

2. **Install Service**
   - Right-click on `install.bat`
   - Select **"Run as administrator"**
   - Wait for confirmation message
   - Service will start automatically

3. **Verify Installation**
   - Open browser: http://localhost:7001
   - Expected response: "ChefMate Print Server is running!"

### Method 2: Using Node.js Scripts

1. **Install Dependencies** (if using source code)
   ```bash
   cd print-server
   npm install
   ```

2. **Install as Service**
   ```bash
   npm run install-windows-service
   ```

3. **Uninstall Service**
   ```bash
   npm run uninstall-windows-service
   ```

## Building from Source

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager

### Build Steps

1. **Install Dependencies**
   ```bash
   cd print-server
   npm install
   ```

2. **Build Executable**
   ```bash
   npm run build:windows
   ```
   This creates `dist/print-server.exe`

3. **Build Service Package**
   ```bash
   npm run build:service
   ```
   This creates `dist/ChefMatePrintServer-WindowsService.zip`

## Service Configuration

### Service Details
- **Service Name**: ChefMatePrintServer
- **Display Name**: ChefMate Print Server
- **Port**: 7001
- **Startup Type**: Automatic
- **Log File**: service.log (in installation directory)

### Printer Configuration
The service uses Windows-configured printers. Edit `PRINTER_CONFIG` in server-windows.js:

```javascript
const PRINTER_CONFIG = {
  kitchen: 'Kitchen', // Your kitchen printer name
  cashier: 'cashier'  // Your cashier printer name
};
```

To find printer names:
```bash
wmic printer list brief
```

## Service Management

### Using Windows Services Manager
1. Press `Win + R`
2. Type: `services.msc`
3. Find "ChefMate Print Server"
4. Right-click for options (Start/Stop/Restart)

### Using Command Line
```bash
# Start service
sc start ChefMatePrintServer

# Stop service
sc stop ChefMatePrintServer

# Query status
sc query ChefMatePrintServer

# View service details
sc qc ChefMatePrintServer
```

## API Endpoints

### Health Check
```
GET http://localhost:7001/
Response: "ChefMate Print Server is running!"
```

### List Printers
```
GET http://localhost:7001/printers
Response: [{ name: "Kitchen", status: "Normal" }]
```

### Print KOT
```
POST http://localhost:7001/print
Body: {
  table: "T1",
  items: [...],
  orderNumber: "123",
  timestamp: "2026-01-20 10:30",
  printerName: "Kitchen"
}
```

### Print ESC/POS
```
POST http://localhost:7001/print-escpos
Body: {
  imageData: "data:image/png;base64,...",
  printerIP: "192.168.1.217",
  printerPort: 9100
}
```

## Troubleshooting

### Service Won't Start
1. Check `service.log` for errors
2. Verify port 7001 is available:
   ```bash
   netstat -ano | findstr :7001
   ```
3. Ensure administrator privileges
4. Check Windows Event Viewer

### Printer Not Found
1. Verify printer is installed in Windows
2. Check printer name matches configuration
3. Test printer with Windows test page
4. Ensure printer is online and ready

### Network Access Issues
1. Check Windows Firewall:
   ```bash
   netsh advfirewall firewall add rule name="ChefMate Print Server" dir=in action=allow protocol=TCP localport=7001
   ```
2. Verify network connectivity
3. Test from another machine: http://[server-ip]:7001

### Service Crashes
1. Check service.log for errors
2. Verify Node.js compatibility
3. Ensure sufficient memory
4. Check for conflicting software

## Deployment to Multiple Machines

### Quick Deployment
1. Extract `ChefMatePrintServer-WindowsService.zip`
2. Copy to `C:\ChefMatePrintServer` on target machine
3. Run `install.bat` as Administrator
4. Configure printer names if needed
5. Test with browser: http://localhost:7001

### Network Configuration
To access from other machines on network:
1. Note server IP address
2. Ensure port 7001 is open in firewall
3. Access from client: http://[server-ip]:7001

## Uninstallation

### Method 1: Batch Script
- Right-click `uninstall.bat`
- Select "Run as administrator"

### Method 2: Command Line
```bash
sc stop ChefMatePrintServer
sc delete ChefMatePrintServer
```

### Method 3: Node.js Script
```bash
npm run uninstall-windows-service
```

## Logs and Monitoring

### Service Log
Location: `C:\ChefMatePrintServer\service.log`

Log entries include:
- Service start/stop events
- Print requests
- Error messages
- API calls

### Windows Event Log
- Open Event Viewer
- Navigate to: Windows Logs > Application
- Filter by source: ChefMate Print Server

## Security Considerations

1. **Run as LocalSystem** (default) or create dedicated service account
2. **Firewall Rules**: Only allow local network access
3. **HTTPS**: Consider adding SSL for production
4. **Authentication**: Add API key authentication if exposed to internet

## Performance Optimization

- Service automatically restarts on failure
- Configurable recovery options in install.bat
- Memory limit: 4GB (configurable in install-windows-service.js)

## Support

For issues or questions:
- Email: support@chefmate.com
- Check service.log for detailed error messages
- Review Windows Event Viewer for system-level issues

## Version History

- **v1.0.0**: Initial release with Windows Service support
  - Auto-install/uninstall scripts
  - Thermal printer support
  - ESC/POS command support
  - Network printer compatibility

## License
MIT License - ChefMate Team
