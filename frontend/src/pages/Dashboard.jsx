import React, { useState, useEffect } from 'react';
import { analyticsService } from '../services/analyticsService';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await analyticsService.getDashboardStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="dashboard">
      <h1>Dashboard</h1>
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Listings</h3>
          <p>{stats?.total_listings || 0}</p>
        </div>
        <div className="stat-card">
          <h3>Total Views</h3>
          <p>{stats?.total_views || 0}</p>
        </div>
        <div className="stat-card">
          <h3>Total Enquiries</h3>
          <p>{stats?.total_enquiries || 0}</p>
        </div>
        <div className="stat-card">
          <h3>Pending Enquiries</h3>
          <p>{stats?.pending_enquiries || 0}</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
