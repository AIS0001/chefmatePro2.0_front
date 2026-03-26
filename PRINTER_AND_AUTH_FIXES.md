# Printer & Device Auth Fixes - Summary

## Issues Fixed

### 1. ✅ Printer Test Print - Padding & Paper Cut

**Problem:** Printer test had insufficient bottom padding and needed paper cut confirmation.

**Solution:** Updated test print function in [print-server1/server-escpos.js](print-server1/server-escpos.js#L254-L265)

**Changes Made:**
- Increased bottom padding from 3 lines (`\n\n\n`) to 6 lines (`\n\n\n\n\n\n`)
- Confirmed paper cut command is present: `0x1D, 0x56, 0x42, 0x00` (full cut)
- Added comment to clarify it's a full cut

**Code Updated:**
```javascript
// Simple ESC/POS test receipt
const escpos = Buffer.from([
  0x1B, 0x40,        // Initialize
  0x1B, 0x61, 0x01,  // Center align
  ...Buffer.from('*** TEST PRINT ***\n'),
  0x1B, 0x61, 0x00,  // Left align
  ...Buffer.from(`Printer: ${printer.name}\n`),
  ...Buffer.from(`IP: ${printer.ip}:${printer.port}\n`),
  ...Buffer.from(`Time: ${new Date().toLocaleString()}\n`),
  ...Buffer.from('\n\n\n\n\n\n'),  // Extra padding at bottom (6 lines)
  0x1D, 0x56, 0x42, 0x00  // Cut paper (full cut)
]);
```

**Result:** 
- More empty space before cut for cleaner tear-off
- Paper automatically cuts after printing completes
- Professional-looking test receipts

---

### 2. ✅ Device Authentication Database Error

**Problem:** Backend showing error:
```
sql: 'SELECT * FROM device_auth_settings WHERE user_id IS NULL',
sqlState: '42S02',
sqlMessage: "Table 'chefmatepro.device_auth_settings' doesn't exist"
```

**Solution:** Ran database setup script to create all required tables.

**Command Executed:**
```bash
cd d:\Projects\chefmate_pro_2.0\chefmate_backend
node setup-device-auth.js
```

**Tables Created:**
1. ✅ `user_devices` - Store registered devices per user
2. ✅ `device_auth_settings` - Global and per-user auth settings
3. ✅ `login_attempts` - Audit trail of login attempts
4. ✅ `blocked_mac_addresses` - Blocked MAC addresses

**Setup Output:**
```
📋 Starting Device Authentication Setup...

Creating table: user_devices...
Creating table: device_auth_settings...
Creating table: login_attempts...
Creating table: blocked_mac_addresses...
✅ All tables created successfully!

Inserting global device authentication settings...
✅ Global settings configured!

🎉 Device Authentication Setup Complete!
```

**Global Settings Configured:**
- `enable_mac_auth`: TRUE
- `allow_multiple_devices`: TRUE
- `max_devices_per_user`: 3

---

## Testing Instructions

### Test Printer Padding & Cut

1. Ensure print server is running:
   ```bash
   cd d:\Projects\chefmate_pro_2.0\chefmate_front\print-server1
   node server-escpos.js
   ```

2. From the React app:
   - Navigate to **Settings → Printer Configuration**
   - Click the **IP icon** (ApiOutlined) next to any printer
   - Observe test print output

3. Expected Result:
   - Test receipt prints with printer info
   - 6 blank lines at bottom
   - Paper automatically cuts

### Verify Device Auth Tables

1. Check MySQL database:
   ```sql
   USE chefmatepro;
   SHOW TABLES LIKE '%device%';
   SHOW TABLES LIKE '%login_attempts%';
   SHOW TABLES LIKE '%blocked_mac%';
   ```

2. Verify global settings:
   ```sql
   SELECT * FROM device_auth_settings WHERE user_id IS NULL;
   ```

3. Expected Result:
   - All 4 tables exist
   - Global settings row present with `enable_mac_auth = 1`

### Access Device Auth Features

1. Navigate to **Settings → Device Management**
   - Register devices for users
   - View device statistics

2. Navigate to **Settings → Device Auth Settings**
   - Configure global authentication rules
   - Set per-user overrides

3. Navigate to **Reports → Login Attempts**
   - View login audit trail
   - Monitor failed login attempts

---

## Files Modified

### Frontend
- ✅ `print-server1/server-escpos.js` - Updated test print with padding and cut

### Backend
- ✅ Database tables created via `setup-device-auth.js`

---

## Next Steps

1. **Restart Print Server** (if running):
   ```bash
   # Stop existing server (Ctrl+C)
   cd d:\Projects\chefmate_pro_2.0\chefmate_front\print-server1
   node server-escpos.js
   ```

2. **Test Print Function**:
   - Test the printer IP icon click
   - Verify 6 lines of padding appear
   - Confirm paper cuts automatically

3. **Restart Backend** (if needed):
   ```bash
   cd d:\Projects\chefmate_pro_2.0\chefmate_backend
   npm start
   # or
   node server.js
   ```

4. **Verify Device Auth**:
   - Access Device Management page
   - Should load without database errors
   - Register a test device

---

## ESC/POS Commands Reference

The test print now uses:

| Command | Bytes | Description |
|---------|-------|-------------|
| Initialize | `0x1B, 0x40` | Reset printer settings |
| Center align | `0x1B, 0x61, 0x01` | Align text center |
| Left align | `0x1B, 0x61, 0x00` | Align text left |
| Line feed | `\n` | New line (6 times for padding) |
| Full cut | `0x1D, 0x56, 0x42, 0x00` | Cut paper completely |

**Paper Cut Variants:**
- Full cut: `0x1D, 0x56, 0x42, 0x00` (currently used)
- Partial cut: `0x1D, 0x56, 0x41, 0x00`
- Feed and cut: `0x1D, 0x56, 0x00` (some printers)

---

## Troubleshooting

### Print Server Issues

**Q: Paper doesn't cut**
A: Some printers need different cut commands. Try:
```javascript
0x1D, 0x56, 0x00  // Feed and full cut
// or
0x1D, 0x56, 0x41, 0x00  // Partial cut
```

**Q: Not enough padding**
A: Increase newlines in server-escpos.js line 263:
```javascript
...Buffer.from('\n\n\n\n\n\n\n\n'),  // 8 lines instead of 6
```

### Database Issues

**Q: Still getting "table doesn't exist" error**
A: Verify database name in backend config matches:
```bash
# Check .env file
cat .env | grep DB_NAME
# Should be: DB_NAME=chefmatepro
```

**Q: Setup script fails**
A: Check database connection:
```bash
node -e "require('./config/dbconnection').db.query('SELECT 1')"
```

---

## Configuration Files

### Print Server Location
```
d:\Projects\chefmate_pro_2.0\chefmate_front\print-server1\server-escpos.js
```

### Database Setup Script
```
d:\Projects\chefmate_pro_2.0\chefmate_backend\setup-device-auth.js
```

### Documentation
- Device Auth Implementation: `DEVICE_AUTHENTICATION_IMPLEMENTATION.md`
- Quick Start Guide: `DEVICE_AUTH_QUICK_START.md`

---

**Status:** ✅ Both issues resolved
**Date:** March 2, 2026
**Version:** Production ready
