import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import React, { useState } from 'react'
import Dashboard from "./views/dashboard/dashboard";

import PandaLogin from './views/pages/pandaLogin';
import NewPage from './views/pages/NewPage';
import PrivateRoute from './utility/PrivateRoute';
import Login from './views/pages/Login';
import HotelBookingCalendar from './views/Hotel/HotelBookingCalendar';
import Details from './views/Hotel/Details';
import NewNotification from './views/pages/NewNotification';
//Users
import NewUser from './views/pages/users/NewUser';
import EditProfile from './views/profile/editprofile';
function App() {
  return (
    <>

      <Router>

        <Routes>
          <Route path='/' element={< Login />} />
          <Route path='/panda' element={< PandaLogin />} />
          {/* Protected Route */}

          
          <Route path="/dashboard" element={<PrivateRoute element={<Dashboard />} />} />
          <Route path="/users/newuser" element={<PrivateRoute element={<NewUser />} />} />
          <Route path="/users/editprofile" element={<PrivateRoute element={<EditProfile />} />} />

          <Route path='/pages/newpage' element={< NewPage />} />
          <Route path='/hotelbooking' element={< HotelBookingCalendar />} />
          <Route path='/details' element={< Details />} />
          <Route path='/notification' element={< NewNotification />} />


        </Routes>
      </Router>

    </>
  );
}

export default App;
