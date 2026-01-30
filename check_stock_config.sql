-- ============================================
-- Stock Configuration Diagnostic Queries
-- Run these in phpMyAdmin to diagnose stock deduction issues
-- ============================================

-- 1. Check which items are marked as stockable
SELECT 
    id,
    iname AS item_name,
    isstockable,
    unit,
    offerprice,
    CASE 
        WHEN isstockable = 1 THEN '✅ Stockable'
        ELSE '❌ Not Stockable'
    END AS status
FROM items
ORDER BY isstockable DESC, iname;

-- 2. Check product_units configuration
-- (Should have at least one BASE unit per stockable item)
SELECT 
    pu.id,
    pu.product_id,
    i.iname AS item_name,
    pu.unit_name,
    pu.unit_type,
    pu.is_base_unit,
    pu.ml_capacity,
    pu.selling_price,
    pu.purchase_price,
    CASE 
        WHEN pu.is_base_unit = 1 THEN '⭐ BASE UNIT'
        ELSE 'DERIVED'
    END AS unit_status
FROM product_units pu
JOIN items i ON pu.product_id = i.id
WHERE pu.is_active = 1
ORDER BY pu.product_id, pu.is_base_unit DESC, pu.ml_capacity DESC;

-- 3. Check stock_balance for all products
-- (Must have entries with quantity > 0 to deduct stock)
SELECT 
    sb.id,
    sb.product_id,
    i.iname AS item_name,
    pu.unit_name,
    sb.current_quantity,
    sb.reserved_quantity,
    sb.available_quantity,
    sb.last_updated,
    CASE 
        WHEN sb.current_quantity > 0 THEN '✅ Stock Available'
        WHEN sb.current_quantity = 0 THEN '⚠️ Out of Stock'
        ELSE '❌ Negative Stock'
    END AS stock_status
FROM stock_balance sb
JOIN items i ON sb.product_id = i.id
JOIN product_units pu ON sb.unit_id = pu.id
ORDER BY sb.current_quantity DESC, i.iname;

-- 4. Find stockable items WITHOUT product_units configured
-- (These will fail stock deduction!)
SELECT 
    i.id,
    i.iname AS item_name,
    i.isstockable,
    'Missing product_units configuration' AS issue
FROM items i
WHERE i.isstockable = 1
  AND NOT EXISTS (
      SELECT 1 FROM product_units pu 
      WHERE pu.product_id = i.id AND pu.is_active = 1
  )
ORDER BY i.iname;

-- 5. Find stockable items WITHOUT stock_balance entries
-- (These will fail stock deduction!)
SELECT 
    i.id,
    i.iname AS item_name,
    pu.unit_name AS base_unit,
    'Missing stock_balance entry' AS issue
FROM items i
JOIN product_units pu ON i.id = pu.product_id AND pu.is_base_unit = 1
WHERE i.isstockable = 1
  AND NOT EXISTS (
      SELECT 1 FROM stock_balance sb 
      WHERE sb.product_id = i.id AND sb.unit_id = pu.id
  )
ORDER BY i.iname;

-- 6. Check recent stock transactions (SALE type)
-- (Should see records after successful stock deduction)
SELECT 
    st.id,
    st.product_id,
    i.iname AS item_name,
    st.transaction_type,
    pu.unit_name,
    st.quantity,
    st.quantity_in_ml,
    st.reference_type,
    st.reference_id AS order_number,
    st.notes,
    st.transaction_date
FROM stock_transactions st
JOIN items i ON st.product_id = i.id
JOIN product_units pu ON st.unit_id = pu.id
WHERE st.reference_type = 'SALE'
ORDER BY st.transaction_date DESC
LIMIT 20;

-- 7. Check unit conversions (for multi-unit items like liquor)
SELECT 
    sc.id,
    sc.product_id,
    i.iname AS item_name,
    pu_from.unit_name AS from_unit,
    pu_to.unit_name AS to_unit,
    sc.conversion_factor,
    CONCAT('1 ', pu_from.unit_name, ' = ', sc.conversion_factor, ' ', pu_to.unit_name) AS conversion
FROM stock_conversions sc
JOIN items i ON sc.product_id = i.id
JOIN product_units pu_from ON sc.from_unit_id = pu_from.id
JOIN product_units pu_to ON sc.to_unit_id = pu_to.id
WHERE sc.is_active = 1
ORDER BY i.iname, sc.conversion_factor DESC;

-- 8. Summary: Items ready for stock deduction
SELECT 
    i.id,
    i.iname AS item_name,
    i.isstockable,
    COUNT(DISTINCT pu.id) AS units_configured,
    COUNT(DISTINCT sb.id) AS balance_entries,
    MAX(sb.current_quantity) AS current_stock,
    CASE 
        WHEN i.isstockable = 1 
             AND EXISTS (SELECT 1 FROM product_units WHERE product_id = i.id AND is_base_unit = 1)
             AND EXISTS (SELECT 1 FROM stock_balance WHERE product_id = i.id)
             AND MAX(sb.current_quantity) > 0
        THEN '✅ Ready for Stock Deduction'
        WHEN i.isstockable = 0 THEN '⚪ Not Stockable (OK)'
        WHEN NOT EXISTS (SELECT 1 FROM product_units WHERE product_id = i.id) 
        THEN '❌ Missing Product Units'
        WHEN NOT EXISTS (SELECT 1 FROM stock_balance WHERE product_id = i.id) 
        THEN '❌ Missing Stock Balance'
        WHEN MAX(sb.current_quantity) <= 0 THEN '⚠️ Out of Stock'
        ELSE '❓ Unknown Issue'
    END AS status
FROM items i
LEFT JOIN product_units pu ON i.id = pu.product_id
LEFT JOIN stock_balance sb ON i.id = sb.product_id
GROUP BY i.id, i.iname, i.isstockable
ORDER BY 
    CASE 
        WHEN i.isstockable = 1 AND EXISTS (SELECT 1 FROM product_units WHERE product_id = i.id AND is_base_unit = 1) AND EXISTS (SELECT 1 FROM stock_balance WHERE product_id = i.id) AND MAX(sb.current_quantity) > 0 THEN 1
        WHEN i.isstockable = 0 THEN 2
        ELSE 3
    END,
    i.iname;

-- ============================================
-- QUICK FIXES
-- ============================================

-- Fix 1: Mark specific items as stockable (replace IDs with your items)
-- UPDATE items SET isstockable = 1 WHERE id IN (22, 23, 24);

-- Fix 2: Create BASE units for items (example for Beer - Bottle)
-- INSERT INTO product_units (product_id, unit_name, unit_type, conversion_factor, is_base_unit, ml_capacity, selling_price)
-- VALUES (22, 'Bottle', 'BASE', 1, 1, 650, 150.00);

-- Fix 3: Initialize stock balance (example with 10 bottles)
-- INSERT INTO stock_balance (product_id, unit_id, current_quantity, reserved_quantity)
-- VALUES (22, 1, 10.0000, 0.0000);

-- Fix 4: Add stock via stock API (preferred method)
-- Use POST /api/stock/add endpoint instead of direct SQL
