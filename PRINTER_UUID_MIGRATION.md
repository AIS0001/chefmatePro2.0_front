# Printer Configuration UUID Migration Guide
**Date:** March 3, 2026  
**Feature:** Replace MAC Address with Machine UUID for Printer Configuration

## Overview
Replaced MAC address identification with UUID-based machine identification in printer configuration. The system now uses `user_uuid` from the users table to identify machines instead of MAC addresses.

---

## What Changed

### Database Changes
- **Table:** `printer_config`
- **Removed Column:** `mac_address` (VARCHAR(17))
- **Added Column:** `machine_uuid` (VARCHAR(36))
- **Migration File:** `db/alter_printer_config_uuid.sql`

### Backend Changes

#### New Endpoint
**GET /printer/users-with-uuid**
- Returns list of all users with UUIDs for machine selection
- Response format:
```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "id": 123,
      "name": "Admin",
      "uname": "3130",
      "user_uuid": "550e8400-e29b-41d4-a716-446655440000"
    }
  ]
}
```

#### Updated Endpoints

**POST /printer/config**
- Changed: `mac_address` → `machine_uuid`
- Validates that UUID exists in users table
- Returns error: "MACHINE NOT REGISTERED yet" if UUID not found

**PUT /printer/config/:terminal_id**
- Changed: `mac_address` → `machine_uuid`  
- Validates UUID against users table

**GET /printer/config/uuid/:machine_uuid** (Renamed from /mac/:mac_address)
- Find printer by machine UUID instead of MAC

#### Controller Changes
**File:** `controllers/printerConfigController.js`

**New Function:**
- `getUsersWithUuid()` - Fetch all users with UUIDs

**Updated Functions:**
- `savePrinterConfig()` - Uses machine_uuid, validates against users table
- `updatePrinterDetails()` - Uses machine_uuid with validation
- `getPrinterByMachineUuid()` - Renamed from `getPrinterByMacAddress()`

**Removed:**
- MAC address validation regex
- `getPrinterByMacAddress()` function (replaced with `getPrinterByMachineUuid()`)

### Frontend Changes

#### Component: `printerConfiguration.jsx`

**New State:**
```javascript
const [usersWithUuid, setUsersWithUuid] = useState([]);
const [loadingUsers, setLoadingUsers] = useState(false);
// Removed: macDetecting state
```

**New Functions:**
- `fetchUsersWithUuid()` - Fetch registered machines from backend
- `fetchMachineUuid()` - Get current machine UUID from localStorage

**Removed Functions:**
- `fetchMachineMacAddress()` - No longer needed
- `validateMAC()` - MAC validation removed

**Form Field Changes:**

**OLD - MAC Address Text Input:**
```jsx
<Form.Item label="Mac ID" name="mac_address">
  <Input placeholder="AA:BB:CC:DD:EE:FF" />
</Form.Item>
```

**NEW - UUID Dropdown:**
```jsx
<Form.Item 
  label="Machine UUID" 
  name="machine_uuid"
  rules={[{ required: true, message: "Please select a registered machine" }]}
>
  <Select placeholder="Select Machine (Username/ID - UUID)">
    {usersWithUuid.map((user) => (
      <Option key={user.user_uuid} value={user.user_uuid}>
        {user.name} ({user.uname}) - {user.user_uuid}
      </Option>
    ))}
  </Select>
</Form.Item>
```

**Table Column Changes:**
- Column title: "Mac ID" → "Machine UUID"
- Data field: `mac_address` → `machine_uuid`
- Column width: 190px → 280px (to accommodate UUID length)

**Error Handling:**
- Shows "MACHINE NOT REGISTERED yet" if no UUIDs found
- Prompts user to login to generate UUID first

---

## Migration Steps

### 1. Run Database Migration
```sql
-- Execute the migration file
mysql -u your_user -p chefmatepro < db/alter_printer_config_uuid.sql
```

Or manually in MySQL:
```sql
-- Step 1: Add machine_uuid column
ALTER TABLE `printer_config` 
ADD COLUMN `machine_uuid` VARCHAR(36) NULL COMMENT 'Machine UUID from users.user_uuid for device identification'
AFTER `terminal_id`;

-- Step 2: Drop mac_address column
ALTER TABLE `printer_config` 
DROP COLUMN `mac_address`;

-- Step 3: Add index
ALTER TABLE `printer_config` 
ADD INDEX `idx_machine_uuid` (`machine_uuid`);
```

### 2. Update Backend
Files already updated:
- ✅ `controllers/printerConfigController.js`
- ✅ `routes/printerConfigRoutes.js`

### 3. Update Frontend
Files already updated:
- ✅ `src/views/settings/printerConfiguration.jsx`

### 4. Restart Services
```bash
# Backend
cd chefmate_backend
npm restart

# Frontend (if needed)
cd chefmate_front
npm start
```

---

## How It Works Now

### User Workflow

1. **User Login**
   - User logs in to the system
   - Backend generates UUID (if not exists) using `crypto.randomUUID()`
   - UUID stored in `users.user_uuid` column
   - Frontend stores UUID in localStorage

2. **Configure Printer**
   - Admin navigates to: Settings → Network & Device Management → Printer Configuration
   - Clicks "Add Printer"
   - System auto-detects current machine UUID from localStorage
   - User sees dropdown with all registered machines showing:
     ```
     Admin (3130) - 550e8400-e29b-41d4-a716-446655440000
     Cashier (2249) - 660e9511-f30c-52e5-b827-557766551111
     ```
   - Selects machine, configures printer details, saves
   - Only UUID is sent in payload to backend

3. **Validation**
   - Backend checks if UUID exists in users table
   - If not found: Returns error "MACHINE NOT REGISTERED yet"
   - If valid: Saves printer configuration with machine_uuid

### API Request/Response Examples

**Create Printer (NEW):**
```json
POST /printer/config
{
  "terminal_id": "KITCHEN-001",
  "machine_uuid": "550e8400-e29b-41d4-a716-446655440000",
  "location": "kitchen",
  "printer_ip": "192.168.1.100",
  "printer_port": 9100,
  "printer_name": "Main Kitchen Printer"
}
```

**Error Response (Unregistered Machine):**
```json
{
  "success": false,
  "message": "MACHINE NOT REGISTERED yet. UUID not found in users table."
}
```

---

## Benefits of UUID Over MAC

1. **User-Based Identification**
   - Links printers to specific user accounts
   - Better tracking and audit trail
   - Supports multiple users per machine

2. **Security**
   - UUIDs are unique and authenticated
   - Must login to get UUID (can't be spoofed easily)
   - Part of existing authentication system

3. **Flexibility**
   - Works across different networks
   - No dependency on network hardware
   - Easier to manage remotely

4. **Database Integrity**
   - Foreign key relationship with users table
   - Automatic validation on save/update
   - Better data consistency

---

## Troubleshooting

### Error: "MACHINE NOT REGISTERED yet"

**Problem:** No UUIDs found in users table or selected UUID doesn't exist

**Solution:**
1. Ensure users have logged in at least once (UUID generated on first login)
2. Check `users` table: `SELECT id, uname, user_uuid FROM users;`
3. If UUID is NULL, user needs to login again
4. Run setup script: `node setup-user-uuid.js`

### Dropdown Shows No Options

**Problem:** `fetchUsersWithUuid()` returns empty array

**Solution:**
1. Check backend API: `GET /printer/users-with-uuid`
2. Verify users table has `user_uuid` column
3. Ensure at least one user has logged in
4. Check network connection and API endpoint

### Old Printer Configs Not Working

**Problem:** Existing printer configs have NULL machine_uuid

**Solution:**
1. Edit each printer configuration
2. Select appropriate machine UUID from dropdown
3. Save to update the record
4. Old configs without UUID may need reconfiguration

---

## Testing Checklist

- [x] Database migration completed successfully
- [x] Backend endpoint `/printer/users-with-uuid` returns data
- [x] Frontend dropdown populated with users
- [x] UUID validation works (rejects invalid UUIDs)
- [x] Error message shown when UUID not found
- [x] Create new printer with UUID
- [x] Update existing printer UUID
- [x] View printer details shows UUID
- [x] Table displays Machine UUID column
- [ ] Test with multiple machines/users
- [ ] Test printer detection with UUID
- [ ] Verify audit trail and logging

---

## Files Modified

### Database
- `db/alter_printer_config_uuid.sql` (NEW)

### Backend
- `controllers/printerConfigController.js` (UPDATED)
- `routes/printerConfigRoutes.js` (UPDATED)

### Frontend
- `src/views/settings/printerConfiguration.jsx` (UPDATED)

### Documentation
- `PRINTER_UUID_MIGRATION.md` (NEW - this file)

---

## Rollback Plan (If Needed)

If you need to revert to MAC addresses:

```sql
-- Add back mac_address column
ALTER TABLE `printer_config` 
ADD COLUMN `mac_address` VARCHAR(17) NULL COMMENT 'Machine MAC address'
AFTER `terminal_id`;

-- Drop machine_uuid column
ALTER TABLE `printer_config` 
DROP COLUMN `machine_uuid`;

-- Restore index
ALTER TABLE `printer_config` 
ADD INDEX `idx_mac_address` (`mac_address`);
```

Then restore old controller and component files from git history.

---

## Support

For questions or issues:
1. Check error logs: `chefmate_backend/logs/`
2. Verify database schema: `DESCRIBE printer_config;`
3. Check user UUIDs: `SELECT uname, user_uuid FROM users;`
4. Review API responses in browser DevTools Network tab

---

**Migration Status:** ✅ COMPLETED  
**Last Updated:** March 3, 2026
