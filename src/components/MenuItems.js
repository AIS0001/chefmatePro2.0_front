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
    path: '/pages/master',
    icon: 'account-circle',
    dataTargetId: '#master',
    submenu: [
      { name: 'New User', path: '/pages/users/new-user' },
      
    ]
  },
  {
    name: 'Products',
    path: '/products/newproduct',
    icon: 'account-store',
    dataTargetId: '#users',
    submenu: [
      { name: 'New Product', path: '/products/newproduct' },
      { name: ' Category Profile', path: '/products/newcategory' },
      
    ]
  },
  {
    name: 'Inventory',
    path: '/pages/users',
    icon: 'store',
    dataTargetId: '#inventory',
    submenu: [
      { name: 'New User', path: '/pages/users/new-user' },
      
    ]
  },
  {
    name: 'Accounts',
    path: '/pages/users',
    icon: 'accounts',
    dataTargetId: '#accounts',
    submenu: [
      { name: 'New User', path: '/pages/users/new-user' },
      
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
    name: 'Reports',
    path: '/pages/reports',
    icon: 'file-text',
    dataTargetId: '#reports',
    submenu: [
      { name: 'Sale Reports', path: '/pages/reports/sale-reports' },
      { name: 'Monthly Sales', path: '/pages/reports/monthly-reports' },
      { name: 'Weekly Sales', path: '/pages/reports/weekly-reports' },
      
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
