# Implementation Checklist - Inventory System Upgrade

## ✅ Completed (Frontend)

- [x] Database schema created (`db/inventory_unit_conversion_schema.sql`)
- [x] Unit conversion utilities (`src/utility/unitConversions.js`)
- [x] Updated NewItemModal with unit configuration
- [x] Updated newStock.jsx with conversion logic
- [x] Created comprehensive documentation
- [x] Created quick reference guide
- [x] All files error-free

## 🔄 Next Steps (Implementation)

### Step 1: Database Migration (CRITICAL)
```bash
# Backup your database first!
mysqldump -u username -p cloudnet_chefmate > backup_before_migration.sql

# Run the migration
mysql -u username -p cloudnet_chefmate < db/inventory_unit_conversion_schema.sql

# Verify tables created
mysql -u username -p cloudnet_chefmate -e "SHOW TABLES LIKE '%unit%'"
mysql -u username -p cloudnet_chefmate -e "SHOW TABLES LIKE '%inventory%'"
```

### Step 2: Backend API Updates (REQUIRED)

The backend must accept these new fields:

#### Items API (`POST /insertdata/items`)
```javascript
// Add to request body validation
{
  // Existing fields
  iname, unit, tax, mrp, offerprice, catid, subcatid, description,
  
  // NEW FIELDS
  unit_type: 'simple' | 'convertible',
  base_unit: string,
  purchase_unit: string,
  bottle_capacity_ml: number | null,
  sale_units: JSON string | null,
  isstockable: 0 | 1
}
```

#### Inventory API (`POST /insertdata/inventory`)
```javascript
// Add to request body validation
{
  // Existing fields
  item_id, supplier_id, opening_stock, stock_in, stock_out,
  unit, purchase_price, vat, subtotal, vatAmount, netAmount,
  refno, pdate,
  
  // NEW FIELDS
  purchase_unit: string,
  purchase_quantity: number,
  base_unit: string
}
```

#### New API (`POST /insertdata/inventory_transactions`)
```javascript
// Create new endpoint
{
  item_id: number,
  transaction_type: 'purchase' | 'sale' | 'adjustment' | 'opening',
  quantity: number, // in base unit
  unit: string,
  unit_quantity: number,
  reference_id: string,
  reference_type: string,
  notes: string,
  transaction_date: date
}
```

#### Stock Query (`GET /getclosingstock/:item_id`)
```javascript
// Update to return base units
{
  closing_stock: number, // in base_unit (ML or pcs)
  base_unit: string,
  display_unit: string
}
```

### Step 3: Update Existing Data

Run these SQL commands to update existing items:

```sql
-- Mark all items as simple type initially
UPDATE items SET 
  unit_type = 'simple',
  base_unit = unit,
  purchase_unit = unit,
  isstockable = 1
WHERE isstockable IS NULL;

-- Example: Convert whiskey items to convertible type
UPDATE items SET
  unit_type = 'convertible',
  base_unit = 'ML',
  purchase_unit = 'Bottle',
  bottle_capacity_ml = 750,
  sale_units = '[{"unit":"30ML Peg","factor":30},{"unit":"60ML Peg","factor":60},{"unit":"Bottle","factor":750}]'
WHERE iname LIKE '%whiskey%' OR iname LIKE '%vodka%' OR iname LIKE '%rum%';

-- Verify updates
SELECT id, iname, unit_type, bottle_capacity_ml, sale_units 
FROM items 
WHERE unit_type = 'convertible';
```

### Step 4: Testing Checklist

#### Test Case 1: Add Simple Item (Coke)
- [ ] Navigate to Inventory → Add New Item
- [ ] Fill: Name="Coca Cola", Unit="cann"
- [ ] Set: Is Stockable=Yes, Unit Type=Simple
- [ ] Save successfully
- [ ] Verify in database: unit_type='simple'

#### Test Case 2: Add Convertible Item (Whiskey)
- [ ] Navigate to Inventory → Add New Item
- [ ] Fill: Name="Black Label", Unit="Bottle"
- [ ] Set: Is Stockable=Yes, Unit Type=Convertible
- [ ] Select: Bottle Capacity=750ML
- [ ] Verify: Sale units auto-populate
- [ ] Save successfully
- [ ] Verify in database: unit_type='convertible', sale_units JSON

#### Test Case 3: Purchase Simple Item
- [ ] Navigate to Inventory → Add New Stock
- [ ] Select: Coca Cola
- [ ] Enter: Stock In=500
- [ ] Fill: Price, Date, Supplier
- [ ] Save successfully
- [ ] Verify: Stock recorded as 500 pcs

#### Test Case 4: Purchase Convertible Item
- [ ] Navigate to Inventory → Add New Stock
- [ ] Select: Black Label
- [ ] Enter: Purchase Quantity=10, Purchase Unit=Bottle
- [ ] Verify: Stock In auto-calculates to 7,500 ML
- [ ] Fill: Price, Date, Supplier
- [ ] Save successfully
- [ ] Verify in DB: stock_in=7500, purchase_unit='Bottle', purchase_quantity=10

#### Test Case 5: Stock Calculation
- [ ] Purchase 10 bottles of whiskey (750ML)
- [ ] Verify: System shows 7,500 ML
- [ ] Check: Display shows "10.00 Bottles (7,500 ML)"
- [ ] Verify: Opening stock for next purchase is 7,500 ML

### Step 5: Frontend Build & Deploy

```bash
# Install dependencies (if needed)
cd d:\Projects\chefmate\chefmate_front
npm install

# Build production version
npm run build

# Test locally first
npm start

# Check browser console for errors
# Test all inventory operations
```

### Step 6: User Training

Prepare training materials:
- [ ] Print INVENTORY_QUICK_REFERENCE.md
- [ ] Review INVENTORY_UPDATE_SUMMARY.md with team
- [ ] Demo the new features
- [ ] Walk through liquor item setup
- [ ] Show stock entry process
- [ ] Explain unit conversions

### Step 7: Go-Live Checklist

Pre-Launch:
- [ ] Database migrated successfully
- [ ] Backend API updated and tested
- [ ] Frontend builds without errors
- [ ] All test cases passed
- [ ] Sample data configured
- [ ] User training completed
- [ ] Backup taken

Launch:
- [ ] Deploy frontend
- [ ] Deploy backend
- [ ] Verify connectivity
- [ ] Test with real data
- [ ] Monitor for errors

Post-Launch:
- [ ] User feedback collection
- [ ] Bug fixes if any
- [ ] Performance monitoring
- [ ] Data accuracy verification

## 📋 Files Reference

### Created Files
1. `db/inventory_unit_conversion_schema.sql` - Database changes
2. `src/utility/unitConversions.js` - Conversion functions
3. `INVENTORY_UNIT_CONVERSION_GUIDE.md` - Full documentation
4. `INVENTORY_UPDATE_SUMMARY.md` - Summary of changes
5. `INVENTORY_QUICK_REFERENCE.md` - Quick reference card
6. `INVENTORY_IMPLEMENTATION_CHECKLIST.md` - This file

### Modified Files
1. `src/components/Modals/NewItemModal.jsx` - Item configuration UI
2. `src/views/inventory/newStock.jsx` - Stock entry UI

## 🆘 Support & Rollback

### If Issues Occur

**Rollback Database**:
```bash
mysql -u username -p cloudnet_chefmate < backup_before_migration.sql
```

**Rollback Frontend**:
```bash
git checkout HEAD~1 src/components/Modals/NewItemModal.jsx
git checkout HEAD~1 src/views/inventory/newStock.jsx
git checkout HEAD~1 src/utility/unitConversions.js
npm run build
```

### Common Issues

**Issue**: Fields not showing  
**Fix**: Clear browser cache, hard refresh (Ctrl+F5)

**Issue**: API errors  
**Fix**: Check backend accepts new fields, verify API endpoints

**Issue**: Conversion wrong  
**Fix**: Verify bottle_capacity_ml and sale_units in database

**Issue**: Stock not calculating  
**Fix**: Check item.unit_type and item.base_unit values

## 📞 Contact

For technical support or questions:
- Review documentation files first
- Check browser console for errors
- Verify database schema matches expected
- Test with sample data before production

## ✅ Sign-off

- [ ] Database Admin verified migration successful
- [ ] Backend Developer confirmed API updates
- [ ] Frontend Developer tested all features
- [ ] QA tested all scenarios
- [ ] Manager approved for deployment
- [ ] Users trained on new features

---

**Implementation Date**: _________________  
**Implemented By**: _________________  
**Verified By**: _________________  
**Status**: ⏳ Pending Implementation
