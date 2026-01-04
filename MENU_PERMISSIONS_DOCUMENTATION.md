# Menu Permissions System - ChefMate POS

## Overview

The Menu Permissions System allows administrators to control which menu items are accessible to different user roles (Admin, Cashier, etc.). This provides granular access control over all application features on a per-role basis.

## Database Structure

### Tables Created

1. **menu_sections** - Categories of menu items (Dashboard, Master Data, Sales, etc.)
2. **menu_items** - Individual menu items within each section
3. **user_roles** - Available user roles (Admin, Cashier, etc.)
4. **menu_permissions** - Controls which roles can access which menu items

### Database Installation

Execute the SQL file to create the necessary tables:

```sql
-- Run this file in your MySQL database
source db/menu_permissions_schema.sql
```

This will create:
- All required tables with proper relationships
- Default menu sections and items
- Default user roles (Admin, Cashier)
- Default permissions (Admin gets all access, Cashier gets limited access)
- Useful views for easy querying

## Backend Implementation

### API Endpoints

The following REST API endpoints are available:

#### GET /api/menu-permissions/roles
Returns all available user roles.

#### GET /api/menu-permissions/menu-structure
Returns the complete menu structure with sections and items.

#### GET /api/menu-permissions/permissions/:roleId
Returns all permissions for a specific role.

#### PUT /api/menu-permissions/permissions/:roleId
Updates permissions for a specific role.
Body: `{ permissions: { menuItemId: boolean, ... } }`

#### GET /api/menu-permissions/enabled-menus/:roleId
Returns only enabled menu items for a specific role.

#### POST /api/menu-permissions/check-access
Checks if the current user has access to a specific route.
Body: `{ routePath: string }`

#### GET /api/menu-permissions/my-menus
Returns accessible menu items for the current authenticated user.

#### POST /api/menu-permissions/reset-permissions/:roleId
Resets permissions for a role.
Body: `{ resetType: "enable_all" | "disable_all" | "default" }`

#### POST /api/menu-permissions/copy-permissions
Copies permissions from one role to another.
Body: `{ fromRoleId: number, toRoleId: number }`

### Backend Files

- `backend/services/menuPermissionsService.js` - Core business logic
- `backend/routes/menuPermissions.js` - API route handlers

## Frontend Implementation

### Menu Permissions Management Page

Located at `/setting/menupermissions`, this page allows administrators to:

- Select a user role
- View all menu sections and items
- Enable/disable individual menu items with checkboxes
- Enable/disable entire sections at once
- Save changes to the database
- Reset changes to last saved state

### Features

- **Section-wise Control**: Toggle entire sections on/off
- **Individual Control**: Fine-grained control over each menu item
- **Visual Feedback**: 
  - Checkboxes show enabled/disabled state
  - Indeterminate state when section is partially enabled
  - Progress indicators during loading and saving
- **Responsive Design**: Works on desktop and mobile devices

### Frontend Files

- `src/views/settings/menuPermissions.js` - Main component
- `src/components/MenuItems.js` - Updated with menu permissions link
- `src/components/Menu_item_vat.js` - Updated with menu permissions link
- `src/App.js` - Added route configuration

## Usage Instructions

### 1. Database Setup

1. Run the SQL schema file to create all necessary tables
2. The system comes pre-populated with default menu items and permissions

### 2. Accessing Menu Permissions

1. Log in as an admin user
2. Navigate to **Settings** → **Menu Permissions**
3. Select a user role from the dropdown

### 3. Managing Permissions

1. **Section Toggle**: Click the checkbox next to a section name to enable/disable all items in that section
2. **Individual Toggle**: Click individual checkboxes to control specific menu items
3. **Save Changes**: Click "Save Permissions" to apply changes
4. **Reset**: Click "Reset" to revert to last saved state

### 4. Default Permission Levels

#### Administrator Role
- **Access**: All menu items enabled by default
- **Purpose**: Full system access for management tasks

#### Cashier Role
- **Access**: Limited to essential POS functions
- **Enabled Items**:
  - Dashboard (Main, Cashier)
  - Sales (POS, POS with GST, New Sale, VAT Sale)
  - Reports (Bill History, Day Close)
  - User Management (Edit Profile only)

## Integration with Existing Features

### Feature Protection

The system integrates with the existing `FeatureProtectedRoute` component. Each route is wrapped to check permissions before rendering.

### Menu Navigation

The sidebar menu items are controlled by the permissions system. Users will only see menu items they have permission to access.

### Route Protection

Backend middleware can check route permissions using the `checkMenuAccess` function.

## Customization

### Adding New Menu Items

1. **Database**: Insert new records in `menu_items` table
2. **Frontend**: Add corresponding routes in `App.js`
3. **Permissions**: Default permissions will be created automatically

### Adding New User Roles

1. **Database**: Insert new records in `user_roles` table
2. **Permissions**: Configure default permissions as needed

### Customizing Default Permissions

Modify the default permission logic in:
- `backend/routes/menuPermissions.js` (reset-permissions endpoint)
- `db/menu_permissions_schema.sql` (initial data inserts)

## Security Considerations

- All API endpoints require authentication
- Role-based access control at both frontend and backend levels
- SQL injection protection through parameterized queries
- Input validation on all endpoints

## Error Handling

- Graceful handling of database connection issues
- User-friendly error messages
- Fallback behavior when permissions cannot be loaded
- Transaction rollback on permission update failures

## Performance Optimization

- Indexed database tables for fast queries
- Caching of user permissions
- Efficient bulk permission updates
- Minimal database calls through optimized queries

## Troubleshooting

### Common Issues

1. **Permissions not updating**: Check database connection and transaction handling
2. **Menu items not showing**: Verify role assignments and permission settings
3. **Access denied errors**: Check route permissions and user role mapping

### Database Views

Use the provided views for easier debugging:

```sql
-- View all permissions with readable names
SELECT * FROM v_menu_permissions WHERE role_code = 'cashier';

-- View enabled menus for a role
SELECT * FROM v_enabled_menus WHERE role_code = 'admin';
```

## Future Enhancements

Potential improvements for the system:

- **User-specific permissions** (override role permissions)
- **Time-based permissions** (schedule access)
- **Permission inheritance** (hierarchical roles)
- **Audit logging** (track permission changes)
- **Bulk role management** (import/export permissions)
- **Permission templates** (predefined permission sets)

## Support

For technical support or questions about the Menu Permissions System:

1. Check the database schema and default data
2. Review API endpoint documentation
3. Examine frontend component code
4. Test with default admin/cashier roles
5. Check browser console for error messages

---

**Note**: This system requires proper user authentication and role assignment to function correctly. Ensure users have appropriate roles assigned in the users table before testing permissions.
