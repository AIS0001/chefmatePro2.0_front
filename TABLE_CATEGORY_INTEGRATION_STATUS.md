# Table Category Integration - Database and Backend Updates Required

## Overview
To complete the table category filtering functionality in the reports, we need to:

1. **Add table_cat_id column to order_items table** ✅ (Migration created)
2. **Update backend API endpoint** ⚠️ (Needs implementation)
3. **Frontend updates** ✅ (Already completed)

## Database Changes

### Migration File Created
- **File**: `db/add_table_category_to_order_items.sql`
- **Purpose**: Adds `table_cat_id` column to `order_items` table
- **Status**: ✅ Ready to execute

```sql
-- Add table category ID column to order_items table
ALTER TABLE order_items 
ADD COLUMN table_cat_id INT DEFAULT NULL 
COMMENT 'Foreign key reference to table_category.id';

-- Add index for better query performance
ALTER TABLE order_items 
ADD INDEX idx_table_cat_id (table_cat_id);
```

## Backend API Updates Required

### 1. Update `/order_items_gst_joined` Endpoint
The backend endpoint needs to be modified to include table category information in the JOIN query.

**Current Issue**: The endpoint doesn't include table category data in the response.

**Required Changes**:
```sql
-- The backend query should include a JOIN with table_category table
SELECT 
    oi.*,
    tc.cat_name as table_category_name,
    oi.table_cat_id
FROM order_items oi
LEFT JOIN table_category tc ON oi.table_cat_id = tc.id
-- ... other existing JOINs
```

### 2. Database Schema Updates
Run the migration file to add the `table_cat_id` column:
```sql
-- Execute this migration
SOURCE db/add_table_category_to_order_items.sql;
```

## Frontend Status

### ✅ Completed Features
1. **POS Integration**: newPOS.jsx already saves `table_cat_id` when creating orders
2. **Table Selection**: TableSelectionModal.jsx passes table category data
3. **Form Integration**: newTable.jsx has table category combo box
4. **Report Filtering**: itemWiseSaleGst.js has complete filtering logic
5. **Tax Type Detection**: Shows VAT or GST columns based on coresetting.tax_type

### 🔧 Current Implementation Status
- **POS System**: ✅ Saving table_cat_id correctly
- **Forms**: ✅ Table category selection working
- **Reports**: ⚠️ Filtering logic ready but waiting for backend data
- **Tax Display**: ✅ Dynamic VAT/GST columns based on system settings

## Testing Notes

### Debug Console Logs Added
The report filtering includes debug logs to help identify issues:
```javascript
console.log("Applying filter with selectedTableCatId:", selectedTableCatId);
console.log("Sample data item:", data[0]); // Shows available fields
console.log("Filtered data count:", filtered.length);
```

### Expected Behavior After Backend Update
1. Table category combo box should filter records correctly
2. "Table Category" column should display category names
3. Table category summary should generate properly
4. Export functions should include table category data

## Action Items

### Immediate (Required for functionality)
1. **Execute database migration**: Run `add_table_category_to_order_items.sql`
2. **Update backend API**: Modify `/order_items_gst_joined` to include table category JOIN
3. **Test functionality**: Verify filtering works after backend changes

### Optional Enhancements
1. Add foreign key constraint for referential integrity
2. Add table category to other report endpoints if needed
3. Consider adding table category to historical data (if applicable)

## Verification Steps
1. Check if `table_cat_id` column exists in order_items table
2. Verify backend endpoint returns `table_category_name` and `table_cat_id` fields
3. Test table category filtering in reports
4. Confirm VAT/GST columns display correctly based on coresetting.tax_type

---
**Note**: The frontend is complete and ready. The table category filtering will work once the backend API includes the table category data in the response.
