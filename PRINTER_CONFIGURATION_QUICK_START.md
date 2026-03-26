# Printer Configuration - Quick Start Guide

## 🚀 Quick Access

**URL:** `http://localhost:3000/setting/printerconfiguration`

**Menu Path:** Settings → Printer Configuration

---

## ⚡ Quick Actions

### Add First Printer (Kitchen)
1. Click **"Add Printer"** button
2. Fill in:
   ```
   Terminal ID: KITCHEN-001
   Location: Kitchen
   Printer Name: Main Kitchen Printer
   Printer IP: 192.168.1.100
   Port: 9100
   Status: Active
   ```
3. Click **"Create"**

### Add First Printer (Cashier)
1. Click **"Add Printer"** button
2. Fill in:
   ```
   Terminal ID: CASHIER-001
   Location: Cashier
   Printer Name: Receipt Printer
   Printer IP: 192.168.1.101
   Port: 9100
   Status: Active
   ```
3. Click **"Create"**

---

## 📊 Page Layout

```
┌─────────────────────────────────────────────────────────┐
│  Header: Printer Configuration                          │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  [Total] [Kitchen] [Cashier] [Active] [Inactive]       │
│   Stats   Stats     Stats     Stats    Stats           │
│                                                          │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Printer Configurations                                 │
│                                                          │
│  [All] [Kitchen] [Cashier]  [Refresh] [Add Printer]    │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │ Terminal ID │ Location │ Name │ IP │ Actions  │    │
│  ├────────────────────────────────────────────────┤    │
│  │ KITCHEN-001 │ Kitchen  │ ... │ ... │ [V][E][D]│    │
│  │ CASHIER-001 │ Cashier  │ ... │ ... │ [V][E][D]│    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
└─────────────────────────────────────────────────────────┘

[V] = View   [E] = Edit   [D] = Delete
```

---

## 🎯 Common Tasks

### Task 1: View All Kitchen Printers
1. Click **"Kitchen"** radio button
2. Table filters to show only kitchen printers

### Task 2: Change Printer IP
1. Click **Edit** icon (pencil) on the printer row
2. Update **Printer IP** field
3. Click **"Update"**

### Task 3: Deactivate Printer (Don't Delete)
1. Click **Edit** icon on the printer row
2. Change **Status** to "Inactive"
3. Click **"Update"**

### Task 4: See Full Printer Details
1. Click **View** icon (eye) on the printer row
2. Review all information
3. Click **"Edit"** to modify or **"Close"**

### Task 5: Delete Old Printer
1. Click **Delete** icon (trash) on the printer row
2. Confirm deletion in popup
3. Printer is permanently removed

---

## ✅ Validation Rules

| Field | Rules |
|-------|-------|
| Terminal ID | Required, Uppercase, Alphanumeric + hyphens/underscores, Unique |
| Location | Required, Must be "kitchen" or "cashier" |
| Printer Name | Optional, Any text |
| Printer IP | Required, Valid IPv4 (xxx.xxx.xxx.xxx), Each part 0-255 |
| Port | Required, Number, Default: 9100 |
| Status | Required, "active" or "inactive" |

---

## 🎨 Visual Indicators

### Location Tags
- 🟠 **Orange Badge** = Kitchen
- 🔵 **Blue Badge** = Cashier

### Status Badges
- 🟢 **Green Dot** = Active
- 🔴 **Red Dot** = Inactive

### Port Tags
- 🔹 **Cyan Tag** = Port number

---

## 📱 Integration with POS

After configuring printers here, use in your POS system:

```javascript
// In your POS component
import printerConfigService from '../services/printerConfigService';

// Get printer for current terminal
const printer = await printerConfigService.getPrinterByTerminalId('KITCHEN-001');

// Use printer IP and port
const { printer_ip, printer_port } = printer.data;
console.log(`Connect to: ${printer_ip}:${printer_port}`);

// Initialize ESC/POS printer
const escposPrinter = new NetworkPrinter(printer_ip, printer_port);
```

---

## 🔍 Filtering & Search

### By Location
- **All** - Shows all printers (default)
- **Kitchen** - Only kitchen printers
- **Cashier** - Only cashier printers

### Table Features
- **Pagination** - 10 printers per page (adjustable)
- **Total Count** - Displayed at bottom
- **Sorting** - Click column headers to sort

---

## 💡 Tips & Tricks

1. **Use Descriptive Names**
   - Bad: "Printer 1"
   - Good: "Kitchen Main Printer - Ground Floor"

2. **Terminal ID Convention**
   - Format: `LOCATION-NUMBER`
   - Example: `KITCHEN-001`, `CASHIER-MAIN`

3. **Static IPs Only**
   - Always use static IP addresses for printers
   - DHCP can cause IP changes

4. **Test Before Activating**
   - Verify printer is reachable
   - Ping IP address first
   - Print test page

5. **Don't Delete, Deactivate**
   - Instead of deleting, set status to "inactive"
   - Preserves configuration history
   - Easy to reactivate later

---

## ⚠️ Common Errors

### "Terminal ID already configured"
**Cause:** Duplicate terminal ID  
**Solution:** Use a different terminal ID or delete the existing one

### "Invalid printer IP format"
**Cause:** IP not in xxx.xxx.xxx.xxx format  
**Solution:** Enter valid IPv4 address (e.g., 192.168.1.100)

### "IP address parts must be between 0-255"
**Cause:** Number in IP is > 255  
**Solution:** Each part must be 0-255 (e.g., 192.168.1.256 is invalid)

### "Failed to fetch printer configurations"
**Cause:** Backend not running or network issue  
**Solution:** Check backend server is running on port 4402

---

## 🔧 Backend Requirements

Ensure backend is running with these endpoints:
- `GET /api/printer/config` - Get all printers
- `GET /api/printer/config/:terminal_id` - Get specific printer
- `GET /api/printer/location/:location` - Get by location
- `POST /api/printer/config` - Create printer
- `PUT /api/printer/config/:terminal_id` - Update printer
- `DELETE /api/printer/config/:terminal_id` - Delete printer

---

## 📞 Need Help?

1. **Page Not Loading?**
   - Check if backend is running
   - Verify route is correct: `/setting/printerconfiguration`
   - Check browser console for errors

2. **Cannot Add Printer?**
   - Review validation rules above
   - Check backend logs
   - Ensure database connection is active

3. **Printers Not Showing?**
   - Click **"Refresh"** button
   - Check location filter setting
   - Verify status is "active"

---

## 📚 Documentation Links

- **Backend API:** See `PRINTER_CONFIG_API.md`
- **Quick Reference:** See `PRINTER_CONFIG_QUICK_REFERENCE.md`
- **Full Frontend Docs:** See `PRINTER_CONFIGURATION_FRONTEND.md`

---

## ✨ Example Setup (Restaurant)

```
Kitchen Setup:
├── KITCHEN-001 (Main Grill) - 192.168.1.100:9100
├── KITCHEN-002 (Prep Station) - 192.168.1.101:9100
└── KITCHEN-003 (Pastry) - 192.168.1.102:9100

Cashier Setup:
├── CASHIER-001 (Counter 1) - 192.168.1.110:9100
├── CASHIER-002 (Counter 2) - 192.168.1.111:9100
└── CASHIER-BACKUP (Backup) - 192.168.1.112:9100 [Inactive]
```

---

**Last Updated:** March 2, 2026  
**Version:** 1.0.0
