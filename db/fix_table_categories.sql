-- =============================================================================
-- Fix Table Category Assignment
-- This script will properly assign table categories to tables
-- =============================================================================

-- First, let's see the current table data
SELECT * FROM tablelist ORDER BY name;

-- Check if table_category table exists and has data
SELECT * FROM table_category ORDER BY id;

-- Update tables to assign proper category IDs
-- Assuming you have table categories like:
-- 1 = Dining Area
-- 2 = VIP Area  
-- 3 = Outdoor Area
-- 4 = Private Room

-- Method 1: Update by table name pattern
UPDATE tablelist 
SET table_cat_id = 1, category = '1'
WHERE name REGEXP '^Table [1-5]$';

UPDATE tablelist 
SET table_cat_id = 2, category = '2'
WHERE name REGEXP '^Table [6-9]$|^Table 10$';

UPDATE tablelist 
SET table_cat_id = 3, category = '3'
WHERE name REGEXP '^Table 1[1-5]$';

-- Method 2: Update specific tables individually
-- UPDATE tablelist SET table_cat_id = 1, category = '1' WHERE name = 'Table 1';
-- UPDATE tablelist SET table_cat_id = 1, category = '1' WHERE name = 'Table 2';
-- UPDATE tablelist SET table_cat_id = 1, category = '1' WHERE name = 'Table 3';
-- UPDATE tablelist SET table_cat_id = 1, category = '1' WHERE name = 'Table 4';
-- UPDATE tablelist SET table_cat_id = 1, category = '1' WHERE name = 'Table 5';

-- UPDATE tablelist SET table_cat_id = 2, category = '2' WHERE name = 'Table 6';
-- UPDATE tablelist SET table_cat_id = 2, category = '2' WHERE name = 'Table 7';
-- UPDATE tablelist SET table_cat_id = 2, category = '2' WHERE name = 'Table 8';
-- UPDATE tablelist SET table_cat_id = 2, category = '2' WHERE name = 'Table 9';
-- UPDATE tablelist SET table_cat_id = 2, category = '2' WHERE name = 'Table 10';

-- Verify the updates
SELECT 
    id,
    name,
    table_cat_id,
    category,
    status
FROM tablelist 
ORDER BY name;

-- Show tables with their category names
SELECT 
    t.id,
    t.name as table_name,
    t.table_cat_id,
    t.category,
    tc.cat_name as category_name,
    t.status
FROM tablelist t
LEFT JOIN table_category tc ON t.table_cat_id = tc.id
ORDER BY t.name;

-- =============================================================================
-- Alternative: If table_cat_id column doesn't exist, add it
-- =============================================================================

-- Check if table_cat_id column exists
-- SHOW COLUMNS FROM tablelist LIKE 'table_cat_id';

-- If it doesn't exist, add it:
-- ALTER TABLE tablelist ADD COLUMN table_cat_id INT NULL;
-- ALTER TABLE tablelist ADD INDEX idx_table_cat_id (table_cat_id);

-- If category column needs to be updated to store ID instead of name:
-- ALTER TABLE tablelist MODIFY COLUMN category VARCHAR(50) NULL;

-- =============================================================================
-- Insert sample table categories if they don't exist
-- =============================================================================

INSERT IGNORE INTO table_category (id, cat_name) VALUES 
(1, 'Dining Area'),
(2, 'VIP Area'),
(3, 'Outdoor Area'),
(4, 'Private Room');

-- =============================================================================
-- Create a view for tables with category information
-- =============================================================================

CREATE OR REPLACE VIEW tables_with_categories AS
SELECT 
    t.id,
    t.name,
    t.table_cat_id,
    t.category,
    tc.cat_name as category_name,
    t.status,
    CASE 
        WHEN t.status = 0 THEN 'Available'
        WHEN t.status = 1 THEN 'Occupied'
        ELSE 'Unknown'
    END as status_text
FROM tablelist t
LEFT JOIN table_category tc ON t.table_cat_id = tc.id
ORDER BY t.name;

-- Test the view
SELECT * FROM tables_with_categories;
