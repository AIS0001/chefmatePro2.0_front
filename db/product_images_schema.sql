-- Product Images Table Schema
-- This table stores uploaded images for products

CREATE TABLE IF NOT EXISTS `product_images` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `product_id` int(11) NOT NULL,
  `filename` varchar(255) NOT NULL,
  `path` varchar(500) NOT NULL,
  `mimetype` varchar(100) NOT NULL,
  `size` int(11) NOT NULL,
  `uploaded_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_primary` tinyint(1) DEFAULT 0,
  `status` enum('active','deleted') DEFAULT 'active',
  PRIMARY KEY (`id`),
  INDEX `idx_product_id` (`product_id`),
  INDEX `idx_status` (`status`),
  INDEX `idx_is_primary` (`is_primary`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add foreign key constraint (optional - adjust table name as needed)
-- ALTER TABLE `product_images` 
-- ADD CONSTRAINT `fk_product_images_items` 
-- FOREIGN KEY (`product_id`) REFERENCES `items` (`id`) 
-- ON DELETE CASCADE ON UPDATE CASCADE;