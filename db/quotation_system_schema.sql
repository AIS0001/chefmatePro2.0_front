-- =====================================================
-- ChefMate Quotation System Database Schema
-- Created: September 1, 2025
-- Description: Database tables for quotation management
-- =====================================================

-- Create quotations table
CREATE TABLE IF NOT EXISTS `quotations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `quotation_number` varchar(50) DEFAULT NULL,
  `customer_id` int(11) DEFAULT NULL,
  `customer_name` varchar(255) NOT NULL,
  `customer_phone` varchar(20) NOT NULL,
  `customer_email` varchar(255) DEFAULT NULL,
  `customer_address` text DEFAULT NULL,
  `customer_gst` varchar(50) DEFAULT NULL,
  `delivery_place` varchar(255) DEFAULT NULL,
  `subtotal` decimal(10,2) DEFAULT 0.00,
  `discount_type` enum('percentage','amount') DEFAULT 'percentage',
  `discount_value` decimal(10,2) DEFAULT 0.00,
  `subtotal_afterdiscount` decimal(10,2) DEFAULT 0.00,
  `tax` decimal(10,2) DEFAULT 0.00,
  `round_off` decimal(10,2) DEFAULT 0.00,
  `grand_total` decimal(10,2) DEFAULT 0.00,
  `status` enum('pending','approved','rejected','converted','expired') DEFAULT 'pending',
  `valid_until` date DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `updated_by` int(11) DEFAULT NULL,
  `setup_date` date DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_customer_id` (`customer_id`),
  KEY `idx_quotation_number` (`quotation_number`),
  KEY `idx_status` (`status`),
  KEY `idx_setup_date` (`setup_date`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_valid_until` (`valid_until`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Quotations master table';

-- Create quotation_items table
CREATE TABLE IF NOT EXISTS `quotation_items` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `quotation_id` int(11) NOT NULL,
  `item_id` int(11) DEFAULT NULL,
  `item_name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `quantity` decimal(10,3) NOT NULL DEFAULT 1.000,
  `uom` varchar(20) DEFAULT 'PCS',
  `rate` decimal(10,2) NOT NULL DEFAULT 0.00,
  `amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `discount_percent` decimal(5,2) DEFAULT 0.00,
  `discount_value` decimal(10,2) DEFAULT 0.00,
  `cgst` decimal(5,2) DEFAULT 0.00,
  `sgst` decimal(5,2) DEFAULT 0.00,
  `igst` decimal(5,2) DEFAULT 0.00,
  `vat` decimal(5,2) DEFAULT 0.00,
  `tax_amount` decimal(10,2) DEFAULT 0.00,
  `net_amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `tax_included` tinyint(1) DEFAULT 0,
  `sort_order` int(11) DEFAULT 0,
  `setup_date` date DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_quotation_id` (`quotation_id`),
  KEY `idx_item_id` (`item_id`),
  KEY `idx_setup_date` (`setup_date`),
  CONSTRAINT `fk_quotation_items_quotation` FOREIGN KEY (`quotation_id`) REFERENCES `quotations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Quotation items detail table';

-- Create quotation_history table for tracking changes
CREATE TABLE IF NOT EXISTS `quotation_history` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `quotation_id` int(11) NOT NULL,
  `action` varchar(50) NOT NULL,
  `old_status` varchar(20) DEFAULT NULL,
  `new_status` varchar(20) DEFAULT NULL,
  `comments` text DEFAULT NULL,
  `action_by` int(11) DEFAULT NULL,
  `action_date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_quotation_id` (`quotation_id`),
  KEY `idx_action_date` (`action_date`),
  CONSTRAINT `fk_quotation_history_quotation` FOREIGN KEY (`quotation_id`) REFERENCES `quotations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Quotation status change history';

-- Create indexes for better performance
CREATE INDEX `idx_quotations_customer_status` ON `quotations` (`customer_id`, `status`);
CREATE INDEX `idx_quotations_date_status` ON `quotations` (`setup_date`, `status`);
CREATE INDEX `idx_quotation_items_quotation_item` ON `quotation_items` (`quotation_id`, `item_id`);

-- Insert sample data (optional)
-- Uncomment the following lines if you want to insert sample data

/*
-- Sample quotation
INSERT INTO `quotations` (
  `quotation_number`, 
  `customer_name`, 
  `customer_phone`, 
  `customer_email`, 
  `customer_address`, 
  `subtotal`, 
  `tax`, 
  `grand_total`, 
  `status`, 
  `valid_until`, 
  `setup_date`
) VALUES (
  'QUO-2025-0001', 
  'John Doe', 
  '+66 123 456 789', 
  'john.doe@email.com', 
  '123 Main Street, Bangkok', 
  1000.00, 
  70.00, 
  1070.00, 
  'pending', 
  DATE_ADD(CURDATE(), INTERVAL 30 DAY), 
  CURDATE()
);

-- Sample quotation items
INSERT INTO `quotation_items` (
  `quotation_id`, 
  `item_name`, 
  `description`, 
  `quantity`, 
  `rate`, 
  `amount`, 
  `cgst`, 
  `sgst`, 
  `net_amount`, 
  `setup_date`
) VALUES 
(1, 'Tawa Roti', 'Fresh made tawa roti', 10, 25.00, 250.00, 2.50, 2.50, 262.50, CURDATE()),
(1, 'Dal Makhani', 'Rich and creamy dal makhani', 2, 150.00, 300.00, 2.50, 2.50, 315.00, CURDATE()),
(1, 'Butter Chicken', 'Tender chicken in rich tomato gravy', 2, 200.00, 400.00, 2.50, 2.50, 420.00, CURDATE());
*/

-- Create triggers for automatic quotation number generation
DELIMITER $$

CREATE TRIGGER `quotation_number_generator` 
BEFORE INSERT ON `quotations` 
FOR EACH ROW 
BEGIN
  DECLARE next_number INT;
  DECLARE quotation_number VARCHAR(50);
  
  -- Get the next quotation number
  SELECT COALESCE(MAX(CAST(SUBSTRING(quotation_number, 10) AS UNSIGNED)), 0) + 1 
  INTO next_number 
  FROM quotations 
  WHERE quotation_number LIKE CONCAT('QUO-', YEAR(CURDATE()), '-%');
  
  -- Generate quotation number in format QUO-YYYY-NNNN
  SET quotation_number = CONCAT('QUO-', YEAR(CURDATE()), '-', LPAD(next_number, 4, '0'));
  
  -- Set the quotation number if not provided
  IF NEW.quotation_number IS NULL OR NEW.quotation_number = '' THEN
    SET NEW.quotation_number = quotation_number;
  END IF;
  
  -- Set setup_date if not provided
  IF NEW.setup_date IS NULL THEN
    SET NEW.setup_date = CURDATE();
  END IF;
END$$

-- Create trigger for quotation history tracking
CREATE TRIGGER `quotation_status_history` 
AFTER UPDATE ON `quotations` 
FOR EACH ROW 
BEGIN
  IF OLD.status != NEW.status THEN
    INSERT INTO quotation_history (quotation_id, action, old_status, new_status, comments)
    VALUES (NEW.id, 'status_change', OLD.status, NEW.status, CONCAT('Status changed from ', OLD.status, ' to ', NEW.status));
  END IF;
END$$

DELIMITER ;

-- Create views for easy data retrieval
CREATE OR REPLACE VIEW `quotation_summary` AS
SELECT 
  q.id,
  q.quotation_number,
  q.customer_name,
  q.customer_phone,
  q.customer_email,
  q.grand_total,
  q.status,
  q.valid_until,
  q.setup_date,
  q.created_at,
  COUNT(qi.id) as item_count,
  SUM(qi.quantity) as total_quantity
FROM quotations q
LEFT JOIN quotation_items qi ON q.id = qi.quotation_id
GROUP BY q.id, q.quotation_number, q.customer_name, q.customer_phone, 
         q.customer_email, q.grand_total, q.status, q.valid_until, 
         q.setup_date, q.created_at;

-- Create view for quotation details with items
CREATE OR REPLACE VIEW `quotation_details` AS
SELECT 
  q.id as quotation_id,
  q.quotation_number,
  q.customer_name,
  q.customer_phone,
  q.customer_email,
  q.customer_address,
  q.customer_gst,
  q.delivery_place,
  q.subtotal,
  q.discount_type,
  q.discount_value,
  q.subtotal_afterdiscount,
  q.tax,
  q.round_off,
  q.grand_total,
  q.status,
  q.valid_until,
  q.setup_date,
  q.created_at,
  qi.id as item_id,
  qi.item_name,
  qi.description,
  qi.quantity,
  qi.uom,
  qi.rate,
  qi.amount,
  qi.discount_percent,
  qi.discount_value as item_discount,
  qi.cgst,
  qi.sgst,
  qi.igst,
  qi.vat,
  qi.tax_amount,
  qi.net_amount,
  qi.tax_included,
  qi.sort_order
FROM quotations q
LEFT JOIN quotation_items qi ON q.id = qi.quotation_id
ORDER BY q.id DESC, qi.sort_order ASC, qi.id ASC;

-- Add comments to tables
ALTER TABLE `quotations` COMMENT = 'Master table for storing quotation information';
ALTER TABLE `quotation_items` COMMENT = 'Detail table for storing quotation line items';
ALTER TABLE `quotation_history` COMMENT = 'History table for tracking quotation status changes';

-- Grant permissions (adjust as needed for your setup)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON `quotations` TO 'chefmate_user'@'%';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON `quotation_items` TO 'chefmate_user'@'%';
-- GRANT SELECT, INSERT ON `quotation_history` TO 'chefmate_user'@'%';

-- =====================================================
-- End of Quotation System Schema
-- =====================================================

-- Additional useful queries for maintenance:

-- Query to get quotation statistics
/*
SELECT 
  status,
  COUNT(*) as count,
  SUM(grand_total) as total_amount,
  AVG(grand_total) as average_amount
FROM quotations 
WHERE setup_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
GROUP BY status;
*/

-- Query to find expired quotations
/*
SELECT 
  quotation_number,
  customer_name,
  grand_total,
  valid_until,
  DATEDIFF(CURDATE(), valid_until) as days_expired
FROM quotations 
WHERE valid_until < CURDATE() 
  AND status = 'pending'
ORDER BY valid_until DESC;
*/

-- Query to get top quoted items
/*
SELECT 
  item_name,
  COUNT(*) as quote_count,
  SUM(quantity) as total_quantity,
  SUM(net_amount) as total_value
FROM quotation_items qi
JOIN quotations q ON qi.quotation_id = q.id
WHERE q.setup_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
GROUP BY item_name
ORDER BY quote_count DESC, total_value DESC
LIMIT 10;
*/
