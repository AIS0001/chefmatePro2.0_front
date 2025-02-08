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
      { name: 'New Item', path: '/inventory/newItem' },
      { name: 'Item List', path: '/inventory/itemList' },
      { name: 'Item Pricing', path: '/inventory/newItem' },
      { name: 'New Product', path: '/inventory/newproduct' },
     
      
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
    name: 'Reports',
    path: '/pages/reports',
    icon: 'file-text',
    dataTargetId: '#reports',
    submenu: [
      { name: 'Bill History', path: '/reports/billhistory' },
      { name: 'Sales Ledger', path: '/reports/saleledger' },
      { name: 'Room Status', path: '/reports/sroom-status' },
      
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
