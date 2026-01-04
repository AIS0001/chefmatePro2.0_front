-- ChefMate POS Feature Control System Database Schema

-- 1. Subscription Plans Table
CREATE TABLE subscription_plans (
    id INT PRIMARY KEY AUTO_INCREMENT,
    plan_code VARCHAR(20) UNIQUE NOT NULL,
    plan_name VARCHAR(100) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    billing_cycle ENUM('monthly', 'quarterly', 'yearly') NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. Feature Definitions Table
CREATE TABLE features (
    id INT PRIMARY KEY AUTO_INCREMENT,
    feature_code VARCHAR(50) UNIQUE NOT NULL,
    feature_name VARCHAR(100) NOT NULL,
    feature_category VARCHAR(50) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 3. Plan Features Table (Many-to-Many relationship)
CREATE TABLE plan_features (
    id INT PRIMARY KEY AUTO_INCREMENT,
    plan_id INT NOT NULL,
    feature_id INT NOT NULL,
    is_enabled BOOLEAN DEFAULT TRUE,
    feature_level ENUM('basic', 'advanced', 'enterprise') DEFAULT 'basic',
    usage_limit INT DEFAULT NULL, -- NULL means unlimited
    additional_config JSON DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (plan_id) REFERENCES subscription_plans(id) ON DELETE CASCADE,
    FOREIGN KEY (feature_id) REFERENCES features(id) ON DELETE CASCADE,
    UNIQUE KEY unique_plan_feature (plan_id, feature_id)
);

-- 4. User Subscriptions Table
CREATE TABLE user_subscriptions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    plan_id INT NOT NULL,
    status ENUM('active', 'expired', 'cancelled', 'suspended') DEFAULT 'active',
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NULL,
    payment_status ENUM('paid', 'pending', 'failed', 'refunded') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (plan_id) REFERENCES subscription_plans(id) ON DELETE RESTRICT,
    INDEX idx_user_status (user_id, status),
    INDEX idx_expires_at (expires_at)
);

-- 5. Feature Usage Tracking Table
CREATE TABLE feature_usage (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    feature_code VARCHAR(50) NOT NULL,
    current_usage INT DEFAULT 0,
    last_reset_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_feature (user_id, feature_code),
    INDEX idx_user_feature (user_id, feature_code)
);

-- 6. Users Table (if not exists)
CREATE TABLE users_subs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'manager', 'cashier', 'accountant') DEFAULT 'cashier',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert Default Subscription Plans
INSERT INTO subscription_plans (plan_code, plan_name, price, billing_cycle, sort_order) VALUES
('basic', 'Basic Plan', 29.99, 'monthly', 1),
('professional', 'Professional Plan', 79.99, 'monthly', 2),
('business', 'Business Plan', 149.99, 'monthly', 3),
('enterprise', 'Enterprise Plan', 299.99, 'monthly', 4);

-- Insert Feature Definitions
INSERT INTO features (feature_code, feature_name, feature_category, description) VALUES
-- Master Data Features
('customers', 'Customer Management', 'master', 'Manage customer information and history'),
('suppliers', 'Supplier Management', 'master', 'Track supplier information and orders'),
('tables', 'Table Management', 'master', 'Manage restaurant tables and seating'),
('categories', 'Category Management', 'master', 'Organize menu items by categories'),
('paymentOptions', 'Payment Options', 'master', 'Configure payment methods'),

-- Inventory Features
('items', 'Item Management', 'inventory', 'Manage menu items and inventory'),
('stockManagement', 'Stock Management', 'inventory', 'Track inventory levels and stock'),
('productManagement', 'Product Management', 'inventory', 'Manage product variants and combinations'),
('stockReports', 'Stock Reports', 'inventory', 'Generate inventory and stock reports'),

-- Sales Features
('pos', 'POS System', 'sales', 'Point of sale system for taking orders'),
('advanceOrders', 'Advance Orders', 'sales', 'Take advance orders from customers'),
('retailSales', 'Retail Sales', 'sales', 'Direct retail sales management'),

-- Financial Features
('vouchers', 'Voucher System', 'financial', 'Issue and manage vouchers'),
('expenses', 'Expense Tracking', 'financial', 'Track business expenses'),

-- Reporting Features
('salesReports', 'Sales Reports', 'reporting', 'Generate sales reports and analytics'),
('itemWiseReports', 'Item-wise Reports', 'reporting', 'Detailed item sales reports'),
('customerReports', 'Customer Reports', 'reporting', 'Customer analytics and reports'),
('supplierReports', 'Supplier Reports', 'reporting', 'Supplier performance reports'),
('advanceOrderReports', 'Advance Order Reports', 'reporting', 'Advance order tracking reports'),
('lowStockReports', 'Low Stock Reports', 'reporting', 'Low stock alerts and reports'),

-- System Features
('users', 'User Management', 'system', 'Manage system users and permissions'),
('profileManagement', 'Profile Management', 'system', 'User profile management'),
('coreSettings', 'Core Settings', 'system', 'System configuration settings'),
('companyInfo', 'Company Information', 'system', 'Company profile and branding'),
('taxManagement', 'Tax Management', 'system', 'Tax rates and tax management'),
('unitsManagement', 'Units Management', 'system', 'Product units and measurements');

-- Insert Plan Features for Basic Plan
INSERT INTO plan_features (plan_id, feature_id, is_enabled, feature_level, usage_limit) VALUES
-- Basic Plan (ID: 1)
(1, (SELECT id FROM features WHERE feature_code = 'customers'), TRUE, 'basic', 100),
(1, (SELECT id FROM features WHERE feature_code = 'suppliers'), FALSE, 'basic', 0),
(1, (SELECT id FROM features WHERE feature_code = 'tables'), TRUE, 'basic', 10),
(1, (SELECT id FROM features WHERE feature_code = 'categories'), TRUE, 'basic', 20),
(1, (SELECT id FROM features WHERE feature_code = 'paymentOptions'), TRUE, 'basic', 2),
(1, (SELECT id FROM features WHERE feature_code = 'items'), TRUE, 'basic', 100),
(1, (SELECT id FROM features WHERE feature_code = 'stockManagement'), TRUE, 'basic', NULL),
(1, (SELECT id FROM features WHERE feature_code = 'productManagement'), FALSE, 'basic', 0),
(1, (SELECT id FROM features WHERE feature_code = 'stockReports'), TRUE, 'basic', NULL),
(1, (SELECT id FROM features WHERE feature_code = 'pos'), TRUE, 'basic', NULL),
(1, (SELECT id FROM features WHERE feature_code = 'advanceOrders'), FALSE, 'basic', 0),
(1, (SELECT id FROM features WHERE feature_code = 'retailSales'), TRUE, 'basic', NULL),
(1, (SELECT id FROM features WHERE feature_code = 'vouchers'), FALSE, 'basic', 0),
(1, (SELECT id FROM features WHERE feature_code = 'expenses'), FALSE, 'basic', 0),
(1, (SELECT id FROM features WHERE feature_code = 'salesReports'), TRUE, 'basic', NULL),
(1, (SELECT id FROM features WHERE feature_code = 'itemWiseReports'), FALSE, 'basic', 0),
(1, (SELECT id FROM features WHERE feature_code = 'customerReports'), TRUE, 'basic', NULL),
(1, (SELECT id FROM features WHERE feature_code = 'supplierReports'), FALSE, 'basic', 0),
(1, (SELECT id FROM features WHERE feature_code = 'advanceOrderReports'), FALSE, 'basic', 0),
(1, (SELECT id FROM features WHERE feature_code = 'lowStockReports'), FALSE, 'basic', 0),
(1, (SELECT id FROM features WHERE feature_code = 'users'), TRUE, 'basic', 1),
(1, (SELECT id FROM features WHERE feature_code = 'profileManagement'), TRUE, 'basic', NULL),
(1, (SELECT id FROM features WHERE feature_code = 'coreSettings'), TRUE, 'basic', NULL),
(1, (SELECT id FROM features WHERE feature_code = 'companyInfo'), TRUE, 'basic', NULL),
(1, (SELECT id FROM features WHERE feature_code = 'taxManagement'), TRUE, 'basic', 2),
(1, (SELECT id FROM features WHERE feature_code = 'unitsManagement'), TRUE, 'basic', 10);

-- Insert Plan Features for Professional Plan
INSERT INTO plan_features (plan_id, feature_id, is_enabled, feature_level, usage_limit) VALUES
-- Professional Plan (ID: 2)
(2, (SELECT id FROM features WHERE feature_code = 'customers'), TRUE, 'advanced', 500),
(2, (SELECT id FROM features WHERE feature_code = 'suppliers'), TRUE, 'advanced', 50),
(2, (SELECT id FROM features WHERE feature_code = 'tables'), TRUE, 'advanced', 50),
(2, (SELECT id FROM features WHERE feature_code = 'categories'), TRUE, 'advanced', NULL),
(2, (SELECT id FROM features WHERE feature_code = 'paymentOptions'), TRUE, 'advanced', 5),
(2, (SELECT id FROM features WHERE feature_code = 'items'), TRUE, 'advanced', 500),
(2, (SELECT id FROM features WHERE feature_code = 'stockManagement'), TRUE, 'advanced', NULL),
(2, (SELECT id FROM features WHERE feature_code = 'productManagement'), TRUE, 'basic', NULL),
(2, (SELECT id FROM features WHERE feature_code = 'stockReports'), TRUE, 'advanced', NULL),
(2, (SELECT id FROM features WHERE feature_code = 'pos'), TRUE, 'advanced', NULL),
(2, (SELECT id FROM features WHERE feature_code = 'advanceOrders'), TRUE, 'basic', NULL),
(2, (SELECT id FROM features WHERE feature_code = 'retailSales'), TRUE, 'advanced', NULL),
(2, (SELECT id FROM features WHERE feature_code = 'vouchers'), TRUE, 'basic', NULL),
(2, (SELECT id FROM features WHERE feature_code = 'expenses'), TRUE, 'basic', NULL),
(2, (SELECT id FROM features WHERE feature_code = 'salesReports'), TRUE, 'advanced', NULL),
(2, (SELECT id FROM features WHERE feature_code = 'itemWiseReports'), TRUE, 'basic', NULL),
(2, (SELECT id FROM features WHERE feature_code = 'customerReports'), TRUE, 'advanced', NULL),
(2, (SELECT id FROM features WHERE feature_code = 'supplierReports'), TRUE, 'basic', NULL),
(2, (SELECT id FROM features WHERE feature_code = 'advanceOrderReports'), TRUE, 'basic', NULL),
(2, (SELECT id FROM features WHERE feature_code = 'lowStockReports'), TRUE, 'basic', NULL),
(2, (SELECT id FROM features WHERE feature_code = 'users'), TRUE, 'advanced', 3),
(2, (SELECT id FROM features WHERE feature_code = 'profileManagement'), TRUE, 'advanced', NULL),
(2, (SELECT id FROM features WHERE feature_code = 'coreSettings'), TRUE, 'advanced', NULL),
(2, (SELECT id FROM features WHERE feature_code = 'companyInfo'), TRUE, 'advanced', NULL),
(2, (SELECT id FROM features WHERE feature_code = 'taxManagement'), TRUE, 'advanced', NULL),
(2, (SELECT id FROM features WHERE feature_code = 'unitsManagement'), TRUE, 'advanced', NULL);

-- Insert Plan Features for Business Plan
INSERT INTO plan_features (plan_id, feature_id, is_enabled, feature_level, usage_limit) VALUES
-- Business Plan (ID: 3)
(3, (SELECT id FROM features WHERE feature_code = 'customers'), TRUE, 'advanced', NULL),
(3, (SELECT id FROM features WHERE feature_code = 'suppliers'), TRUE, 'advanced', NULL),
(3, (SELECT id FROM features WHERE feature_code = 'tables'), TRUE, 'advanced', NULL),
(3, (SELECT id FROM features WHERE feature_code = 'categories'), TRUE, 'advanced', NULL),
(3, (SELECT id FROM features WHERE feature_code = 'paymentOptions'), TRUE, 'advanced', NULL),
(3, (SELECT id FROM features WHERE feature_code = 'items'), TRUE, 'advanced', NULL),
(3, (SELECT id FROM features WHERE feature_code = 'stockManagement'), TRUE, 'advanced', NULL),
(3, (SELECT id FROM features WHERE feature_code = 'productManagement'), TRUE, 'advanced', NULL),
(3, (SELECT id FROM features WHERE feature_code = 'stockReports'), TRUE, 'advanced', NULL),
(3, (SELECT id FROM features WHERE feature_code = 'pos'), TRUE, 'advanced', NULL),
(3, (SELECT id FROM features WHERE feature_code = 'advanceOrders'), TRUE, 'advanced', NULL),
(3, (SELECT id FROM features WHERE feature_code = 'retailSales'), TRUE, 'advanced', NULL),
(3, (SELECT id FROM features WHERE feature_code = 'vouchers'), TRUE, 'advanced', NULL),
(3, (SELECT id FROM features WHERE feature_code = 'expenses'), TRUE, 'advanced', NULL),
(3, (SELECT id FROM features WHERE feature_code = 'salesReports'), TRUE, 'advanced', NULL),
(3, (SELECT id FROM features WHERE feature_code = 'itemWiseReports'), TRUE, 'advanced', NULL),
(3, (SELECT id FROM features WHERE feature_code = 'customerReports'), TRUE, 'advanced', NULL),
(3, (SELECT id FROM features WHERE feature_code = 'supplierReports'), TRUE, 'advanced', NULL),
(3, (SELECT id FROM features WHERE feature_code = 'advanceOrderReports'), TRUE, 'advanced', NULL),
(3, (SELECT id FROM features WHERE feature_code = 'lowStockReports'), TRUE, 'advanced', NULL),
(3, (SELECT id FROM features WHERE feature_code = 'users'), TRUE, 'advanced', 10),
(3, (SELECT id FROM features WHERE feature_code = 'profileManagement'), TRUE, 'advanced', NULL),
(3, (SELECT id FROM features WHERE feature_code = 'coreSettings'), TRUE, 'advanced', NULL),
(3, (SELECT id FROM features WHERE feature_code = 'companyInfo'), TRUE, 'advanced', NULL),
(3, (SELECT id FROM features WHERE feature_code = 'taxManagement'), TRUE, 'advanced', NULL),
(3, (SELECT id FROM features WHERE feature_code = 'unitsManagement'), TRUE, 'advanced', NULL);

-- Insert Plan Features for Enterprise Plan
INSERT INTO plan_features (plan_id, feature_id, is_enabled, feature_level, usage_limit) VALUES
-- Enterprise Plan (ID: 4)
(4, (SELECT id FROM features WHERE feature_code = 'customers'), TRUE, 'enterprise', NULL),
(4, (SELECT id FROM features WHERE feature_code = 'suppliers'), TRUE, 'enterprise', NULL),
(4, (SELECT id FROM features WHERE feature_code = 'tables'), TRUE, 'enterprise', NULL),
(4, (SELECT id FROM features WHERE feature_code = 'categories'), TRUE, 'enterprise', NULL),
(4, (SELECT id FROM features WHERE feature_code = 'paymentOptions'), TRUE, 'enterprise', NULL),
(4, (SELECT id FROM features WHERE feature_code = 'items'), TRUE, 'enterprise', NULL),
(4, (SELECT id FROM features WHERE feature_code = 'stockManagement'), TRUE, 'enterprise', NULL),
(4, (SELECT id FROM features WHERE feature_code = 'productManagement'), TRUE, 'enterprise', NULL),
(4, (SELECT id FROM features WHERE feature_code = 'stockReports'), TRUE, 'enterprise', NULL),
(4, (SELECT id FROM features WHERE feature_code = 'pos'), TRUE, 'enterprise', NULL),
(4, (SELECT id FROM features WHERE feature_code = 'advanceOrders'), TRUE, 'enterprise', NULL),
(4, (SELECT id FROM features WHERE feature_code = 'retailSales'), TRUE, 'enterprise', NULL),
(4, (SELECT id FROM features WHERE feature_code = 'vouchers'), TRUE, 'enterprise', NULL),
(4, (SELECT id FROM features WHERE feature_code = 'expenses'), TRUE, 'enterprise', NULL),
(4, (SELECT id FROM features WHERE feature_code = 'salesReports'), TRUE, 'enterprise', NULL),
(4, (SELECT id FROM features WHERE feature_code = 'itemWiseReports'), TRUE, 'enterprise', NULL),
(4, (SELECT id FROM features WHERE feature_code = 'customerReports'), TRUE, 'enterprise', NULL),
(4, (SELECT id FROM features WHERE feature_code = 'supplierReports'), TRUE, 'enterprise', NULL),
(4, (SELECT id FROM features WHERE feature_code = 'advanceOrderReports'), TRUE, 'enterprise', NULL),
(4, (SELECT id FROM features WHERE feature_code = 'lowStockReports'), TRUE, 'enterprise', NULL),
(4, (SELECT id FROM features WHERE feature_code = 'users'), TRUE, 'enterprise', NULL),
(4, (SELECT id FROM features WHERE feature_code = 'profileManagement'), TRUE, 'enterprise', NULL),
(4, (SELECT id FROM features WHERE feature_code = 'coreSettings'), TRUE, 'enterprise', NULL),
(4, (SELECT id FROM features WHERE feature_code = 'companyInfo'), TRUE, 'enterprise', NULL),
(4, (SELECT id FROM features WHERE feature_code = 'taxManagement'), TRUE, 'enterprise', NULL),
(4, (SELECT id FROM features WHERE feature_code = 'unitsManagement'), TRUE, 'enterprise', NULL);

-- Create Views for Easy Access

-- View to get current user subscription with plan details
CREATE VIEW v_user_current_subscription AS
SELECT 
    us.user_id,
    us.id as subscription_id,
    sp.plan_code,
    sp.plan_name,
    us.status,
    us.started_at,
    us.expires_at,
    us.payment_status
FROM user_subscriptions us
JOIN subscription_plans sp ON us.plan_id = sp.id
WHERE us.status = 'active'
AND (us.expires_at IS NULL OR us.expires_at > NOW());

-- View to get user features with usage limits
CREATE VIEW v_user_features AS
SELECT 
    ucs.user_id,
    ucs.plan_code,
    ucs.plan_name,
    f.feature_code,
    f.feature_name,
    f.feature_category,
    pf.is_enabled,
    pf.feature_level,
    pf.usage_limit,
    COALESCE(fu.current_usage, 0) as current_usage,
    CASE 
        WHEN pf.usage_limit IS NULL THEN 'unlimited'
        WHEN COALESCE(fu.current_usage, 0) < pf.usage_limit THEN 'within_limit'
        ELSE 'limit_exceeded'
    END as usage_status
FROM v_user_current_subscription ucs
JOIN plan_features pf ON ucs.plan_code = (SELECT plan_code FROM subscription_plans WHERE id = pf.plan_id)
JOIN features f ON pf.feature_id = f.id
LEFT JOIN feature_usage fu ON ucs.user_id = fu.user_id AND f.feature_code = fu.feature_code
WHERE f.is_active = TRUE;

-- Stored Procedures

-- Get user features
DELIMITER //
CREATE PROCEDURE GetUserFeatures(IN p_user_id INT)
BEGIN
    SELECT 
        feature_code,
        feature_name,
        feature_category,
        is_enabled,
        feature_level,
        usage_limit,
        current_usage,
        usage_status
    FROM v_user_features
    WHERE user_id = p_user_id
    ORDER BY feature_category, feature_name;
END //
DELIMITER ;

-- Check if user has feature access
DELIMITER //
CREATE PROCEDURE CheckFeatureAccess(
    IN p_user_id INT,
    IN p_feature_code VARCHAR(50),
    OUT p_has_access BOOLEAN,
    OUT p_usage_limit INT,
    OUT p_current_usage INT
)
BEGIN
    SELECT 
        is_enabled,
        usage_limit,
        current_usage
    INTO p_has_access, p_usage_limit, p_current_usage
    FROM v_user_features
    WHERE user_id = p_user_id 
    AND feature_code = p_feature_code;
    
    IF p_has_access IS NULL THEN
        SET p_has_access = FALSE;
        SET p_usage_limit = 0;
        SET p_current_usage = 0;
    END IF;
END //
DELIMITER ;

-- Update feature usage
DELIMITER //
CREATE PROCEDURE UpdateFeatureUsage(
    IN p_user_id INT,
    IN p_feature_code VARCHAR(50),
    IN p_increment INT
)
BEGIN
    INSERT INTO feature_usage (user_id, feature_code, current_usage)
    VALUES (p_user_id, p_feature_code, p_increment)
    ON DUPLICATE KEY UPDATE 
        current_usage = current_usage + p_increment,
        updated_at = CURRENT_TIMESTAMP;
END //
DELIMITER ;

-- Sample user subscription (for testing)
INSERT INTO user_subscriptions (user_id, plan_id, status, started_at, expires_at) VALUES
(1, 1, 'active', NOW(), DATE_ADD(NOW(), INTERVAL 1 MONTH)),
(2, 2, 'active', NOW(), DATE_ADD(NOW(), INTERVAL 1 MONTH)),
(3, 3, 'active', NOW(), DATE_ADD(NOW(), INTERVAL 1 MONTH)),
(4, 4, 'active', NOW(), DATE_ADD(NOW(), INTERVAL 1 MONTH));

-- Sample feature usage
INSERT INTO feature_usage (user_id, feature_code, current_usage) VALUES
(1, 'customers', 45),
(1, 'tables', 8),
(1, 'categories', 15),
(1, 'items', 78),
(2, 'customers', 234),
(2, 'suppliers', 12),
(2, 'tables', 35),
(2, 'items', 345);
