# Low Stock Items Report

## Overview
The Low Stock Items Report is a comprehensive inventory management tool that helps track and manage items with low stock levels. This feature provides real-time insights into your inventory status, helping prevent stockouts and maintain optimal stock levels.

## Features

### 📊 Dashboard Summary
- **Total Items**: Overview of all items in inventory
- **Low Stock Items**: Items below the threshold level
- **Out of Stock**: Items with zero stock
- **Critical Items**: Items with stock ≤ 5 units
- **Total Stock Value**: Monetary value of current low stock items

### 📈 Visual Analytics
- **Stock Distribution Chart**: Pie chart showing distribution of stock levels
- **Category-wise Analysis**: Bar chart showing low stock items by category
- Interactive charts with hover details and legends

### 🔍 Advanced Filtering
- **Search**: Filter by item name or category
- **Stock Threshold**: Adjustable threshold for low stock definition
- **Category Filter**: Filter by specific product categories
- **Sorting Options**: Sort by stock level, name, or value

### 📤 Export Capabilities
- **CSV Export**: Export filtered data to CSV format
- **PDF Export**: Generate comprehensive PDF reports with summaries
- **Print-friendly**: Optimized layout for printing

### 📱 Responsive Design
- Mobile-friendly interface
- Responsive tables and charts
- Touch-friendly controls

## Usage

### Accessing the Report
1. Navigate to **Reports** → **Low Stock Items** in the main menu
2. The dashboard will load with current low stock data

### Filtering Data
1. Use the search box to find specific items
2. Adjust the stock threshold to define "low stock"
3. Select categories to filter by product type
4. Choose sorting options from the dropdown

### Exporting Data
1. Click **CSV** button to download data in spreadsheet format
2. Click **PDF** button to generate a comprehensive report
3. Use browser print function for physical copies

### Understanding Status Badges
- 🔴 **Out of Stock**: Zero units available (animated alert)
- 🟡 **Critical**: 5 or fewer units available (blinking alert)
- 🔵 **Low Stock**: Below threshold but not critical

## Technical Implementation

### API Endpoints
- `/report/getlowstockalert` - Fetches low stock items
- `/api/items` - Fetches all items for comprehensive analysis
- `/api/categories` - Fetches product categories

### Data Structure
The component handles the following data fields:
- `item_name` - Product name
- `category` - Product category
- `closing_stock` - Current stock level
- `selling_price` - Item price
- `id` - Unique identifier

### Performance Features
- Efficient data filtering and sorting
- Responsive chart rendering
- Optimized table pagination
- Real-time search functionality

## Configuration

### Stock Threshold
The default low stock threshold is 10 units but can be adjusted:
- Use the "Stock Threshold" input field
- Changes apply immediately to all filters and charts
- Threshold is maintained during the session

### Currency Display
- Automatically detects currency from system settings
- Supports multiple currency symbols
- Consistent formatting across all monetary displays

## Troubleshooting

### Common Issues
1. **No data loading**: Check API endpoints and network connectivity
2. **Charts not rendering**: Ensure all required data fields are present
3. **Export not working**: Verify browser permissions for file downloads

### Browser Compatibility
- Modern browsers (Chrome, Firefox, Safari, Edge)
- JavaScript enabled
- Local storage support for preferences

## Future Enhancements
- Email alerts for critical stock levels
- Integration with purchase order system
- Historical trend analysis
- Automated reorder suggestions
- Supplier contact integration

## Support
For technical support or feature requests, please contact the development team or refer to the main application documentation.
