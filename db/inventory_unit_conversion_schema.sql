-- Enhanced Inventory System with Unit Conversion Support
-- This migration adds support for multi-unit inventory tracking
-- Supports items like liquor (bottles with ML capacity) and regular items (pcs/cans)

-- Step 1: Add unit conversion columns to items table
ALTER TABLE `items` 
ADD COLUMN `unit_type` ENUM('simple', 'convertible') DEFAULT 'simple' COMMENT 'simple=pcs/cans, convertible=bottles with ML',
ADD COLUMN `base_unit` VARCHAR(20) DEFAULT NULL COMMENT 'Base unit for storage (e.g., ML for liquor, pcs for simple items)',
ADD COLUMN `purchase_unit` VARCHAR(20) DEFAULT NULL COMMENT 'Unit used for purchasing (e.g., Bottle for liquor)',
ADD COLUMN `sale_units` JSON DEFAULT NULL COMMENT 'JSON array of allowed sale units with conversion rates',
ADD COLUMN `bottle_capacity_ml` DECIMAL(10,2) DEFAULT NULL COMMENT 'Capacity in ML if item is liquor/convertible',
ADD COLUMN `isstockable` TINYINT(1) DEFAULT 0 COMMENT '1 if item tracks inventory';

-- Step 2: Update inventory table to use base units
ALTER TABLE `inventory`
ADD COLUMN `purchase_unit` VARCHAR(20) DEFAULT NULL COMMENT 'Unit used for purchase (e.g., Bottle)',
ADD COLUMN `purchase_quantity` DECIMAL(10,2) DEFAULT NULL COMMENT 'Quantity in purchase units',
ADD COLUMN `base_unit` VARCHAR(20) DEFAULT NULL COMMENT 'Base unit for storage (ML/pcs)',
MODIFY COLUMN `unit` VARCHAR(50) DEFAULT NULL COMMENT 'Display unit (kept for backward compatibility)';

-- Step 3: Create a new table for tracking unit conversions
CREATE TABLE IF NOT EXISTS `unit_conversions` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `item_id` INT NOT NULL,
  `from_unit` VARCHAR(20) NOT NULL,
  `to_unit` VARCHAR(20) NOT NULL,
  `conversion_factor` DECIMAL(10,4) NOT NULL COMMENT 'Factor to multiply from_unit to get to_unit',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_item_unit` (`item_id`, `from_unit`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Step 4: Create inventory transactions table for detailed tracking
CREATE TABLE IF NOT EXISTS `inventory_transactions` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `item_id` INT NOT NULL,
  `transaction_type` ENUM('purchase', 'sale', 'adjustment', 'opening') NOT NULL,
  `quantity` DECIMAL(10,2) NOT NULL COMMENT 'Quantity in base unit (ML or pcs)',
  `unit` VARCHAR(20) NOT NULL COMMENT 'Unit used in transaction',
  `unit_quantity` DECIMAL(10,2) NOT NULL COMMENT 'Quantity in transaction unit',
  `reference_id` VARCHAR(100) DEFAULT NULL COMMENT 'Bill ID or Purchase Ref',
  `reference_type` VARCHAR(50) DEFAULT NULL COMMENT 'invoice, purchase_order, etc',
  `notes` TEXT DEFAULT NULL,
  `transaction_date` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `created_by` INT DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_item_date` (`item_id`, `transaction_date`),
  KEY `idx_reference` (`reference_id`, `reference_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Step 5: Update existing simple items (non-liquor)
-- This is an example - adjust based on your actual data
UPDATE `items` 
SET 
  `unit_type` = 'simple',
  `base_unit` = `unit`,
  `purchase_unit` = `unit`,
  `isstockable` = 1
WHERE `unit` IN ('pcs', 'cann', 'can', 'bottle', 'pack', 'box');

-- Step 6: Sample data for liquor item configuration
-- Example: Whiskey bottle with 750ML capacity
-- INSERT INTO `items` (`catid`, `subcatid`, `iname`, `unit`, `tax`, `mrp`, `offerprice`, `description`, 
--   `unit_type`, `base_unit`, `purchase_unit`, `bottle_capacity_ml`, `sale_units`, `isstockable`) VALUES
-- (5, 12, 'Black Label Whiskey', 'Bottle', 7, 2500, 2300, 'Premium Scotch Whiskey 750ML',
--   'convertible', 'ML', 'Bottle', 750.00, 
--   '[{"unit":"30ML Peg","factor":30},{"unit":"60ML Peg","factor":60},{"unit":"Bottle","factor":750}]',
--   1);

-- Step 7: Add indexes for performance
ALTER TABLE `inventory` ADD INDEX `idx_item_id` (`item_id`);
ALTER TABLE `inventory_transactions` ADD INDEX `idx_transaction_type` (`transaction_type`);

-- Step 8: Create view for current stock levels in base units
CREATE OR REPLACE VIEW `v_current_stock` AS
SELECT 
  i.id as item_id,
  i.iname as item_name,
  i.unit_type,
  i.base_unit,
  i.purchase_unit,
  i.bottle_capacity_ml,
  COALESCE(SUM(
    CASE 
      WHEN it.transaction_type IN ('purchase', 'opening') THEN it.quantity
      WHEN it.transaction_type = 'sale' THEN -it.quantity
      ELSE 0
    END
  ), 0) as current_stock_base_unit,
  CASE 
    WHEN i.unit_type = 'convertible' AND i.bottle_capacity_ml > 0 
    THEN COALESCE(SUM(
      CASE 
        WHEN it.transaction_type IN ('purchase', 'opening') THEN it.quantity
        WHEN it.transaction_type = 'sale' THEN -it.quantity
        ELSE 0
      END
    ), 0) / i.bottle_capacity_ml
    ELSE COALESCE(SUM(
      CASE 
        WHEN it.transaction_type IN ('purchase', 'opening') THEN it.quantity
        WHEN it.transaction_type = 'sale' THEN -it.quantity
        ELSE 0
      END
    ), 0)
  END as current_stock_display_unit,
  CASE 
    WHEN i.unit_type = 'convertible' THEN CONCAT(i.bottle_capacity_ml, 'ML Bottle')
    ELSE i.base_unit
  END as display_unit
FROM items i
LEFT JOIN inventory_transactions it ON i.id = it.item_id
WHERE i.isstockable = 1
GROUP BY i.id, i.iname, i.unit_type, i.base_unit, i.purchase_unit, i.bottle_capacity_ml;

-- Step 9: Add comments for documentation
ALTER TABLE `items` 
  COMMENT = 'Items table with multi-unit support for inventory tracking';

ALTER TABLE `inventory` 
  COMMENT = 'Inventory purchase records with unit conversion support';

ALTER TABLE `unit_conversions` 
  COMMENT = 'Conversion factors between different units for each item';

ALTER TABLE `inventory_transactions` 
  COMMENT = 'Detailed transaction log for all inventory movements in base units';

COMMIT;
