-- =====================================================
-- Stock Database Verification Queries
-- Use these queries to check if stock data is being saved
-- =====================================================

-- 1. Check if stock_balance table exists and has data
SELECT 
    'stock_balance table check' as check_type,
    COUNT(*) as total_records
FROM stock_balance;

-- 2. View all stock balance records
SELECT 
    sb.id,
    i.iname as product_name,
    pu.unit_name,
    sb.current_quantity,
    sb.reserved_quantity,
    sb.available_quantity,
    sb.last_updated
FROM stock_balance sb
JOIN items i ON sb.product_id = i.id
JOIN product_units pu ON sb.unit_id = pu.id
ORDER BY i.iname, pu.unit_name;

-- 3. Check if stock_transactions table exists and has data
SELECT 
    'stock_transactions table check' as check_type,
    COUNT(*) as total_records
FROM stock_transactions;

-- 4. View recent stock transactions (last 20)
SELECT 
    st.id,
    i.iname as product_name,
    pu.unit_name,
    st.transaction_type,
    st.quantity,
    st.reference_type,
    st.reference_id,
    st.notes,
    st.transaction_date,
    st.user_id
FROM stock_transactions st
JOIN items i ON st.product_id = i.id
JOIN product_units pu ON st.unit_id = pu.id
ORDER BY st.transaction_date DESC
LIMIT 20;

-- 5. Check stock for a specific product (change product_id = 1 to your product)
SELECT 
    'Product ID 1 (Black Label) stock check' as check_type;

SELECT 
    sb.id,
    sb.product_id,
    i.iname as product_name,
    sb.unit_id,
    pu.unit_name,
    pu.ml_capacity,
    sb.current_quantity,
    sb.reserved_quantity,
    sb.available_quantity,
    sb.last_updated
FROM stock_balance sb
JOIN items i ON sb.product_id = i.id
JOIN product_units pu ON sb.unit_id = pu.id
WHERE sb.product_id = 1;

-- 6. Check transactions for a specific product
SELECT 
    st.id,
    st.transaction_type,
    pu.unit_name,
    st.quantity,
    st.quantity_in_ml,
    st.reference_type,
    st.reference_id,
    st.notes,
    st.transaction_date
FROM stock_transactions st
JOIN product_units pu ON st.unit_id = pu.id
WHERE st.product_id = 1
ORDER BY st.transaction_date DESC;

-- 7. Check if product_units are configured
SELECT 
    pu.id,
    pu.product_id,
    i.iname as product_name,
    pu.unit_name,
    pu.unit_type,
    pu.ml_capacity,
    pu.is_base_unit,
    pu.purchase_price,
    pu.selling_price,
    pu.is_active
FROM product_units pu
JOIN items i ON pu.product_id = i.id
WHERE pu.product_id = 1
ORDER BY pu.is_base_unit DESC, pu.ml_capacity DESC;

-- 8. Find products that are stockable but have no stock balance
SELECT 
    i.id,
    i.iname,
    i.isstockable,
    'No stock balance record' as issue
FROM items i
WHERE i.isstockable = 1
AND NOT EXISTS (
    SELECT 1 FROM stock_balance sb WHERE sb.product_id = i.id
)
LIMIT 20;

-- 9. Find products with stock but no units configured
SELECT 
    i.id,
    i.iname,
    'No units configured' as issue
FROM items i
WHERE i.isstockable = 1
AND NOT EXISTS (
    SELECT 1 FROM product_units pu WHERE pu.product_id = i.id AND pu.is_active = 1
)
LIMIT 20;

-- 10. Summary report
SELECT 
    'Total stockable items' as metric,
    COUNT(*) as value
FROM items WHERE isstockable = 1

UNION ALL

SELECT 
    'Items with stock balance' as metric,
    COUNT(DISTINCT product_id) as value
FROM stock_balance

UNION ALL

SELECT 
    'Items with units configured' as metric,
    COUNT(DISTINCT product_id) as value
FROM product_units WHERE is_active = 1

UNION ALL

SELECT 
    'Total stock transactions' as metric,
    COUNT(*) as value
FROM stock_transactions

UNION ALL

SELECT 
    'Stock transactions today' as metric,
    COUNT(*) as value
FROM stock_transactions 
WHERE DATE(transaction_date) = CURDATE();

-- =====================================================
-- TROUBLESHOOTING: If you find issues
-- =====================================================

-- To manually add stock for testing (Product ID 1, Unit ID 3):
/*
INSERT INTO stock_balance (product_id, unit_id, current_quantity, reserved_quantity, available_quantity)
VALUES (1, 3, 10.00, 0.00, 10.00)
ON DUPLICATE KEY UPDATE 
    current_quantity = current_quantity + 10,
    available_quantity = available_quantity + 10;

INSERT INTO stock_transactions 
(product_id, transaction_type, unit_id, quantity, reference_type, notes, user_id)
VALUES 
(1, 'ADD', 3, 10.00, 'ADJUSTMENT', 'Manual test stock addition', NULL);
*/

-- To check if tables exist:
/*
SHOW TABLES LIKE '%stock%';
DESCRIBE stock_balance;
DESCRIBE stock_transactions;
*/
