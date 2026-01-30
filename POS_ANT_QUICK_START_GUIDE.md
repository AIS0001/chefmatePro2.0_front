# POS Ant Design - Quick Start Guide

## 🚀 How to Access

### Method 1: Via Menu
1. Login to ChefMate
2. Navigate to: **Sales** → **POS (Ant - Stock Managed)**
3. Wait for page to load (fetching categories, items, customers, tables)

### Method 2: Direct URL
```
http://localhost:3000/sale/pos-ant
```

---

## 📋 Basic Operations

### Creating a Simple Sale

#### Step 1: Select Category
- Look at left sidebar
- Click on a category (e.g., "Beverages")
- Items from that category appear in the center

#### Step 2: Select Items
- Click on an item card to add to cart
- Item appears in the right panel (cart)
- Quantity defaults to 1

#### Step 3: Adjust Quantities
- In cart, find the item
- Use **+** button to increase quantity
- Use **-** button to decrease quantity
- Totals update automatically

#### Step 4: Remove Items (Optional)
- Click the trash icon next to item in cart
- Item removed from cart

#### Step 5: Set Discount (Optional)
- Choose discount type: **Fixed** or **Percentage**
- Enter discount value
- Grand total updates automatically

#### Step 6: Select Payment Mode
- Choose: Cash, Card, QR Code, or Credit
- This is required before bill creation

#### Step 7: Send KOT (Kitchen Order)
- Click **Send KOT (Deduct Stock)**
- Stock is deducted immediately
- Order is sent to kitchen
- Cart clears automatically
- Success message appears

#### Step 8: Send Bill & Print (Alternative)
- Instead of KOT, click **Send Bill & Print**
- Stock is deducted
- Bill is created and saved
- Receipt prints to thermal printer
- Cart clears
- Success message appears

---

## 🛒 Cart Operations

### Add Item
```
Click item card → Item added with qty=1
```

### Increase Quantity
```
Click item in cart → Click "+" button
qty increases by 1 → Totals update
```

### Decrease Quantity
```
Click item in cart → Click "-" button
qty decreases by 1 → If qty=0, item removed
```

### Remove Item
```
Click item in cart → Click trash icon → Item removed
```

### Clear All
```
Click "Clear All" button → Entire cart cleared
All inputs reset
```

---

## 💰 Pricing Examples

### Example 1: Simple Sale
```
Whiskey (₹800) x 1  → Subtotal: ₹800
Tax (7%)            → Tax: ₹56
No discount         → Discount: ₹0
---
GRAND TOTAL: ₹856
```

### Example 2: With Fixed Discount
```
Coke (₹150) x 2     → Subtotal: ₹300
Tax (5%)            → Tax: ₹15
Discount Fixed ₹50  → Discount: ₹50
---
GRAND TOTAL: ₹265
```

### Example 3: With Percentage Discount
```
Meal (₹500) x 1     → Subtotal: ₹500
Tax (12%)           → Tax: ₹60
Discount 10%        → Discount: ₹50
---
GRAND TOTAL: ₹510
```

### Example 4: With Round Off
```
Subtotal: ₹1234
Tax: ₹88.88
Discount: ₹50
Round Off: +0.12
---
GRAND TOTAL: ₹1273 (rounded from 1272.88)
```

---

## 👥 Customer & Table Selection

### For Dine-In Order
1. Select **Customer**: (Optional - leave blank for walk-in)
2. Select **Table**: Choose table number
3. Proceed with order

### For Delivery/Takeaway
1. Select **Customer**: Select from dropdown or leave blank
2. Table: Leave blank
3. Proceed with order

### For Credit Sale
1. Select **Customer**: Must select (required for credit)
2. Payment Mode: Select "Credit"
3. Proceed with order
4. Bill links customer for outstanding balance tracking

---

## 🔔 Notifications

### Success Messages
```
✓ Whiskey added to cart
✓ Stock deducted successfully
✓ Bill saved successfully
✓ Receipt sent to printer
✓ KOT sent to kitchen and stock deducted
```

### Warning Messages
```
⚠ Cart is empty (can't send KOT/Bill)
⚠ Please select at least one item
```

### Error Messages
```
✗ Failed to deduct stock: [Reason]
✗ Failed to save bill: [Reason]
✗ Session expired. Please login again
```

---

## 📊 Understanding Stock Deduction

### When Does Stock Get Deducted?

#### Option 1: Send KOT
- **When**: Immediately when "Send KOT" button clicked
- **What**: Stock is reduced by ordered quantities
- **Purpose**: Kitchen knows what's in inventory
- **Bill**: NOT created yet (KOT only)

#### Option 2: Send Bill & Print
- **When**: When "Send Bill & Print" button clicked
- **What**: 
  1. Stock is reduced
  2. Bill is created and saved
  3. Receipt is printed
- **Purpose**: Complete sale transaction
- **Bill**: Created with all details

### Stock Movement Record
Behind the scenes, each stock deduction creates a record:
- **Product**: Whiskey
- **Quantity**: 2 bottles
- **Type**: SALE (identified as sales transaction)
- **Bill ID**: Links to bill for audit
- **Date/Time**: When it happened
- **User**: Who made the sale

This creates a complete audit trail!

---

## ⚙️ Troubleshooting

### Issue: Items Not Showing
**Possible Cause**: Category not selected
**Solution**: 
1. Click on a category in left sidebar
2. Items will appear in center area

### Issue: "Insufficient Stock" Error
**Possible Cause**: Trying to sell more than available
**Solution**:
1. Check inventory level
2. Reduce quantity
3. Retry sale

### Issue: Stock Deducted but Bill Not Created
**Possible Cause**: Network error during bill saving
**Solution**:
1. Contact admin
2. Check if stock_transactions table has your entry
3. May need manual bill creation
4. This is rare - proper error handling prevents it

### Issue: Session Expired
**Possible Cause**: JWT token expired (idle for too long)
**Solution**:
1. Logout
2. Login again
3. Restart POS

### Issue: Customer/Table Dropdown Empty
**Possible Cause**: Data not loaded or none exist
**Solution**:
1. Refresh page (F5)
2. Check backend connectivity
3. Add customers/tables in master data first

---

## 🎯 Best Practices

### Before Shift
- [ ] Test KOT/Print buttons work
- [ ] Verify printer is connected
- [ ] Check stock levels are current
- [ ] Ensure categories have items

### During Operation
- [ ] Always select correct table
- [ ] Double-check quantities before sending
- [ ] Note discount reason in POS notes
- [ ] Watch for "Stock deducted" confirmation

### End of Shift
- [ ] Verify day-end closing stock report
- [ ] Compare stock movements with actual sales
- [ ] Check for any failed transactions
- [ ] Review high-discount items

---

## 📈 Performance Tips

### For Faster Browsing
1. Categories are on left - quick access
2. Most-used category first
3. Use search (if added) for specific items

### For Accuracy
1. Check item prices before selling
2. Verify discount before applying
3. Confirm totals match customer bill

### For Speed
1. Use keyboard shortcuts (if configured)
2. Pre-select popular items
3. Use saved order presets (if added)

---

## 📱 Mobile Usage

### Supported Devices
- Desktop/Laptop (best experience)
- Tablet (good experience)
- Large phones (usable, but cramped)

### Mobile Tips
1. Hold device in landscape mode
2. Use large fingers (not stylus)
3. Scroll carefully in cart area
4. Test printer before shift

---

## 🔐 Security Notes

- All actions require login
- Stock movements are logged
- Bills are auditable
- Cannot delete past transactions
- Only authorized users can access POS

---

## 📞 Support

### Common Issues
See **Troubleshooting** section above

### For Technical Issues
1. Check browser console for errors
2. Verify backend is running
3. Check database connectivity
4. Review API logs

### For Features
See documentation files:
- `POS_ANT_STOCK_MANAGED_DOCUMENTATION.md`
- `POS_ANT_API_INTEGRATION_EXAMPLES.md`

---

## ✅ First Time Checklist

- [ ] Access POS Ant page
- [ ] Select a category
- [ ] Add item to cart
- [ ] Increase quantity
- [ ] Set discount
- [ ] Select payment mode
- [ ] Click "Send KOT"
- [ ] Verify success message
- [ ] Check stock was deducted
- [ ] Repeat with "Send Bill & Print"

---

## 🎓 Learning Path

### Beginner
1. Read this Quick Start Guide
2. Practice adding items
3. Learn quantity adjustment

### Intermediate
1. Practice with discounts
2. Learn customer/table selection
3. Understand stock deduction

### Advanced
1. Learn multiple payment modes
2. Understand audit trail
3. Monitor stock movements

---

**Created:** January 30, 2026  
**Version:** 1.0  
**Last Updated:** January 30, 2026

For detailed technical information, see:
- POS_ANT_STOCK_MANAGED_DOCUMENTATION.md
- POS_ANT_API_INTEGRATION_EXAMPLES.md
- POS_ANT_IMPLEMENTATION_SUMMARY.md
