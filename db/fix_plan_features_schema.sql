-- Fix for missing columns in plan_features table
-- This resolves the ER_BAD_FIELD_ERROR for feature_limit column

-- Add missing columns to plan_features table
ALTER TABLE `plan_features` 
ADD COLUMN IF NOT EXISTS `feature_limit` INT(11) DEFAULT NULL COMMENT 'Maximum usage limit for this feature (-1 for unlimited)',
ADD COLUMN IF NOT EXISTS `is_unlimited` TINYINT(1) DEFAULT 0 COMMENT '1 if feature has no usage limits';

-- Update existing records to have reasonable defaults
UPDATE `plan_features` 
SET 
    `feature_limit` = CASE 
        WHEN `feature_limit` IS NULL THEN -1 
        ELSE `feature_limit` 
    END,
    `is_unlimited` = CASE 
        WHEN `feature_limit` = -1 OR `feature_limit` IS NULL THEN 1 
        ELSE 0 
    END;

-- Verify the fix
SELECT 
    pf.id,
    pf.plan_id,
    pf.feature_id,
    pf.feature_limit,
    pf.is_unlimited,
    f.feature_code,
    f.feature_name
FROM plan_features pf
JOIN features f ON pf.feature_id = f.id
WHERE f.feature_code = 'inventory'
LIMIT 5;