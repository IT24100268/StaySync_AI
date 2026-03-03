import React, { useState, useEffect } from 'react';
import { dashboardAPI } from '../services/api';
import './Dashboard.css';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await dashboardAPI.getStats();
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="dashboard">
      <h1>Dashboard</h1>
      <div className="stats-grid">
        <div className="stat-card pending">
          <div className="stat-icon">🏠</div>
          <div className="stat-info">
            <h3>{stats?.pending_rooms || 0}</h3>
            <p>Pending Rooms</p>
          </div>
        </div>
        
        <div className="stat-card pending">
          <div className="stat-icon">🍽️</div>
          <div className="stat-info">
            <h3>{stats?.pending_restaurants || 0}</h3>
            <p>Pending Restaurants</p>
          </div>
        </div>
        
        <div className="stat-card pending">
          <div className="stat-icon">🚚</div>
          <div className="stat-info">
            <h3>{stats?.pending_delivery_partners || 0}</h3>
            <p>Pending Delivery Partners</p>
          </div>
        </div>
        
        <div className="stat-card blocked">
          <div className="stat-icon">🚫</div>
          <div className="stat-info">
            <h3>{stats?.blocked_users || 0}</h3>
            <p>Blocked Users</p>
          </div>
        </div>
        
        <div className="stat-card total">
          <div className="stat-icon">📦</div>
          <div className="stat-info">
            <h3>{stats?.total_orders || 0}</h3>
            <p>Total Orders</p>
          </div>
        </div>
        
        <div className="stat-card total">
          <div className="stat-icon">👥</div>
          <div className="stat-info">
            <h3>{stats?.total_users || 0}</h3>
            <p>Total Users</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;