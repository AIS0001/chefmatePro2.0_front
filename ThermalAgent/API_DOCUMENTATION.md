# Thermal Printer Agent API Documentation

## Overview

The Thermal Printer Agent is a Node.js service that handles ESC/POS thermal printer operations with support for single and multi-printer configurations.

## Configuration

### Environment Variables (.env)

```bash
# Server
PORT=6001

# Printer Type
PRINTER_TYPE=network  # Options: windows, usb, network

# Single Printer (Fallback)
PRINTER_IP=192.168.1.81
PRINTER_PORT=9100

# Multi-Printer Configuration
PRINTER_1_IP=192.168.1.100      # Kitchen Printer
PRINTER_1_PORT=9100
PRINTER_2_IP=192.168.1.101      # Cashier Printer
PRINTER_2_PORT=9100
PRINTER_3_IP=192.168.1.102      # Kiosk Printer (optional)
PRINTER_3_PORT=9100

# Mode
MULTI_PRINTER_MODE=simultaneous # simultaneous or sequential
```

## API Endpoints

### 1. Health Check
```
GET /
```

**Response:**
```json
{
  "status": "running",
  "service": "Thermal Printer Agent",
  "version": "1.0.0",
  "endpoints": {
    "health": "GET /",
    "print": "POST /print",
    "printers": "GET /printers"
  }
}
```

---

### 2. List Available Printers
```
GET /printers
```

**Response:**
```json
{
  "success": true,
  "system": [
    {
      "name": "Brother QL-820W",
      "driver": "Brother QL-820W",
      "port": "FILE:",
      "status": "Ok"
    }
  ],
  "usb": [
    {
      "index": 0,
      "vendorId": 4661,
      "productId": 8963,
      "manufacturer": "EPSON",
      "product": "TM-P80"
    }
  ],
  "config": {
    "type": "network",
    "ip": "192.168.1.123",
    "port": 9100
  }
}
```

---

### 3. Get Printer Status
```
GET /status
```

**Response:**
```json
{
  "success": true,
  "printerManagerInitialized": true,
  "printerType": "network",
  "configuredPrinters": 2,
  "printers": [
    {
      "ip": "192.168.1.100",
      "port": 9100,
      "name": "Printer 1"
    },
    {
      "ip": "192.168.1.101",
      "port": 9100,
      "name": "Printer 2"
    }
  ],
  "environment": {
    "printer1": {
      "ip": "192.168.1.100",
      "port": 9100
    },
    "printer2": {
      "ip": "192.168.1.101",
      "port": 9100
    }
  }
}
```

---

### 4. Print to Single Printer
```
POST /print
Content-Type: application/json
```

**Request Body:**
```json
{
  "data": "base64_encoded_escpos_data"
}
```

**Example:**
```bash
curl -X POST http://localhost:6001/print \
  -H "Content-Type: application/json" \
  -d '{"data":"G1BYCg=="}'
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Print job sent successfully",
  "duration": "245ms",
  "method": "escpos",
  "type": "network"
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": "Invalid base64 data provided",
  "duration": "12ms"
}
```

---

### 5. Print to Multiple Printers
```
POST /print-multi
Content-Type: application/json
```

**Request Body:**
```json
{
  "data": "base64_encoded_escpos_data",
  "sequential": false
}
```

**Parameters:**
- `data` (string, required): Base64 encoded ESC/POS data
- `sequential` (boolean, optional): 
  - `false` (default): Send to all printers simultaneously
  - `true`: Send one by one (prevents network congestion)

**Example - Simultaneous:**
```bash
curl -X POST http://localhost:6001/print-multi \
  -H "Content-Type: application/json" \
  -d '{"data":"G1BYCg==","sequential":false}'
```

**Example - Sequential:**
```bash
curl -X POST http://localhost:6001/print-multi \
  -H "Content-Type: application/json" \
  -d '{"data":"G1BYCg==","sequential":true}'
```

**Response (All Success):**
```json
{
  "success": true,
  "duration": "456ms",
  "totalPrinters": 2,
  "successCount": 2,
  "failureCount": 0,
  "results": [
    {
      "success": true,
      "printerIndex": 1,
      "ip": "192.168.1.100",
      "port": 9100,
      "message": "Printer 1 (192.168.1.100) printed successfully"
    },
    {
      "success": true,
      "printerIndex": 2,
      "ip": "192.168.1.101",
      "port": 9100,
      "message": "Printer 2 (192.168.1.101) printed successfully"
    }
  ],
  "message": "✅ All printers printed successfully"
}
```

**Response (Partial Failure):**
```json
{
  "success": false,
  "duration": "500ms",
  "totalPrinters": 2,
  "successCount": 1,
  "failureCount": 1,
  "results": [
    {
      "success": true,
      "printerIndex": 1,
      "ip": "192.168.1.100",
      "port": 9100,
      "message": "Printer 1 (192.168.1.100) printed successfully"
    },
    {
      "success": false,
      "printerIndex": 2,
      "ip": "192.168.1.101",
      "port": 9100,
      "error": "Failed to open device: ECONNREFUSED"
    }
  ],
  "message": "⚠️  Partial success - Success: [192.168.1.100], Failed: [192.168.1.101]"
}
```

---

### 6. Print to Two Specific IP Addresses
```
POST /print-two-ip
Content-Type: application/json
```

**Request Body:**
```json
{
  "data": "base64_encoded_escpos_data",
  "ip1": "192.168.1.100",
  "ip2": "192.168.1.101",
  "port1": 9100,
  "port2": 9100
}
```

**Parameters:**
- `data` (string, required): Base64 encoded ESC/POS data
- `ip1` (string, required): First printer IP address
- `ip2` (string, required): Second printer IP address
- `port1` (number, optional): Port for first printer (default: 9100)
- `port2` (number, optional): Port for second printer (default: 9100)

**Example:**
```bash
curl -X POST http://localhost:6001/print-two-ip \
  -H "Content-Type: application/json" \
  -d '{
    "data": "G1BYCg==",
    "ip1": "192.168.1.100",
    "ip2": "192.168.1.101",
    "port1": 9100,
    "port2": 9100
  }'
```

**Response:**
```json
{
  "success": true,
  "duration": "512ms",
  "totalPrinters": 2,
  "successCount": 2,
  "failureCount": 0,
  "results": [
    {
      "success": true,
      "printerIndex": 1,
      "ip": "192.168.1.100",
      "port": 9100,
      "message": "Printer 1 (192.168.1.100) printed successfully"
    },
    {
      "success": true,
      "printerIndex": 2,
      "ip": "192.168.1.101",
      "port": 9100,
      "message": "Printer 2 (192.168.1.101) printed successfully"
    }
  ],
  "message": "✅ All printers printed successfully"
}
```

---

## Usage Examples

### Node.js Client

```javascript
const axios = require('axios');

const API_URL = 'http://localhost:6001';

// Single printer
async function printSingle(escposData) {
  const response = await axios.post(`${API_URL}/print`, {
    data: Buffer.from(escposData).toString('base64')
  });
  console.log(response.data);
}

// Multiple printers (simultaneous)
async function printMulti(escposData) {
  const response = await axios.post(`${API_URL}/print-multi`, {
    data: Buffer.from(escposData).toString('base64'),
    sequential: false
  });
  console.log(response.data);
}

// Two specific IPs
async function printTwoIP(escposData, ip1, ip2) {
  const response = await axios.post(`${API_URL}/print-two-ip`, {
    data: Buffer.from(escposData).toString('base64'),
    ip1: ip1,
    ip2: ip2,
    port1: 9100,
    port2: 9100
  });
  console.log(response.data);
}

// Get status
async function getStatus() {
  const response = await axios.get(`${API_URL}/status`);
  console.log(response.data);
}
```

### JavaScript (Fetch API)

```javascript
// Print to multiple printers
async function printKOT(kotData) {
  const response = await fetch('http://localhost:6001/print-multi', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      data: kotData,
      sequential: false
    })
  });
  
  const result = await response.json();
  
  if (result.success) {
    console.log('✅ KOT sent to all printers');
  } else if (result.successCount > 0) {
    console.log(`⚠️  KOT sent to ${result.successCount} printers`);
  } else {
    console.log('❌ Failed to send KOT');
  }
}
```

### Python

```python
import requests
import base64

API_URL = 'http://localhost:6001'

def print_multi(escpos_data, sequential=False):
    response = requests.post(
        f'{API_URL}/print-multi',
        json={
            'data': base64.b64encode(escpos_data).decode(),
            'sequential': sequential
        }
    )
    return response.json()

def print_two_ip(escpos_data, ip1, ip2, port1=9100, port2=9100):
    response = requests.post(
        f'{API_URL}/print-two-ip',
        json={
            'data': base64.b64encode(escpos_data).decode(),
            'ip1': ip1,
            'ip2': ip2,
            'port1': port1,
            'port2': port2
        }
    )
    return response.json()
```

---

## Error Handling

### Common Errors

**1. Invalid Base64**
```json
{
  "success": false,
  "error": "Invalid base64 data provided",
  "duration": "5ms"
}
```

**2. Printer Not Connected**
```json
{
  "success": false,
  "error": "Failed to open device: ECONNREFUSED",
  "duration": "3500ms"
}
```

**3. Missing Required Field**
```json
{
  "success": false,
  "error": "Missing required fields: data, ip1, ip2"
}
```

**4. Printer Manager Not Initialized**
```json
{
  "success": false,
  "error": "Printer manager not initialized"
}
```

---

## Status Codes

- `200 OK` - Request successful
- `400 Bad Request` - Invalid data or missing fields
- `500 Internal Server Error` - Server or printer error

---

## Performance Tips

1. **Simultaneous Printing**: Use for fast networks
   ```json
   {"sequential": false}
   ```

2. **Sequential Printing**: Use for slow networks or multiple printers
   ```json
   {"sequential": true}
   ```

3. **Custom Timeouts**: Configure in .env
   ```bash
   PRINTER_TIMEOUT=10000  # 10 seconds
   ```

4. **Retry Logic**: Configure in .env
   ```bash
   PRINTER_RETRY_ATTEMPTS=3
   PRINTER_RETRY_DELAY=500
   ```

---

## Troubleshooting

### Printer Not Found
1. Check printer IP address
2. Verify network connectivity: `ping <printer_ip>`
3. Verify port: `telnet <printer_ip> 9100`
4. Check .env configuration

### Connection Timeout
1. Increase `PRINTER_TIMEOUT` in .env
2. Use sequential mode: `sequential: true`
3. Check network latency

### Partial Failures
- Check `results` array for which printers failed
- Verify all printer IPs are correct
- Test each printer individually

---

## Service Control

### Windows Service

```bash
# Install
npm run install-service

# Start
npm run start-service

# Stop
npm run stop-service

# View logs
Get-Content service.log -Tail 100 -Wait
```

### Direct Execution

```bash
# Start server
npm start

# Start in debug mode
npm run dev
```

---

## Supported Printers

- EPSON TM series (TM-P80, TM-U220, TM-T88)
- Star Micronics (StarPRNT)
- Zebra printers
- Generic ESC/POS printers
- USB printers
- Network thermal printers
