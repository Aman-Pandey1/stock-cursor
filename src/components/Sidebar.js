// Sidebar.js
import React, { useRef, useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import './Sidebar.css';
import '../pages/Dashboard.css';

const Sidebar = () => {
  const navigate = useNavigate();
  const sidebarRef = useRef(null);
  const navRef = useRef(null);
  const [showScrollIndicator, setShowScrollIndicator] = useState(false);

  useEffect(() => {
    const checkScroll = () => {
      if (navRef.current && window.innerWidth <= 768) {
        const hasOverflow = navRef.current.scrollWidth > navRef.current.clientWidth;
        setShowScrollIndicator(hasOverflow);
      } else {
        setShowScrollIndicator(false);
      }
    };

    checkScroll();
    
    const resizeObserver = new ResizeObserver(checkScroll);
    if (navRef.current) {
      resizeObserver.observe(navRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    sessionStorage.clear();
    navigate('/login');
  };

  return (
    <div className="sidebar" ref={sidebarRef}>
      <div className="sidebar-header">
        <h2 className="logo">Shree Balaji Traders</h2>
        <div className="logo-subtitle">Inventory Management</div>
      </div>
      <nav className="sidebar-nav" ref={navRef}>
        <NavLink to="/dashboard" className="nav-link" activeClassName="active">
          <i className="fas fa-tachometer-alt"></i> Dashboard
        </NavLink>
        <NavLink to="/add-product" className="nav-link" activeClassName="active">
          <i className="fas fa-plus-circle"></i> Add Product
        </NavLink>
        <NavLink to="/product-list" className="nav-link" activeClassName="active">
          <i className="fas fa-boxes"></i> Product List
        </NavLink>
        <NavLink to="/admins" className="nav-link" activeClassName="active">
          <i className="fas fa-users-cog"></i> Admin List
        </NavLink>
        <NavLink to="/signup" className="nav-link" activeClassName="active">
          <i className="fas fa-user-plus"></i> Create User
        </NavLink>
   
<NavLink to="/reduce-stock" className="nav-link" activeClassName="active">
  <i className="fas fa-minus-circle"></i> Reduce Stock
</NavLink>

      </nav>
      {showScrollIndicator && (
        <div className="scroll-indicator">
          <i className="fas fa-chevron-right"></i>
        </div>
      )}
      <button onClick={handleLogout} className="logout-btn">
        <i className="fas fa-sign-out-alt"></i> Logout
      </button>
    </div>
  );
};

export default Sidebar;