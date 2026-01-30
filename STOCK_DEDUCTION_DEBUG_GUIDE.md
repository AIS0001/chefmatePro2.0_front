# Stock Deduction Debugging Guide

## Issue Description
Stock deduction shows success toast message but database is not being updated.

## Root Cause Analysis

### Possible Issues:

1. **All items are non-stockable**
   - The cart items have `isstockable = 0`
   - Function returns success but doesn't call API
   - Database shows no changes because no API calls were made

2. **Missing product_units configuration**
   - Items marked as stockable but no units configured in `product_units` table
   - API call fails or is skipped
   - Error not properly displayed to user

3. **Backend transaction rollback**
   - API receives request but database transaction fails
   - Backend returns 200 OK but changes are rolled back
   - Frontend shows success but DB unchanged

4. **Missing stock_balance entries**
   - Item is stockable with units configured
   - But no entry in `stock_balance` table
   - Backend can't update non-existent balance

## Debugging Steps

### Step 1: Check Browser Console
Open browser DevTools (F12) and look for:
```
📊 Stock Deduction Results: {
  total: X,
  success: Y,
  skipped: Z,
  failed: 0
}
```

If `skipped = total`, all items are non-stockable!

### Step 2: Check Network Tab
Look for POST requests to `/stock/remove`:
- **Request Payload**: Should contain `productId`, `unitId`, `quantity`, etc.
- **Response**: Check status code (200 = success, 400 = error)
- **Response Body**: Should show `success: true` and affected rows

Example successful request:
```json
{
  "productId": 22,
  "unitId": 1,
  "quantity": 2,
  "referenceType": "SALE",
  "referenceId": 12345,
  "notes": "Sale - Order #12345 - Table: T1"
}
```

Example successful response:
```json
{
  "success": true,
  "message": "Stock removed successfully",
  "data": {
    "transactionId": 123,
    "newBalance": 48.0000
  }
}
```

### Step 3: Check Database Configuration

#### 3.1 Check if items are stockable
```sql
SELECT id, iname, isstockable, unit 
FROM items 
WHERE id IN (22, 23, 24);  -- Replace with your product IDs
```

Expected: `isstockable = 1` for items you want to track

#### 3.2 Check product_units table
```sql
SELECT * FROM product_units 
WHERE product_id IN (22, 23, 24);
```

Expected: At least one BASE unit per product
Example:
```
| id | product_id | unit_name | unit_type | is_base_unit | ml_capacity | selling_price |
|----|------------|-----------|-----------|--------------|-------------|---------------|
| 1  | 22         | Bottle    | BASE      | 1            | 750         | 3000.00       |
| 2  | 22         | 30ML Peg  | DERIVED   | 0            | 30          | 150.00        |
```

#### 3.3 Check stock_balance table
```sql
SELECT sb.*, pu.unit_name 
FROM stock_balance sb
JOIN product_units pu ON sb.unit_id = pu.id
WHERE sb.product_id IN (22, 23, 24);
```

Expected: Entry for each product with current_quantity > 0
Example:
```
| product_id | unit_id | unit_name | current_quantity | available_quantity |
|------------|---------|-----------|------------------|-------------------|
| 22         | 1       | Bottle    | 50.0000          | 50.0000           |
```

**If no entry exists**: Stock can't be deducted! Add stock first:
```sql
INSERT INTO stock_balance (product_id, unit_id, current_quantity, reserved_quantity)
VALUES (22, 1, 10.0000, 0.0000);
```

### Step 4: Check Backend Logs
If using Node.js backend, check terminal for:
```
Stock removal request: { productId: 22, unitId: 1, quantity: 2 }
Transaction started
Stock balance updated: 50 -> 48
Transaction recorded in stock_transactions
Transaction committed
```

### Step 5: Verify stock_transactions table
After successful deduction, check:
```sql
SELECT * FROM stock_transactions 
WHERE reference_type = 'SALE' 
ORDER BY transaction_date DESC 
LIMIT 10;
```

Expected: New record for each deducted item
Example:
```
| id | product_id | transaction_type | unit_id | quantity | reference_id | transaction_date |
|----|------------|------------------|---------|----------|--------------|------------------|
| 10 | 22         | REMOVE           | 1       | 2.0000   | 12345        | 2026-01-30 ...   |
```

**If no record**: Backend didn't execute the SQL or transaction was rolled back

## Common Fixes

### Fix 1: Mark items as stockable
```sql
UPDATE items 
SET isstockable = 1 
WHERE id IN (22, 23, 24);
```

### Fix 2: Create product units
```sql
-- Create Bottle unit (BASE)
INSERT INTO product_units 
(product_id, unit_name, unit_type, conversion_factor, is_base_unit, ml_capacity, selling_price)
VALUES 
(22, 'Bottle', 'BASE', 1, 1, 750, 3000.00);

-- Create 30ML Peg unit (DERIVED)
INSERT INTO product_units 
(product_id, unit_name, unit_type, conversion_factor, is_base_unit, ml_capacity, selling_price)
VALUES 
(22, '30ML Peg', 'DERIVED', 0.04, 0, 30, 150.00);
```

### Fix 3: Initialize stock balance
```sql
-- Add initial stock
INSERT INTO stock_balance (product_id, unit_id, current_quantity, reserved_quantity)
SELECT pu.product_id, pu.id, 10.0000, 0.0000
FROM product_units pu
WHERE pu.product_id IN (22, 23, 24) 
  AND pu.is_base_unit = 1
ON DUPLICATE KEY UPDATE current_quantity = current_quantity;
```

### Fix 4: Backend transaction handling
Check backend stockService.js for proper error handling:
```javascript
async removeStock(productId, unitId, quantity, userId, referenceType, referenceId, notes) {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // 1. Check stock balance
    const [balanceRows] = await connection.query(
      'SELECT current_quantity FROM stock_balance WHERE product_id = ? AND unit_id = ?',
      [productId, unitId]
    );
    
    if (!balanceRows.length) {
      throw new Error('No stock balance found for this product/unit');
    }
    
    if (balanceRows[0].current_quantity < quantity) {
      throw new Error('Insufficient stock');
    }
    
    // 2. Update stock balance
    await connection.query(
      'UPDATE stock_balance SET current_quantity = current_quantity - ? WHERE product_id = ? AND unit_id = ?',
      [quantity, productId, unitId]
    );
    
    // 3. Record transaction
    await connection.query(
      'INSERT INTO stock_transactions (product_id, transaction_type, unit_id, quantity, reference_type, reference_id, user_id, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [productId, 'REMOVE', unitId, quantity, referenceType, referenceId, userId, notes]
    );
    
    await connection.commit();
    return { success: true };
    
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
```

## Frontend Improvements Applied

1. **Better logging**: Added detailed console logs with emoji indicators
2. **Success count**: Only show success if items actually deducted
3. **Skip notification**: Show info message when all items are non-stockable
4. **Payload logging**: Log exact API request payload for debugging

## Testing Checklist

- [ ] Check browser console for stock deduction results
- [ ] Verify Network tab shows POST /stock/remove requests
- [ ] Confirm items.isstockable = 1 in database
- [ ] Verify product_units table has entries for products
- [ ] Confirm stock_balance has entries with quantity > 0
- [ ] Check stock_transactions table for new records after sale
- [ ] Test with stockable items (beer, whiskey)
- [ ] Test with non-stockable items (services)
- [ ] Test with mixed cart (both types)
- [ ] Verify insufficient stock error handling

## Expected Flow

1. User adds items to cart
2. User sends KOT
3. Frontend calls `/stock/remove` for each stockable item
4. Backend:
   - Checks stock_balance
   - Validates sufficient stock
   - Updates stock_balance (decrease quantity)
   - Inserts record in stock_transactions
   - Commits transaction
5. Frontend shows success message
6. Database reflects changes

If any step fails, check logs at that point!
