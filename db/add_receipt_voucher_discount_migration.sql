-- Migration: Add discount support for receipt vouchers and optional ledger tracking
-- Compatible with MariaDB/MySQL

START TRANSACTION;

-- Required: store discount directly on voucher row
ALTER TABLE receipt_vouchers
    ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00 AFTER amount_paid;

-- Optional: if you want direct discount column in ledger rows for reporting
-- If you track discount as separate ledger entry (recommended accounting-wise),
-- this column is not mandatory.
ALTER TABLE ledger_entries
    ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00 AFTER credit_amount;

COMMIT;
