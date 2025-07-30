import React, { useEffect, useState } from 'react';
import API from '../utils/api';
import './Dashboard.css';
import img from "../assest/banner.webp"

function Dashboard() {
  const [stats, setStats] = useState([
    { id: 1, title: 'Total Users', value: 'Loading...', icon: '👥', trend: '' },
    { id: 2, title: 'Total Products', value: 'Loading...', icon: '📦', trend: '' },
    { id: 3, title: 'Low Stock Items', value: 'Loading...', icon: '⚠️', trend: '' },
    { id: 4, title: 'New Today', value: 'Loading...', icon: '🆕', trend: '' }
  ]);

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch all data in parallel
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
            icon: '👥', 
            trend: '+5%' 
          },
          { 
            id: 2, 
            title: 'Total Products', 
            value: productsRes.data.length, 
            icon: '📦', 
            trend: '+8%' 
          },
          { 
            id: 3, 
            title: 'Low Stock Items', 
            value: lowStockRes.data.length, 
            icon: '⚠️', 
            trend: lowStockRes.data.length > 5 ? '❗High' : 'Normal' 
          },
          { 
            id: 4, 
            title: 'New Today', 
            value: todayProductsRes.data.length, 
            icon: '🆕', 
            trend: todayProductsRes.data.length > 0 ? `+${todayProductsRes.data.length}` : 'None' 
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
        <div className="search-bar">
          <input type="text" placeholder="Search products, users..." />
          <button className="search-btn">
            <i className="fas fa-search"></i>
          </button>
        </div>
      </header>

      <div className="stats-container">
        {stats.map(stat => (
          <div className={`stat-card ${stat.id === 3 && stat.value > 5 ? 'warning' : ''}`} key={stat.id}>
            <div className="stat-icon">{stat.icon}</div>
            <div className="stat-info">
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
          src={img}
          alt="Dashboard Banner" 
          className="dashboard-banner"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = '../assest/banner.webp';
          }}
        />
      </div>
    </div>
  );
}

export default Dashboard;