// Dashboard.js
import React, { useEffect, useState } from 'react';
import API from '../utils/api';
import './Dashboard.css';
import bannerImg from "../assest/banner.webp";

function Dashboard() {
  const [stats, setStats] = useState([
    { id: 1, title: 'Total Users', value: 'Loading...', icon: 'fas fa-users', trend: '', color: 'purple' },
    { id: 2, title: 'Total Products', value: 'Loading...', icon: 'fas fa-box-open', trend: '', color: 'blue' },
    { id: 3, title: 'Low Stock Items', value: 'Loading...', icon: 'fas fa-exclamation-triangle', trend: '', color: 'orange' },
    { id: 4, title: 'New Today', value: 'Loading...', icon: 'fas fa-star', trend: '', color: 'green' }
  ]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [usersRes, productsRes, lowStockRes, todayProductsRes] = await Promise.all([
          API.get('/users'),
          API.get('/products'),
          API.get('/products/low-stock'),
          API.get('/products?dateFilter=today')
        ]);

        setStats([
          { 
            id: 1, 
            title: 'Total Users', 
            value: usersRes.data.length, 
            icon: 'fas fa-users', 
            trend: '+5%',
            color: 'purple'
          },
          { 
            id: 2, 
            title: 'Total Products', 
            value: productsRes.data.length, 
            icon: 'fas fa-box-open', 
            trend: '+8%',
            color: 'blue'
          },
          { 
            id: 3, 
            title: 'Low Stock Items', 
            value: lowStockRes.data.length, 
            icon: 'fas fa-exclamation-triangle', 
            trend: lowStockRes.data.length > 5 ? '❗High' : 'Normal',
            color: 'orange'
          },
          { 
            id: 4, 
            title: 'New Today', 
            value: todayProductsRes.data.length, 
            icon: 'fas fa-star', 
            trend: todayProductsRes.data.length > 0 ? `+${todayProductsRes.data.length}` : 'None',
            color: 'green'
          }
        ]);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Dashboard Overview</h1>
        <div className="search-container">
          <input type="text" placeholder="Search products, users..." className="search-input" />
          <button className="search-btn">
            <i className="fas fa-search"></i>
          </button>
        </div>
      </header>

      <div className="stats-grid">
        {stats.map(stat => (
          <div className={`stat-card ${stat.color} ${stat.id === 3 && stat.value > 5 ? 'warning' : ''}`} key={stat.id}>
            <div className="stat-icon">
              <i className={stat.icon}></i>
            </div>
            <div className="stat-content">
              <h3>{stat.title}</h3>
              <p className="stat-value">{stat.value}</p>
              <p className={`stat-trend ${stat.trend.includes('+') ? 'positive' : stat.trend.includes('-') ? 'negative' : ''}`}>
                {stat.trend}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="banner-container">
        <img 
          src={bannerImg}
          alt="Dashboard Banner" 
          className="dashboard-banner"
        />
      </div>
    </div>
  );
}

export default Dashboard;