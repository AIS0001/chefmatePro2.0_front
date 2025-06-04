import React from 'react'
import { Link } from 'react-router-dom'

const menuItems = [
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
      { name: 'POS', path: '/sale/pos' },
     
      
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
      { name: 'Company Info', path: '/setting/companyinfo' },
      { name: 'Taxes', path: '/setting/taxes' },
      { name: 'Units', path: '/setting/units' },
      
    ]
  },
  { name: 'Logout', 
    path: '/logout', 
    icon: 'sign-in', 
    dataTargetId: '#logout' ,
    "signOut": true
 }
]

export default menuItems
