# Whiskey Item Creation Guide (Correct Setup for Stock Deduction)

This guide explains how to create a whiskey item in the New Item modal so stock adds in bottles and deducts correctly when you sell 30ml/60ml/90ml pegs.

## Why this setup matters

For liquor, the system works on a base unit and conversion:

- Base unit = Bottle
- Sale units = 30ML / 60ML / 90ML (derived from bottle)
- Stock buy should be entered in bottle quantity
- Sale deduction is calculated from ml conversion

If unit setup is wrong, stock deduction will be wrong.

## Step-by-step in New Item modal

### 1. Basic item details

Fill normal fields first:

- Item Name: Example `Black Label`
- Category/Subcategory: Select liquor category
- Tax: As required
- MRP / Offer Price: As required
- Stockable: Enable stock tracking

### 2. Select correct Unit Type

In Unit Configuration:

- Unit Type: `Convertible (Liquor with ML)`

Do not use simple unit type for whiskey if you want peg-wise sale deduction.

### 3. Set bottle capacity (required)

- Bottle Capacity (ML): select actual bottle size, usually `750`

This is required because system calculates:

- conversionFactor = pegML / bottleML

Examples for 750ml bottle:

- 30ML peg = 30 / 750 = 0.04
- 60ML peg = 60 / 750 = 0.08
- 90ML peg = 90 / 750 = 0.12

### 4. Configure Sale Units

Keep these rows in Sale Units Configuration:

- 30ML Peg -> ml = 30 -> set selling price
- 60ML Peg -> ml = 60 -> set selling price
- 90ML Large Peg -> ml = 90 -> set selling price
- Bottle -> ml = 750 -> set bottle selling price (optional but recommended)

Important:

- Unit name should be clear and unique
- ml value must be correct numeric value
- Do not set ml as 0

### 5. Save item

Click Add Item.

On save, system creates:

1. Base unit: Bottle (isBaseUnit = true)
2. Derived units: 30/60/90 etc. (isBaseUnit = false)
3. Variant entries for derived units with quantity in base unit

## How to enter purchase stock after item creation

When buying inventory for this whiskey:

- Enter stock in Bottle unit only
- Example: Purchased 12 bottles (750ml)

Do not purchase in peg units.

## How sale deduction will happen

When POS sells peg unit:

- System reads selected unit ml
- Converts sale quantity to equivalent base/bottle quantity
- Deducts from bottle stock balance
- Logs stock transaction with reference order

## Quick validation checklist

Use this checklist after creating a whiskey item:

- Unit Type is Convertible
- Bottle Capacity selected (example 750)
- Bottle exists as base unit
- Peg units have correct ml (30/60/90)
- Selling price entered for each peg unit
- Stock purchase entered in Bottle quantity only

## Common mistakes

- Missing bottle capacity
- Wrong bottle capacity (e.g. 700 instead of 750)
- Entering purchase in 30ml/60ml unit instead of Bottle
- Keeping non-numeric ml values
- Creating whiskey as simple item type

## Example (recommended)

- Item: Black Label
- Unit Type: Convertible
- Bottle Capacity: 750
- Sale Units:
  - 30ML Peg -> 30
  - 60ML Peg -> 60
  - 90ML Large Peg -> 90
  - Bottle -> 750
- Purchase entry: 10 Bottles

This setup ensures buy-in-bottle and sell-in-peg both work correctly with stock deduction.
