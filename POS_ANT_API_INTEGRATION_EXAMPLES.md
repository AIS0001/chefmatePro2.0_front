# POS Ant - API Integration Examples

## 1. Fetch Categories

### Request
```
GET /fetchdata/categories/id

Authorization: Bearer <token>
```

### Response
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Beverages",
      "description": "Hot and cold drinks"
    },
    {
      "id": 2,
      "name": "Food",
      "description": "Food items"
    }
  ]
}
```

---

## 2. Fetch Items by Category

### Request
```
GET /fetchdata/items/id/{where}?isstockable=1

Authorization: Bearer <token>
```

### Response
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "iname": "Whiskey - Premium",
      "catid": 1,
      "sprice": "800",
      "tax": "7",
      "unit": "Bottle",
      "isstockable": 1
    },
    {
      "id": 2,
      "iname": "Coke",
      "catid": 2,
      "sprice": "150",
      "tax": "5",
      "unit": "Can",
      "isstockable": 1
    }
  ]
}
```

---

## 3. Stock Deduction (KOT or Sale)

### Request
```
POST /stock/remove

Authorization: Bearer <token>
Content-Type: application/json

{
  "productId": 1,           // Whiskey ID
  "unitId": 1,              // Base unit (Bottle)
  "quantity": 2,            // Selling 2 bottles
  "referenceType": "SALE",
  "referenceId": 12345,     // Bill ID
  "notes": "Sale - Bill #12345 - Table: 5"
}
```

### Response (Success)
```json
{
  "success": true,
  "message": "Stock removed successfully",
  "data": {
    "productId": 1,
    "unitId": 1,
    "previousQuantity": 50,
    "newQuantity": 48,
    "quantityRemoved": 2,
    "transactionId": 789,
    "transactionDate": "2026-01-30T15:30:45.000Z"
  }
}
```

### Response (Error - Insufficient Stock)
```json
{
  "success": false,
  "message": "Insufficient stock available. Available: 1, Requested: 2"
}
```

### Response (Error - Product Not Found)
```json
{
  "success": false,
  "message": "Product not found or unit not configured"
}
```

---

## 4. Save Bill

### Request
```
POST /savebill

Authorization: Bearer <token>
Content-Type: application/json

{
  "customer_id": null,              // null for walk-in
  "tablenumber": 5,
  "subtotal": 2000,                 // Whiskey: 800x2 + Coke: 150x4 = 2200
  "tax": 154,                        // 7% on 2000 + 5% on 600
  "discount_type": "percentage",    // "fixed" or "percentage"
  "discount_value": 10,              // 10% discount
  "discount_amount": 200,            // 10% of 2000
  "subtotal_afterdiscount": 1800,   // 2000 - 200
  "round_off": 0,                    // No rounding
  "grand_total": 1954,              // 1800 + 154
  "payment_mode": "Cash",           // Cash, Card, QR Code, Credit
  "status": "Paid",                 // Paid, Pending, Cancelled
  "setup_date": "2026-01-30"
}
```

### Response (Success)
```json
{
  "success": true,
  "message": "Bill & Ledger saved successfully!",
  "bill_id": 12345
}
```

### Response (Error - Missing Required Fields)
```json
{
  "success": false,
  "message": "Error saving bill"
}
```

---

## 5. Fetch Customers

### Request
```
GET /fetchdata/customers/id

Authorization: Bearer <token>
```

### Response
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "John Doe",
      "phone": "9876543210",
      "email": "john@example.com",
      "address": "123 Main St"
    },
    {
      "id": 2,
      "name": "ABC Restaurant",
      "phone": "9876543211",
      "email": "abc@restaurant.com",
      "address": "456 Market St"
    }
  ]
}
```

---

## 6. Fetch Tables

### Request
```
GET /fetchdata/tablelist/id

Authorization: Bearer <token>
```

### Response
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "table_number": 1,
      "capacity": 4,
      "status": "vacant"
    },
    {
      "id": 2,
      "table_number": 2,
      "capacity": 2,
      "status": "occupied"
    },
    {
      "id": 5,
      "table_number": 5,
      "capacity": 6,
      "status": "vacant"
    }
  ]
}
```

---

## Complete Flow Example

### User Action: Create a dine-in bill with stock deduction

```javascript
// Step 1: User selects items and clicks "Send Bill & Print"

// Step 2: Deduct stock for each item (BATCH OPERATION)
POST /stock/remove { productId: 1, unitId: 1, quantity: 2, ... }
POST /stock/remove { productId: 2, unitId: 1, quantity: 4, ... }

// Response: Stock deducted from inventory

// Step 3: Create bill
POST /savebill {
  customer_id: null,
  tablenumber: 5,
  subtotal: 2000,
  tax: 154,
  discount_value: 10,
  discount_type: "percentage",
  ...
  grand_total: 1954,
  payment_mode: "Cash"
}

// Response: bill_id = 12345

// Step 4: Show success and print receipt
// Print receipt using ESCPOS/Thermal printer
// Display bill confirmation

// Step 5: Reset POS for next order
```

---

## Error Scenarios & Handling

### Scenario 1: Stock Deduction Fails
```javascript
// One item has insufficient stock
POST /stock/remove { productId: 1, quantity: 100 }
// Response: 400 error - "Insufficient stock"

// UI Action: Show error message, DO NOT save bill
// Cart remains unchanged
// User can adjust quantity and retry
```

### Scenario 2: Bill Creation Fails
```javascript
// All stock successfully deducted
POST /stock/remove { ... } // Success
POST /stock/remove { ... } // Success

// But bill creation fails
POST /savebill { ... }
// Response: 500 error - Database error

// UI Action: Show error, BUT STOCK ALREADY DEDUCTED!
// This is a transaction issue - may need manual reconciliation
// Stock movements are recorded but bill is missing
```

### Scenario 3: Network Error
```javascript
// Stock deduction in progress
POST /stock/remove { productId: 1 }
// Network timeout - no response

// UI Action: Show timeout error
// STOCK STATUS IS UNKNOWN
// User should check inventory before retrying
// Implement retry mechanism with confirmation
```

---

## Response Structures

### Success Response
```json
{
  "success": true,
  "message": "Operation completed",
  "data": { /* operation-specific data */ }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description"
}
```

### List Response
```json
{
  "success": true,
  "data": [ /* array of items */ ],
  "count": 10
}
```

---

## Common HTTP Status Codes

- **200 OK**: Successful GET request
- **201 Created**: Successful POST creating new resource
- **400 Bad Request**: Invalid request (insufficient stock, missing fields)
- **401 Unauthorized**: Invalid or expired token
- **404 Not Found**: Resource not found
- **500 Internal Server Error**: Database or server error
- **503 Service Unavailable**: Server temporarily unavailable

---

## Headers Required

### All API Calls Must Include:
```
Authorization: Bearer <jwt_token>
Content-Type: application/json (for POST/PUT)
```

### Example Complete Request:
```
POST /stock/remove HTTP/1.1
Host: localhost:4402
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
Content-Length: 156

{
  "productId": 1,
  "unitId": 1,
  "quantity": 2,
  "referenceType": "SALE",
  "referenceId": 12345,
  "notes": "Sale - Bill #12345"
}
```

---

## Debugging Tips

### Check Stock Deduction
```sql
-- Query stock_transactions table
SELECT * FROM stock_transactions 
WHERE product_id = 1 
AND transaction_type = 'REMOVE'
AND reference_type = 'SALE'
ORDER BY transaction_date DESC;
```

### Check Bill Creation
```sql
-- Query final_bill table
SELECT * FROM final_bill 
WHERE id = 12345;

-- Query ledger_entries
SELECT * FROM ledger_entries 
WHERE reference_id = 12345;
```

### Check Stock Balance
```sql
-- Current stock for product
SELECT * FROM stock_balance 
WHERE product_id = 1;
```

### Check API Logs
```bash
# In backend console/logs
tail -f server.log | grep "stock\|bill"
```

---

## Test Cases

### Test 1: Successful Stock Deduction & Bill
1. Add item to cart
2. Click "Send Bill & Print"
3. Verify: stock_balance decreased
4. Verify: stock_transactions record created
5. Verify: final_bill record created
6. Verify: ledger_entries created

### Test 2: Insufficient Stock
1. Try to deduct more than available
2. Verify: Error message shown
3. Verify: Stock NOT deducted
4. Verify: Bill NOT created
5. Verify: Cart still has items

### Test 3: Network Error
1. Simulate network failure
2. Verify: Error shown to user
3. Verify: Cart state preserved
4. Verify: User can retry

### Test 4: Multiple Items
1. Add 3 different items to cart
2. Click "Send KOT"
3. Verify: All 3 items have stock deducted
4. Verify: 3 transaction records created
5. Verify: No bill created (just KOT)

---

**Date Created:** January 30, 2026  
**Last Updated:** January 30, 2026  
**Version:** 1.0
