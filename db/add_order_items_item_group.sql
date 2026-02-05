ALTER TABLE `order_items`
  ADD COLUMN `item_group` VARCHAR(20) DEFAULT NULL AFTER `item_name`;
