# Device Authentication - Quick Start Guide

## Access Points

### From Application Menu

**Settings Menu:**
- **Device Management** → `/setting/devicemanagement`
- **Device Auth Settings** → `/setting/deviceauthsettings`

**Reports Menu:**
- **Login Attempts** → `/reports/loginattempts`

## Quick Tasks

### 1. Register a Device (2 minutes)

1. Login to ChefMate POS
2. Navigate to **Settings → Device Management**
3. Select user from dropdown
4. Click **"Register New Device"** button
5. Fill in form:
   - **MAC Address**: Format XX:XX:XX:XX:XX:XX or XX-XX-XX-XX-XX-XX
   - **Device Name**: e.g., "Manager Tablet" or "Kitchen Terminal 1"
   - **Device Type**: Select from dropdown (Desktop/Laptop/Tablet/Mobile/Terminal)
6. Click **Submit**
7. Device appears in table with "Active" status

**Example MAC Formats:**
- `00:1B:44:11:3A:B7`
- `00-1B-44-11-3A-B7`
- `001B44113AB7`

### 2. Configure Global Authentication (3 minutes)

1. Navigate to **Settings → Device Auth Settings**
2. Stay on **"Global Settings"** tab
3. Configure options:
   - ✅ Enable MAC Authentication
   - ✅ Allow Multiple Devices
   - Set **Max Devices Per User**: 3
   - ⬜ Block New Devices (leave unchecked)
   - ✅ Require First Device
   - ⬜ Require Admin Approval (optional)
   - ⬜ Allow Device Override (for admin bypass)
   - Set **Session Timeout**: 8 hours
4. Click **"Save Global Settings"**
5. Success message confirms save

**Recommended Settings for Small Restaurant:**
```
Enable MAC Auth: ✅
Allow Multiple Devices: ✅
Max Devices: 2-3
Block New Devices: ⬜
Require First Device: ✅
Admin Approval: ⬜
Device Override: ✅
Session Timeout: 8 hours
```

### 3. Set User-Specific Overrides (1 minute)

1. Navigate to **Settings → Device Auth Settings**
2. Click **"User Settings"** tab
3. Select user from dropdown
4. Modify settings (overrides global)
5. Click **"Save User Settings"**

**Use Case:** Give manager unlimited devices while limiting staff to 1 device each.

### 4. Monitor Login Activity (1 minute)

1. Navigate to **Reports → Login Attempts**
2. View statistics at top:
   - Total login attempts
   - Successful logins
   - Failed attempts
   - Invalid MAC warnings
   - Blocked MAC rejections
3. Use filters:
   - **User**: Select specific user or "All Users"
   - **Status**: All/Success/Failed
   - **Limit**: 10/25/50/100/All records
4. Click **🔄 Refresh** to update data

**Status Colors:**
- 🟢 Green = Successful login
- 🔴 Red = Failed login
- 🟠 Orange = Invalid MAC
- ⚫ Black = Blocked MAC

### 5. Block a Device (30 seconds)

1. Navigate to **Settings → Device Management**
2. Find device in table
3. Click **Edit** icon
4. Change **Status** to "Blocked"
5. Click **Submit**
6. User cannot login from that device anymore

### 6. View Device Statistics (10 seconds)

On **Device Management** page, view cards at top:
- **Total Devices**: All registered devices
- **Active**: Currently enabled devices
- **Inactive**: Disabled but not blocked
- **Blocked**: Permanently blocked devices

## Common Workflows

### Scenario 1: New Employee Setup
```
1. Create user account (Users → New User)
2. Register their device (Settings → Device Management)
3. Set custom limits if needed (Settings → Device Auth Settings → User Settings)
4. Verify login works (Reports → Login Attempts)
```

### Scenario 2: Employee Lost Device
```
1. Go to Settings → Device Management
2. Select the user
3. Find lost device in list
4. Click Edit → Change Status to "Blocked"
5. Register new device if needed
```

### Scenario 3: Security Audit
```
1. Go to Reports → Login Attempts
2. Filter by date range (if implemented)
3. Look for:
   - Multiple failed attempts (red cards)
   - Invalid MAC addresses (suspicious)
   - Unusual login times
   - Unknown IP addresses
4. Block suspicious MACs if needed
```

### Scenario 4: Disable Authentication Temporarily
```
1. Go to Settings → Device Auth Settings
2. Global Settings tab
3. Uncheck "Enable MAC Authentication"
4. Click Save
5. All users can login from any device
6. Re-enable when needed
```

## Keyboard Shortcuts

- **Alt + S** → Settings Menu
- **Alt + R** → Reports Menu
- **Ctrl + F** → Search/Filter (when on table view)
- **Esc** → Close modal/dialog

## API Integration Notes

These UI components work with existing backend APIs at:
```
http://127.0.0.1:4402/api/
```

**Required Backend Endpoints:**
- `/devices/*` - Device CRUD operations
- `/device-auth/settings` - Auth configuration
- `/device-auth/login-attempts` - Audit logs
- `/device-auth/block-mac` - MAC blocking

## Troubleshooting

**Q: Can't register device - "Invalid MAC address"**
A: Use format XX:XX:XX:XX:XX:XX (colons or hyphens)

**Q: Settings not saving**
A: Check browser console for errors, verify backend is running

**Q: Login attempts page empty**
A: Backend must log login events to database

**Q: User locked out after enabling MAC auth**
A: Admin can use "Device Override" setting to bypass temporarily

**Q: How to find MAC address?**
A: 
- Windows: `ipconfig /all` → Physical Address
- Mac: System Preferences → Network → Advanced
- Linux: `ifconfig` or `ip addr`

## Security Best Practices

1. ✅ **Enable MAC Authentication** for production
2. ✅ **Limit devices per user** to prevent sharing
3. ✅ **Require first device** registration
4. ✅ **Monitor login attempts** regularly
5. ✅ **Block suspicious MACs** immediately
6. ✅ **Set reasonable session timeout** (4-12 hours)
7. ⬜ **Enable admin approval** if high security needed
8. ✅ **Keep audit logs** for compliance

## Performance Tips

1. Use filters on Login Attempts to limit results
2. Set appropriate result limits (default 50)
3. Regularly clean old login attempts from database
4. Archive blocked devices after 90 days

## Mobile Access

All pages are responsive and work on:
- Desktop browsers
- Tablets
- Mobile phones (portrait/landscape)

**Recommended:** Use tablet for device management on the floor.

## Support

For issues or questions:
1. Check console for error messages
2. Verify backend API connectivity
3. Review audit logs for clues
4. Check user permissions

---

**Quick Access URLs:**
- Device Management: `http://localhost:3000/setting/devicemanagement`
- Auth Settings: `http://localhost:3000/setting/deviceauthsettings`
- Login Attempts: `http://localhost:3000/reports/loginattempts`
