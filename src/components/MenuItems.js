import React from 'react'
import { Link } from 'react-router-dom'

const fullMenu = [
  // {
  //   name: 'Dashboard',
  //   path: '/dashboard/admin',
  //   icon: 'view-dashboard',
  //   dataTargetId: '#home'
  // },
{
    name: 'Dashboard',
    path: '/dashboard',
    icon: 'folder',
    dataTargetId: '#dashboard',
    submenu: [
      { name: 'Analytics', path: '/dashboard/admin' },
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
      { name: 'New Product', path: '/inventory/newproduct' },
      { name: 'Stock Report', path: '/inventory/stockreports' },


    ]
  },


  {
    name: 'Sale GST',
    path: '/sale',
    icon: 'shopping-cart',
    dataTargetId: '#property',
    submenu: [
      { name: 'Advance Order', path: '/sale/advanceordergstt' },
      { name: 'POS', path: '/sale/posgst' },
      { name: 'Retail', path: '/sale/newsale' },
      { name: 'New Quotation', path: '/sale/quotation' },
      { name: 'Quotation History', path: '/quotation-history' },


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
    name: 'Reports GST',
    path: '/pages/reports',
    icon: 'chart',
    dataTargetId: '#reports',
    submenu: [

      { name: 'Sale Report-GST', path: '/reports/billhistorygst' },
      { name: 'PreOrders-GST', path: '/reports/advanceorderreportgst' },
      { name: 'Item Wise GST', path: '/reports/itemwisesalegst' },
      { name: 'Item Wise VAT Summary', path: '/reports/itemwisesummaryvat' },
      { name: 'Purchase Report', path: '/inventory/stockreports' },
      { name: 'Low Stock Items', path: '/reports/lowstockitems' },
      { name: 'Supplier Ledger', path: '/reports/supplierledger' },
      { name: 'Customer Ledger', path: '/reports/saleledger' },
      { name: 'Day Close', path: '/reports/dayclose' },
      { name: 'Day Wise Reports', path: '/reports/daywise' },
      { name: 'Login Attempts', path: '/reports/loginattempts' },
      { name: 'Entertainment Report', path: '/reports/entertainment' },
      { name: 'Group Wise Report', path: '/reports/groupwise' },

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
      { name: 'Print Setting', path: '/setting/printsetting' },
      { name: 'Printer Configuration', path: '/setting/printerconfiguration' },
      { name: 'Device Management', path: '/setting/devicemanagement' },
      { name: 'Device Auth Settings', path: '/setting/deviceauthsettings' },

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
  { name: 'Preorders', path: '/reports/advanceorderreport' },
  { name: 'Purchase Report', path: '/inventory/stockreports' },
  { name: 'Low Stock Items', path: '/reports/lowstockitems' },
  { name: 'Supplier Ledger', path: '/reports/supplierledger' },
  { name: 'Customer Ledger', path: '/reports/saleledger' },
  { name: 'Day Close', path: '/reports/dayclose' },
  { name: 'Day Wise Reports', path: '/reports/daywise' },
  { name: 'Entertainment Report', path: '/reports/entertainment' },
  { name: 'Group Wise Report', path: '/reports/groupwise' },
];

const accountMenu = [
  {
    name: 'Dashboard',
    path: '/dashboard',
    icon: 'folder',
    dataTargetId: '#dashboard',
    submenu: [
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
      .filter(item => ["Dashboard", "Sale GST", "Reports GST", "Vouchers", "Logout"].includes(item.name))
      .map(item => {
        if (item.submenu) 
          {
          const allowedSubmenuNames = {
            "Sale GST": ["POS"],
            "Reports GST": ["Sale Report-GST", "Supplier Ledger", "Customer Ledger"],
            "Vouchers": ["Reciept Voucher", "Payment Voucher"],
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
