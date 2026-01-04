-- Company Information Table Schema
-- This table stores complete company information including branding, banking, and terms

CREATE TABLE IF NOT EXISTS companyinfo (
    id INT AUTO_INCREMENT PRIMARY KEY,
    
    -- Basic Company Information
    name VARCHAR(255) NOT NULL,
    tax_id VARCHAR(100) NOT NULL,
    phone_number VARCHAR(50) NOT NULL,
    email VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    website VARCHAR(255) NULL,
    city VARCHAR(100) NULL,
    state VARCHAR(100) NULL,
    zip_code VARCHAR(20) NULL,
    country VARCHAR(100) NULL,
    
    -- Branding Assets (stored as BLOB data)
    logo LONGBLOB NULL COMMENT 'Company logo image data',
    logo_type VARCHAR(50) NULL COMMENT 'Logo file type (image/jpeg, image/png, etc.)',
    logo_name VARCHAR(255) NULL COMMENT 'Original logo filename',
    qr_code LONGBLOB NULL COMMENT 'QR code image data',
    qr_code_type VARCHAR(50) NULL COMMENT 'QR code file type (image/jpeg, image/png, etc.)',
    qr_code_name VARCHAR(255) NULL COMMENT 'Original QR code filename',
    
    -- Banking Details
    bank_name VARCHAR(255) NULL,
    account_number VARCHAR(100) NULL,
    account_name VARCHAR(255) NULL,
    routing_number VARCHAR(50) NULL,
    swift_code VARCHAR(20) NULL,
    payment_methods TEXT NULL COMMENT 'Comma separated payment methods',
    
    -- Legal Information
    terms_and_conditions TEXT NULL COMMENT 'Company terms and conditions',
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Indexes
    INDEX idx_name (name),
    INDEX idx_tax_id (tax_id),
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default company record (optional)
-- INSERT INTO companyinfo (
--     name, 
--     tax_id, 
--     phone_number, 
--     email, 
--     address,
--     website,
--     city,
--     state,
--     zip_code,
--     country
-- ) VALUES (
--     'Your Company Name',
--     'TAX123456789',
--     '+1-234-567-8900',
--     'info@yourcompany.com',
--     '123 Business Street, Suite 100',
--     'https://www.yourcompany.com',
--     'Business City',
--     'Business State',
--     '12345',
--     'United States'
-- );

-- Add any additional constraints or modifications as needed
