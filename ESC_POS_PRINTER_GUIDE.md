# ESC/POS Auto-Detect Printer - Implementation Guide

## Overview
This system provides automatic printer detection and KOT (Kitchen Order Ticket) printing using the ESC/POS protocol. The printer is detected based on location (kitchen/cashier) and automatically configured via the backend API.

## Architecture

```
Frontend (POS.jsx)
    ↓
GET /api/printer/detect?type=kitchen
    ↓
Backend (printerConfigController.js)
    ├→ Detect Machine MAC
    ├→ Match against printer_config table
    └→ Return {printer_ip, printer_port, terminal_id, ...}
    ↓
Local Printing Agent (127.0.0.1:3001)
    ↓
ESC/POS Printer
```

---

## Files Created

### 1. Service Layer
**File**: `src/services/escPosAutoDetectPrinter.js`

Core printing service with three main functions:
- `printKOT(kotData, location)` - Print by location type
- `printKOTByMac(kotData, macAddress)` - Print by specific MAC
- `prepareKOTData(orderData)` - Format order data for printing

### 2. Button Component
**File**: `src/components/ESCPosAutoDetectButton.jsx`

Pre-built React button with:
- Location selector (Kitchen/Cashier)
- Auto-detect printer functionality
- Loading states and error handling
- Popover UI for printer selection

### 3. Custom Hook
**File**: `src/hooks/useESCPosPrinter.js`

React hook for programmatic usage:
- State management for loading/error
- Reusable in any component
- Tracks last printed data

---

## Usage Examples

### Example 1: Using the Button Component (Recommended for POS)

```jsx
import React, { useState } from 'react';
import ESCPosAutoDetectButton from '../components/ESCPosAutoDetectButton';

export default function OrderScreen() {
  const [orderData, setOrderData] = useState({
    id: 'ORD-001',
    order_number: '1',
    table_number: '5',
    items: [
      { item_name: 'Biryani', quantity: 2, special_instructions: 'Extra spicy' },
      { item_name: 'Dal Makhani', quantity: 1 }
    ]
  });

  return (
    <div>
      {/* Existing order UI */}
      
      {/* ESC/POS Button */}
      <ESCPosAutoDetectButton
        orderData={orderData}
        onPrintSuccess={() => console.log('✅ Print successful')}
        size="middle"
        buttonType="primary"
      />
    </div>
  );
}
```

---

### Example 2: Using the Custom Hook (For Advanced Control)

```jsx
import React from 'react';
import { Button, Space, message } from 'antd';
import { PrinterOutlined } from '@ant-design/icons';
import useESCPosPrinter from '../hooks/useESCPosPrinter';

export default function AdvancedPrintingComponent({ orderData }) {
  const { loading, error, printKOT, printKOTByMac } = useESCPosPrinter();

  const handlePrintToKitchen = async () => {
    try {
      const success = await printKOT(orderData, 'kitchen');
      if (success) {
        message.success('✅ Printed to Kitchen!');
      }
    } catch (err) {
      message.error(`❌ ${err.message}`);
    }
  };

  const handlePrintToCashier = async () => {
    try {
      const success = await printKOT(orderData, 'cashier');
      if (success) {
        message.success('✅ Printed to Cashier!');
      }
    } catch (err) {
      message.error(`❌ ${err.message}`);
    }
  };

  return (
    <Space>
      <Button
        type="primary"
        icon={<PrinterOutlined />}
        onClick={handlePrintToKitchen}
        loading={loading}
      >
        🍳 Kitchen
      </Button>
      <Button
        icon={<PrinterOutlined />}
        onClick={handlePrintToCashier}
        loading={loading}
      >
        💰 Cashier
      </Button>
    </Space>
  );
}
```

---

### Example 3: Direct Service Usage

```jsx
import escPosAutoDetectService from '../services/escPosAutoDetectPrinter';

// Prepare KOT data
const kotData = escPosAutoDetectService.prepareKOTData(orderData);

// Print to kitchen (auto-detect)
const success = await escPosAutoDetectService.printKOT(kotData, 'kitchen');

// Or print by specific MAC address
const successByMac = await escPosAutoDetectService.printKOTByMac(
  kotData,
  '00:1A:2B:3C:4D:5E'
);
```

---

## Backend API Endpoints

### 1. Detect Printer by Location
```
GET /api/printer/detect?type=kitchen
```

**Response:**
```json
{
  "success": true,
  "message": "Printer detected successfully (matched by MAC address)",
  "data": {
    "id": 1,
    "terminal_id": "KITCHEN-001",
    "mac_address": "00:1A:2B:3C:4D:5E",
    "location": "kitchen",
    "printer_ip": "192.168.1.100",
    "printer_port": 9100,
    "printer_name": "Main Kitchen",
    "detection_method": "mac_address",
    "client_ip": "192.168.1.50",
    "client_mac": "00:1A:2B:3C:4D:5E"
  }
}
```

### 2. Get Printer by MAC (Local Agent)
```
GET /api/printer/agent/detect?mac_address=00:1A:2B:3C:4D:5E
```

**Response:**
```json
{
  "success": true,
  "message": "Printer configuration found",
  "data": {
    "printer_id": 1,
    "terminal_id": "KITCHEN-001",
    "location": "kitchen",
    "printer_ip": "192.168.1.100",
    "printer_port": 9100,
    "printer_name": "Main Kitchen",
    "mac_address": "00:1A:2B:3C:4D:5E",
    "status": "active"
  }
}
```

---

## Local Printing Agent Integration

The system requires a local Node.js agent running on port 3001 to receive print jobs.

### Expected Print Endpoint
```
POST http://127.0.0.1:3001/print-kot
```

**Request Payload:**
```json
{
  "printer_ip": "192.168.1.100",
  "printer_port": 9100,
  "terminal_id": "KITCHEN-001",
  "type": "KOT",
  "location": "kitchen",
  "mac_address": "00:1A:2B:3C:4D:5E",
  "timestamp": "2025-03-03T10:30:45.123Z",
  "data": {
    "order_id": "ORD-001",
    "order_number": "1",
    "table_number": "5",
    "customer_name": "Walk-in",
    "items": [
      {
        "item_name": "Biryani",
        "quantity": 2,
        "special_instructions": "Extra spicy",
        "category": "Rice"
      }
    ],
    "timestamp": "3/3/2025, 10:30:45 AM",
    "special_notes": "",
    "delivery_type": "Dine-in"
  }
}
```

### Expected Response
```json
{
  "success": true,
  "message": "KOT printed successfully",
  "data": {
    "printer_ip": "192.168.1.100",
    "printer_port": 9100,
    "terminal_id": "KITCHEN-001",
    "print_id": "PRINT-123456",
    "timestamp": "2025-03-03T10:30:45.123Z",
    "bytes_sent": 1024,
    "print_time": 2500
  }
}
```

---

## Error Handling

### Common Error Scenarios

| Error | Cause | Solution |
|-------|-------|----------|
| "No kitchen printer configured!" | Printer config not in database | Add printer config via Printer Configuration page |
| "Local printing agent not running" | Port 3001 not responding | Start local printing agent |
| "Print job timed out" | Printer offline or unreachable | Check printer IP/network connectivity |
| "No printer found for MAC" | MAC not configured | Register printer MAC in system |

---

## Order Data Format

The component accepts order data with this structure:

```javascript
{
  // Required fields
  id: string,
  items: [
    {
      item_name: string,
      quantity: number,
      // Optional
      special_instructions?: string,
      category?: string
    }
  ],

  // Optional fields
  order_number?: string,
  queue_number?: string,
  table_number?: string | number,
  table?: string | number,
  customer_name?: string,
  customer?: string,
  special_notes?: string,
  notes?: string,
  delivery_type?: string  // "Dine-in", "Takeaway", "Delivery"
}
```

---

## Configuration

All printers are configured via the **Printer Configuration** page in Settings:
- Go to: Settings → Printer Configuration
- Add printer with Terminal ID, IP, Port, and Location
- MAC address auto-detected from system
- System will auto-match based on MAC first, then location

---

## Testing

### Test with curl
```bash
# Detect kitchen printer
curl "http://127.0.0.1:4402/api/printer/detect?type=kitchen"

# Get by MAC
curl "http://127.0.0.1:4402/api/printer/agent/detect?mac_address=00:1A:2B:3C:4D:5E"
```

### Test from Browser Console
```javascript
// Import and test service
const service = await import('/src/services/escPosAutoDetectPrinter.js');
const kotData = {
  order_id: 'TEST-001',
  items: [{ item_name: 'Test Item', quantity: 1 }]
};
await service.default.printKOT(kotData, 'kitchen');
```

---

## Integration with newPOS.jsx

To add the button to your POS system:

```jsx
import ESCPosAutoDetectButton from '../components/ESCPosAutoDetectButton';

// In your POS component render:
<ESCPosAutoDetectButton
  orderData={currentOrder}
  onPrintSuccess={() => {
    console.log('Order printed successfully');
    // Refresh items, mark as sent, etc.
  }}
/>
```

---

## Security Notes

⚠️ **Important:**
- Local printing agent should only listen on localhost (127.0.0.1)
- Implement proper authentication in production
- Validate all printer configurations before printing
- Log all print operations for audit trail
- Use MAC address filtering for sensitive locations

---

## Next Steps

1. ✅ Set up printer configurations in Settings → Printer Configuration
2. ✅ Start local printing agent on port 3001
3. ✅ Add ESCPosAutoDetectButton to POS screen
4. ✅ Test with sample orders
5. ✅ Monitor logs for any issues

---

## Support

For issues with:
- **Printer detection**: Check `/settings/printerconfig` page
- **Print job failure**: Check local agent logs
- **Network connectivity**: Verify printer IP/port in config
- **MAC detection**: Check device authentication system

