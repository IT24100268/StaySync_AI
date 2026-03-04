import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Sidebar.css';

const Sidebar = () => {
  const location = useLocation();

  const menuItems = [
    { path: '/', label: 'Dashboard', icon: '📊' },
    { path: '/rooms', label: 'Rooms Approval', icon: '🏠' },
    { path: '/restaurants', label: 'Restaurants', icon: '🍽️' },
    { path: '/delivery', label: 'Delivery Partners', icon: '🚚' },
    { path: '/users', label: 'Users Management', icon: '👥' },
    { path: '/orders', label: 'Orders', icon: '📦' },
    { path: '/reports', label: 'Reports', icon: '📈' },
  ];

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2>StaySync AI</h2>
        <p>Admin Panel</p>
      </div>
      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;