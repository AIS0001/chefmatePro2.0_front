-- =============================================================================
-- Printer Settings Table Schema for ESCpos Thermal Printers
-- Created for Print Settings Management
-- Date: 2026-01-13
-- =============================================================================

-- Drop table if exists (for recreation)
DROP TABLE IF EXISTS `printer_settings`;

-- Create printer_settings table
CREATE TABLE `printer_settings` (
  `id` int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  
  -- Printer IP Addresses
  `cashier_printer_ip` varchar(15) DEFAULT NULL COMMENT 'Cashier thermal printer IP address (e.g., 192.168.1.100)',
  `kitchen_printer_ip` varchar(15) DEFAULT NULL COMMENT 'Kitchen thermal printer IP address (e.g., 192.168.1.101)',
  `kiosk_printer_ip` varchar(15) DEFAULT NULL COMMENT 'Kiosk terminal printer IP address (e.g., 192.168.1.102)',
  
  -- Network Configuration
  `printer_port` varchar(10) DEFAULT '9100' COMMENT 'Network port for ESCpos communication (default: 9100)',
  
  -- Print Configuration
  `print_width` int(3) DEFAULT 80 COMMENT 'Print width in mm (typically 58 or 80)',
  
  -- Status
  `status` varchar(50) DEFAULT 'active' COMMENT 'Settings status (active/inactive)',
  
  -- System Fields
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Record creation timestamp',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Record last update timestamp',
  `created_by` int(11) DEFAULT NULL COMMENT 'User ID who created the record',
  `updated_by` int(11) DEFAULT NULL COMMENT 'User ID who last updated the record',
  
  UNIQUE KEY `unique_printer_settings` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='ESCpos Thermal Printer Settings for Multiple Locations';

-- Insert default printer settings record
INSERT INTO `printer_settings` (
  `cashier_printer_ip`,
  `kitchen_printer_ip`,
  `kiosk_printer_ip`,
  `printer_port`,
  `print_width`,
  `status`
) VALUES (
  '',
  '',
  '',
  '9100',
  80,
  'active'
);

-- Optional: Create index for faster lookups
ALTER TABLE `printer_settings` ADD INDEX `idx_status` (`status`);

-- =============================================================================
-- Comments for Documentation
-- =============================================================================
/*
PRINTER TYPES AND USAGE:
1. Cashier Printer: Prints bills, receipts, and customer invoices
2. Kitchen Printer: Prints order tickets for kitchen staff
3. Kiosk Printer: Prints tickets from self-service kiosk terminals

ESCpos THERMAL PRINTER SPECIFICATIONS:
- Default Network Port: 9100 (can be customized)
- Print Width: 58mm (standard receipt printer) or 80mm (wide format)
- Connection: TCP/IP Network Connection
- Protocol: ESCpos (Epson Standard Code for Point of Sale)

SETUP INSTRUCTIONS:
1. Ensure printers are connected to the same network
2. Configure each printer's static IP address
3. Verify network connectivity using ping command
4. Test connection from the application before going live
5. Keep printer firmware updated for compatibility

SAMPLE IP ADDRESSES:
- Cashier Printer: 192.168.1.100
- Kitchen Printer: 192.168.1.101
- Kiosk Printer: 192.168.1.102

DATABASE QUERIES:
- Fetch current settings: SELECT * FROM printer_settings WHERE status='active';
- Update settings: UPDATE printer_settings SET cashier_printer_ip='192.168.1.100' WHERE id=1;
- Deactivate settings: UPDATE printer_settings SET status='inactive' WHERE id=1;
*/
