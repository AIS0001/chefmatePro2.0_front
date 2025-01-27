import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import React, { useState } from 'react'
import Dashboard from "./views/dashboard/dashboard";

import NewPage from './views/pages/NewPage';
import PrivateRoute from './utility/PrivateRoute';
import Login from './views/pages/Login';
import Logout from './views/Logout';
import HotelBookingCalendar from './views/Hotel/HotelBookingCalendar';
import Details from './views/Hotel/Details';

import Categories from './views/master/categories';
import SubCategories from './views/master/subCategories';
import TableList from './views/master/newTable';

import NewItem from './views/inventory/newItem';
import EditItem from './views/inventory/editItem';
import NewProduct from './views/inventory/newProduct1';


import NewPOS from './views/pos/newPOS';
import BillHistory from './views/reports/billHistory';


//Users
import NewUser from './views/pages/users/NewUser';
import EditProfile from './views/profile/editprofile';


//settings
import Taxes from './views/master/taxes';
import Units from './views/master/units';

function App() {
  return (
    <>

      <Router>

        <Routes>
          <Route path='/' element={< Login />} />
          <Route path='/logout' element={< Logout />} />
       
          {/* Protected Route */}

          {/* Products */}
          <Route path="/master/newcategory" element={<PrivateRoute element={<Categories />} />} />
          <Route path="/master/newsubcategory" element={<PrivateRoute element={<SubCategories />} />} />
          <Route path="/master/table" element={<PrivateRoute element={<TableList />} />} />

          <Route path="/inventory/newitem" element={<PrivateRoute element={<NewItem />} />} />
          <Route path="/inventory/edititem/:id" element={<PrivateRoute element={<EditItem />} />} />
          <Route path="/inventory/newproduct" element={<PrivateRoute element={<NewProduct />} />} />
         
          <Route path="/sale/pos" element={<PrivateRoute element={<NewPOS />} />} />
         
          
         
         
          <Route path="/dashboard" element={<PrivateRoute element={<Dashboard />} />} />
          <Route path="/users/newuser" element={<PrivateRoute element={<NewUser />} />} />
          <Route path="/users/editprofile" element={<PrivateRoute element={<EditProfile />} />} />

 {/* Reports */}
          <Route path="/reports/billhistory" element={<PrivateRoute element={<BillHistory />} />} />
          <Route path='/setting/taxes' element={< Taxes />} />
          <Route path='/setting/units' element={< Units />} />
          {/* <Route path='/users/newuser' element={< NewUser />} /> */}
        
         


        </Routes>
      </Router>

    </>
  );
}

export default App;
