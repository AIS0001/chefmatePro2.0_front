# 401 Unauthorized Errors - Root Cause & Fix

## Problem
The application was returning **401 (Unauthorized)** errors with `fetchData error: AxiosError` across multiple API calls.

### Error Pattern
```
Failed to load resource: the server responded with a status of 401 (Unauthorized)
installHook.js:1 fetchData error: AxiosError
```

## Root Cause
The `getHeaders()` utility function returns an object with the following structure:
```javascript
{
  headers: {
    Authorization: "Bearer <token>"
  }
}
```

However, many parts of the codebase were passing this directly as the second parameter to axios methods:
```javascript
// ❌ INCORRECT (was causing 401):
const response = await axios.get(url, getHeaders());
```

When `getHeaders()` is passed this way, axios doesn't recognize it as a config object and doesn't include the Authorization header in the request, resulting in 401 errors.

## Solution
The fix assigns `getHeaders()` to a variable first, then passes it to axios:
```javascript
// ✅ CORRECT (now working):
const headers = getHeaders();
const response = await axios.get(url, headers);
```

This ensures axios receives the proper config object with the Authorization header.

## Files Fixed

### Core Utility Functions (High Priority)
1. **src/functions/fetchData.js** - Both `fetchData()` and `fetchdatanotequal()` functions
2. **src/functions/getRunningTable.js** - Table data fetching
3. **src/functions/fetchdatawithTwoTables.js** - Multi-table joins
4. **src/functions/fetchOrderDetails.jsx** - Order detail retrieval
5. **src/functions/getMax.js** - Max value fetching
6. **src/functions/viewAllData.js** - General data viewing

### Inventory Module
7. **src/views/inventory/newStockAntDesign.jsx** - Stock/purchase order creation
8. **src/views/inventory/stockReport.jsx** - Stock reporting
9. **src/views/inventory/newStock.jsx** - Classic stock entry (3 instances)

## Testing Checklist
- [ ] Navigate to inventory pages and verify data loads without 401 errors
- [ ] Create a new item and verify it saves successfully
- [ ] Create a purchase order and verify stock updates
- [ ] Check stock reports load closing stock data
- [ ] Verify browser console shows no 401 errors
- [ ] Test all dropdown/combo boxes populate correctly

## Implementation Pattern
For any new axios calls that use `getHeaders()`, follow this pattern:

```javascript
// Pattern to use everywhere:
const headers = getHeaders();
const response = await axios.get(url, headers);
// or for POST:
const response = await axios.post(url, data, headers);
```

## Additional Files Needing Review
The following files still may have the old pattern and should be checked/updated if they're actively used:
- src/views/inventory/newStock.jsx (remaining instances if any)
- src/components/data-tables/dataTable.jsx
- src/views/dashboard/analyticsDashboard.jsx
- src/views/vouchers/vouchers.jsx
- src/views/vouchers/paymentVouchers.jsx

## Root Issue Summary
The core issue was a misunderstanding of how axios config objects work. The `getHeaders()` function intentionally wraps the headers in a `{ headers: {...} }` object for proper axios configuration. Passing it directly without assignment prevented axios from recognizing and applying the Authorization header.

---
**Date Fixed:** January 30, 2026
**Impact:** Critical - affects all authenticated API calls across the application
**Severity:** High - blocks feature testing and production deployment
