# ChefMate KIOSK System

## Overview
A customer-facing self-service ordering system built with Ant Design, optimized for touch-screen kiosk machines. Customers can browse menu items, add them to cart, and place orders directly without staff assistance.

## Features

### 🎨 Modern UI with Ant Design
- Large, touch-friendly buttons and cards
- Responsive design for various screen sizes
- Beautiful animations and transitions
- Clean, customer-friendly interface

### 🛒 Shopping Cart
- Real-time cart updates
- Quantity adjustment (increase/decrease)
- Item removal
- Cart total calculation
- Floating cart button for mobile devices

### 📱 Customer Journey
1. **Category Selection**: Browse main food categories
2. **Subcategory Navigation**: Select specific food types
3. **Item Selection**: View items with images and prices
4. **Cart Management**: Review and modify order
5. **Order Confirmation**: Confirm order details
6. **Success Notification**: Receive order number

### ✨ Key Functionalities

#### Navigation
- Breadcrumb navigation for easy back-tracking
- "Back to Categories" and "Back to Subcategories" buttons
- Clear visual indicators of current location

#### Order Management
- Add items to cart with one tap
- Adjust quantities in cart
- Remove individual items
- Clear entire cart
- View cart total in real-time

#### Order Placement
- Order confirmation modal
- Success notification with order number
- Auto-reset after successful order
- KIOSK orders tagged separately for tracking

## Components Used

### Ant Design Components
- `Card` - Category, subcategory, and item display
- `Row` & `Col` - Responsive grid layout
- `Button` - All interactive elements
- `Badge` - Cart item counter
- `Image` - Product images with fallback
- `Typography` - Text elements (Title, Text)
- `InputNumber` - Quantity adjustment
- `Modal` - Cart, confirmation, and success modals
- `Divider` - Visual separators
- `Space` - Component spacing
- `message` - Toast notifications
- `Affix` - Sticky header and floating buttons
- `Empty` - Empty state displays
- `Tag` - Category tags and labels
- `Spin` - Loading indicators

### Icons Used (Ant Design Icons)
- `ShoppingCartOutlined`
- `PlusOutlined`
- `MinusOutlined`
- `DeleteOutlined`
- `CheckCircleOutlined`
- `CloseOutlined`
- `ShoppingOutlined`
- `AppstoreOutlined`

## File Structure

```
src/views/pos/
├── Kiosk.jsx          # Main KIOSK component
└── Kiosk.css          # KIOSK-specific styles
```

## Installation & Setup

### ✅ Already Configured!
The KIOSK route has been added to App.js as a **public route** - no login required!

```javascript
import Kiosk from './views/pos/Kiosk';

// Public Access Route (no authentication needed)
<Route path="/kiosk" element={<Kiosk />} />
```

### 🔓 Public Access
**The KIOSK is accessible without login!** This is intentional for customer self-service:
- Navigate directly to: `http://localhost:3000/kiosk`
- Or on production: `http://your-domain.com/kiosk`
- **No authentication required**
- **No user credentials needed**
- Perfect for customer-facing kiosk machines

### 1. Install Ant Design (if not already installed)
```bash
npm install antd @ant-design/icons
```

### 2. Start your application
```bash
npm start
```

### 3. Access the KIOSK
- **Local Development**: `http://localhost:3000/kiosk`
- **Production**: `http://your-domain.com/kiosk`

## Configuration

### Base URL
Update the `baseURL` in Kiosk.jsx to match your API endpoint:
```javascript
const baseURL = 'http://localhost:4402';
```

### Kiosk Mode Setup (Fullscreen)
For a true kiosk experience, configure the browser to run in fullscreen/kiosk mode:

#### Chrome Kiosk Mode (Windows)
```bash
chrome.exe --kiosk "http://localhost:3000/kiosk" --no-first-run --disable-session-crashed-bubble
```

#### Chrome Kiosk Mode (Mac)
```bash
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --kiosk "http://localhost:3000/kiosk"
```

#### Firefox Fullscreen
Press `F11` to toggle fullscreen mode after loading the KIOSK page.

#### Auto-start on Boot (Windows)
1. Create a shortcut to Chrome with kiosk parameters
2. Place shortcut in: `C:\ProgramData\Microsoft\Windows\Start Menu\Programs\StartUp`
3. Kiosk will auto-launch on system startup

#### Disable Browser Navigation
For production kiosks, consider using:
- Kiosk browser extensions
- Windows Shell Launcher (Windows 10/11 Pro)
- FullPageOS for Raspberry Pi
- Tablet/iPad Guided Access mode

### Styling Customization
Modify `Kiosk.css` to match your brand:
- Colors
- Fonts
- Card sizes
- Button styles
- Animations

## Features in Detail

### 1. Category View
- Grid layout of all available categories
- Large, colorful cards with icons
- Hover effects for better UX
- Responsive columns (4 on desktop, 2 on tablet, 1 on mobile)

### 2. Subcategory View
- Shows subcategories of selected category
- Easy navigation back to categories
- Visual feedback on hover
- Consistent card design

### 3. Item View
- Product images from database
- Item name and price display
- "Add to Cart" button on each item
- Fallback image if product image missing
- Support for weight-based items (future enhancement)

### 4. Cart Management
- Modal/Drawer display
- Item list with images
- Quantity controls (+/- buttons)
- Remove item option
- Clear all items
- Real-time total calculation
- Floating cart button (mobile)

### 5. Order Confirmation
- Order summary display
- Itemized list with quantities
- Total amount
- Confirm/Cancel options

### 6. Order Success
- Success icon with animation
- Order number display
- Auto-dismiss after 3 seconds
- Auto-reset to categories

## Responsive Design

### Desktop (> 1024px)
- Multi-column grid layouts
- Fixed header with cart button
- Larger card sizes
- Optimal spacing

### Tablet (768px - 1024px)
- Adjusted column counts
- Medium card sizes
- Touch-optimized button sizes

### Mobile (< 768px)
- Single column layouts
- Floating cart button
- Smaller but still touch-friendly
- Optimized for portrait orientation

## Touch Optimization

### Large Touch Targets
- Minimum 50px height for buttons
- Large card clickable areas
- Adequate spacing between elements

### Visual Feedback
- Hover effects (for touch preview)
- Active states
- Loading indicators
- Success/error messages

## Database Integration

### Tables Used
- `categories` - Main food categories
- `subcategory` - Subcategories within categories
- `items` - Menu items
- `item_images` - Product images
- `orders` - Order header
- `order_items` - Order line items
- `companyinfo` - Company information

### Order Data Saved
```javascript
{
  order_number: Random 6-digit number,
  table_number: "KIOSK",
  total_amount: Calculated total,
  status: "pending",
  order_date: Current date,
  setup_date: Next setup date,
  userid: "KIOSK-CUSTOMER",
  table_cat_id: null
}
```

### Order Item Data
```javascript
{
  order_id: Generated order ID,
  product_id: Item ID,
  order_number: Same as order,
  quantity: Selected quantity,
  price: Item price,
  item_name: Item name,
  table_number: "KIOSK",
  status: "pending",
  order_date: Current date,
  setup_date: Next setup date,
  category_id: Selected category,
  subcategory_id: Selected subcategory
}
```

## Customization Options

### 1. Currency
Change the currency symbol in the code:
```javascript
// Current: ฿ (Thai Baht)
// Replace with: $, €, £, etc.
```

### 2. Color Scheme
Update in Kiosk.css:
```css
/* Primary color */
--primary-color: #1890ff;

/* Success color */
--success-color: #52c41a;

/* Background gradient */
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
```

### 3. Company Branding
Update company info in database `companyinfo` table:
- Company name
- Logo
- Contact information

### 4. Auto-dismiss Timing
Modify success modal auto-close duration:
```javascript
setTimeout(() => {
  // Close modal and reset
}, 3000); // Change 3000 to desired milliseconds
```

## Future Enhancements

### Potential Features
1. **Payment Integration**
   - Credit card processing
   - QR code payments
   - Digital wallets

2. **Multi-language Support**
   - Language selector
   - Translated menu items
   - RTL support

3. **Dietary Filters**
   - Vegetarian
   - Vegan
   - Gluten-free
   - Allergen warnings

4. **Item Customization**
   - Size selection
   - Add-ons/extras
   - Special instructions

5. **Promotional Features**
   - Daily specials
   - Combo deals
   - Discount codes

6. **Order Tracking**
   - Estimated wait time
   - Order status updates
   - Notification system

7. **Analytics**
   - Popular items
   - Peak hours
   - Customer preferences

## Troubleshooting

### Images Not Loading
- Check baseURL configuration
- Verify uploads folder permissions
- Ensure item_images table has correct data
- Check image filename paths

### Cart Not Updating
- Verify state management
- Check console for errors
- Ensure cart functions are being called

### Orders Not Saving
- Check API endpoint availability
- Verify database connection
- Check required fields in order data
- Review console errors

### Responsive Issues
- Clear browser cache
- Check CSS media queries
- Verify Ant Design grid system usage
- Test on actual devices

## Performance Optimization

### Best Practices
1. **Image Optimization**
   - Compress product images
   - Use appropriate image sizes
   - Implement lazy loading

2. **Code Splitting**
   - Lazy load modals
   - Split routes
   - Optimize bundle size

3. **Caching**
   - Cache category data
   - Store company info
   - Minimize API calls

4. **Loading States**
   - Show spinners during data fetch
   - Skeleton screens for better UX
   - Optimistic UI updates

## Browser Support

### Tested Browsers
- ✅ Chrome (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Edge (latest)

### Touch Devices
- ✅ iPad
- ✅ Android tablets
- ✅ Surface devices
- ✅ Touch-enabled monitors

## Security Considerations

### Current Implementation
- No user authentication (customer-facing)
- Basic input validation
- CORS configuration required

### Recommended Enhancements
- Rate limiting for orders
- Input sanitization
- CSRF protection
- Session management

## Support & Maintenance

### Regular Tasks
- Update product images
- Review and update menu items
- Monitor order success rate
- Check for UI issues
- Update software dependencies

### Monitoring
- Track failed orders
- Monitor API errors
- Review customer feedback
- Analyze usage patterns

## License
Part of ChefMate POS System

## Contact
For support and questions, refer to main project documentation.

---

**Version**: 1.0.0  
**Last Updated**: January 2026  
**Built with**: React, Ant Design, Axios
