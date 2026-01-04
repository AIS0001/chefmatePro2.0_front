-- Fix order_items table to support decimal quantities
-- This script modifies the quantity column to support decimal values for weight-based items

-- First, let's see the current structure (run this separately to check)
-- DESCRIBE order_items;

-- Option 1: If the table exists and has data, alter the column type
ALTER TABLE order_items 
MODIFY COLUMN quantity DECIMAL(10,3) NOT NULL DEFAULT 0.000;

-- Option 2: If creating a new table, use this structure
/*
CREATE TABLE IF NOT EXISTS order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_number INT NOT NULL,
    table_number VARCHAR(50),
    item_name VARCHAR(255) NOT NULL,
    quantity DECIMAL(10,3) NOT NULL DEFAULT 0.000,  -- Supports up to 9999999.999
    price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    uom VARCHAR(50) DEFAULT '',  -- Unit of measure (kg, g, pcs, etc.)
    weight_based TINYINT(1) DEFAULT 0,  -- 1 for weight-based items, 0 for regular items
    status VARCHAR(10) DEFAULT '1',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_order_number (order_number),
    INDEX idx_table_number (table_number)
);
*/

-- Update any existing records that might have been truncated
-- This will help if you have existing data that was saved as 0
-- UPDATE order_items SET quantity = 1.000 WHERE quantity = 0 AND weight_based = 1;

-- Optional: Add a comment to the quantity column for clarity
ALTER TABLE order_items 
MODIFY COLUMN quantity DECIMAL(10,3) NOT NULL DEFAULT 0.000 
COMMENT 'Quantity - supports decimal values for weight-based items (e.g., 0.250 for 250g)';

SELECT 'order_items table quantity column updated successfully!' as status;
