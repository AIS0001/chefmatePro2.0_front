import React from 'react'
import { Link } from 'react-router-dom'

const fullMenu = [

  


{
    name: 'Dashboard',
    path: '/dashboard',
    icon: 'folder',
    dataTargetId: '#dashboard',
    submenu: [
     
      { name: 'Analytics', path: '/dashboard/analytics' },
      { name: 'Accounts', path: '/dashboard/account' },
    ]
  },
  {
    name: 'Master',
    path: '/master',
    icon: 'layers',
    dataTargetId: '#master',
    submenu: [
      { name: 'New Customer', path: '/master/newcustomer' },
      { name: 'New Supplier', path: '/master/newsupplier' },
      { name: 'New Table', path: '/master/table' },
      { name: 'New Category', path: '/master/newcategory' },
      { name: 'New Sub Category', path: '/master/newsubcategory' },
      { name: 'Payment Options', path: '/master/paymentoptions' },

    ]
  },
  {
    name: 'Inventory',
    path: '/inventory',
    icon: 'store',
    dataTargetId: '#inventory',
    submenu: [
      { name: 'Add New Item', path: '/inventory/newItem' },
      { name: 'Add New Stock', path: '/inventory/newStock' },
      { name: 'Add New Stock (Ant)', path: '/inventory/newstock-ant' },
      { name: 'New Product', path: '/inventory/newproduct' },
      { name: 'Stock Report', path: '/inventory/stockreports' },
      { name: 'Stock Reports (Ant)', path: '/inventory/stockreports-ant' },


    ]
  },

  {
    name: 'Sale',
    path: '/sale',
    icon: 'shopping-cart',
    dataTargetId: '#property',
    submenu: [
      //  { name: 'Advance Order', path: '/sale/advanceorder' },
      { name: 'POS', path: '/sale/pos' },
      { name: 'POS (Ant - Stock Managed)', path: '/sale/pos-ant' },
      // { name: 'New Sale', path: '/sale/newsale' },
      // { name: 'New Quotation', path: '/sale/quotation' },
     



    ]
  },

  {
    name: 'Vouchers',
    path: '/pages/vouchers',
    icon: 'file-text',
    dataTargetId: '#reports',
    submenu: [
      { name: 'Reciept Voucher', path: '/vouchers/recieptvoucher' },
      { name: 'Payment Voucher', path: '/vouchers/paymentvoucher' },

    ]
  },
  {
    name: 'Expenses',
    path: '/pages/expenses',
    icon: 'minus-circle',
    dataTargetId: '#reports',
    submenu: [
      { name: 'Add Expense', path: '/expenses/suppliersexpenses' },

    ]
  },
  {
    name: 'Reports',
    path: '/pages/reports',
    icon: 'chart',
    dataTargetId: '#reports',
    submenu: [
      { name: 'Bill Wise ', path: '/reports/billhistory' },
      //  { name: 'Quotation History', path: '/quotation-history' },
      // { name: 'Item Wise', path: '/reports/itemwisesale' },
      { name: 'Item Wise ', path: '/reports/itemwisesummaryvat' },
        { name: 'Group Wise Report', path: '/reports/groupwise' },
       { name: 'Entertainment Report', path: '/reports/entertainment' },
      
      { name: 'Day Close', path: '/reports/dayclose' },
      { name: 'Cash Drawer', path: '/reports/cashdrawer' },
      { name: 'Day Wise Reports', path: '/reports/daywise' },
      { name: 'Supplier Ledger', path: '/reports/supplierledger' },
      { name: 'Customer Ledger', path: '/reports/saleledger' },
       { name: 'Preorders', path: '/reports/advanceorderreport' },
      { name: 'Purchase Report', path: '/inventory/stockreports' },
      { name: 'Low Stock Items', path: '/reports/lowstockitems' },
      { name: 'Bill Edit Logs', path: '/reports/billeditlogs' },
      { name: 'Login Attempts', path: '/reports/loginattempts' },
     

    ]
  },
  

  {
    name: 'Users',
    path: '/pages/users',
    icon: 'account-circle',
    dataTargetId: '#users',
    submenu: [
      { name: 'New User', path: '/users/newuser' },
      { name: 'Edit Profile', path: '/users/editprofile' },

    ]
  },
  {
    name: 'Setting',
    path: '/setting',
    icon: 'settings',
    dataTargetId: '#inventory',
    submenu: [
      { name: 'Core Setting', path: '/setting/coresetting' },
      { name: 'Company Info', path: '/setting/companyinfo' },
      { name: 'Taxes', path: '/setting/taxes' },
      { name: 'Units', path: '/setting/units' },
      { name: 'Menu Permissions', path: '/setting/menupermissions' },
    ]
  },
  {
    name: 'Network & Device Management',
    path: '/setting/network-device',
    icon: 'router',
    dataTargetId: '#network',
    submenu: [
      { name: 'Printer Configuration', path: '/setting/printerconfiguration' },
      { name: 'Device Management', path: '/setting/devicemanagement' },
      { name: 'Device Auth Settings', path: '/setting/deviceauthsettings' },
      { name: 'Device UUID Management', path: '/setting/deviceuuidmanagement' },
    ]
  },
  {
    name: 'Subscription',
    path: '/subscription',
    icon: 'card-membership',
    dataTargetId: '#subscription'
  },
  {
    name: 'Support',
    path: '/support/tickets',
    icon: 'help-outline',
    dataTargetId: '#support'
  },
  //   { name: 'Logout', 
  //     path: '/logout', 
  //     icon: 'sign-in', 
  //     dataTargetId: '#logout' ,
  //     "signOut": true
  //  }
];

const accountVatReports = [
  { name: 'Sale Report', path: '/reports/billhistory' },
  { name: 'Quotation History', path: '/quotation-history' },
  { name: 'Item Wise', path: '/reports/itemwisesummaryvat' },
  // { name: 'Preorders', path: '/reports/advanceorderreport' },
  { name: 'Purchase Report', path: '/inventory/stockreports' },
  { name: 'Low Stock Items', path: '/reports/lowstockitems' },
  { name: 'Supplier Ledger', path: '/reports/supplierledger' },
  { name: 'Customer Ledger', path: '/reports/saleledger' },
  { name: 'Day Close', path: '/reports/dayclose' },
  { name: 'Cash Drawer', path: '/reports/cashdrawer' },
  { name: 'Day Wise Reports', path: '/reports/daywise' },
  { name: 'Bill Edit Logs', path: '/reports/billeditlogs' },
];

const accountMenu = [
  {
    name: 'Dashboard',
    path: '/dashboard',
    icon: 'folder',
    dataTargetId: '#dashboard',
    submenu: [
      { name: 'Analytics', path: '/dashboard/analytics' },
      { name: 'Accounts', path: '/dashboard/account' },
    ]
  },
  {
    name: 'Reports',
    path: '/pages/reports',
    icon: 'chart',
    dataTargetId: '#reports',
    submenu: accountVatReports
  },
  {
    name: 'Vouchers',
    path: '/pages/vouchers',
    icon: 'file-text',
    dataTargetId: '#reports',
    submenu: [
      { name: 'Reciept Voucher', path: '/vouchers/recieptvoucher' },
      { name: 'Payment Voucher', path: '/vouchers/paymentvoucher' },
    ]
  },
  {
    name: 'Expenses',
    path: '/pages/expenses',
    icon: 'minus-circle',
    dataTargetId: '#reports',
    submenu: [
      { name: 'Add Expense', path: '/expenses/suppliersexpenses' },
    ]
  },
  {
    name: 'Subscription',
    path: '/subscription',
    icon: 'card-membership',
    dataTargetId: '#subscription'
  },
  {
    name: 'Support',
    path: '/support/tickets',
    icon: 'help-outline',
    dataTargetId: '#support'
  },
];
const getMenuItems = (usertype) => {
  const normalizedUsertype = (usertype || "").toLowerCase();
  if (normalizedUsertype === "cashier")
    {
    return fullMenu
      .filter(item => ["Dashboard", "Sale", "Reports", "Vouchers", "Subscription", "Logout"].includes(item.name))
      .map(item => {
        if (item.submenu) 
          {
          const allowedSubmenuNames = {
            Sale: ["POS","Retail"],
            Reports: ["Sale Report", "Supplier Ledger", "Customer Ledger", "Reciept Voucher", "Payment Voucher"],
          };
          const filteredSubmenu = allowedSubmenuNames[item.name]
            ? item.submenu.filter(sub => allowedSubmenuNames[item.name].includes(sub.name))
            : item.submenu;
          return { ...item, submenu: filteredSubmenu };
        }
        return item;
      });
  }

  if (normalizedUsertype === "account") {
    return accountMenu;
  }

  // Default for Admin or other full-access users
  return fullMenu;
};


export default getMenuItems;
