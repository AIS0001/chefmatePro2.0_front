# User Admin Dashboard - Shop ID Filtering Implementation

## Overview
The user admin dashboard has been updated to filter all data based on shop_id, ensuring that each shop admin only sees their shop's data.

## Changes Made

### 1. **Import Shop Context Utility**
Added import at the top of dashboard.jsx:
```javascript
import { getSelectedShopId } from "../../utils/shopContext";
```

### 2. **Modified fetchDashboardData Function**
Updated to pass shop_id parameter to all API calls:

**Added at start of function:**
```javascript
// Get shop_id from sessionStorage
const shopId = getSelectedShopId();
console.log('Using shop_id for dashboard:', shopId);

// Build query params with shop_id
const shopParam = shopId ? `&shop_id=${shopId}` : '';

// Create filter params object for fetchData calls
const filterParams = shopId ? { shop_id: shopId } : {};
```

### 3. **Updated All API Calls**

**Axios calls now include shop_id:**
- ✅ `GET analytics/report/todaysummary?shop_id=xxx`
- ✅ `GET /report/sale?range=week&shop_id=xxx`
- ✅ `GET analytics/report/purchase?range=week&shop_id=xxx`
- ✅ `GET analytics/report/summary?shop_id=xxx`
- ✅ `GET analytics/report/getlowstockalert?shop_id=xxx`
- ✅ `GET analytics/report/gettopproducts?shop_id=xxx`

**fetchData calls now include shop_id parameter:**
- ✅ `fetchData('customers', ..., { shop_id: xxx })`
- ✅ `fetchData('final_bill', ..., { shop_id: xxx, limit: 5 })`
- ✅ `fetchData('purchase', ..., { shop_id: xxx, limit: 5 })`

## How It Works

### For Super Admins
1. Super admin selects a shop from top bar dropdown
2. Shop_id is stored in `sessionStorage.getItem('selected_shop_id')`
3. When dashboard loads, it reads shop_id from sessionStorage
4. All API calls include `?shop_id=xxx` parameter
5. Backend filters data for that specific shop

### For Shop Admins
1. Shop admin logs in with their own credentials
2. If shop_id is in sessionStorage, it's used
3. If not, backend uses shop context from JWT token (tenant middleware)
4. Backend ensures admin only sees their own shop's data

## API Call Examples

**Before:**
```
GET /analytics/report/todaysummary
GET /report/sale?range=week
GET /analytics/report/summary
```

**After:**
```
GET /analytics/report/todaysummary?shop_id=12345
GET /report/sale?range=week&shop_id=12345
GET /analytics/report/summary?shop_id=12345
```

## Data Being Filtered

The following dashboard metrics now show only the selected shop's data:

1. **Today's Summary**
   - Today's Sales (filtered by shop_id)
   - Today's Purchases (filtered by shop_id)
   - Bill Count (filtered by shop_id)
   - Average Order Price (filtered by shop_id)

2. **Charts (Last 7 Days)**
   - Sales Chart (filtered by shop_id)
   - Purchase Chart (filtered by shop_id)
   - Combined Sales vs Purchase Chart (filtered by shop_id)

3. **Business Analysis**
   - Total Revenue (filtered by shop_id)
   - Total Profit (filtered by shop_id)
   - Low Stock Items (filtered by shop_id)
   - Top Selling Products (filtered by shop_id)
   - Total Customers (filtered by shop_id)

4. **Recent Transactions**
   - Recent Bills (filtered by shop_id, limit 5)
   - Recent Purchases (filtered by shop_id, limit 5)

## Backend Requirements

For this to work properly, ensure your backend endpoints support the `shop_id` query parameter:

```javascript
// Example query parameter handling:
GET /analytics/report/todaysummary?shop_id=12345

// Backend should filter:
SELECT * FROM bills WHERE shop_id = 12345 AND DATE(created_at) = TODAY()
```

The `tenantMiddleware` should validate that users can only access their shop's data.

## Testing Checklist

- [ ] Log in as shop admin
- [ ] Dashboard loads
- [ ] Open browser console
- [ ] Look for log: "Using shop_id for dashboard: [id]"
- [ ] Verify API calls include shop_id parameter (Network tab)
- [ ] Dashboard shows data for that shop only (not all shops)
- [ ] Switch shops (if super admin) → dashboard data updates
- [ ] All metrics show shop-specific numbers
- [ ] Charts show only that shop's sales/purchases

## Deployment Notes

1. Ensure backend endpoints are updated to accept and filter by shop_id
2. Test with multiple shops to verify filtering
3. Verify shop admins cannot access other shops' data
4. Check that super admins can see different shops' data based on selection
5. Monitor logs for any 403/401 errors during access validation

## Troubleshooting

**Issue: Dashboard shows all shops' data**
- Verify backend is filtering by shop_id correctly
- Check Network tab to confirm API calls include shop_id parameter
- Check browser console for any errors

**Issue: Shop admins see data they shouldn't**
- Verify tenant middleware is enforcing shop_id validation
- Check that JWT token contains correct shop context
- Verify database queries include shop_id in WHERE clause

**Issue: API calls fail with 403 error**
- Verify user has permission for that shop
- Check JWT token is valid
- Verify shop_id matches user's shop context

## Files Modified

- `src/views/dashboard/dashboard.jsx` - Added shop_id filtering to all API calls
- Uses existing `src/utils/shopContext.js` utility (created for super admin dashboard)

## Related Documentation

- `SHOP_FILTERING_IMPLEMENTATION.md` - Super admin dashboard shop filtering
- `SHOP_FILTERING_SUMMARY.md` - Implementation overview
- `SHOP_FILTERING_TROUBLESHOOTING.md` - Debugging guide
