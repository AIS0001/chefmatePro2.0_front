import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import React, { useState } from 'react'
import Dashboard from "./views/dashboard/dashboard";
import CashierDashboard from "./views/dashboard/cashierDashboard";
import AccoiuntDashboard from "./views/dashboard/dashboardAccount";

import AccessDenied from "./views/pages/accessDenied";

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


import AdvanceOrder from './views/pos/advanceorder';
import AdvanceOrdergstt from './views/pos/advanceOrderPosgst';
import NewPOS from './views/pos/newPOS';
import NewPOSGST from './views/pos/posGst';
import NewSale from './views/pos/sale';
import vatSale from './views/pos/vatsale';
//expenses
import SupplierLedgerEntry from './views/expenses/supplierLedgerEntry';

//Vouchers
import Vouchers from './views/vouchers/vouchers';
import PaymentVouchers from './views/vouchers/paymentVouchers';
//Reports
import BillHistory from './views/reports/billHistory';
import BillHistoryGst from './views/reports/billHistorygst';
import AdvanceOrdergst from './views/reports/advanceOrdergst';
import AdvanceOrderReport from './views/reports/advanceorderReports';
import ItemWiseSaleGst from './views/reports/itemWiseSaleGst';
import SaleLedger from './views/reports/saleLedger';
import SupplierLedger from './views/reports/suppliersLedger';


//Users
import NewUser from './views/pages/users/NewUser';
import EditProfile from './views/profile/editprofile';


//settings
import CompanyInfo from './views/settings/companyInfo';
import CoreSetting from './views/settings/coreSetting';
import Taxes from './views/master/taxes';
import Units from './views/master/units';
import { Views } from 'react-big-calendar';


function App() {
  return (
    <>

      <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/logout" element={<Logout />} />
          <Route path="/accessdenied" element={<AccessDenied />} />

          {/* Protected Routes */}
          <Route path="/master/newsupplier" element={<PrivateRoute><Suppliers /></PrivateRoute>} />
          <Route path="/master/newcustomer" element={<PrivateRoute><Customers /></PrivateRoute>} />
          <Route path="/master/newcategory" element={<PrivateRoute><Categories /></PrivateRoute>} />
          <Route path="/master/newsubcategory" element={<PrivateRoute><SubCategories /></PrivateRoute>} />
          <Route path="/master/table" element={<PrivateRoute><TableList /></PrivateRoute>} />
          <Route path="/master/paymentoptions" element={<PrivateRoute><PaymentOptions /></PrivateRoute>} />

          <Route path="/inventory/newitem" element={<PrivateRoute><NewItem /></PrivateRoute>} />
          <Route path="/inventory/newstock" element={<PrivateRoute><NewStock /></PrivateRoute>} />
          <Route path="/inventory/edititem/:id" element={<PrivateRoute><EditItem /></PrivateRoute>} />
          <Route path="/inventory/newproduct" element={<PrivateRoute><NewProduct /></PrivateRoute>} />
          <Route path="/inventory/stockreports" element={<PrivateRoute><StockReport /></PrivateRoute>} />

          
          <Route path="/sale/pos" element={<PrivateRoute><NewPOS /></PrivateRoute>} />
          <Route path="/sale/advanceorder" element={<PrivateRoute><AdvanceOrder /></PrivateRoute>} />
          <Route path="/sale/newsale" element={<PrivateRoute><NewSale /></PrivateRoute>} />
          <Route path="/sale/vatsale" element={<PrivateRoute><vatSale /></PrivateRoute>} />
          <Route path="/sale/advanceordergstt" element={<PrivateRoute><AdvanceOrdergstt /></PrivateRoute>} />
          
          <Route path="/sale/posgst" element={<PrivateRoute><NewPOSGST /></PrivateRoute>} />
          

          <Route path="/expenses/suppliersexpenses" element={<PrivateRoute><SupplierLedgerEntry /></PrivateRoute>} />

          <Route path="/dashboard/admin" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/dashboard/cashier" element={<PrivateRoute><CashierDashboard /></PrivateRoute>} />
          <Route path="/dashboard/account" element={<PrivateRoute><AccoiuntDashboard /></PrivateRoute>} />
        
        
          <Route path="/users/newuser" element={<PrivateRoute><NewUser /></PrivateRoute>} />
          <Route path="/users/editprofile" element={<PrivateRoute><EditProfile /></PrivateRoute>} />

          {/* Vouchers */}
          <Route path="/vouchers/recieptvoucher" element={<PrivateRoute><Vouchers /></PrivateRoute>} />
          <Route path="/vouchers/paymentvoucher" element={<PrivateRoute><PaymentVouchers /></PrivateRoute>} />

          {/* Reports */}
          <Route path="/reports/billhistory" element={<PrivateRoute><BillHistory /></PrivateRoute>} />
         
          <Route path="/reports/saleledger" element={<PrivateRoute><SaleLedger /></PrivateRoute>} />
          <Route path="/reports/supplierledger" element={<PrivateRoute><SupplierLedger /></PrivateRoute>} />

           <Route path="/reports/advanceorderreportgst" element={<PrivateRoute><AdvanceOrdergst /></PrivateRoute>} />
           <Route path="/reports/advanceorderreport" element={<PrivateRoute><AdvanceOrderReport /></PrivateRoute>} />
           <Route path="/reports/billhistorygst" element={<PrivateRoute><BillHistoryGst /></PrivateRoute>} />
          <Route path="/reports/itemwisesale" element={<PrivateRoute><ItemWiseSaleGst /></PrivateRoute>} />
          <Route path="/reports/itemwisesalegst" element={<PrivateRoute><ItemWiseSaleGst /></PrivateRoute>} />

          {/* Settings - Unprotected (or protect if needed) */}
          <Route path="/setting/companyinfo" element={<CompanyInfo />} />
          <Route path="/setting/coresetting" element={<CoreSetting />} />
          <Route path="/setting/taxes" element={<Taxes />} />
          <Route path="/setting/units" element={<Units />} />
        </Routes>
      </Router>


    </>
  );
}

export default App;
