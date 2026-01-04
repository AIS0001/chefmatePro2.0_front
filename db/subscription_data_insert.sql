-- Insert sample subscription data for ChefMate POS
-- This script will insert real subscription data instead of using hardcoded values

-- Insert subscription plans (if not already exists)
INSERT IGNORE INTO subscription_plans (plan_code, plan_name, price, billing_cycle, is_active, sort_order) VALUES
('basic', 'Basic Plan', 0.00, 'monthly', TRUE, 1),
('professional', 'Professional Plan', 29.99, 'monthly', TRUE, 2),
('business', 'Business Plan', 79.99, 'monthly', TRUE, 3),
('enterprise', 'Enterprise Plan', 199.99, 'monthly', TRUE, 4);

-- Insert feature definitions
INSERT IGNORE INTO features (feature_code, feature_name, feature_category, description, is_active) VALUES
-- Master Data Features
('customers', 'Customer Management', 'master', 'Manage customer information and history', TRUE),
('suppliers', 'Supplier Management', 'master', 'Track supplier information and orders', TRUE),
('tables', 'Table Management', 'master', 'Manage restaurant tables and seating', TRUE),
('categories', 'Category Management', 'master', 'Organize menu items by categories', TRUE),
('paymentOptions', 'Payment Options', 'master', 'Configure payment methods', TRUE),

-- Inventory Features
('inventory', 'Inventory Management', 'inventory', 'Manage menu items and inventory', TRUE),
('items', 'Item Management', 'inventory', 'Manage menu items and inventory', TRUE),
('stockManagement', 'Stock Management', 'inventory', 'Track inventory levels and stock', TRUE),
('productManagement', 'Product Management', 'inventory', 'Manage product variants and combinations', TRUE),

-- Sales Features
('pos', 'POS System', 'sales', 'Point of sale system for taking orders', TRUE),
('advanceOrders', 'Advance Orders', 'sales', 'Take advance orders from customers', TRUE),
('retailSales', 'Retail Sales', 'sales', 'Direct retail sales management', TRUE),

-- Reporting Features
('reports', 'Reporting System', 'reporting', 'Generate various business reports', TRUE),
('salesReports', 'Sales Reports', 'reporting', 'Generate sales reports and analytics', TRUE),
('itemWiseReports', 'Item-wise Reports', 'reporting', 'Detailed item sales reports', TRUE),
('customerReports', 'Customer Reports', 'reporting', 'Customer analytics and reports', TRUE),
('supplierReports', 'Supplier Reports', 'reporting', 'Supplier performance reports', TRUE),

-- System Features
('users', 'User Management', 'system', 'Manage system users and permissions', TRUE),
('customization', 'Customization', 'system', 'System customization and settings', TRUE),
('multiLocation', 'Multi-Location', 'system', 'Multiple location management', TRUE),
('gst', 'GST/Tax Management', 'system', 'Tax rates and GST management', TRUE);

-- Insert plan features for Basic Plan
INSERT IGNORE INTO plan_features (plan_id, feature_id, is_enabled, feature_level, usage_limit) VALUES
-- Basic Plan (assuming ID 1)
(1, (SELECT id FROM features WHERE feature_code = 'customers'), TRUE, 'basic', 100),
(1, (SELECT id FROM features WHERE feature_code = 'suppliers'), FALSE, 'basic', 0),
(1, (SELECT id FROM features WHERE feature_code = 'tables'), TRUE, 'basic', 10),
(1, (SELECT id FROM features WHERE feature_code = 'categories'), TRUE, 'basic', 20),
(1, (SELECT id FROM features WHERE feature_code = 'paymentOptions'), TRUE, 'basic', 2),
(1, (SELECT id FROM features WHERE feature_code = 'inventory'), TRUE, 'basic', 100),
(1, (SELECT id FROM features WHERE feature_code = 'items'), TRUE, 'basic', 100),
(1, (SELECT id FROM features WHERE feature_code = 'stockManagement'), TRUE, 'basic', NULL),
(1, (SELECT id FROM features WHERE feature_code = 'productManagement'), FALSE, 'basic', 0),
(1, (SELECT id FROM features WHERE feature_code = 'pos'), TRUE, 'basic', NULL),
(1, (SELECT id FROM features WHERE feature_code = 'advanceOrders'), FALSE, 'basic', 0),
(1, (SELECT id FROM features WHERE feature_code = 'retailSales'), TRUE, 'basic', NULL),
(1, (SELECT id FROM features WHERE feature_code = 'reports'), TRUE, 'basic', 5),
(1, (SELECT id FROM features WHERE feature_code = 'salesReports'), TRUE, 'basic', NULL),
(1, (SELECT id FROM features WHERE feature_code = 'itemWiseReports'), FALSE, 'basic', 0),
(1, (SELECT id FROM features WHERE feature_code = 'customerReports'), TRUE, 'basic', NULL),
(1, (SELECT id FROM features WHERE feature_code = 'supplierReports'), FALSE, 'basic', 0),
(1, (SELECT id FROM features WHERE feature_code = 'users'), TRUE, 'basic', 1),
(1, (SELECT id FROM features WHERE feature_code = 'customization'), TRUE, 'basic', 2),
(1, (SELECT id FROM features WHERE feature_code = 'multiLocation'), FALSE, 'basic', 0),
(1, (SELECT id FROM features WHERE feature_code = 'gst'), TRUE, 'basic', 1);

-- Insert plan features for Professional Plan
INSERT IGNORE INTO plan_features (plan_id, feature_id, is_enabled, feature_level, usage_limit) VALUES
-- Professional Plan (assuming ID 2)
(2, (SELECT id FROM features WHERE feature_code = 'customers'), TRUE, 'advanced', 500),
(2, (SELECT id FROM features WHERE feature_code = 'suppliers'), TRUE, 'advanced', 50),
(2, (SELECT id FROM features WHERE feature_code = 'tables'), TRUE, 'advanced', 50),
(2, (SELECT id FROM features WHERE feature_code = 'categories'), TRUE, 'advanced', NULL),
(2, (SELECT id FROM features WHERE feature_code = 'paymentOptions'), TRUE, 'advanced', 5),
(2, (SELECT id FROM features WHERE feature_code = 'inventory'), TRUE, 'advanced', 500),
(2, (SELECT id FROM features WHERE feature_code = 'items'), TRUE, 'advanced', 500),
(2, (SELECT id FROM features WHERE feature_code = 'stockManagement'), TRUE, 'advanced', NULL),
(2, (SELECT id FROM features WHERE feature_code = 'productManagement'), TRUE, 'basic', NULL),
(2, (SELECT id FROM features WHERE feature_code = 'pos'), TRUE, 'advanced', NULL),
(2, (SELECT id FROM features WHERE feature_code = 'advanceOrders'), TRUE, 'basic', NULL),
(2, (SELECT id FROM features WHERE feature_code = 'retailSales'), TRUE, 'advanced', NULL),
(2, (SELECT id FROM features WHERE feature_code = 'reports'), TRUE, 'advanced', 20),
(2, (SELECT id FROM features WHERE feature_code = 'salesReports'), TRUE, 'advanced', NULL),
(2, (SELECT id FROM features WHERE feature_code = 'itemWiseReports'), TRUE, 'basic', NULL),
(2, (SELECT id FROM features WHERE feature_code = 'customerReports'), TRUE, 'advanced', NULL),
(2, (SELECT id FROM features WHERE feature_code = 'supplierReports'), TRUE, 'basic', NULL),
(2, (SELECT id FROM features WHERE feature_code = 'users'), TRUE, 'advanced', 3),
(2, (SELECT id FROM features WHERE feature_code = 'customization'), TRUE, 'advanced', 10),
(2, (SELECT id FROM features WHERE feature_code = 'multiLocation'), FALSE, 'basic', 0),
(2, (SELECT id FROM features WHERE feature_code = 'gst'), TRUE, 'advanced', 1);

-- Insert plan features for Business Plan
INSERT IGNORE INTO plan_features (plan_id, feature_id, is_enabled, feature_level, usage_limit) VALUES
-- Business Plan (assuming ID 3)
(3, (SELECT id FROM features WHERE feature_code = 'customers'), TRUE, 'advanced', NULL),
(3, (SELECT id FROM features WHERE feature_code = 'suppliers'), TRUE, 'advanced', NULL),
(3, (SELECT id FROM features WHERE feature_code = 'tables'), TRUE, 'advanced', NULL),
(3, (SELECT id FROM features WHERE feature_code = 'categories'), TRUE, 'advanced', NULL),
(3, (SELECT id FROM features WHERE feature_code = 'paymentOptions'), TRUE, 'advanced', NULL),
(3, (SELECT id FROM features WHERE feature_code = 'inventory'), TRUE, 'advanced', NULL),
(3, (SELECT id FROM features WHERE feature_code = 'items'), TRUE, 'advanced', NULL),
(3, (SELECT id FROM features WHERE feature_code = 'stockManagement'), TRUE, 'advanced', NULL),
(3, (SELECT id FROM features WHERE feature_code = 'productManagement'), TRUE, 'advanced', NULL),
(3, (SELECT id FROM features WHERE feature_code = 'pos'), TRUE, 'advanced', NULL),
(3, (SELECT id FROM features WHERE feature_code = 'advanceOrders'), TRUE, 'advanced', NULL),
(3, (SELECT id FROM features WHERE feature_code = 'retailSales'), TRUE, 'advanced', NULL),
(3, (SELECT id FROM features WHERE feature_code = 'reports'), TRUE, 'advanced', NULL),
(3, (SELECT id FROM features WHERE feature_code = 'salesReports'), TRUE, 'advanced', NULL),
(3, (SELECT id FROM features WHERE feature_code = 'itemWiseReports'), TRUE, 'advanced', NULL),
(3, (SELECT id FROM features WHERE feature_code = 'customerReports'), TRUE, 'advanced', NULL),
(3, (SELECT id FROM features WHERE feature_code = 'supplierReports'), TRUE, 'advanced', NULL),
(3, (SELECT id FROM features WHERE feature_code = 'users'), TRUE, 'advanced', 10),
(3, (SELECT id FROM features WHERE feature_code = 'customization'), TRUE, 'advanced', NULL),
(3, (SELECT id FROM features WHERE feature_code = 'multiLocation'), TRUE, 'basic', 3),
(3, (SELECT id FROM features WHERE feature_code = 'gst'), TRUE, 'advanced', 1);

-- Insert plan features for Enterprise Plan
INSERT IGNORE INTO plan_features (plan_id, feature_id, is_enabled, feature_level, usage_limit) VALUES
-- Enterprise Plan (assuming ID 4)
(4, (SELECT id FROM features WHERE feature_code = 'customers'), TRUE, 'enterprise', NULL),
(4, (SELECT id FROM features WHERE feature_code = 'suppliers'), TRUE, 'enterprise', NULL),
(4, (SELECT id FROM features WHERE feature_code = 'tables'), TRUE, 'enterprise', NULL),
(4, (SELECT id FROM features WHERE feature_code = 'categories'), TRUE, 'enterprise', NULL),
(4, (SELECT id FROM features WHERE feature_code = 'paymentOptions'), TRUE, 'enterprise', NULL),
(4, (SELECT id FROM features WHERE feature_code = 'inventory'), TRUE, 'enterprise', NULL),
(4, (SELECT id FROM features WHERE feature_code = 'items'), TRUE, 'enterprise', NULL),
(4, (SELECT id FROM features WHERE feature_code = 'stockManagement'), TRUE, 'enterprise', NULL),
(4, (SELECT id FROM features WHERE feature_code = 'productManagement'), TRUE, 'enterprise', NULL),
(4, (SELECT id FROM features WHERE feature_code = 'pos'), TRUE, 'enterprise', NULL),
(4, (SELECT id FROM features WHERE feature_code = 'advanceOrders'), TRUE, 'enterprise', NULL),
(4, (SELECT id FROM features WHERE feature_code = 'retailSales'), TRUE, 'enterprise', NULL),
(4, (SELECT id FROM features WHERE feature_code = 'reports'), TRUE, 'enterprise', NULL),
(4, (SELECT id FROM features WHERE feature_code = 'salesReports'), TRUE, 'enterprise', NULL),
(4, (SELECT id FROM features WHERE feature_code = 'itemWiseReports'), TRUE, 'enterprise', NULL),
(4, (SELECT id FROM features WHERE feature_code = 'customerReports'), TRUE, 'enterprise', NULL),
(4, (SELECT id FROM features WHERE feature_code = 'supplierReports'), TRUE, 'enterprise', NULL),
(4, (SELECT id FROM features WHERE feature_code = 'users'), TRUE, 'enterprise', NULL),
(4, (SELECT id FROM features WHERE feature_code = 'customization'), TRUE, 'enterprise', NULL),
(4, (SELECT id FROM features WHERE feature_code = 'multiLocation'), TRUE, 'enterprise', NULL),
(4, (SELECT id FROM features WHERE feature_code = 'gst'), TRUE, 'enterprise', 1);

-- Insert a sample user subscription (assuming user ID 1 exists)
-- This creates an active subscription for the current user
INSERT IGNORE INTO user_subscriptions (user_id, plan_id, status, started_at, expires_at, payment_status) VALUES
(1, 2, 'active', NOW(), DATE_ADD(NOW(), INTERVAL 1 MONTH), 'paid');

-- Insert some sample feature usage data
INSERT IGNORE INTO feature_usage (user_id, feature_code, current_usage, last_reset_at) VALUES
(1, 'customers', 25, NOW()),
(1, 'suppliers', 5, NOW()),
(1, 'inventory', 150, NOW()),
(1, 'items', 150, NOW()),
(1, 'pos', 1, NOW()),
(1, 'reports', 8, NOW()),
(1, 'users', 2, NOW());

-- Display confirmation
SELECT 'Subscription data inserted successfully!' as message;
