import { BrowserRouter, Route, Routes } from 'react-router-dom'
import React, { useState } from 'react'
import Dashboard from "./views/dashboard/dashboard";
import Pages from './views/pages/Pages';
import NewBlog from './views/blogs/NewBlog';
import NewPage from './views/pages/NewPage';

function App() {
  return (
<>

<BrowserRouter>

<Routes>
          <Route path='/' element={< Dashboard/>} />
          <Route path='/pages/viepages' element={< Pages/>} />
          <Route path='/pages/newpage' element={< NewPage/>} />
          <Route path='/blogs/newblog' element={< NewBlog/>} />
       

          </Routes>
</BrowserRouter>

</>
  );
}

export default App;
