-- Day Close System SQL Schema
-- This file contains the database structure for day close functionality

-- 1. Create day_close_summary table to store daily summary
CREATE TABLE IF NOT EXISTS day_close_summary (
    id INT AUTO_INCREMENT PRIMARY KEY,
    close_date DATE NOT NULL UNIQUE,
    total_sales DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    cash_sales DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    upi_sales DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    card_sales DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    qr_sales DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    bank_transfer_sales DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    online_sales DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    other_sales DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    total_orders INT NOT NULL DEFAULT 0,
    total_items_sold INT NOT NULL DEFAULT 0,
    discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    net_sales DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    opened_by VARCHAR(100),
    closed_by VARCHAR(100),
    opening_time TIMESTAMP,
    closing_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('open', 'closed') DEFAULT 'open',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_close_date (close_date),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 ;

-- 2. Modify final_bill table to include payment_method if not exists
-- First check if payment_method column exists, if not add it
ALTER TABLE final_bill 
ADD COLUMN IF NOT EXISTS payment_method ENUM('cash', 'upi', 'card', 'qr', 'bank_transfer', 'online', 'other') DEFAULT 'cash';

-- Add payment_date column if not exists (for better day close tracking)
ALTER TABLE final_bill 
ADD COLUMN IF NOT EXISTS payment_date DATE GENERATED ALWAYS AS (DATE(created_at)) STORED;

-- Add index for better performance on day close queries
ALTER TABLE final_bill 
ADD INDEX IF NOT EXISTS idx_payment_date (payment_date);

ALTER TABLE final_bill 
ADD INDEX IF NOT EXISTS idx_payment_method (payment_method);

-- 3. Create day_close_details table for detailed breakdown
CREATE TABLE IF NOT EXISTS day_close_details (
    id INT AUTO_INCREMENT PRIMARY KEY,
    day_close_id INT NOT NULL,
    category VARCHAR(100) NOT NULL,
    subcategory VARCHAR(100),
    amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    quantity INT NOT NULL DEFAULT 0,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (day_close_id) REFERENCES day_close_summary(id) ON DELETE CASCADE,
    INDEX idx_day_close_id (day_close_id),
    INDEX idx_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 4. Create cash_drawer table for cash management
CREATE TABLE IF NOT EXISTS cash_drawer (
    id INT AUTO_INCREMENT PRIMARY KEY,
    open_date DATE NOT NULL,
    opening_cash DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    closing_cash DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    expected_cash DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    cash_difference DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    cash_in DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    cash_out DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    opened_by VARCHAR(100),
    closed_by VARCHAR(100),
    opening_time TIMESTAMP,
    closing_time TIMESTAMP,
    status ENUM('open', 'closed') DEFAULT 'open',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_open_date (open_date),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 5. Update order_items table to support better tracking
-- Add payment_method column if not exists
ALTER TABLE order_items 
ADD COLUMN IF NOT EXISTS payment_method ENUM('cash', 'upi', 'card', 'qr', 'bank_transfer', 'online', 'other') DEFAULT 'cash';

-- Add order_date for better filtering
ALTER TABLE order_items 
ADD COLUMN IF NOT EXISTS order_date DATE GENERATED ALWAYS AS (DATE(created_at)) STORED;

-- Add indexes for performance
ALTER TABLE order_items 
ADD INDEX IF NOT EXISTS idx_order_date (order_date);

ALTER TABLE order_items 
ADD INDEX IF NOT EXISTS idx_payment_method (payment_method);

-- 6. Create stored procedure for day close calculation
DELIMITER //

CREATE PROCEDURE CalculateDayCloseSummary(IN close_date DATE)
BEGIN
    DECLARE total_cash DECIMAL(12,2) DEFAULT 0;
    DECLARE total_upi DECIMAL(12,2) DEFAULT 0;
    DECLARE total_card DECIMAL(12,2) DEFAULT 0;
    DECLARE total_qr DECIMAL(12,2) DEFAULT 0;
    DECLARE total_bank DECIMAL(12,2) DEFAULT 0;
    DECLARE total_online DECIMAL(12,2) DEFAULT 0;
    DECLARE total_other DECIMAL(12,2) DEFAULT 0;
    DECLARE order_count INT DEFAULT 0;
    DECLARE item_count INT DEFAULT 0;
    DECLARE grand_total DECIMAL(12,2) DEFAULT 0;

    -- Calculate payment method totals from final_bill
    SELECT 
        COALESCE(SUM(CASE WHEN payment_method = 'cash' THEN paid_amount ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN payment_method = 'upi' THEN paid_amount ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN payment_method = 'card' THEN paid_amount ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN payment_method = 'qr' THEN paid_amount ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN payment_method = 'bank_transfer' THEN paid_amount ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN payment_method = 'online' THEN paid_amount ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN payment_method = 'other' THEN paid_amount ELSE 0 END), 0),
        COUNT(*),
        COALESCE(SUM(paid_amount), 0)
    INTO total_cash, total_upi, total_card, total_qr, total_bank, total_online, total_other, order_count, grand_total
    FROM final_bill 
    WHERE DATE(created_at) = close_date;

    -- Calculate total items sold
    SELECT COALESCE(SUM(quantity), 0) 
    INTO item_count
    FROM order_items 
    WHERE DATE(created_at) = close_date;

    -- Insert or update day close summary
    INSERT INTO day_close_summary (
        close_date, total_sales, cash_sales, upi_sales, card_sales, 
        qr_sales, bank_transfer_sales, online_sales, other_sales,
        total_orders, total_items_sold, net_sales
    ) VALUES (
        close_date, grand_total, total_cash, total_upi, total_card,
        total_qr, total_bank, total_online, total_other,
        order_count, item_count, grand_total
    )
    ON DUPLICATE KEY UPDATE
        total_sales = VALUES(total_sales),
        cash_sales = VALUES(cash_sales),
        upi_sales = VALUES(upi_sales),
        card_sales = VALUES(card_sales),
        qr_sales = VALUES(qr_sales),
        bank_transfer_sales = VALUES(bank_transfer_sales),
        online_sales = VALUES(online_sales),
        other_sales = VALUES(other_sales),
        total_orders = VALUES(total_orders),
        total_items_sold = VALUES(total_items_sold),
        net_sales = VALUES(net_sales),
        updated_at = CURRENT_TIMESTAMP;

END //

DELIMITER ;

-- 7. Insert sample payment methods data (if final_bill table exists and has data)
-- Update existing records to have payment methods (randomly assign for demo)
-- UPDATE final_bill SET payment_method = 'cash' WHERE payment_method IS NULL AND id % 3 = 0;
-- UPDATE final_bill SET payment_method = 'upi' WHERE payment_method IS NULL AND id % 3 = 1;
-- UPDATE final_bill SET payment_method = 'card' WHERE payment_method IS NULL AND id % 3 = 2;

-- 8. Create view for easy day close reporting
CREATE OR REPLACE VIEW vw_daily_sales_summary AS
SELECT 
    DATE(fb.created_at) as sale_date,
    COUNT(DISTINCT fb.id) as total_orders,
    SUM(fb.paid_amount) as total_sales,
    SUM(CASE WHEN fb.payment_method = 'cash' THEN fb.paid_amount ELSE 0 END) as cash_sales,
    SUM(CASE WHEN fb.payment_method = 'upi' THEN fb.paid_amount ELSE 0 END) as upi_sales,
    SUM(CASE WHEN fb.payment_method = 'card' THEN fb.paid_amount ELSE 0 END) as card_sales,
    SUM(CASE WHEN fb.payment_method = 'qr' THEN fb.paid_amount ELSE 0 END) as qr_sales,
    SUM(CASE WHEN fb.payment_method = 'bank_transfer' THEN fb.paid_amount ELSE 0 END) as bank_transfer_sales,
    SUM(CASE WHEN fb.payment_method = 'online' THEN fb.paid_amount ELSE 0 END) as online_sales,
    SUM(CASE WHEN fb.payment_method = 'other' THEN fb.paid_amount ELSE 0 END) as other_sales,
    COUNT(oi.id) as total_items_sold,
    AVG(fb.paid_amount) as avg_order_value
FROM final_bill fb
LEFT JOIN order_items oi ON fb.invoice_number = oi.invoice_number
WHERE fb.created_at >= CURDATE() - INTERVAL 30 DAY
GROUP BY DATE(fb.created_at)
ORDER BY sale_date DESC;

-- Sample query to get today's summary
-- SELECT * FROM vw_daily_sales_summary WHERE sale_date = CURDATE();

SELECT 'Day Close database structure created successfully!' as status;
