# Printer Configuration Module - Frontend Documentation

## 📌 Overview
The Printer Configuration Module provides a comprehensive interface for managing network ESC/POS printer configurations for kitchen and cashier terminals. Built with Ant Design, it offers a modern, intuitive UI for CRUD operations on printer settings.

---

## 🎯 Features

### ✅ Implemented Features
1. **View All Printers** - Table view with pagination and sorting
2. **Add New Printer** - Modal form with validation
3. **Edit Printer** - Update existing configurations
4. **Delete Printer** - Remove printer configurations with confirmation
5. **Filter by Location** - Kitchen/Cashier/All filter tabs
6. **View Details** - Detailed printer information modal
7. **Statistics Dashboard** - Real-time printer statistics cards
8. **IP Validation** - Client-side IP address format validation
9. **Status Management** - Active/Inactive status toggle

---

## 📂 File Structure

```
src/
├── views/
│   └── settings/
│       └── printerConfiguration.jsx    # Main component
├── services/
│   └── printerConfigService.js         # API service layer
└── App.js                               # Route configuration
```

---

## 🚀 Getting Started

### 1. Access the Page

Navigate to the printer configuration page:
```
http://localhost:3000/setting/printerconfiguration
```

Or use the settings menu in your application sidebar.

### 2. Default Configuration

The page automatically:
- Fetches all printer configurations on load
- Displays statistics cards at the top
- Shows all printers in a table format
- Provides filtering and action buttons

---

## 🎨 UI Components

### Statistics Cards
Located at the top of the page, showing:
- **Total Printers** - All configured printers
- **Kitchen Printers** - Printers in kitchen location
- **Cashier Printers** - Printers in cashier location
- **Active Printers** - Currently active printers
- **Inactive Printers** - Disabled printers

### Main Table
Displays printer configurations with columns:
- Terminal ID (unique identifier)
- Location (Kitchen/Cashier)
- Printer Name (friendly name)
- IP Address (network address)
- Port (network port)
- Status (Active/Inactive)
- Created At (timestamp)
- Actions (View/Edit/Delete)

### Location Filter
Radio button group to filter printers:
- **All** - Show all printers
- **Kitchen** - Show only kitchen printers
- **Cashier** - Show only cashier printers

---

## 📝 User Actions

### Add New Printer

1. Click **"Add Printer"** button (top right)
2. Fill in the form:
   - **Terminal ID** (required) - e.g., "KITCHEN-001"
   - **Location** (required) - Select "Kitchen" or "Cashier"
   - **Printer Name** (optional) - Friendly name
   - **Printer IP** (required) - e.g., "192.168.1.100"
   - **Port** (required) - Default: 9100
   - **Status** (required) - "Active" or "Inactive"
3. Click **"Create"**

**Validation:**
- Terminal ID must be uppercase alphanumeric with hyphens/underscores
- IP address must be valid IPv4 format (xxx.xxx.xxx.xxx)
- Each octet must be 0-255
- Terminal ID must be unique

### Edit Printer

1. Click **Edit icon** (pencil) in the Actions column
2. Modify the fields (Terminal ID is disabled)
3. Click **"Update"**

**Note:** You can update IP, port, name, and status, but not the terminal ID.

### View Printer Details

1. Click **View icon** (eye) in the Actions column
2. See detailed information:
   - Full printer configuration
   - Connection string (IP:Port)
   - Timestamps (created/updated)
3. Click **"Edit"** to modify or **"Close"** to exit

### Delete Printer

1. Click **Delete icon** (trash) in the Actions column
2. Confirm deletion in the popup
3. Printer configuration is permanently removed

**Warning:** This action cannot be undone.

---

## 🔧 API Integration

The component uses the centralized API service (`printerConfigService.js`):

### Available Service Methods

```javascript
import printerConfigService from '../../services/printerConfigService';

// Get all printers
const response = await printerConfigService.getAllPrinters();

// Get printer by terminal ID
const printer = await printerConfigService.getPrinterByTerminalId('KITCHEN-001');

// Get printers by location
const kitchenPrinters = await printerConfigService.getPrintersByLocation('kitchen');

// Create new printer
const newPrinter = await printerConfigService.createPrinter({
  terminal_id: 'KITCHEN-001',
  location: 'kitchen',
  printer_ip: '192.168.1.100',
  printer_port: 9100,
  printer_name: 'Main Kitchen Printer',
  status: 'active'
});

// Update printer
const updated = await printerConfigService.updatePrinter('KITCHEN-001', {
  printer_ip: '192.168.1.110',
  status: 'inactive'
});

// Delete printer
await printerConfigService.deletePrinter('KITCHEN-001');

// Validate IP address
const isValid = printerConfigService.validateIPAddress('192.168.1.100');
```

---

## 🎨 Ant Design Components Used

| Component | Purpose |
|-----------|---------|
| `Table` | Display printer configurations |
| `Card` | Statistics cards and main container |
| `Modal` | Add/Edit/View forms |
| `Form` | Input handling and validation |
| `Button` | Action triggers |
| `Tag` | Location and status badges |
| `Badge` | Status indicators |
| `Tooltip` | Helpful hints on hover |
| `Popconfirm` | Delete confirmation |
| `Space` | Component spacing |
| `Row/Col` | Grid layout |
| `Radio` | Location filter |
| `Select` | Dropdown selections |
| `Input` | Text input fields |
| `message` | Toast notifications |

---

## 📊 Data Flow

```
┌─────────────────┐
│  User Action    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Component      │ (printerConfiguration.jsx)
│  Event Handler  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ API Service     │ (printerConfigService.js)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Axios Request   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Backend API     │ (/api/printer/*)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Database        │ (printer_config table)
└─────────────────┘
```

---

## 🛠️ Customization

### Change Default Port
In the form initialization:
```javascript
initialValues={{
  printer_port: 9100,  // Change default port here
  status: "active",
}}
```

### Modify Table Page Size
```javascript
pagination={{
  pageSize: 10,  // Change number of rows per page
  showSizeChanger: true,
  showTotal: (total) => `Total ${total} printers`,
}}
```

### Add Custom Validation
```javascript
const validateCustom = (_, value) => {
  if (your_condition) {
    return Promise.reject(new Error("Custom error message"));
  }
  return Promise.resolve();
};

// Add to Form.Item
<Form.Item
  name="field_name"
  rules={[{ validator: validateCustom }]}
>
```

---

## 🔐 Security & Permissions

### Access Control
The route is protected with `FeatureProtectedRoute`:

```javascript
<Route path="/setting/printerconfiguration" element={
  <FeatureProtectedRoute route="/setting/printerconfiguration">
    <PrinterConfiguration />
  </FeatureProtectedRoute>
} />
```

### Authentication
All API calls use `getHeaders()` which includes:
- JWT token
- Authorization headers
- Proper content-type

---

## 🎯 Best Practices

### 1. Terminal ID Naming Convention
Use descriptive, location-based IDs:
- ✅ `KITCHEN-001`, `KITCHEN-002`
- ✅ `CASHIER-MAIN`, `CASHIER-BACKUP`
- ❌ `PRINTER1`, `P1`

### 2. IP Address Management
- Use static IP addresses for printers
- Ensure IPs are on the same network
- Document IP assignments externally

### 3. Printer Names
Use clear, descriptive names:
- ✅ "Main Kitchen Printer - Ground Floor"
- ✅ "Cashier Receipt Printer - Counter 1"
- ❌ "Printer", "P1"

### 4. Status Management
- Set to "inactive" instead of deleting when troubleshooting
- Active printers should be tested regularly
- Document reason for inactive status

---

## 🐛 Troubleshooting

### Printer Not Showing
- Check if status is "active"
- Verify location filter is not hiding it
- Refresh the page

### IP Validation Error
- Ensure format is xxx.xxx.xxx.xxx
- Each number must be 0-255
- No spaces or special characters

### Cannot Create Duplicate Terminal ID
- Terminal IDs must be unique
- Delete old configuration first
- Or use different terminal ID

### Connection Failed
- Verify printer is on network
- Ping the IP address
- Check firewall settings
- Ensure port 9100 is open

---

## 📱 Responsive Design

The page is fully responsive:
- **Desktop** - Full table with all columns
- **Tablet** - Horizontal scroll for table
- **Mobile** - Stacked statistics cards, scrollable table

---

## 🔄 State Management

### Component State
```javascript
const [printers, setPrinters] = useState([]);              // All printer data
const [loading, setLoading] = useState(false);             // Loading indicator
const [isModalVisible, setIsModalVisible] = useState(false); // Add/Edit modal
const [isViewModalVisible, setIsViewModalVisible] = useState(false); // View modal
const [editingPrinter, setEditingPrinter] = useState(null); // Currently editing
const [viewingPrinter, setViewingPrinter] = useState(null); // Currently viewing
const [filterLocation, setFilterLocation] = useState("all"); // Location filter
const [form] = Form.useForm();                             // Ant Design form instance
```

---

## 🧪 Testing Checklist

- [ ] Load page and verify all printers display
- [ ] Add new printer with valid data
- [ ] Add printer with invalid IP (should fail)
- [ ] Add printer with duplicate terminal ID (should fail)
- [ ] Edit existing printer IP address
- [ ] View printer details
- [ ] Delete printer with confirmation
- [ ] Filter by Kitchen location
- [ ] Filter by Cashier location
- [ ] Verify statistics cards update correctly
- [ ] Test pagination
- [ ] Test table sorting
- [ ] Test responsive design on mobile

---

## 📞 Support

For issues or questions:
1. Check backend API documentation
2. Review `printerConfigService.js` for API methods
3. Check browser console for errors
4. Verify backend is running on correct port

---

## 🚀 Future Enhancements

Possible improvements:
- [ ] Test printer connection button
- [ ] Bulk import/export printers (CSV)
- [ ] Printer usage statistics
- [ ] Print test page from UI
- [ ] Automatic IP discovery
- [ ] Printer logs and history
- [ ] Multi-site support
- [ ] Printer templates

---

## 📄 Related Files

Backend files:
- `routes/printerConfigRoutes.js` - API routes
- `controllers/printerConfigController.js` - Business logic
- `docs/PRINTER_CONFIG_API.md` - Backend API documentation

Frontend files:
- `views/settings/printerConfiguration.jsx` - Main component
- `services/printerConfigService.js` - API service
- `App.js` - Route configuration

---

## 📝 Version History

**v1.0.0** (March 2, 2026)
- Initial release
- Full CRUD operations
- Ant Design UI
- Location filtering
- Statistics dashboard
- IP validation
- Responsive design
