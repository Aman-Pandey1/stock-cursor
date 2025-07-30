import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import '../pages/Dashboard.css'; // existing CSS

const Sidebar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Clear token or user data from storage
    localStorage.removeItem('token'); // or whatever you stored
    sessionStorage.clear(); // if you're using sessionStorage

    // Navigate to login page
    navigate('/login');
  };

  return (
    <div className="sidebar">
      <h2 className="logo">Shree Balaji Traders</h2>
      <nav className="sidebar-nav">
        <NavLink to="/dashboard" className="nav-link">Dashboard</NavLink>
        <NavLink to="/add-product" className="nav-link">Add Product</NavLink>
        <NavLink to="/product-list" className="nav-link">Product List</NavLink>
        <NavLink to="/admins" className="nav-link">Admin List</NavLink>
           <NavLink to="/signup" className="nav-link">Create User</NavLink>

        {/* 🔴 Logout Button */}
       <button onClick={handleLogout} className="nav-link logout-button">
  Logout
</button>

      </nav>
    </div>
  );
};

export default Sidebar;
