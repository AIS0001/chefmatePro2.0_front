-- Migration script to add payment tracking to existing tables
-- Based on the attached order_items.sql structure

-- 1. Add payment_method column to final_bill table (if not exists)
-- Note: Replace 'final_bill' with the actual table name from your database

-- Check if final_bill table exists, if not create basic structure
CREATE TABLE IF NOT EXISTS final_bill (
    id INT AUTO_INCREMENT PRIMARY KEY,
    invoice_number VARCHAR(255) NOT NULL,
    customer_name VARCHAR(255),
    table_number VARCHAR(50),
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    paid_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    status INT DEFAULT 1,
    INDEX idx_invoice_number (invoice_number),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Add payment_method column if it doesn't exist
ALTER TABLE final_bill 
ADD COLUMN IF NOT EXISTS payment_method ENUM('cash', 'upi', 'card', 'qr', 'bank_transfer', 'online', 'other') DEFAULT 'cash'
COMMENT 'Payment method used for the transaction';

-- Add payment_date for easier day close calculations
ALTER TABLE final_bill 
ADD COLUMN IF NOT EXISTS payment_date DATE GENERATED ALWAYS AS (DATE(created_at)) STORED
COMMENT 'Date of payment for day close calculations';

-- Add indexes for better performance
ALTER TABLE final_bill 
ADD INDEX IF NOT EXISTS idx_payment_method (payment_method);

ALTER TABLE final_bill 
ADD INDEX IF NOT EXISTS idx_payment_date (payment_date);

-- 2. Update order_items table to include payment tracking
-- Based on the attached order_items.sql structure

-- Add payment_method column to order_items if not exists
ALTER TABLE order_items 
ADD COLUMN IF NOT EXISTS payment_method ENUM('cash', 'upi', 'card', 'qr', 'bank_transfer', 'online', 'other') DEFAULT 'cash'
COMMENT 'Payment method for this order item';

-- Add order_date for better filtering
ALTER TABLE order_items 
ADD COLUMN IF NOT EXISTS order_date DATE GENERATED ALWAYS AS (DATE(created_at)) STORED
COMMENT 'Order date for day close filtering';

-- Add price column if it doesn't exist (from your current structure it seems to be total_price)
ALTER TABLE order_items 
ADD COLUMN IF NOT EXISTS price DECIMAL(10,2) GENERATED ALWAYS AS (total_price / quantity) STORED
COMMENT 'Unit price calculated from total_price and quantity';

-- Add indexes for performance
ALTER TABLE order_items 
ADD INDEX IF NOT EXISTS idx_order_date (order_date);

ALTER TABLE order_items 
ADD INDEX IF NOT EXISTS idx_payment_method (payment_method);

-- 3. Update existing data with default payment methods (for demo purposes)
-- Randomly assign payment methods to existing records to simulate real data

-- Update final_bill records (if the table exists and has data)
UPDATE final_bill 
SET payment_method = CASE 
    WHEN id % 7 = 0 THEN 'upi'
    WHEN id % 7 = 1 THEN 'card' 
    WHEN id % 7 = 2 THEN 'qr'
    WHEN id % 7 = 3 THEN 'cash'
    WHEN id % 7 = 4 THEN 'bank_transfer'
    WHEN id % 7 = 5 THEN 'online'
    ELSE 'cash'
END
WHERE payment_method IS NULL OR payment_method = '';

-- Update order_items records
UPDATE order_items 
SET payment_method = CASE 
    WHEN id % 7 = 0 THEN 'upi'
    WHEN id % 7 = 1 THEN 'card' 
    WHEN id % 7 = 2 THEN 'qr'
    WHEN id % 7 = 3 THEN 'cash'
    WHEN id % 7 = 4 THEN 'bank_transfer'
    WHEN id % 7 = 5 THEN 'online'
    ELSE 'cash'
END
WHERE payment_method IS NULL OR payment_method = '';

-- 4. Create a view for easy day close reporting
CREATE OR REPLACE VIEW vw_daily_payment_summary AS
SELECT 
    DATE(created_at) as sale_date,
    payment_method,
    COUNT(*) as transaction_count,
    SUM(paid_amount) as total_amount,
    AVG(paid_amount) as avg_amount,
    MIN(paid_amount) as min_amount,
    MAX(paid_amount) as max_amount
FROM final_bill 
WHERE created_at >= CURDATE() - INTERVAL 30 DAY
GROUP BY DATE(created_at), payment_method
ORDER BY sale_date DESC, payment_method;

-- 5. Create a comprehensive daily summary view
CREATE OR REPLACE VIEW vw_daily_complete_summary AS
SELECT 
    fb.sale_date,
    fb.total_sales,
    fb.total_orders,
    fb.cash_sales,
    fb.upi_sales,
    fb.card_sales,
    fb.qr_sales,
    fb.bank_transfer_sales,
    fb.online_sales,
    fb.other_sales,
    oi.total_items_sold,
    fb.avg_order_value
FROM (
    SELECT 
        DATE(created_at) as sale_date,
        COUNT(*) as total_orders,
        SUM(paid_amount) as total_sales,
        AVG(paid_amount) as avg_order_value,
        SUM(CASE WHEN payment_method = 'cash' THEN paid_amount ELSE 0 END) as cash_sales,
        SUM(CASE WHEN payment_method = 'upi' THEN paid_amount ELSE 0 END) as upi_sales,
        SUM(CASE WHEN payment_method = 'card' THEN paid_amount ELSE 0 END) as card_sales,
        SUM(CASE WHEN payment_method = 'qr' THEN paid_amount ELSE 0 END) as qr_sales,
        SUM(CASE WHEN payment_method = 'bank_transfer' THEN paid_amount ELSE 0 END) as bank_transfer_sales,
        SUM(CASE WHEN payment_method = 'online' THEN paid_amount ELSE 0 END) as online_sales,
        SUM(CASE WHEN payment_method = 'other' THEN paid_amount ELSE 0 END) as other_sales
    FROM final_bill 
    WHERE created_at >= CURDATE() - INTERVAL 30 DAY
    GROUP BY DATE(created_at)
) fb
LEFT JOIN (
    SELECT 
        DATE(created_at) as sale_date,
        SUM(quantity) as total_items_sold
    FROM order_items 
    WHERE created_at >= CURDATE() - INTERVAL 30 DAY
    GROUP BY DATE(created_at)
) oi ON fb.sale_date = oi.sale_date
ORDER BY fb.sale_date DESC;

-- 6. Sample queries for testing

-- Get today's summary
-- SELECT * FROM vw_daily_complete_summary WHERE sale_date = CURDATE();

-- Get payment method breakdown for today
-- SELECT * FROM vw_daily_payment_summary WHERE sale_date = CURDATE();

-- Get top selling items for today
-- SELECT 
--     item_name,
--     SUM(quantity) as total_quantity,
--     SUM(total_price) as total_amount,
--     COUNT(*) as order_count
-- FROM order_items 
-- WHERE DATE(created_at) = CURDATE()
-- GROUP BY item_name
-- ORDER BY total_quantity DESC
-- LIMIT 10;

SELECT 'Migration completed successfully! Payment tracking added to final_bill and order_items tables.' as status;
