# Inventory System - Quick Reference Card

## 🍾 Adding a Liquor Item

```
1. Inventory → Add New Item
2. Item Name: "Black Label Whiskey"
3. Unit: "Bottle"
4. Is Stockable?: Yes
5. Unit Type: Convertible (Bottles with ML)
6. Bottle Capacity: 750ML (Standard)
7. Sale Units: (Auto-populated)
   ✓ 30ML Peg → 30
   ✓ 60ML Peg → 60
   ✓ Bottle → 750
8. Save
```

## 🥤 Adding a Regular Item (Cans/Pcs)

```
1. Inventory → Add New Item
2. Item Name: "Coca Cola"
3. Unit: "cann"
4. Is Stockable?: Yes
5. Unit Type: Simple (Pcs/Cans)
6. Save
```

## 📦 Purchasing Liquor

```
1. Inventory → Add New Stock
2. Supplier: Select supplier
3. Select Item: Black Label Whiskey
4. Purchase Quantity: 10
5. Purchase Unit: Bottle
6. Stock In: 7,500 ML (auto-calculated)
7. Purchase Price: 2,500 (per bottle)
8. Save
```

## 📦 Purchasing Regular Items

```
1. Inventory → Add New Stock
2. Supplier: Select supplier
3. Select Item: Coca Cola
4. Stock In: 500 (cans)
5. Purchase Price: 25 (per can)
6. Save
```

## 💡 Unit Conversion Cheat Sheet

### Common Bottle Sizes
- Nip: 180 ML
- Half Bottle: 375 ML
- Standard: 750 ML
- 1 Liter: 1,000 ML
- Magnum: 1,750 ML

### Common Serving Sizes (Pegs)
- Small Peg: 30 ML
- Regular Peg: 60 ML
- Large Peg: 90 ML

### Calculations
```
1 Bottle (750ML) = 25 × 30ML Pegs
1 Bottle (750ML) = 12 × 60ML Pegs
1 Bottle (750ML) = 8 × 90ML Pegs

10 Bottles = 7,500 ML
20 Bottles = 15,000 ML
```

## 🔢 Stock Examples

### Whiskey Stock
```
Purchase: 100 bottles @ 750ML
Storage: 75,000 ML
Available Servings:
  - 2,500 × 30ML Pegs
  - 1,250 × 60ML Pegs
  - 100 × Full Bottles
```

### Vodka Stock (1L Bottle)
```
Purchase: 50 bottles @ 1,000ML
Storage: 50,000 ML
Available Servings:
  - 1,666 × 30ML Shots
  - 833 × 60ML Doubles
  - 50 × Full Bottles
```

### Beer/Cans
```
Purchase: 500 cans
Storage: 500 pcs
Available: 500 servings
```

## ⚠️ Important Rules

1. **Always select item first** - Units populate based on item type
2. **Purchase in wholesale units** - Bottles, cases, boxes
3. **System calculates base units** - Auto-converts to ML/pcs
4. **Sales deduct from base units** - Exact tracking
5. **Opening stock auto-fills** - Based on closing stock

## 🎯 Quick Checks

### Before Adding Stock
- ✓ Supplier selected?
- ✓ Reference number entered?
- ✓ Purchase date set?
- ✓ Item selected?
- ✓ Quantity and unit correct?

### Item Configuration
- ✓ Is Stockable = Yes?
- ✓ Unit type correct?
- ✓ Bottle capacity set? (for liquor)
- ✓ Sale units configured? (for liquor)

## 🚨 Troubleshooting

**Problem**: Purchase unit dropdown is empty  
**Fix**: Make sure item is set as "Convertible" type

**Problem**: Stock not converting  
**Fix**: Check bottle capacity is set correctly

**Problem**: Opening stock shows 0  
**Fix**: Normal for new items; will auto-update after first purchase

**Problem**: Can't find item in dropdown  
**Fix**: Check if item is marked "Is Stockable = Yes"

## 📊 Reports & Views

### Current Stock View
Shows:
- Item name
- Stock in base units (ML or pcs)
- Stock in display units (Bottles or cans)
- Value

### Transaction History
Shows:
- All purchases
- All sales
- Stock adjustments
- Running balance

## 🔄 Common Workflows

### Daily Opening
1. Check current stock levels
2. Compare with physical stock
3. Make adjustments if needed

### Receiving Stock
1. Add New Stock
2. Enter supplier details
3. Add items with quantities
4. Final Save for ledger entry

### Stock Taking
1. View current stock report
2. Count physical stock
3. Record differences
4. Adjust inventory

## 💾 Data Storage

```
Items Table:
  - unit_type: 'simple' or 'convertible'
  - base_unit: 'ML' or 'pcs'
  - bottle_capacity_ml: 750, 1000, etc.
  - sale_units: JSON array

Inventory Table:
  - stock_in: Always in base units
  - purchase_unit: What you bought
  - purchase_quantity: How many you bought

Transactions Table:
  - quantity: In base units
  - unit: Transaction unit
  - unit_quantity: In transaction unit
```

## 🎨 UI Hints

### Colors
- 🔵 Blue border: Input fields
- 🟢 Green: Success messages
- 🔴 Red: Error messages
- ⚪ Gray text: Auto-calculated fields

### Icons
- ✏️ Edit
- 🗑️ Delete
- ➕ Add
- ✓ Save
- ✖️ Cancel

---

**Print this page for quick reference!**
**Keep it near your inventory station.**
