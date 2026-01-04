-- ChefMate POS Menu Permissions System Database Schema

-- 1. Menu Sections Table (Categorizes menu items)
CREATE TABLE menu_sections (
    id INT PRIMARY KEY AUTO_INCREMENT,
    section_code VARCHAR(50) UNIQUE NOT NULL,
    section_name VARCHAR(100) NOT NULL,
    display_order INT DEFAULT 0,
    icon_class VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. Menu Items Table (All available menu items in the system)
CREATE TABLE menu_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    item_code VARCHAR(50) UNIQUE NOT NULL,
    item_name VARCHAR(100) NOT NULL,
    section_id INT NOT NULL,
    route_path VARCHAR(255) NOT NULL,
    display_order INT DEFAULT 0,
    icon_class VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (section_id) REFERENCES menu_sections(id) ON DELETE CASCADE
);

-- 3. User Roles Table (Admin, Cashier, etc.)
CREATE TABLE user_roles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    role_code VARCHAR(20) UNIQUE NOT NULL,
    role_name VARCHAR(50) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 4. Menu Permissions Table (Controls which roles can access which menu items)
CREATE TABLE menu_permissions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    role_id INT NOT NULL,
    menu_item_id INT NOT NULL,
    is_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES user_roles(id) ON DELETE CASCADE,
    FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE CASCADE,
    UNIQUE KEY unique_role_menu_item (role_id, menu_item_id)
);

-- Insert default menu sections
INSERT INTO menu_sections (section_code, section_name, display_order, icon_class) VALUES
('dashboard', 'Dashboard', 1, 'fa-tachometer-alt'),
('master', 'Master Data', 2, 'fa-database'),
('inventory', 'Inventory Management', 3, 'fa-boxes'),
('sales', 'Sales & POS', 4, 'fa-cash-register'),
('expenses', 'Expenses', 5, 'fa-money-bill'),
('vouchers', 'Vouchers', 6, 'fa-receipt'),
('reports', 'Reports', 7, 'fa-chart-bar'),
('users', 'User Management', 8, 'fa-users'),
('settings', 'Settings', 9, 'fa-cog');

-- Insert default user roles
INSERT INTO user_roles (role_code, role_name, description) VALUES
('admin', 'Administrator', 'Full system access with all permissions'),
('cashier', 'Cashier', 'Limited access for point-of-sale operations');

-- Insert menu items for each section
INSERT INTO menu_items (item_code, item_name, section_id, route_path, display_order, icon_class) VALUES
-- Dashboard items
('dashboard_main', 'Main Dashboard', 1, '/dashboard', 1, 'fa-home'),
('dashboard_analytics', 'Analytics Dashboard', 1, '/dashboard/analytics', 2, 'fa-chart-line'),
('dashboard_cashier', 'Cashier Dashboard', 1, '/dashboard/cashier', 3, 'fa-calculator'),
('dashboard_account', 'Account Dashboard', 1, '/dashboard/account', 4, 'fa-user-circle'),

-- Master Data items
('master_customers', 'Customers', 2, '/master/newcustomer', 1, 'fa-user-friends'),
('master_suppliers', 'Suppliers', 2, '/master/newsupplier', 2, 'fa-truck'),
('master_categories', 'Categories', 2, '/master/newcategory', 3, 'fa-tags'),
('master_subcategories', 'Sub Categories', 2, '/master/newsubcategory', 4, 'fa-tag'),
('master_tables', 'Tables', 2, '/master/table', 5, 'fa-chair'),
('master_payment_options', 'Payment Options', 2, '/master/paymentoptions', 6, 'fa-credit-card'),

-- Inventory items
('inventory_new_item', 'New Item', 3, '/inventory/newitem', 1, 'fa-plus-circle'),
('inventory_new_stock', 'New Stock', 3, '/inventory/newstock', 2, 'fa-warehouse'),
('inventory_edit_item', 'Edit Item', 3, '/inventory/edititem', 3, 'fa-edit'),
('inventory_new_product', 'New Product', 3, '/inventory/newproduct', 4, 'fa-box-open'),
('inventory_stock_reports', 'Stock Reports', 3, '/inventory/stockreports', 5, 'fa-clipboard-list'),

-- Sales & POS items
('sales_pos', 'Point of Sale', 4, '/sale/pos', 1, 'fa-cash-register'),
('sales_pos_gst', 'POS with GST', 4, '/sale/posgst', 2, 'fa-receipt'),
('sales_advance_order', 'Advance Order', 4, '/sale/advanceorder', 3, 'fa-clock'),
('sales_advance_order_gst', 'Advance Order GST', 4, '/sale/advanceordergstt', 4, 'fa-file-invoice'),
('sales_new_sale', 'New Sale', 4, '/sale/newsale', 5, 'fa-shopping-cart'),
('sales_vat_sale', 'VAT Sale', 4, '/sale/vatsale', 6, 'fa-percent'),
('sales_quotation', 'Quotation', 4, '/sale/quotation', 7, 'fa-quote-left'),
('quotation_history', 'Quotation History', 4, '/quotation-history', 8, 'fa-history'),

-- Expenses items
('expenses_supplier_ledger', 'Supplier Expenses', 5, '/expenses/suppliersexpenses', 1, 'fa-file-invoice-dollar'),

-- Vouchers items
('vouchers_receipt', 'Receipt Vouchers', 6, '/vouchers/recieptvoucher', 1, 'fa-receipt'),
('vouchers_payment', 'Payment Vouchers', 6, '/vouchers/paymentvoucher', 2, 'fa-money-check'),

-- Reports items
('reports_bill_history', 'Bill History', 7, '/reports/billhistory', 1, 'fa-history'),
('reports_bill_history_gst', 'Bill History GST', 7, '/reports/billhistorygst', 2, 'fa-file-alt'),
('reports_advance_order_gst', 'Advance Order GST Report', 7, '/reports/advanceorderreportgst', 3, 'fa-chart-bar'),
('reports_advance_order', 'Advance Order Report', 7, '/reports/advanceorderreport', 4, 'fa-list-alt'),
('reports_itemwise_sale', 'Item-wise Sale', 7, '/reports/itemwisesale', 5, 'fa-chart-pie'),
('reports_itemwise_sale_gst', 'Item-wise Sale GST', 7, '/reports/itemwisesalegst', 6, 'fa-chart-line'),
('reports_itemwise_summary_vat', 'Item-wise Summary VAT', 7, '/reports/itemwisesummaryvat', 7, 'fa-table'),
('reports_sale_ledger', 'Sale Ledger', 7, '/reports/saleledger', 8, 'fa-book'),
('reports_supplier_ledger', 'Supplier Ledger', 7, '/reports/supplierledger', 9, 'fa-address-book'),
('reports_low_stock', 'Low Stock Items', 7, '/reports/lowstockitems', 10, 'fa-exclamation-triangle'),
('reports_day_close', 'Day Close', 7, '/reports/dayclose', 11, 'fa-calendar-check'),

-- User Management items
('users_new_user', 'New User', 8, '/users/newuser', 1, 'fa-user-plus'),
('users_edit_profile', 'Edit Profile', 8, '/users/editprofile', 2, 'fa-user-edit'),

-- Settings items
('settings_company_info', 'Company Information', 9, '/setting/companyinfo', 1, 'fa-building'),
('settings_core', 'Core Settings', 9, '/setting/coresetting', 2, 'fa-cogs'),
('settings_taxes', 'Taxes', 9, '/setting/taxes', 3, 'fa-percentage'),
('settings_units', 'Units', 9, '/setting/units', 4, 'fa-ruler'),
('settings_menu_permissions', 'Menu Permissions', 9, '/setting/menupermissions', 5, 'fa-key');

-- Insert default permissions for Admin (all enabled)
INSERT INTO menu_permissions (role_id, menu_item_id, is_enabled)
SELECT 1, id, TRUE FROM menu_items;

-- Insert default permissions for Cashier (limited access)
INSERT INTO menu_permissions (role_id, menu_item_id, is_enabled)
SELECT 2, id, 
CASE 
    WHEN item_code IN (
        'dashboard_cashier', 'dashboard_main',
        'sales_pos', 'sales_pos_gst', 'sales_new_sale', 'sales_vat_sale',
        'reports_bill_history', 'reports_day_close',
        'users_edit_profile'
    ) THEN TRUE
    ELSE FALSE
END
FROM menu_items;

-- Create indexes for better performance
CREATE INDEX idx_menu_items_section_id ON menu_items(section_id);
CREATE INDEX idx_menu_permissions_role_id ON menu_permissions(role_id);
CREATE INDEX idx_menu_permissions_menu_item_id ON menu_permissions(menu_item_id);
CREATE INDEX idx_menu_items_route_path ON menu_items(route_path);
CREATE INDEX idx_menu_sections_display_order ON menu_sections(display_order);
CREATE INDEX idx_menu_items_display_order ON menu_items(display_order);

-- Views for easier querying
CREATE VIEW v_menu_permissions AS
SELECT 
    mp.id as permission_id,
    ur.role_code,
    ur.role_name,
    ms.section_code,
    ms.section_name,
    mi.item_code,
    mi.item_name,
    mi.route_path,
    mp.is_enabled,
    ms.display_order as section_order,
    mi.display_order as item_order
FROM menu_permissions mp
JOIN user_roles ur ON mp.role_id = ur.id
JOIN menu_items mi ON mp.menu_item_id = mi.id
JOIN menu_sections ms ON mi.section_id = ms.id
WHERE ur.is_active = TRUE AND mi.is_active = TRUE AND ms.is_active = TRUE
ORDER BY ur.role_code, ms.display_order, mi.display_order;

-- View for getting enabled menus for a specific role
CREATE VIEW v_enabled_menus AS
SELECT 
    ur.role_code,
    ms.section_code,
    ms.section_name,
    mi.item_code,
    mi.item_name,
    mi.route_path,
    mi.icon_class,
    ms.display_order as section_order,
    mi.display_order as item_order
FROM menu_permissions mp
JOIN user_roles ur ON mp.role_id = ur.id
JOIN menu_items mi ON mp.menu_item_id = mi.id
JOIN menu_sections ms ON mi.section_id = ms.id
WHERE mp.is_enabled = TRUE 
AND ur.is_active = TRUE 
AND mi.is_active = TRUE 
AND ms.is_active = TRUE
ORDER BY ur.role_code, ms.display_order, mi.display_order;
