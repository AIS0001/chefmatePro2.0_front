# Enhanced Inventory System with Unit Conversion

## Overview

The enhanced inventory system now supports smart unit conversion for different types of items:
- **Simple Items**: Items sold and purchased in the same unit (e.g., coke in cans, chips in pcs)
- **Convertible Items**: Items like liquor where purchase is in bottles but sales can be in different portions (30ML peg, 60ML peg, full bottle)

## Key Features

### 1. Multi-Unit Support
- Items can be purchased in one unit (e.g., bottles) and sold in different units (e.g., 30ML pegs)
- Automatic conversion between units
- Base unit storage (ML for liquor, pcs for simple items)

### 2. Smart Stock Tracking
- Opening stock tracked in base units
- Purchase entries converted to base units automatically
- Sales deducted based on actual serving size
- Real-time stock calculation

### 3. Flexible Configuration
- Configurable bottle sizes (180ML, 375ML, 750ML, 1L, 1.75L)
- Customizable sale units (30ML Peg, 60ML Peg, 90ML Large Peg, Full Bottle)
- Support for any custom unit combinations

## Database Changes

### New Columns in `items` Table

```sql
- unit_type: 'simple' or 'convertible'
- base_unit: Unit for storage (ML for liquor, pcs for simple)
- purchase_unit: Unit used for purchasing (Bottle for liquor)
- bottle_capacity_ml: Capacity in ML if item is liquor
- sale_units: JSON array of sale unit options
- isstockable: Whether item tracks inventory (0/1)
```

### New Columns in `inventory` Table

```sql
- purchase_unit: Unit used in this purchase
- purchase_quantity: Quantity in purchase units
- base_unit: Base unit for reference
```

### New Tables

#### `unit_conversions`
Stores conversion factors between units for each item.

```sql
- item_id: Reference to items table
- from_unit: Source unit
- to_unit: Target unit
- conversion_factor: Multiplier for conversion
```

#### `inventory_transactions`
Detailed log of all inventory movements.

```sql
- item_id: Reference to items table
- transaction_type: 'purchase', 'sale', 'adjustment', 'opening'
- quantity: Quantity in base unit
- unit: Unit used in transaction
- unit_quantity: Quantity in transaction unit
- reference_id: Bill ID or Purchase Ref
- reference_type: 'invoice', 'purchase_order', etc.
- transaction_date: When transaction occurred
```

#### View: `v_current_stock`
Real-time view of current stock levels with conversions.

## Usage Guide

### Adding a New Item

1. **Navigate to**: Inventory → Add New Item
2. **Fill Basic Details**: Name, Category, Tax, etc.
3. **Set "Is Stockable"**: Yes
4. **Choose Unit Type**:
   - **Simple**: For items like cans, pcs, boxes
   - **Convertible**: For liquor items

5. **For Convertible Items**:
   - Select Bottle Capacity (e.g., 750ML)
   - Configure Sale Units:
     - 30ML Peg → 30
     - 60ML Peg → 60
     - Bottle → 750
   - Add/remove sale units as needed

### Adding Stock (Purchase)

1. **Navigate to**: Inventory → Add New Stock
2. **Select Supplier** and enter Ref. No., Date
3. **Select Item**
4. **For Convertible Items** (e.g., Whiskey):
   - Purchase Quantity: Enter number (e.g., 10)
   - Purchase Unit: Select "Bottle"
   - Stock In: Auto-calculated (e.g., 10 × 750ML = 7500 ML)
   
5. **For Simple Items** (e.g., Coke):
   - Stock In: Enter quantity directly (e.g., 500 cans)

6. **Enter Purchase Price**: Price per unit
7. **VAT Calculation**: Auto-calculated based on tax settings
8. **Click "Add Item"** to save

### Stock Display Examples

#### Liquor Item (Convertible)
```
Item: Black Label Whiskey
Purchase: 10 Bottles @ 750ML each
Stock In: 7,500 ML
Display: 10.00 Bottles (7,500 ML)
```

#### Simple Item
```
Item: Coca Cola
Purchase: 500 Cans
Stock In: 500 pcs
Display: 500.00 cans
```

### How Sales Deduct Stock

#### Example 1: Selling Whiskey Pegs
```
Current Stock: 7,500 ML (10 bottles)

Sale 1: 1 × 30ML Peg
Deduction: 30 ML
New Stock: 7,470 ML (9.96 bottles)

Sale 2: 2 × 60ML Pegs
Deduction: 120 ML
New Stock: 7,350 ML (9.8 bottles)

Sale 3: 1 × Full Bottle
Deduction: 750 ML
New Stock: 6,600 ML (8.8 bottles)
```

#### Example 2: Selling Cans
```
Current Stock: 500 cans

Sale 1: 24 cans
Deduction: 24 pcs
New Stock: 476 cans
```

## Configuration Examples

### Example 1: Whiskey (750ML Bottle)

**Item Configuration:**
```json
{
  "iname": "Black Label Whiskey",
  "unit": "Bottle",
  "unit_type": "convertible",
  "base_unit": "ML",
  "purchase_unit": "Bottle",
  "bottle_capacity_ml": 750,
  "sale_units": [
    {"unit": "30ML Peg", "factor": 30},
    {"unit": "60ML Peg", "factor": 60},
    {"unit": "90ML Large Peg", "factor": 90},
    {"unit": "Bottle", "factor": 750}
  ],
  "isstockable": 1
}
```

**Stock Entry:**
- Purchase: 100 bottles
- Conversion: 100 × 750 = 75,000 ML
- Stock recorded: 75,000 ML in base unit

**Sale Options:**
- 30ML Peg: Customer gets 30ML
- 60ML Peg: Customer gets 60ML
- Bottle: Customer gets 750ML

### Example 2: Vodka (1 Liter Bottle)

**Item Configuration:**
```json
{
  "iname": "Absolut Vodka",
  "unit": "Bottle",
  "unit_type": "convertible",
  "base_unit": "ML",
  "purchase_unit": "Bottle",
  "bottle_capacity_ml": 1000,
  "sale_units": [
    {"unit": "30ML Shot", "factor": 30},
    {"unit": "45ML Double", "factor": 45},
    {"unit": "Bottle", "factor": 1000}
  ],
  "isstockable": 1
}
```

### Example 3: Beer (Simple)

**Item Configuration:**
```json
{
  "iname": "Heineken Beer",
  "unit": "bottle",
  "unit_type": "simple",
  "base_unit": "bottle",
  "purchase_unit": "bottle",
  "isstockable": 1
}
```

### Example 4: Soft Drink (Simple)

**Item Configuration:**
```json
{
  "iname": "Coca Cola",
  "unit": "cann",
  "unit_type": "simple",
  "base_unit": "cann",
  "purchase_unit": "cann",
  "isstockable": 1
}
```

## Stock Reports

The stock report will show:
- **Item Name**
- **Current Stock in Base Units** (e.g., 7,500 ML or 500 cans)
- **Current Stock in Display Units** (e.g., 10 Bottles or 500 cans)
- **Opening Stock**
- **Stock In** (Purchases)
- **Stock Out** (Sales)
- **Closing Stock**

## API Integration

### Frontend to Backend

The system sends the following data structure:

```javascript
// For inventory purchase
{
  item_id: 23,
  supplier_id: 2,
  purchase_unit: "Bottle",
  purchase_quantity: 10,
  stock_in: 7500, // Auto-calculated in base unit
  base_unit: "ML",
  purchase_price: 2500,
  vat: 7,
  subtotal: 11682.24,
  vatAmount: 817.76,
  netAmount: 12500.00,
  refno: "PO-2026-001",
  pdate: "2026-01-29"
}
```

### Backend Requirements

The backend API should:

1. **Accept the enhanced inventory fields**
2. **Store in inventory table** with purchase_unit and base_unit
3. **Create transaction record** in inventory_transactions table
4. **Return closing stock** in base units for opening balance

### Required API Endpoints

1. `POST /insertdata/inventory` - Save purchase entry
2. `POST /insertdata/inventory_transactions` - Log transaction
3. `GET /getclosingstock/:item_id` - Get current stock in base units
4. `GET /inventory/joined` - Get inventory with item names
5. `GET /getinvoiceitems/:refno` - Get all items in an invoice

## Utility Functions

The system includes utility functions in `/src/utility/unitConversions.js`:

- `convertToBaseUnit()` - Convert any unit to base unit
- `convertFromBaseUnit()` - Convert base unit to any unit
- `getAvailableSaleUnits()` - Get sale unit options for an item
- `formatStockDisplay()` - Format stock for display
- `calculateStockAfterSale()` - Calculate remaining stock after sale
- `hasAvailableStock()` - Check if sufficient stock available

## Migration Steps

1. **Run Database Migration**:
   ```bash
   mysql -u username -p database_name < db/inventory_unit_conversion_schema.sql
   ```

2. **Update Existing Items**:
   - Set `unit_type = 'simple'` for all current items
   - Set `base_unit = unit` for simple items
   - Set `isstockable = 1` for items that need inventory tracking

3. **Configure Liquor Items**:
   - Change `unit_type` to `'convertible'`
   - Set `bottle_capacity_ml`
   - Add `sale_units` JSON configuration
   - Set `base_unit = 'ML'`
   - Set `purchase_unit = 'Bottle'`

4. **Test the System**:
   - Add a new liquor item
   - Add stock with bottles
   - Verify stock calculation in ML
   - Test different sale units

## Benefits

1. **Accurate Inventory**: Track exact quantities in base units
2. **Flexible Selling**: Sell in different portion sizes
3. **Reduced Wastage**: Know exact ML/pcs available
4. **Better Costing**: Calculate cost per ML/peg
5. **Easy Reconciliation**: Clear audit trail of all transactions
6. **Scalable**: Easy to add new items and units

## Troubleshooting

### Issue: Stock not calculating correctly

**Solution**: 
- Check that `bottle_capacity_ml` is set correctly
- Verify `sale_units` JSON is valid
- Ensure `unit_type` is set to 'convertible'

### Issue: Purchase units not showing

**Solution**:
- Verify item has `unit_type = 'convertible'`
- Check that `sale_units` JSON is populated
- Refresh the page after selecting item

### Issue: Base unit conversion wrong

**Solution**:
- Verify conversion factors in `sale_units`
- Check that purchase_unit matches a unit in sale_units
- Ensure bottle_capacity_ml is correct

## Future Enhancements

1. **Recipe Management**: Deduct ingredients based on recipe
2. **Wastage Tracking**: Log spillage and wastage
3. **Batch Tracking**: Track different purchase batches
4. **Expiry Management**: Monitor expiry dates
5. **Reorder Alerts**: Auto-alerts when stock low
6. **Multi-location**: Track stock across multiple locations

## Support

For issues or questions:
1. Check the documentation above
2. Review error messages in browser console
3. Verify database schema is updated
4. Check API responses in network tab

---

**Last Updated**: January 29, 2026
**Version**: 1.0
