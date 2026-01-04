# RS485 USB Communication Setup for Vending Machine

## Required Dependencies

Install the required Node.js packages for USB serial communication:

```bash
npm install serialport
npm install @serialport/parser-readline
```

## Package.json Dependencies

Add these to your package.json:

```json
{
  "dependencies": {
    "serialport": "^12.0.0",
    "@serialport/parser-readline": "^12.0.0"
  }
}
```

## Backend Setup

1. **Add the vending machine routes to your Express app:**

```javascript
// In your main server file (app.js or server.js)
const vendingMachineRoutes = require('./backend/routes/vendingMachine');
app.use('/api/vending', vendingMachineRoutes);
```

2. **Ensure COM5 port permissions (Windows):**
   - Make sure the USB-to-RS485 adapter is properly installed
   - Check Device Manager for COM port assignment
   - Ensure the port is not being used by other applications

## Hardware Setup

### RS485 USB Adapter Configuration
- **Port**: COM5 (configurable)
- **Baud Rate**: 9600 (default, configurable)
- **Data Bits**: 8
- **Stop Bits**: 1
- **Parity**: None
- **Flow Control**: None

### Typical RS485 Wiring
```
USB-RS485 Adapter    Vending Machine
A+ (or D+)     -->   A+ (Data+)
B- (or D-)     -->   B- (Data-)
GND            -->   GND (Common Ground)
```

## API Endpoints

### Test Connection
```
POST /api/vending/test-connection
Content-Type: application/json

{
  "connectionType": "USB",
  "port": "COM5",
  "baudRate": 9600,
  "dataBits": 8,
  "stopBits": 1,
  "parity": "none"
}
```

### Health Check
```
GET /api/vending/health
```

### Get Machine Status
```
GET /api/vending/machine/VM001/status
```

### Send Command
```
POST /api/vending/machine/VM001/command
Content-Type: application/json

{
  "command": "DISPENSE",
  "parameters": {
    "slot": "A1",
    "quantity": 1
  }
}
```

### Get Available Ports
```
GET /api/vending/available-ports
```

### Disconnect
```
POST /api/vending/disconnect
```

## Common RS485 Commands

### Status Commands
```
STATUS\r\n                  - Get machine status
GET_INVENTORY\r\n           - Get current inventory
GET_STATUS:VM001\r\n        - Get specific machine status
```

### Dispense Commands
```
DISPENSE:A1:1\r\n          - Dispense 1 item from slot A1
DISPENSE:B2:2\r\n          - Dispense 2 items from slot B2
```

### Control Commands
```
RESET:VM001\r\n            - Reset machine VM001
UNLOCK_DOOR\r\n            - Unlock service door
LOCK_DOOR\r\n              - Lock service door
```

## Troubleshooting

### Common Issues

1. **Port Not Found**
   - Check if COM5 exists in Device Manager
   - Try different COM ports (COM1, COM3, etc.)
   - Restart the USB adapter

2. **Permission Denied**
   - Close other applications using the COM port
   - Run Node.js with administrator privileges
   - Check port is not locked by system

3. **Connection Timeout**
   - Verify hardware connections
   - Check RS485 wiring (A+/B-, GND)
   - Ensure correct baud rate settings

4. **No Response from Machine**
   - Machine may not support the command
   - Wrong command format
   - Machine is offline or busy

### Debug Tips

1. **Check Available Ports**
```bash
# Use the available-ports endpoint to see all COM ports
curl http://localhost:3000/api/vending/available-ports
```

2. **Test Basic Connection**
```bash
# Use a serial terminal program like PuTTY or Tera Term
# Connect to COM5 with 9600,8,N,1 settings
# Send: STATUS
# Expected response varies by machine
```

3. **Monitor Serial Communication**
```javascript
// Add debug logging to see raw data
serialPort.on('data', (data) => {
  console.log('Raw data received:', data);
  console.log('As string:', data.toString());
  console.log('As hex:', data.toString('hex'));
});
```

## Example Frontend Usage

The frontend VendingMachine.js component now includes:
- USB COM5 connection testing
- Detailed error messages for USB issues
- Connection status indicators
- Automatic retry mechanisms

The connection will now specifically use COM5 port with proper USB serial communication instead of network-based communication.

## Production Considerations

1. **Port Configuration**: Make COM port configurable via environment variables
2. **Error Recovery**: Implement automatic reconnection on connection loss
3. **Logging**: Add comprehensive logging for debugging
4. **Security**: Ensure proper access control to serial ports
5. **Testing**: Test with actual vending machine hardware
