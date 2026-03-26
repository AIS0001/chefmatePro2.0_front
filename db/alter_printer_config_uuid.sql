-- Migration: Replace mac_address with machine_uuid in printer_config table
-- Date: March 3, 2026
-- Description: Change MAC address to UUID for device identification using users.user_uuid

-- Step 1: Add new machine_uuid column
ALTER TABLE `printer_config` 
ADD COLUMN `machine_uuid` VARCHAR(36) NULL COMMENT 'Machine UUID from users.user_uuid for device identification'
AFTER `terminal_id`;

-- Step 2: Migrate existing mac_address data (if needed, can be done manually)
-- UPDATE printer_config SET machine_uuid = mac_address WHERE mac_address IS NOT NULL;

-- Step 3: Drop the old mac_address column
ALTER TABLE `printer_config` 
DROP COLUMN `mac_address`;

-- Step 4: Add index on machine_uuid for faster lookups
ALTER TABLE `printer_config` 
ADD INDEX `idx_machine_uuid` (`machine_uuid`);

-- Verify the changes
DESCRIBE printer_config;
