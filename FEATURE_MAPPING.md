# ChefMate POS - Feature Mapping & Subscription Tiers

## Complete Feature Analysis

### 1. Dashboard & Analytics
**Available in:** All plans
**Features:**
- Real-time sales dashboard
- Analytics and reporting overview
- Quick access to key metrics
- Visual charts and graphs

### 2. Master Data Management
**Available in:** All plans (with limitations)

#### 2.1 Customer Management (`/master/newcustomer`)
- **Basic:** Up to 100 customers
- **Professional:** Up to 500 customers  
- **Business:** Unlimited customers
- **Enterprise:** Unlimited customers + advanced customer analytics

#### 2.2 Supplier Management (`/master/newsupplier`)
- **Basic:** Not available
- **Professional:** Up to 50 suppliers
- **Business:** Unlimited suppliers
- **Enterprise:** Unlimited suppliers + supplier analytics

#### 2.3 Table Management (`/master/table`)
- **Basic:** Up to 10 tables
- **Professional:** Up to 50 tables
- **Business:** Unlimited tables
- **Enterprise:** Unlimited tables + table analytics

#### 2.4 Category Management (`/master/newcategory`, `/master/newsubcategory`)
- **Basic:** Up to 20 categories
- **Professional:** Unlimited categories
- **Business:** Unlimited categories
- **Enterprise:** Unlimited categories + category analytics

#### 2.5 Payment Options (`/master/paymentoptions`)
- **Basic:** Cash, Card (2 methods)
- **Professional:** Cash, Card, UPI (5 methods)
- **Business:** All payment methods
- **Enterprise:** All payment methods + custom payment gateway integration

### 3. Inventory Management
**Path:** `/inventory/*`

#### 3.1 Item Management (`/inventory/newitem`)
- **Basic:** Up to 100 items
- **Professional:** Up to 500 items
- **Business:** Unlimited items
- **Enterprise:** Unlimited items + bulk import/export

#### 3.2 Stock Management (`/inventory/newstock`)
- **Basic:** Basic stock tracking
- **Professional:** Advanced stock tracking + low stock alerts
- **Business:** Advanced stock tracking + automated reorder points
- **Enterprise:** Advanced stock tracking + predictive analytics

#### 3.3 Product Management (`/inventory/newproduct`)
- **Basic:** Not available
- **Professional:** Basic product variants
- **Business:** Advanced product variants
- **Enterprise:** Advanced product variants + combo products

#### 3.4 Stock Reports (`/inventory/stockreports`)
- **Basic:** Basic stock reports
- **Professional:** Advanced stock reports
- **Business:** Advanced stock reports + export
- **Enterprise:** Advanced stock reports + custom reports

### 4. Sales & POS Systems
**Path:** `/sale/*`

#### 4.1 POS System (`/sale/pos`, `/sale/posgst`)
- **Basic:** Basic POS with limited features
- **Professional:** Full POS with GST/VAT support
- **Business:** Full POS with advanced features
- **Enterprise:** Full POS with custom integrations

#### 4.2 Advance Orders (`/sale/advanceorder`, `/sale/advanceordergstt`)
- **Basic:** Not available
- **Professional:** Basic advance order system
- **Business:** Advanced advance order system
- **Enterprise:** Advanced advance order system + API integration

#### 4.3 Retail Sales (`/sale/newsale`)
- **Basic:** Basic retail sales
- **Professional:** Advanced retail sales
- **Business:** Advanced retail sales + customer history
- **Enterprise:** Advanced retail sales + custom workflows

### 5. Financial Management

#### 5.1 Vouchers (`/vouchers/*`)
- **Basic:** Not available
- **Professional:** Basic voucher system
- **Business:** Advanced voucher system
- **Enterprise:** Advanced voucher system + custom vouchers

#### 5.2 Expenses (`/expenses/suppliersexpenses`)
- **Basic:** Not available
- **Professional:** Basic expense tracking
- **Business:** Advanced expense tracking + categories
- **Enterprise:** Advanced expense tracking + approval workflows

### 6. Reporting & Analytics
**Path:** `/reports/*`

#### 6.1 Sales Reports (`/reports/billhistory`, `/reports/billhistorygst`)
- **Basic:** Basic sales reports (last 30 days)
- **Professional:** Advanced sales reports (last 1 year)
- **Business:** Advanced sales reports (unlimited history)
- **Enterprise:** Advanced sales reports + custom date ranges

#### 6.2 Item-wise Reports (`/reports/itemwisesale`, `/reports/itemwisesalegst`)
- **Basic:** Not available
- **Professional:** Basic item-wise reports
- **Business:** Advanced item-wise reports
- **Enterprise:** Advanced item-wise reports + profitability analysis

#### 6.3 Customer Reports (`/reports/saleledger`)
- **Basic:** Basic customer history
- **Professional:** Advanced customer reports
- **Business:** Advanced customer reports + loyalty tracking
- **Enterprise:** Advanced customer reports + predictive analytics

#### 6.4 Supplier Reports (`/reports/supplierledger`)
- **Basic:** Not available
- **Professional:** Basic supplier reports
- **Business:** Advanced supplier reports
- **Enterprise:** Advanced supplier reports + payment tracking

#### 6.5 Advance Order Reports (`/reports/advanceorderreport`, `/reports/advanceorderreportgst`)
- **Basic:** Not available
- **Professional:** Basic advance order reports
- **Business:** Advanced advance order reports
- **Enterprise:** Advanced advance order reports + analytics

#### 6.6 Low Stock Reports (`/reports/lowstockitems`)
- **Basic:** Not available
- **Professional:** Basic low stock alerts
- **Business:** Advanced low stock reports + automated alerts
- **Enterprise:** Advanced low stock reports + predictive restocking

### 7. User Management
**Path:** `/users/*`

#### 7.1 User Creation (`/users/newuser`)
- **Basic:** 1 user only
- **Professional:** Up to 3 users
- **Business:** Up to 10 users
- **Enterprise:** Unlimited users

#### 7.2 Profile Management (`/users/editprofile`)
- **Basic:** Basic profile editing
- **Professional:** Advanced profile management
- **Business:** Advanced profile management + role customization
- **Enterprise:** Advanced profile management + custom permissions

### 8. System Settings
**Path:** `/setting/*`

#### 8.1 Core Settings (`/setting/coresetting`)
- **Basic:** Basic system configuration
- **Professional:** Advanced system configuration
- **Business:** Advanced system configuration + customization
- **Enterprise:** Advanced system configuration + white-label options

#### 8.2 Company Info (`/setting/companyinfo`)
- **Basic:** Basic company information
- **Professional:** Advanced company information + branding
- **Business:** Advanced company information + custom branding
- **Enterprise:** Advanced company information + white-label branding

#### 8.3 Tax Management (`/setting/taxes`)
- **Basic:** Basic tax rates (2 rates)
- **Professional:** Advanced tax rates (unlimited)
- **Business:** Advanced tax rates + tax reports
- **Enterprise:** Advanced tax rates + custom tax rules

#### 8.4 Units Management (`/setting/units`)
- **Basic:** Basic units (10 units)
- **Professional:** Advanced units (unlimited)
- **Business:** Advanced units + custom units
- **Enterprise:** Advanced units + unit conversion

## User Role Restrictions by Plan

### Basic Plan
- **Admin:** Limited access to basic features
- **Cashier:** POS access only
- **Account:** Not available

### Professional Plan
- **Admin:** Full access to professional features
- **Cashier:** POS + basic reports
- **Account:** Financial reports only

### Business Plan
- **Admin:** Full access to business features
- **Cashier:** POS + advanced reports
- **Account:** Full financial access

### Enterprise Plan
- **Admin:** Full system access + custom features
- **Cashier:** Custom role configuration
- **Account:** Custom role configuration
- **Custom Roles:** Available

## Technical Limitations by Plan

### Basic Plan
- Single location only
- No API access
- Email support only
- Basic data backup

### Professional Plan
- Single location only
- No API access
- Priority email support
- Advanced data backup

### Business Plan
- Up to 3 locations
- Basic API access
- Phone + email support
- Advanced data backup + export

### Enterprise Plan
- Unlimited locations
- Full API access
- 24/7 priority support
- Advanced data backup + disaster recovery

## Integration Capabilities

### Basic Plan
- No integrations

### Professional Plan
- Basic payment gateway integration
- Email notifications

### Business Plan
- Advanced payment gateway integration
- Email + SMS notifications
- Basic third-party integrations

### Enterprise Plan
- Custom payment gateway integration
- Multi-channel notifications
- Advanced third-party integrations
- Custom API development
- Webhook support

## Data & Security Features

### Basic Plan
- Basic data encryption
- Local data storage
- Basic user authentication

### Professional Plan
- Advanced data encryption
- Cloud data storage
- Multi-factor authentication

### Business Plan
- Advanced data encryption
- Cloud + local data storage
- Multi-factor authentication
- Role-based access control

### Enterprise Plan
- Enterprise-grade encryption
- Multi-region data storage
- Advanced authentication
- Advanced access control
- Audit trails
- Compliance reporting
