import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import React, { useState } from 'react'
import Dashboard from "./views/dashboard/dashboard";

import NewPage from './views/pages/NewPage';
import PrivateRoute from './utility/PrivateRoute';
import Login from './views/pages/Login';
import Logout from './views/Logout';
import HotelBookingCalendar from './views/Hotel/HotelBookingCalendar';
import Details from './views/Hotel/Details';

import Customers from './views/master/customers';
import Suppliers from './views/master/suppliers';
import Categories from './views/master/categories';
import SubCategories from './views/master/subCategories';
import TableList from './views/master/newTable';
import PaymentOptions from './views/master/paymentOptions';

import NewItem from './views/inventory/newItem';
import NewStock from './views/inventory/newStock';
import EditItem from './views/inventory/editItem';
import NewProduct from './views/inventory/newProduct1';
import StockReport from './views/inventory/stockReport';


import NewPOS from './views/pos/newPOS';
//expenses
import SupplierLedgerEntry from './views/expenses/supplierLedgerEntry';

//Vouchers
import Vouchers from './views/vouchers/vouchers';
import PaymentVouchers from './views/vouchers/paymentVouchers';
//Reports
import BillHistory from './views/reports/billHistory';
import SaleLedger from './views/reports/saleLedger';
import SupplierLedger from './views/reports/suppliersLedger';


//Users
import NewUser from './views/pages/users/NewUser';
import EditProfile from './views/profile/editprofile';


//settings
import CompanyInfo from './views/settings/companyInfo';
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
          <Route path="/master/newsupplier" element={<PrivateRoute element={<Suppliers />} />} />
          <Route path="/master/newcustomer" element={<PrivateRoute element={<Customers />} />} />
          <Route path="/master/newcategory" element={<PrivateRoute element={<Categories />} />} />
          <Route path="/master/newsubcategory" element={<PrivateRoute element={<SubCategories />} />} />
          <Route path="/master/table" element={<PrivateRoute element={<TableList />} />} />
          <Route path="/master/paymentoptions" element={<PrivateRoute element={<PaymentOptions />} />} />

          <Route path="/inventory/newitem" element={<PrivateRoute element={<NewItem />} />} />
          <Route path="/inventory/newstock" element={<PrivateRoute element={<NewStock />} />} />
          <Route path="/inventory/edititem/:id" element={<PrivateRoute element={<EditItem />} />} />
          <Route path="/inventory/newproduct" element={<PrivateRoute element={<NewProduct />} />} />
          <Route path="/inventory/stockreports" element={<PrivateRoute element={<StockReport />} />} />
         
          <Route path="/sale/pos" element={<PrivateRoute element={<NewPOS />} />} />

          <Route path="/expenses/suppliersexpenses" element={<PrivateRoute element={<SupplierLedgerEntry />} />} />
         
          
         
         
          <Route path="/dashboard/admin" element={<PrivateRoute element={<Dashboard />} />} />
          <Route path="/users/newuser" element={<PrivateRoute element={<NewUser />} />} />
          <Route path="/users/editprofile" element={<PrivateRoute element={<EditProfile />} />} />

          {/* Vouchers */}
          <Route path="/vouchers/recieptvoucher" element={<PrivateRoute element={<Vouchers />} />} />
          <Route path="/vouchers/paymentvoucher" element={<PrivateRoute element={<PaymentVouchers />} />} />

 {/* Reports */}
          <Route path="/reports/billhistory" element={<PrivateRoute element={<BillHistory />} />} />
          <Route path="/reports/saleledger" element={<PrivateRoute element={<SaleLedger />} />} />
          <Route path="/reports/supplierledger" element={<PrivateRoute element={<SupplierLedger />} />} />
         
         {/* Settings */}
         <Route path='/setting/companyinfo' element={< CompanyInfo />} />
         <Route path='/setting/taxes' element={< Taxes />} />
          <Route path='/setting/units' element={< Units />} />
          {/* <Route path='/users/newuser' element={< NewUser />} /> */}
        
         


        </Routes>
      </Router>

    </>
  );
}

export default App;
