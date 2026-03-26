# Shop Filtering Implementation

## Overview
The super admin dashboard now supports shop filtering using sessionStorage to persist the selected shop ID across the interface.

## Features Implemented

### 1. **Shop Selector in Top Bar**
- Added a dropdown selector in the SuperAdminLayout header
- Shows all available shops with their names and shop codes
- Automatically fetches shops from `/super-admin/shops` endpoint
- Displays loading spinner while fetching

### 2. **Session Storage Management**
- Selected shop ID is stored in `sessionStorage.getItem('selected_shop_id')`
- Persists across page navigation within the dashboard
- Clears when browser session ends

### 3. **Dashboard Filtering**
- SuperAdminDashboard checks if a shop is selected
- Shows info message if no shop is selected
- Passes `shop_id` parameter to all API calls
- **Only displays data for the selected shop**, not all shops

### 4. **API Integration**
- All API calls now include `params: { shop_id: shopId }`
- Backend endpoints support `shop_id` query parameter
- Tenant middleware on backend validates shop context

## How to Use

### For End Users
1. Open Super Admin Dashboard
2. Select a shop from the dropdown in the top bar
3. Dashboard automatically filters to show only that shop's data
4. Switch shops by selecting a different option from the dropdown
5. Page refreshes to show new shop's data

### For Developers

#### Getting Selected Shop ID
```javascript
import { getSelectedShopId } from '../utils/shopContext';

const shopId = getSelectedShopId(); // Returns shop ID or null
```

#### Setting Selected Shop ID (Automatic via Layout)
```javascript
import { setSelectedShopId } from '../utils/shopContext';

setSelectedShopId('shop123');
```

#### Creating Shop-Aware API Calls
```javascript
import { createShopAwareParams } from '../utils/shopContext';
import axios from 'axios';

const response = await axios.get('/super-admin/some-endpoint', {
  headers: { Authorization: `Bearer ${token}` },
  params: createShopAwareParams({
    limit: 10,
    offset: 0
  })
});
```

#### Checking if Shop is Selected
```javascript
import { isShopSelected } from '../utils/shopContext';

if (!isShopSelected()) {
  // Show warning to select shop
}
```

## File Changes

### Modified Files
1. **SuperAdminLayout.jsx**
   - Added shop selector dropdown in header
   - Fetches shops on mount
   - Stores selected shop_id in sessionStorage
   - Auto-refreshes dashboard when shop changes

2. **SuperAdminDashboard.jsx**
   - Reads shop_id from sessionStorage
   - Passes shop_id to all API calls
   - Shows message if no shop selected
   - Displays selected shop ID in header

### New Files
1. **shopContext.js** (utils/)
   - Utility functions for shop context management
   - Centralized shop ID handling

## API Changes

### Backend Support
All super admin endpoints that should be shop-aware:
- `GET /super-admin/dashboard/stats` - accepts `shop_id` query param
- `GET /super-admin/analytics/system-health` - accepts `shop_id` query param
- `GET /super-admin/shops` - fetches all shops (no filtering)
- And all other endpoints...

### Query Parameter Format
```
GET /api/super-admin/dashboard/stats?shop_id=123456
Authorization: Bearer <token>
```

## Testing

### Manual Testing Steps
1. Log in as super admin
2. Verify shops dropdown appears in top bar
3. Select a shop from dropdown
4. Verify dashboard data updates
5. Check sessionStorage: `sessionStorage.getItem('selected_shop_id')`
6. Switch shops and verify data changes
7. Verify only selected shop's data displays (not all shops)

### Expected Behavior
- ✅ Shop selector visible in header
- ✅ Can select/change shops
- ✅ Dashboard shows only selected shop's data
- ✅ Shop ID persists on page refresh
- ✅ Clearing sessionStorage hides data

## Next Steps

### Pages Still Needing Shop Filtering
- [ ] ShopsManagement.jsx - Filter shops list by shop_id
- [ ] BillingManagement.jsx - Show only selected shop's billing
- [ ] UserManagement.jsx - Show only shop's admin users
- [ ] AuditLogs.jsx - Pre-filter by selected shop

### Backend Enhancements Needed
- Verify all endpoints support shop_id filtering
- Add validation that user can only access their shop data
- Consider adding shop context to tenant middleware for auto-filtering

## Troubleshooting

### Issue: Dashboard shows "No Shop Selected"
- **Solution**: Select a shop from the dropdown in the top bar

### Issue: Dashboard shows all shops' data
- **Solution**: Check if shop_id is being passed to API call:
  ```javascript
  // Add this to console to debug
  console.log('Selected shop:', sessionStorage.getItem('selected_shop_id'));
  ```

### Issue: Shop dropdown is empty
- **Solution**: Check if `/super-admin/shops` endpoint returns data
  - Verify authentication token is valid
  - Check network tab in browser dev tools

### Issue: Data doesn't update when changing shops
- **Solution**: Page should auto-refresh. If not:
  - Verify `handleShopChange` is being called
  - Check browser console for errors
  - Try manual page refresh

## Schema Reference

### SessionStorage Keys
- `selected_shop_id` - Current selected shop ID (string)
- `token` - Auth token (existing)
- `usertype` - User type (existing)

### Database Fields
- `shops.id` - Shop identifier (UUID or integer)
- `shops.name` - Shop display name
- `shops.shop_code` - Shop code/identifier
