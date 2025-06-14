import React from 'react'
import { Link } from 'react-router-dom'

const fullMenu = [
  {
    name: 'Dashboard',
    path: '/dashboard/admin',
    icon: 'view-dashboard',
    dataTargetId: '#home'
  },

  {
    name: 'Master',
    path: '/master',
    icon: 'folder',
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
    name: 'Sale',
    path: '/sale',
    icon: 'menu',
    dataTargetId: '#property',
    submenu: [
       { name: 'Advance Order', path: '/sale/advanceorder' },
      { name: 'POS', path: '/sale/pos' },



    ]
  },
  {
    name: 'Sale GST',
    path: '/sale',
    icon: 'menu',
    dataTargetId: '#property',
    submenu: [
      { name: 'Advance Order', path: '/sale/advanceordergstt' },
      { name: 'POS', path: '/sale/posgst' },


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
    icon: 'file-text',
    dataTargetId: '#reports',
    submenu: [
      { name: 'Add Expense', path: '/expenses/suppliersexpenses' },

    ]
  },
  {
    name: 'Reports',
    path: '/pages/reports',
    icon: 'file-text',
    dataTargetId: '#reports',
    submenu: [
      { name: 'Sale Report', path: '/reports/billhistory' },
      { name: 'Item Wise', path: '/reports/itemwisesale' },
      { name: 'Preorders', path: '/reports/advanceorderreport' },
      { name: 'Purchase Report', path: '/inventory/stockreports' },
      { name: 'Supplier Ledger', path: '/reports/supplierledger' },
      { name: 'Customer Ledger', path: '/reports/saleledger' },

    ]
  },
  {
    name: 'Reports GST',
    path: '/pages/reports',
    icon: 'file-text',
    dataTargetId: '#reports',
    submenu: [

      { name: 'Sale Report-GST', path: '/reports/billhistorygst' },
      { name: 'Advance Orders-GST', path: '/reports/advanceorderreportgst' },
      { name: 'Item Wise GST', path: '/reports/itemwisesalegst' },
      { name: 'Purchase Report', path: '/inventory/stockreports' },
      { name: 'Supplier Ledger', path: '/reports/supplierledger' },
      { name: 'Customer Ledger', path: '/reports/saleledger' },

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
    icon: 'gears',
    dataTargetId: '#inventory',
    submenu: [
      { name: 'Core Setting', path: '/setting/coresetting' },
      { name: 'Company Info', path: '/setting/companyinfo' },
      { name: 'Taxes', path: '/setting/taxes' },
      { name: 'Units', path: '/setting/units' },

    ]
  },
  //   { name: 'Logout', 
  //     path: '/logout', 
  //     icon: 'sign-in', 
  //     dataTargetId: '#logout' ,
  //     "signOut": true
  //  }
];
const getMenuItems = (usertype) => {
  if (usertype === "Cashier")
    {
    return fullMenu
      .filter(item => ["Dashboard", "Sale", "Reports", "Vouchers", "Logout"].includes(item.name))
      .map(item => {
        if (item.submenu) 
          {
          const allowedSubmenuNames = {
            Sale: ["POS"],
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

  if (usertype === "Account") {
    return fullMenu
      .filter(item => ["Account Dashboard", "Reports", "Logout"].includes(item.name))
      .map(item => {
        if (item.name === "Reports" && item.submenu) {
          // Show full Reports submenu for Account
          return { ...item };
        }
        return item;
      });
  }

  // Default for Admin or other full-access users
  return fullMenu;
};


export default getMenuItems;
