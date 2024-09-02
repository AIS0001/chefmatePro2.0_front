import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import React, { useState } from 'react'
import Dashboard from "./views/dashboard/dashboard";
import Pages from './views/pages/Pages';
import NewBlog from './views/blogs/NewBlog';
import NewPage from './views/pages/NewPage';
import PrivateRoute from './utility/PrivateRoute';
import Login from './views/pages/Login';
function App() {
  return (
    <>

      <Router>

        <Routes>
          <Route path='/' element={< Login />} />
          {/* Protected Route */}

          
          <Route path="/dashboard" element={<PrivateRoute element={<Dashboard />} />} />

          <Route path='/pages/newpage' element={< NewPage />} />
          <Route path='/blogs/newblog' element={< NewBlog />} />


        </Routes>
      </Router>

    </>
  );
}

export default App;
