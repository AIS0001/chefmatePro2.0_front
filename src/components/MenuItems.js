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
    name: 'Property',
    path: '/property/propertiess',
    icon: 'home',
    dataTargetId: '#property',
    submenu: [
      { name: 'New Property', path: '/property/newproperty' },
      { name: ' View Properties', path: '/property/properties' },
      { name: ' View Contracts', path: '/lentproperty/viewlent' },
      
    ]
  },

  {
    name: 'Reports',
    path: '/pages/reports',
    icon: 'file-text',
    dataTargetId: '#reports',
    submenu: [
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
  { name: 'Logout', 
    path: '/logout', 
    icon: 'sign-in', 
    dataTargetId: '#logout' ,
    "signOut": true
 }
]

export default menuItems
