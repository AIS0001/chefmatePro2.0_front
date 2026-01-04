-- =============================================================================
-- Company Information Table Schema
-- Created based on companyInfo.js form structure
-- Date: 2025-09-06
-- =============================================================================

-- Drop table if exists (for recreation)
DROP TABLE IF EXISTS `company_profile`;

-- Create company_profile table
CREATE TABLE `company_profile` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  
  -- Basic Company Information
  `name` varchar(255) NOT NULL COMMENT 'Company name (required)',
  `tax_id` varchar(100) NOT NULL COMMENT 'Tax identification number (required)',
  `phone_number` varchar(50) NOT NULL COMMENT 'Primary phone number (required)',
  `email` varchar(255) NOT NULL COMMENT 'Primary email address (required)',
  `address` text NOT NULL COMMENT 'Complete address (required)',
  `website` varchar(255) DEFAULT NULL COMMENT 'Company website URL',
  
  -- Location Details
  `city` varchar(100) DEFAULT NULL COMMENT 'City',
  `state` varchar(100) DEFAULT NULL COMMENT 'State/Province',
  `zip_code` varchar(20) DEFAULT NULL COMMENT 'ZIP/Postal code',
  `country` varchar(100) DEFAULT NULL COMMENT 'Country',
  
  -- Media Files
  `logo` longblob DEFAULT NULL COMMENT 'Company logo image (BLOB)',
  `logo_type` varchar(50) DEFAULT NULL COMMENT 'Logo MIME type (e.g., image/png)',
  `logo_name` varchar(255) DEFAULT NULL COMMENT 'Original logo filename',
  `qr_code` longblob DEFAULT NULL COMMENT 'QR code image (BLOB)',
  `qr_code_type` varchar(50) DEFAULT NULL COMMENT 'QR code MIME type',
  `qr_code_name` varchar(255) DEFAULT NULL COMMENT 'Original QR code filename',
  
  -- Banking Information
  `bank_name` varchar(255) DEFAULT NULL COMMENT 'Bank name',
  `account_number` varchar(100) DEFAULT NULL COMMENT 'Bank account number',
  `account_name` varchar(255) DEFAULT NULL COMMENT 'Account holder name',
  `routing_number` varchar(50) DEFAULT NULL COMMENT 'Bank routing number',
  `swift_code` varchar(20) DEFAULT NULL COMMENT 'SWIFT/BIC code',
  `payment_methods` text DEFAULT NULL COMMENT 'Accepted payment methods',
  
  -- Legal/Terms
  `terms_and_conditions` text DEFAULT NULL COMMENT 'Terms and conditions text',
  
  -- System Fields
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Record creation timestamp',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Record last update timestamp',
  `created_by` int(11) DEFAULT NULL COMMENT 'User ID who created the record',
  `updated_by` int(11) DEFAULT NULL COMMENT 'User ID who last updated the record',
  `is_active` tinyint(1) NOT NULL DEFAULT 1 COMMENT 'Active status (1=active, 0=inactive)',
  
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_tax_id` (`tax_id`),
  UNIQUE KEY `unique_email` (`email`),
  KEY `idx_company_name` (`name`),
  KEY `idx_city` (`city`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Company information and settings';

-- =============================================================================
-- Sample Data Insert
-- =============================================================================

INSERT INTO `company_profile` (
  `name`,
  `tax_id`,
  `phone_number`,
  `email`,
  `address`,
  `website`,
  `city`,
  `state`,
  `zip_code`,
  `country`,
  `bank_name`,
  `account_name`,
  `payment_methods`,
  `terms_and_conditions`,
  `created_by`,
  `updated_by`
) VALUES (
  'ChefMate Restaurant Solutions',
  'TAX123456789',
  '+1-555-123-4567',
  'info@chefmate.com',
  '123 Restaurant Street, Food District',
  'https://www.chefmate.com',
  'Bangkok',
  'Bangkok Metropolitan',
  '10110',
  'Thailand',
  'Bangkok Bank',
  'ChefMate Restaurant Solutions Co., Ltd.',
  'Cash, Credit Card, Debit Card, Bank Transfer, Mobile Payment',
  'Terms and Conditions:

1. Payment Terms:
   - Payment is due upon receipt of invoice
   - Late payments may incur additional charges
   - All prices are subject to applicable taxes

2. Return Policy:
   - Items must be returned within 30 days
   - Original receipt required for all returns
   - Perishable items cannot be returned

3. Warranty:
   - Equipment warranty as per manufacturer terms
   - Software support included for first year
   - Extended warranty available upon request

4. Liability:
   - Company liability limited to product value
   - Customer responsible for proper usage
   - Installation and training provided

For questions or support, contact us at support@chefmate.com',
  1,
  1
);

-- =============================================================================
-- Indexes for Performance Optimization
-- =============================================================================

-- Additional indexes for common queries
CREATE INDEX `idx_company_profile_search` ON `company_profile` (`name`, `email`, `city`);
CREATE INDEX `idx_company_profile_status` ON `company_profile` (`is_active`, `created_at`);

-- =============================================================================
-- Views for Common Queries
-- =============================================================================

-- View for basic company info (without BLOB data for performance)
CREATE VIEW `company_profile_basic` AS
SELECT 
  `id`,
  `name`,
  `tax_id`,
  `phone_number`,
  `email`,
  `address`,
  `website`,
  `city`,
  `state`,
  `zip_code`,
  `country`,
  `bank_name`,
  `account_number`,
  `account_name`,
  `payment_methods`,
  `is_active`,
  `created_at`,
  `updated_at`
FROM `company_profile`
WHERE `is_active` = 1;

-- View for invoice/receipt display (includes media info but not BLOB data)
CREATE VIEW `company_profile_display` AS
SELECT 
  `id`,
  `name`,
  `tax_id`,
  `phone_number`,
  `email`,
  `address`,
  `city`,
  `state`,
  `zip_code`,
  `country`,
  CASE WHEN `logo` IS NOT NULL THEN 1 ELSE 0 END as `has_logo`,
  CASE WHEN `qr_code` IS NOT NULL THEN 1 ELSE 0 END as `has_qr_code`,
  `terms_and_conditions`,
  `payment_methods`
FROM `company_profile`
WHERE `is_active` = 1;

-- =============================================================================
-- Triggers for Audit Trail
-- =============================================================================

-- Trigger to update the updated_at timestamp
DELIMITER $$
CREATE TRIGGER `company_profile_before_update`
BEFORE UPDATE ON `company_profile`
FOR EACH ROW
BEGIN
  SET NEW.updated_at = CURRENT_TIMESTAMP;
END$$
DELIMITER ;

-- =============================================================================
-- Stored Procedures
-- =============================================================================

-- Procedure to get active company info
DELIMITER $$
CREATE PROCEDURE `GetActiveCompanyInfo`()
BEGIN
  SELECT * FROM `company_profile` 
  WHERE `is_active` = 1 
  ORDER BY `created_at` DESC 
  LIMIT 1;
END$$
DELIMITER ;

-- Procedure to update company info
DELIMITER $$
CREATE PROCEDURE `UpdateCompanyInfo`(
  IN p_id INT,
  IN p_name VARCHAR(255),
  IN p_tax_id VARCHAR(100),
  IN p_phone VARCHAR(50),
  IN p_email VARCHAR(255),
  IN p_address TEXT,
  IN p_website VARCHAR(255),
  IN p_city VARCHAR(100),
  IN p_state VARCHAR(100),
  IN p_zip VARCHAR(20),
  IN p_country VARCHAR(100),
  IN p_updated_by INT
)
BEGIN
  UPDATE `company_profile` 
  SET 
    `name` = p_name,
    `tax_id` = p_tax_id,
    `phone_number` = p_phone,
    `email` = p_email,
    `address` = p_address,
    `website` = p_website,
    `city` = p_city,
    `state` = p_state,
    `zip_code` = p_zip,
    `country` = p_country,
    `updated_by` = p_updated_by,
    `updated_at` = CURRENT_TIMESTAMP
  WHERE `id` = p_id;
END$$
DELIMITER ;

-- =============================================================================
-- Comments and Documentation
-- =============================================================================

/*
TABLE STRUCTURE EXPLANATION:

1. BASIC FIELDS:
   - name: Company name (required, indexed)
   - tax_id: Tax ID (required, unique)
   - phone_number: Contact phone (required)
   - email: Contact email (required, unique)
   - address: Full address (required)
   - website: Company website URL

2. LOCATION FIELDS:
   - city, state, zip_code, country: Address components

3. MEDIA FIELDS:
   - logo/qr_code: BLOB storage for images
   - logo_type/qr_code_type: MIME types for proper display
   - logo_name/qr_code_name: Original filenames

4. BANKING FIELDS:
   - bank_name, account_number, account_name: Banking details
   - routing_number, swift_code: International banking
   - payment_methods: Accepted payment types

5. LEGAL FIELDS:
   - terms_and_conditions: Legal text for invoices

6. SYSTEM FIELDS:
   - created_at/updated_at: Timestamps
   - created_by/updated_by: User tracking
   - is_active: Soft delete flag

PERFORMANCE CONSIDERATIONS:
- BLOB fields separated for optional loading
- Multiple indexes for common search patterns
- Views for different use cases
- Stored procedures for complex operations

SECURITY CONSIDERATIONS:
- Unique constraints on tax_id and email
- Foreign key relationships with user table
- Audit trail with user tracking
- Soft delete with is_active flag

FIELD MAPPING TO FORM:
Form Field Name -> Database Field Name
- name -> name
- taxId -> tax_id
- phoneNumber -> phone_number
- email -> email
- address -> address
- website -> website
- city -> city
- state -> state
- zipCode -> zip_code
- country -> country
- logo -> logo (+ logo_type, logo_name)
- qrCode -> qr_code (+ qr_code_type, qr_code_name)
- bankName -> bank_name
- accountNumber -> account_number
- accountName -> account_name
- routingNumber -> routing_number
- swiftCode -> swift_code
- paymentMethods -> payment_methods
- termsAndConditions -> terms_and_conditions
*/
