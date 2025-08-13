// src/App.js
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import DashboardLayout from './pages/DashboardLayout';
import Dashboard from './pages/Dashboard';
import AddProduct from './pages/AddProduct';
import ProductList from './components/ProductList';
import AdminList from './pages/AdminList';
import Login from './auth/Login';
import EditProduct from './components/EditProduct';
import ProtectedRoute from './auth/ProtectedRoute';
import Register from './auth/Register';
import ForgotPassword from './auth/ForgotPassword';
import AlertNotification from './components/AlertNotification';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import StockOutflow from './components/StockOutflow';

function App() {
  return (

    <BrowserRouter>
      <div className="app">
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          
          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<DashboardLayout />}>
              <Route path="dashboard" element={<Dashboard/>} />
              <Route path="add-product" element={<AddProduct />} />
              <Route path="product-list" element={<ProductList />} />
              <Route path="admins" element={<AdminList />} />
              <Route path="edit-product/:id" element={<EditProduct />} />
              <Route path="/reduce-stock" element={<StockOutflow/>} />
            </Route>
          </Route>
        </Routes>

        {/* Notification system (should be outside Routes) */}
        <AlertNotification />
        <ToastContainer position="top-right" autoClose={5000} />
      </div>
    </BrowserRouter> 
     );
}

export default App;