import React, { useState, useEffect } from 'react';
import { dashboardAPI, roomsAPI, restaurantsAPI, ordersAPI, deliveryAPI, usersAPI } from '../services/api';
import './Reports.css';

const Reports = () => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    try {
      const [users, rooms, restaurants, orders, deliveries] = await Promise.all([
        usersAPI.getUsers(),
        roomsAPI.getRooms(),
        restaurantsAPI.getRestaurants(),
        ordersAPI.getOrders(),
        deliveryAPI.getDeliveryPartners()
      ]);

      const activeDeliveries = orders.data.filter((order) => 
        ['confirmed', 'preparing', 'ready', 'picked_up'].includes(order.status)
      ).length;

      setReportData({
        totalUsers: users.data.length,
        totalRooms: rooms.data.length,
        totalRestaurants: restaurants.data.length,
        totalOrders: orders.data.length,
        activeDeliveries
      });
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="reports-page">
      <h1>Reports & Analytics</h1>
      
      <div className="reports-grid">
        <div className="report-card">
          <div className="report-icon">👥</div>
          <div className="report-info">
            <h3>{reportData?.totalUsers || 0}</h3>
            <p>Total Users</p>
            <span className="report-trend positive">+12% from last month</span>
          </div>
        </div>
        
        <div className="report-card">
          <div className="report-icon">🏠</div>
          <div className="report-info">
            <h3>{reportData?.totalRooms || 0}</h3>
            <p>Total Rooms</p>
            <span className="report-trend positive">+8% from last month</span>
          </div>
        </div>
        
        <div className="report-card">
          <div className="report-icon">🍽️</div>
          <div className="report-info">
            <h3>{reportData?.totalRestaurants || 0}</h3>
            <p>Total Restaurants</p>
            <span className="report-trend positive">+15% from last month</span>
          </div>
        </div>
        
        <div className="report-card">
          <div className="report-icon">📦</div>
          <div className="report-info">
            <h3>{reportData?.totalOrders || 0}</h3>
            <p>Total Orders</p>
            <span className="report-trend positive">+25% from last month</span>
          </div>
        </div>
        
        <div className="report-card">
          <div className="report-icon">🚚</div>
          <div className="report-info">
            <h3>{reportData?.activeDeliveries || 0}</h3>
            <p>Active Deliveries</p>
            <span className="report-trend neutral">Real-time</span>
          </div>
        </div>
      </div>
      
      <div className="charts-section">
        <div className="chart-placeholder">
          <h3>Revenue Analytics</h3>
          <p>Chart visualization would be implemented here with a charting library like Chart.js or Recharts</p>
        </div>
        
        <div className="chart-placeholder">
          <h3>User Growth</h3>
          <p>User registration trends over time would be displayed here</p>
        </div>
      </div>
    </div>
  );
};

export default Reports;