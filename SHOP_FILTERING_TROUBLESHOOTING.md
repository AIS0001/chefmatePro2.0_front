# Shop Filtering - Troubleshooting Guide

## Common Issues and Solutions

### Issue 1: Dashboard Shows Empty Data / "No Shop Selected" Message
**Problem:** When opening dashboard, it shows "Please select a shop from the dropdown menu"

**Solution:**
1. Check if shops dropdown is populated:
   - Open Developer Console (F12)
   - Check Network tab - is `/super-admin/shops` request successful?
   - Check Application → SessionStorage for `selected_shop_id`
2. If dropdown is empty:
   - Verify backend `/super-admin/shops` endpoint is working
   - Check authentication token is valid
   - Try browser refresh

---

### Issue 2: Dashboard Shows All Shops' Data Instead of Selected Shop
**Problem:** Dashboard displays aggregated data for all shops instead of filtering by selected shop

**Solutions:**

**Check 1: Is shop_id being passed?**
```javascript
// Open Console and run:
sessionStorage.getItem('selected_shop_id')
// Should show: "shop_123" (not null/undefined)
```

**Check 2: API call includes shop_id parameter**
- Open Network tab → Look for `/super-admin/dashboard/stats` request
- Check Query String Parameters
- Should show: `shop_id=123456` in URL or params

**Check 3: Code verification**
```javascript
// In SuperAdminDashboard.jsx, verify line has:
params: { shop_id: shopId }  // ← should be present

// NOT:
params: {}  // ← wrong
```

**Check 4: Backend validation**
- Verify backend is filtering by shop_id
- Check database query includes: `WHERE shop_id = ?`

---

### Issue 3: Dropdown is Empty (No Shops Listed)
**Problem:** Shop selector dropdown has no options

**Solutions:**

1. **Check backend endpoint:**
   ```bash
   curl -H "Authorization: Bearer <token>" http://localhost:5000/api/super-admin/shops
   ```
   Should return: `{ success: true, shops: [...], pagination: {...} }`

2. **Check request headers:**
   - Open DevTools → Network
   - Look for `/super-admin/shops` request
   - Verify `Authorization: Bearer <token>` header is present
   - Check response status (should be 200)

3. **Check database:**
   - Verify shops table has data:
   ```sql
   SELECT id, name, shop_code FROM shops LIMIT 5;
   ```
   - Should return rows, not empty

4. **Check user permissions:**
   - Super admin user should have access to all shops
   - Verify JWT token is valid:
   ```javascript
   // Parse token at jwt.io
   // Should show: { role: 'super_admin', ... }
   ```

---

### Issue 4: Shop Selector Dropdown Keeps Loading
**Problem:** Loading spinner doesn't stop in shop selector

**Solutions:**

1. **Check network:**
   - DevTools → Network tab
   - Look for stuck `/super-admin/shops` request
   - Check if request completes with 200/404/500

2. **Check timeout:**
   - If request takes >30 seconds, connection might be issue
   - Check backend server is running: `ps aux | grep node`

3. **Check CORS:**
   - Look for CORS errors in console
   - Should show green response in network tab

4. **Fix:**
   ```javascript
   // Add timeout to axios call
   axios.get('/super-admin/shops', {
     timeout: 5000,  // 5 second timeout
     headers: { ... }
   })
   ```

---

### Issue 5: Shop Selection Doesn't Update Dashboard
**Problem:** Selected shop from dropdown but dashboard still shows same data

**Solutions:**

1. **Check handleShopChange is being called:**
   ```javascript
   // Add to SuperAdminLayout.jsx
   const handleShopChange = (shopId) => {
     console.log('Shop changed to:', shopId);  // ← Add this
     setSelectedShop(shopId);
     sessionStorage.setItem('selected_shop_id', shopId);
     window.location.reload();  // Force page refresh
   };
   ```

2. **Verify sessionStorage was updated:**
   ```javascript
   // In console:
   sessionStorage.getItem('selected_shop_id')
   // Should show the newly selected ID
   ```

3. **Check page reload:**
   - Page should auto-reload after selection
   - If not, manually reload: F5 or Cmd+R

4. **Clear browser cache:**
   - DevTools → Application → Clear Site Data
   - Close browser completely
   - Reopen and try again

---

### Issue 6: Switching Between Shops Is Slow
**Problem:** Takes 5-10 seconds to switch shops

**Solutions:**

1. **Check network speed:**
   - DevTools → Network tab → throttle speed
   - Reduce API response data if possible

2. **Implement lazy loading:**
   ```javascript
   // Fetch shops on demand instead of on every load
   useEffect(() => {
     fetchShops();  // Only once on component mount
   }, []);
   ```

3. **Cache shops:**
   ```javascript
   // Store shops in localStorage after first fetch
   const cachedShops = JSON.parse(localStorage.getItem('cached_shops'));
   if (cachedShops) {
     setShops(cachedShops);
   }
   ```

4. **Add loading indicator:**
   - Show spinner in dropdown or dashboard during load
   - User can see something is happening

---

### Issue 7: Data Sometimes Works, Sometimes Doesn't
**Problem:** Dashboard works occasionally but then shows empty/all data

**Root Cause:** Authentication token might be expiring

**Solutions:**

1. **Check token expiration:**
   ```javascript
   // Add to axios interceptor
   const token = localStorage.getItem('token');
   if (!token || tokenExpired(token)) {
     logout();  // Force re-login
   }
   ```

2. **Add token refresh:**
   - Implement refresh token logic
   - Refresh token before expiry

3. **Check sessionStorage persistence:**
   - Some browsers clear sessionStorage on tab close
   - Consider using localStorage for shop_id instead:
   ```javascript
   localStorage.setItem('selected_shop_id', shopId);
   ```

---

### Issue 8: Browser Console Shows Errors
**Common Errors:**

**Error:** `Cannot read property 'getSelectedShopId' of undefined`
- **Fix:** Verify `shopContext.js` import path is correct
```javascript
import { getSelectedShopId } from '../../utils/shopContext';  // Check path
```

**Error:** `shopContext is not defined`
- **Fix:** Missing import statement
```javascript
// Add at top of file:
import { createShopAwareParams } from '../../utils/shopContext';
```

**Error:** `undefined is not a valid React component`
- **Fix:** File not exported correctly
```javascript
// In shopContext.js, verify exports:
export const getSelectedShopId = () => { ... };
export const createShopAwareParams = () => { ... };
```

---

## Debug Commands

### In Browser Console

**Check selected shop:**
```javascript
sessionStorage.getItem('selected_shop_id')
```

**Check authentication:**
```javascript
localStorage.getItem('token')
```

**Manually trigger fetch:**
```javascript
// In SuperAdminDashboard component:
window.location.reload()
```

**Test API call:**
```javascript
fetch('/super-admin/dashboard/stats?shop_id=123', {
  headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
}).then(r => r.json()).then(d => console.log(d))
```

---

## Testing Workflow

1. **Fresh Start:**
   ```
   1. Close browser completely
   2. Clear browser cache/cookies
   3. Open fresh browser tab
   4. Log in again
   5. Select shop
   6. Check data
   ```

2. **Check Each Layer:**
   ```
   1. UI Layer: Shop dropdown visible? ✓
   2. Storage Layer: sessionStorage has shop_id? ✓
   3. API Layer: Request has shop_id param? ✓
   4. Backend Layer: Backend filters by shop_id? ✓
   5. Data Layer: Database has shop data? ✓
   ```

3. **Network Debugging:**
   ```
   1. DevTools → Network tab
   2. Select a shop
   3. Look for these requests:
      - GET /super-admin/shops (to fetch dropdown)
      - GET /super-admin/dashboard/stats?shop_id=xxx
      - GET /super-admin/analytics/system-health?shop_id=xxx
   4. All should return 200 OK
   ```

---

## Permanent Fixes

### If problem persists after all troubleshooting:

1. **Reset implementation:**
   ```bash
   # Clear browser data
   - Settings → Clear browsing data → All time
   - Cookies, cache, localStorage, sessionStorage
   
   # Restart backend
   npm stop
   npm start
   
   # Refresh frontend
   npm start (or reload)
   ```

2. **Check backend logs:**
   ```bash
   # Look for errors in node server
   tail -f logs/access.log
   tail -f logs/error.log
   ```

3. **Database validation:**
   ```sql
   -- Verify data exists
   SELECT COUNT(*) FROM shops;
   SELECT id, name, shop_code FROM shops LIMIT 3;
   
   -- Check shop has related data
   SELECT * FROM shops WHERE id = 'selected_shop_id' LIMIT 1;
   ```

4. **Clear vs Fresh Install:**
   ```bash
   # If nothing works, reinstall frontend
   rm -rf node_modules package-lock.json
   npm install
   npm start
   ```

---

## Support Information

**When reporting issues, provide:**
1. Screenshot of error/behavior
2. Browser console errors (copy-paste)
3. Network tab showing API requests
4. SessionStorage contents: `sessionStorage`
5. Backend logs showing what was processed
6. Steps to reproduce the issue

**Example bug report:**
```
Issue: Dashboard shows no data
Steps:
1. Log in as super admin
2. Select shop "Store 1" from dropdown
3. Dashboard shows blank cards (should show stats)

Expected: Dashboard shows metrics for Store 1
Actual: All cards show 0 values

Environment:
- Browser: Chrome 120
- OS: Windows 10
- Backend: Running on localhost:5000
```
