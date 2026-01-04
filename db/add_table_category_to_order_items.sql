-- Add table category ID column to order_items table
-- This migration adds table_cat_id to track which table category each order item belongs to

-- Add table_cat_id column to order_items table
ALTER TABLE order_items 
ADD COLUMN table_cat_id INT DEFAULT NULL 
COMMENT 'Foreign key reference to table_category.id';

-- Add index for better query performance
ALTER TABLE order_items 
ADD INDEX idx_table_cat_id (table_cat_id);

-- Add foreign key constraint (optional - uncomment if you want referential integrity)
-- ALTER TABLE order_items 
-- ADD CONSTRAINT fk_order_items_table_category 
-- FOREIGN KEY (table_cat_id) REFERENCES table_category(id) 
-- ON DELETE SET NULL ON UPDATE CASCADE;

SELECT 'order_items table updated with table_cat_id column successfully!' as status;
