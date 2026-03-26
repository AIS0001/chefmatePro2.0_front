import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import React, { useState } from 'react'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import useAutoLogout from './hooks/useAutoLogout'
// 🚨 SUBSCRIPTION SYSTEM DISABLED 🚨
// import { SubscriptionProvider, FeatureProtectedRoute } from './lib/subscription-system'
import Dashboard from "./views/dashboard/dashboard";
import CashierDashboard from "./views/dashboard/cashierDashboard";
import AccountDashboard from "./views/dashboard/accountDashboard";
import AnalyticsDashboard from "./views/dashboard/analyticsDashboard";

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
import NewStockAntDesign from './views/inventory/newStockAntDesign';
import EditItem from './views/inventory/editItem';
import NewProduct from './views/inventory/newProduct1';
import StockReport from './views/inventory/stockReport';
import StockReportsAnt from './views/inventory/stockReportsAnt';


import AdvanceOrder from './views/pos/advanceorder';
import AdvanceOrdergstt from './views/pos/advanceOrderPosgst';
import NewPOS from './views/pos/newPOS';
import NewPOSAnt from './views/pos/newPOSAnt';
import NewPOSGST from './views/pos/posGst';
import NewSale from './views/pos/sale';
import vatSale from './views/pos/vatsale';
import Quotation from './views/pos/quotation';
import QuotationHistory from './views/pos/quotationHistory';
import Kiosk from './views/pos/Kiosk';
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
import ItemWiseSummaryVat from './views/reports/itemWiseSummaryVat';
import SaleLedger from './views/reports/saleLedger';
import SupplierLedger from './views/reports/suppliersLedger';
import LowStockItems from './views/reports/lowStockItems';
import DayClose from './views/reports/DayClose';
import BillEditLogs from './views/reports/BillEditLogs';
import DayWiseReports from './views/reports/DayWiseReports';
import CashDrawer from './views/reports/CashDrawer';
import LoginAttempts from './views/reports/loginAttempts';


//Users
import NewUser from './views/pages/users/NewUser';
import EditProfile from './views/profile/editprofile';

// Customer Display
import CustomerDisplay from './components/CustomerDisplay/CustomerDisplay';
import SaleCustomerDisplay from './components/CustomerDisplay/SaleCustomerDisplay';

//Pages
// 🚨 SUBSCRIPTION IMPORTS DISABLED 🚨
// import Subscription from './views/pages/Subscription';
// import { SubscriptionDemo } from './lib/subscription-system'
// import SubscriptionDebug from './lib/subscription-system/demo/SubscriptionDebug';
import Layout from './layout/Layout';

//settings
import CompanyInfo from './views/settings/companyInfo';
import CoreSetting from './views/settings/coreSetting';
import MenuPermissions from './views/settings/menuPermissions';
import PrintSetting from './views/settings/printSetting';
import PrinterConfiguration from './views/settings/printerConfiguration';
import DeviceManagement from './views/settings/deviceManagement';
import DeviceAuthSettings from './views/settings/deviceAuthSettings';
import DeviceUuidManagement from './views/settings/deviceUuidManagement';
import Taxes from './views/master/taxes';
import Units from './views/master/units';

// Public Pages
import BoardingPass from './views/public/BoardingPass';
import PublicAccess from './views/public/PublicAccess';
import VendingMachine from './views/public/VendingMachine';
import { Views } from 'react-big-calendar';

// Super Admin Pages
import LoginSelector from './views/pages/LoginSelector';
import SuperAdminLogin from './views/pages/SuperAdminLogin';
import SuperAdminLayout from './views/superAdmin/SuperAdminLayout';
import SuperAdminDashboard from './views/superAdmin/SuperAdminDashboard';
import ShopsManagement from './views/superAdmin/ShopsManagement';
import BillingManagement from './views/superAdmin/BillingManagement';
import UserManagement from './views/superAdmin/UserManagement';
import AuditLogs from './views/superAdmin/AuditLogs';

// Dummy FeatureProtectedRoute that always returns children
const FeatureProtectedRoute = ({ children }) => children;

// Wrapper component to use useAutoLogout inside Router context
function AppRoutes() {
  // Auto-logout when token expires or user is inactive
  useAutoLogout();
  
  return (
    <Routes>
          <Route path="/" element={<LoginSelector />} />
          <Route path="/login" element={<Login />} />
          <Route path="/superadmin-login" element={<SuperAdminLogin />} />
          <Route path="/logout" element={<Logout />} />
          <Route path="/accessdenied" element={<AccessDenied />} />
          
          {/* Customer Display Route - No authentication required for second screen */}
          <Route path="/customer-display" element={<CustomerDisplay />} />
          <Route path="/sale-customer-display" element={<SaleCustomerDisplay />} />
          
          {/* Public Access Routes - No authentication required */}
          <Route path="/public" element={<PublicAccess />} />
          <Route path="/boarding-pass" element={<BoardingPass />} />
          <Route path="/vending-machine" element={<VendingMachine />} />
          <Route path="/kiosk" element={<Kiosk />} />

          {/* Protected Routes with Feature Control */}
          <Route path="/master/newsupplier" element={
            <FeatureProtectedRoute route="/master/newsupplier">
              <PrivateRoute><Suppliers /></PrivateRoute>
            </FeatureProtectedRoute>
          } />
          <Route path="/master/newcustomer" element={
            <FeatureProtectedRoute route="/master/newcustomer">
              <PrivateRoute><Customers /></PrivateRoute>
            </FeatureProtectedRoute>
          } />
          <Route path="/master/newcategory" element={
            <FeatureProtectedRoute route="/master/newcategory">
              <PrivateRoute><Categories /></PrivateRoute>
            </FeatureProtectedRoute>
          } />
          <Route path="/master/newsubcategory" element={
            <FeatureProtectedRoute route="/master/newsubcategory">
              <PrivateRoute><SubCategories /></PrivateRoute>
            </FeatureProtectedRoute>
          } />
          <Route path="/master/table" element={
            <FeatureProtectedRoute route="/master/table">
              <PrivateRoute><TableList /></PrivateRoute>
            </FeatureProtectedRoute>
          } />
          <Route path="/master/paymentoptions" element={
            <FeatureProtectedRoute route="/master/paymentoptions">
              <PrivateRoute><PaymentOptions /></PrivateRoute>
            </FeatureProtectedRoute>
          } />

          <Route path="/inventory/newitem" element={
            <FeatureProtectedRoute route="/inventory/newitem">
              <PrivateRoute><NewItem /></PrivateRoute>
            </FeatureProtectedRoute>
          } />
          <Route path="/inventory/newstock" element={
            <FeatureProtectedRoute route="/inventory/newstock">
              <PrivateRoute><NewStock /></PrivateRoute>
            </FeatureProtectedRoute>
          } />
          <Route path="/inventory/newstock-ant" element={
            <FeatureProtectedRoute route="/inventory/newstock-ant">
              <PrivateRoute><NewStockAntDesign /></PrivateRoute>
            </FeatureProtectedRoute>
          } />
          <Route path="/inventory/edititem/:id" element={
            <FeatureProtectedRoute route="/inventory/edititem">
              <PrivateRoute><EditItem /></PrivateRoute>
            </FeatureProtectedRoute>
          } />
          <Route path="/inventory/newproduct" element={
            <FeatureProtectedRoute route="/inventory/newproduct">
              <PrivateRoute><NewProduct /></PrivateRoute>
            </FeatureProtectedRoute>
          } />
          <Route path="/inventory/stockreports" element={
            <FeatureProtectedRoute route="/inventory/stockreports">
              <PrivateRoute><StockReport /></PrivateRoute>
            </FeatureProtectedRoute>
          } />
          <Route path="/inventory/stockreports-ant" element={
            <FeatureProtectedRoute route="/inventory/stockreports-ant">
              <PrivateRoute><StockReportsAnt /></PrivateRoute>
            </FeatureProtectedRoute>
          } />
          
          <Route path="/sale/pos" element={
            <FeatureProtectedRoute route="/sale/pos">
              <PrivateRoute><NewPOS /></PrivateRoute>
            </FeatureProtectedRoute>
          } />

          <Route path="/sale/pos-ant" element={
            <FeatureProtectedRoute route="/sale/pos">
              <PrivateRoute><NewPOSAnt /></PrivateRoute>
            </FeatureProtectedRoute>
          } />

          <Route path="/sale/advanceorder" element={
            <FeatureProtectedRoute route="/sale/advanceorder">
              <PrivateRoute><AdvanceOrder /></PrivateRoute>
            </FeatureProtectedRoute>
          } />
          <Route path="/sale/newsale" element={
            <FeatureProtectedRoute route="/sale/newsale">
              <PrivateRoute><NewSale /></PrivateRoute>
            </FeatureProtectedRoute>
          } />
          <Route path="/sale/quotation" element={
            <FeatureProtectedRoute route="/sale/quotation">
              <PrivateRoute><Quotation /></PrivateRoute>
            </FeatureProtectedRoute>
          } />
          <Route path="/quotation" element={
            <FeatureProtectedRoute route="/quotation">
              <PrivateRoute><Quotation /></PrivateRoute>
            </FeatureProtectedRoute>
          } />
          <Route path="/quotation-history" element={
            <FeatureProtectedRoute route="/quotation-history">
              <PrivateRoute><QuotationHistory /></PrivateRoute>
            </FeatureProtectedRoute>
          } />
          <Route path="/sale/vatsale" element={
            <FeatureProtectedRoute route="/sale/vatsale">
              <PrivateRoute><vatSale /></PrivateRoute>
            </FeatureProtectedRoute>
          } />
          <Route path="/sale/advanceordergstt" element={
            <FeatureProtectedRoute route="/sale/advanceordergstt">
              <PrivateRoute><AdvanceOrdergstt /></PrivateRoute>
            </FeatureProtectedRoute>
          } />
          
          <Route path="/sale/posgst" element={
            <FeatureProtectedRoute route="/sale/posgst">
              <PrivateRoute><NewPOSGST /></PrivateRoute>
            </FeatureProtectedRoute>
          } />
          

          <Route path="/expenses/suppliersexpenses" element={
            <FeatureProtectedRoute route="/expenses/suppliersexpenses">
              <PrivateRoute><SupplierLedgerEntry /></PrivateRoute>
            </FeatureProtectedRoute>
          } />

          <Route path="/dashboard/analytics" element={<PrivateRoute><AnalyticsDashboard /></PrivateRoute>} />
          <Route path="/dashboard/cashier" element={<PrivateRoute><CashierDashboard /></PrivateRoute>} />
          <Route path="/dashboard/account" element={<PrivateRoute><AccountDashboard /></PrivateRoute>} />
          <Route path="/dashboard/analytics" element={<PrivateRoute><AnalyticsDashboard /></PrivateRoute>} />
          <Route path="/dashboard/admin" element={<PrivateRoute><AnalyticsDashboard /></PrivateRoute>} />
          <Route path="/dashboard" element={<PrivateRoute><AnalyticsDashboard /></PrivateRoute>} />
        
        
          <Route path="/users/newuser" element={
            <FeatureProtectedRoute route="/users/newuser">
              <PrivateRoute><NewUser /></PrivateRoute>
            </FeatureProtectedRoute>
          } />
          <Route path="/users/editprofile" element={
            <FeatureProtectedRoute route="/users/editprofile">
              <PrivateRoute><EditProfile /></PrivateRoute>
            </FeatureProtectedRoute>
          } />

          {/* Pages */}
          {/* 🚨 SUBSCRIPTION ROUTES DISABLED 🚨 */}
          {/* 
          <Route path="/subscription" element={<Subscription />} />
          <Route path="/demo" element={<SubscriptionDemo Layout={Layout} />} />
          <Route path="/subscription-demo" element={<SubscriptionDemo Layout={Layout} />} />
          <Route path="/subscription-debug" element={<SubscriptionDebug />} />
          <Route path="/subscription-test" element={<SubscriptionDebug />} />
          */}

          {/* Vouchers */}
          <Route path="/vouchers/recieptvoucher" element={
            <FeatureProtectedRoute route="/vouchers/recieptvoucher">
              <PrivateRoute><Vouchers /></PrivateRoute>
            </FeatureProtectedRoute>
          } />
          <Route path="/vouchers/paymentvoucher" element={
            <FeatureProtectedRoute route="/vouchers/paymentvoucher">
              <PrivateRoute><PaymentVouchers /></PrivateRoute>
            </FeatureProtectedRoute>
          } />

          {/* Reports */}
          <Route path="/reports/billhistory" element={
            <FeatureProtectedRoute route="/reports/billhistory">
              <PrivateRoute><BillHistory /></PrivateRoute>
            </FeatureProtectedRoute>
          } />
          <Route path="/reports/dayclose" element={
            <FeatureProtectedRoute route="/reports/dayclose">
              <PrivateRoute><DayClose /></PrivateRoute>
            </FeatureProtectedRoute>
          } />
          <Route path="/reports/cashdrawer" element={
            <FeatureProtectedRoute route="/reports/cashdrawer">
              <PrivateRoute><CashDrawer /></PrivateRoute>
            </FeatureProtectedRoute>
          } />
          <Route path="/reports/daywise" element={
            <FeatureProtectedRoute route="/reports/daywise">
              <PrivateRoute><DayWiseReports /></PrivateRoute>
            </FeatureProtectedRoute>
          } />
          <Route path="/reports/lowstockitems" element={
            <FeatureProtectedRoute route="/reports/lowstockitems">
              <PrivateRoute><LowStockItems /></PrivateRoute>
            </FeatureProtectedRoute>
          } />
          <Route path="/reports/saleledger" element={
            <FeatureProtectedRoute route="/reports/saleledger">
              <PrivateRoute><SaleLedger /></PrivateRoute>
            </FeatureProtectedRoute>
          } />
          <Route path="/reports/supplierledger" element={
            <FeatureProtectedRoute route="/reports/supplierledger">
              <PrivateRoute><SupplierLedger /></PrivateRoute>
            </FeatureProtectedRoute>
          } />

           <Route path="/reports/advanceorderreportgst" element={
            <FeatureProtectedRoute route="/reports/advanceorderreportgst">
              <PrivateRoute><AdvanceOrdergst /></PrivateRoute>
            </FeatureProtectedRoute>
           } />
           <Route path="/reports/advanceorderreport" element={
            <FeatureProtectedRoute route="/reports/advanceorderreport">
              <PrivateRoute><AdvanceOrderReport /></PrivateRoute>
            </FeatureProtectedRoute>
           } />
           <Route path="/reports/billhistorygst" element={
            <FeatureProtectedRoute route="/reports/billhistorygst">
              <PrivateRoute><BillHistoryGst /></PrivateRoute>
            </FeatureProtectedRoute>
           } />
          <Route path="/reports/itemwisesale" element={
            <FeatureProtectedRoute route="/reports/itemwisesale">
              <PrivateRoute><ItemWiseSaleGst /></PrivateRoute>
            </FeatureProtectedRoute>
          } />
          <Route path="/reports/itemwisesalegst" element={
            <FeatureProtectedRoute route="/reports/itemwisesalegst">
              <PrivateRoute><ItemWiseSaleGst /></PrivateRoute>
            </FeatureProtectedRoute>
          } />
          <Route path="/reports/itemwisesummaryvat" element={
            <FeatureProtectedRoute route="/reports/itemwisesummaryvat">
              <PrivateRoute><ItemWiseSummaryVat /></PrivateRoute>
            </FeatureProtectedRoute>
          } />
          <Route path="/reports/billeditlogs" element={
            <FeatureProtectedRoute route="/reports/billeditlogs">
              <PrivateRoute><BillEditLogs /></PrivateRoute>
            </FeatureProtectedRoute>
          } />

          {/* Settings - Feature Protected */}
          <Route path="/setting/companyinfo" element={
            <FeatureProtectedRoute route="/setting/companyinfo">
              <CompanyInfo />
            </FeatureProtectedRoute>
          } />
          <Route path="/setting/coresetting" element={
            <FeatureProtectedRoute route="/setting/coresetting">
              <CoreSetting />
            </FeatureProtectedRoute>
          } />
          <Route path="/setting/taxes" element={
            <FeatureProtectedRoute route="/setting/taxes">
              <Taxes />
            </FeatureProtectedRoute>
          } />
          <Route path="/setting/units" element={
            <FeatureProtectedRoute route="/setting/units">
              <Units />
            </FeatureProtectedRoute>
          } />
          <Route path="/setting/menupermissions" element={
            <FeatureProtectedRoute route="/setting/menupermissions">
              <MenuPermissions />
            </FeatureProtectedRoute>
          } />
          <Route path="/setting/printsetting" element={
            <FeatureProtectedRoute route="/setting/printsetting">
              <PrintSetting />
            </FeatureProtectedRoute>
          } />
          <Route path="/setting/printerconfiguration" element={
            <FeatureProtectedRoute route="/setting/printerconfiguration">
              <PrinterConfiguration />
            </FeatureProtectedRoute>
          } />
          <Route path="/setting/devicemanagement" element={
            <FeatureProtectedRoute route="/setting/devicemanagement">
              <DeviceManagement />
            </FeatureProtectedRoute>
          } />
          <Route path="/setting/deviceauthsettings" element={
            <FeatureProtectedRoute route="/setting/deviceauthsettings">
              <DeviceAuthSettings />
            </FeatureProtectedRoute>
          } />
          <Route path="/setting/deviceuuidmanagement" element={
            <FeatureProtectedRoute route="/setting/deviceuuidmanagement">
              <PrivateRoute><DeviceUuidManagement /></PrivateRoute>
            </FeatureProtectedRoute>
          } />
          <Route path="/reports/loginattempts" element={
            <FeatureProtectedRoute route="/reports/loginattempts">
              <PrivateRoute><LoginAttempts /></PrivateRoute>
            </FeatureProtectedRoute>
          } />

          {/* Super Admin Routes - Nested under SuperAdminLayout */}
          <Route path="/superadmin" element={
            <PrivateRoute><SuperAdminLayout /></PrivateRoute>
          }>
            <Route index element={<SuperAdminDashboard />} />
            <Route path="dashboard" element={<SuperAdminDashboard />} />
            <Route path="shops" element={<ShopsManagement />} />
            <Route path="billing" element={<BillingManagement />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="audit-logs" element={<AuditLogs />} />
          </Route>
        </Routes>
  );
}

function App() {
  return (
    // 🚨 SUBSCRIPTION PROVIDER DISABLED 🚨
    // <SubscriptionProvider>
      <Router>
        <ToastContainer />
        <AppRoutes />
      </Router>
    // </SubscriptionProvider>
  );
}

export default App;
