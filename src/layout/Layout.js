import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';
import '../styles/layout.css';
import AlertNotification from '../components/AlertNotification';

const Layout = () => {
  return (
    <div className="app-container">
      <Header />
      <div className="main-content">
        <Sidebar />
        <div className="content-area">
          <Outlet />
        </div>
         <div className="app">
      {/* Your other components */}
      <AlertNotification />
    </div>
      </div>
      <Footer />
    </div>
  );
};

export default Layout;