ALTER TABLE `items`
  ADD COLUMN `item_type` VARCHAR(20) NOT NULL DEFAULT 'Food' AFTER `item_code`;
