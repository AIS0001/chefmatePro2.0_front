# Customer Display Setup Instructions

## Overview
The Customer Display feature allows you to show real-time order information to customers on a separate screen. This is perfect for:
- Transparency in ordering process
- Customer engagement
- Professional POS experience
- Dual-screen setups

## How to Use

### 1. Opening Customer Display
- In the POS system, look for the **Customer Display button** (monitor icon) on the right side
- Click it to open a new window with the customer display
- The button will turn green when the display is active

### 2. Automatic Synchronization
- When you add items to the cart, they appear instantly on the customer display
- Quantities, prices, and totals update in real-time
- Cart changes are reflected immediately

### 3. Setting Up Dual Monitors
For the best experience with dual monitors:

1. **Extend Your Display** (Windows):
   - Right-click on desktop → Display Settings
   - Select "Extend these displays"
   - Arrange monitors as needed

2. **Position Customer Display**:
   - The system automatically tries to open on the second monitor
   - Drag the customer display window to your customer-facing monitor
   - Use F11 to make it fullscreen

3. **Customer-Facing Setup**:
   - Position the second monitor facing customers
   - Ensure good visibility and appropriate brightness
   - Consider using a larger monitor for better customer experience

### 4. Features
- **Welcome Screen**: Shows when cart is empty
- **Real-time Updates**: Items appear as they're added
- **Professional Design**: Clean, modern interface
- **Company Branding**: Shows your company information
- **Mobile Responsive**: Works on various screen sizes

### 5. Controls
- **Green Button**: Customer display is open and connected
- **Yellow Button**: Customer display is closed
- **Monitor Icon**: Indicates customer display status
- **Eye Icon**: Shows when display is active

### 6. Troubleshooting
- If display doesn't sync, close and reopen it
- Ensure popup blockers are disabled
- For dual monitors, check display settings
- Refresh the page if connection is lost

### 7. Tips for Best Experience
- Use a second monitor dedicated to customers
- Keep the display clean and professional
- Ensure good lighting for customer visibility
- Test the setup before busy periods
- Train staff on opening/closing the display

## Technical Notes
- Uses JavaScript window.open() for new window
- Real-time sync via custom events
- Responsive design for various screen sizes
- No authentication required for customer display
- Automatic reconnection on page refresh
