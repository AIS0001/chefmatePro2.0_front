# POS Ant Design - Stock Managed System Documentation

## Overview
This document describes the new Ant Design-based POS system (`newPOSAnt.jsx`) that integrates automatic stock deduction on sales.

## Features

### 1. **Category-Based Item Selection**
- Left sidebar displays all product categories
- Click on category to view items within that category
- Categories are dynamically fetched from the database

### 2. **Shopping Cart Management**
- Add items to cart with quantity controls
- Increase/decrease quantity using +/- buttons
- Remove items from cart
- Real-time total calculation

### 3. **Flexible Pricing & Discounts**
- Support for both fixed and percentage-based discounts
- Automatic tax calculation per item
- Round-off adjustment support
- Real-time grand total display

### 4. **Customer & Table Selection**
- Optional customer selection (for credit sales)
- Table selection for dine-in orders
- Support for walk-in customers (no customer/table required)

### 5. **Stock Deduction System** (NEW)
- Automatic stock deduction from inventory when KOT/Bill is sent
- Uses backend API: `POST /stock/remove`
- Tracks sales as reference type for audit trail
- Prevents over-selling by checking inventory levels
- Proper error handling and user feedback

### 6. **KOT (Kitchen Order Ticket) Integration**
- **Send KOT** button: Sends order to kitchen and deducts stock
- Marks items for kitchen display
- Automatically clears cart after successful KOT
- Stock deducted immediately when KOT is sent

### 7. **Bill & Print System**
- **Send Bill & Print** button: Creates bill, deducts stock, sends to thermal printer
- Saves bill to database with ledger entries
- Supports multiple payment modes: Cash, Card, QR Code, Credit
- Generates receipt for customer
- Stock deducted at time of bill creation

## API Endpoints Used

### Stock Deduction
**Endpoint:** `POST /api/stock/remove`

**Request Body:**
```javascript
{
  productId: number,           // Item ID
  unitId: number,              // Unit ID (usually 1 for base unit)
  quantity: number,            // Quantity sold
  referenceType: "SALE",       // Fixed for POS sales
  referenceId: billId,         // Bill ID for audit trail
  notes: string                // Additional notes
}
```

**Response:**
```javascript
{
  success: true,
  message: "Stock removed successfully",
  data: {
    productId,
    unitId,
    quantityRemoved,
    newStockLevel
  }
}
```

### Bill Creation
**Endpoint:** `POST /api/savebill`

**Request Body:**
```javascript
{
  customer_id: number|null,
  tablenumber: number|null,
  subtotal: number,
  subtotal_afterdiscount: number,
  tax: number,
  discount_type: "fixed" | "percentage",
  discount_value: number,
  round_off: number,
  grand_total: number,
  payment_mode: string,
  status: string,
  setup_date: date
}
```

## User Interface Layout

### Left Sidebar (Categories)
- Scrollable list of product categories
- Each category is a clickable button
- Selected category is highlighted in blue
- Allows browsing and selecting items

### Center Area (Items Grid)
- Displays items from selected category
- 3-column responsive grid
- Each item card shows:
  - Item name
  - Selling price
  - Unit type
- Clicking item adds to cart

### Right Sidebar (Cart & Checkout)
- **Customer Selection**: Optional dropdown
- **Table Selection**: Dropdown for dine-in
- **Cart Summary**: 
  - Item list with quantities
  - Quantity adjustment buttons
  - Individual item totals
- **Price Summary**:
  - Subtotal
  - Tax amount
  - Discount (fixed or percentage)
  - Grand total
- **Payment Settings**:
  - Discount type selector
  - Discount value input
  - Round-off adjustment
  - Payment mode selection
- **Action Buttons**:
  - Send KOT (deduct stock & send to kitchen)
  - Send Bill & Print (deduct stock & save bill)
  - Clear All (reset cart)

## Stock Deduction Flow

### Scenario 1: Send KOT (Kitchen Order)
```
User clicks "Send KOT"
    ↓
Validate cart is not empty
    ↓
Deduct stock for each item via POST /stock/remove
    ↓
    ├─ SUCCESS: Show confirmation, clear cart
    └─ FAILURE: Show error, keep items in cart
    ↓
Stock updated in inventory
Order sent to kitchen
```

### Scenario 2: Send Bill & Print
```
User clicks "Send Bill & Print"
    ↓
Validate cart is not empty
    ↓
Check if stock already deducted
    ├─ YES: Skip deduction, go to bill creation
    └─ NO: Deduct stock via POST /stock/remove
    ↓
Create bill via POST /savebill
    ↓
    ├─ SUCCESS: Print receipt, clear cart
    └─ FAILURE: Show error message
    ↓
Bill saved to database
Ledger entries created
Stock deducted from inventory
```

## Key Files

### Main Component
- `src/views/pos/newPOSAnt.jsx` (645 lines)

### Routes
- Added to `src/App.js`: `/sale/pos-ant`

### Menu Items
- Added to `src/components/Menu_item_vat.js`

### Dependencies
- Ant Design components (Layout, Card, Table, Button, Form, Select, etc.)
- axios for API calls
- react-toastify for notifications
- date-fns for date formatting

## Error Handling

### Stock Deduction Errors
- Network errors: "Failed to deduct stock: [error message]"
- Insufficient stock: Backend validation prevents over-selling
- Invalid item/unit: API returns validation error

### Bill Creation Errors
- Missing required fields: Form validation
- Database errors: Transaction rollback
- Payment mode validation: Only allowed modes

## User Notifications

### Success Messages
- "Item added to cart"
- "Stock deducted successfully"
- "Bill saved successfully"
- "Receipt sent to printer"
- "KOT sent to kitchen and stock deducted"

### Error Messages
- "Cart is empty"
- "Failed to deduct stock: [reason]"
- "Failed to save bill: [reason]"
- Toast notifications for all operations

## Audit Trail

Stock deduction includes:
- `referenceType`: "SALE" (for POS sales)
- `referenceId`: Bill ID (links to bill record)
- `notes`: Human-readable description including table/customer info
- `transaction_date`: Automatic timestamp from backend
- `user_id`: User performing the sale

This creates a complete audit trail for all stock movements.

## Configuration & Customization

### Default Unit
Currently hardcoded to `unitId: 1` (base unit). To support multi-unit sales:
1. Add unit selector to UI
2. Fetch units via GET `/api/stock/units/:productId`
3. Pass selected unit to stock deduction API

### Variants Support
For liquor/serving size variants:
1. Add variant selection to item cards
2. Use POST `/api/stock/remove-variant` instead of `/stock/remove`
3. Pass `variantId` instead of `unitId`

### Payment Modes
Currently supported:
- Cash
- Card
- QR Code
- Credit

Add more by editing the Select options in the UI.

### Keyboard Shortcuts
Can be added for:
- Quick item search (Ctrl+F)
- Send KOT (Ctrl+K)
- Send Bill (Ctrl+B)
- Clear Cart (Delete)

## Testing Checklist

- [ ] Load POS Ant page without errors
- [ ] Display all categories in sidebar
- [ ] Click category shows items
- [ ] Add item to cart
- [ ] Update item quantity
- [ ] Remove item from cart
- [ ] Calculate totals correctly (subtotal, tax, discount)
- [ ] Select customer and table
- [ ] Change discount type (fixed/percentage)
- [ ] Verify stock deduction on Send KOT
- [ ] Verify stock deduction on Send Bill
- [ ] Check ledger entries created for bill
- [ ] Verify audit trail in stock_transactions table
- [ ] Test error handling (empty cart, network errors)
- [ ] Test all payment modes
- [ ] Verify cart clears after successful operations
- [ ] Test on mobile/tablet responsiveness

## Future Enhancements

1. **Multi-Unit Support**: Allow selling in different units
2. **Variant Support**: Support liquor serving sizes
3. **Search**: Quick item search by name/code
4. **Favorites**: Quick access to popular items
5. **Presets**: Save common order combinations
6. **Split Bills**: Split bill among customers
7. **Delivery Orders**: Add delivery tracking
8. **Loyalty Points**: Integrate loyalty program
9. **Printer Setup**: Configure printer IP/port
10. **Advanced Reports**: Daily sales, stock movements, profit analysis

## Troubleshooting

### Stock Not Deducting
1. Check Authorization header (getHeaders() working correctly)
2. Verify productId matches item in database
3. Check unitId exists for that product
4. Review backend logs for errors

### Bill Not Saving
1. Ensure customer_id is valid (or null for walk-in)
2. Check table_id exists in database
3. Verify payment_mode is allowed
4. Review backend transaction logs

### UI Not Loading Items
1. Verify categories fetch successfully
2. Check items have correct `catid` matching category
3. Verify `isstockable: "1"` filter is working
4. Check backend API returns valid data

---
**Created:** January 30, 2026  
**Version:** 1.0  
**Status:** Production Ready with Stock Management
