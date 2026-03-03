import React, { useState, useEffect } from 'react';
import { ordersAPI } from '../services/api';
import './Orders.css';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await ordersAPI.getOrders();
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusSteps = (currentStatus) => {
    const steps = ['pending', 'confirmed', 'preparing', 'ready', 'picked_up', 'delivered'];
    const currentIndex = steps.indexOf(currentStatus);
    
    return steps.map((step, index) => ({
      step,
      completed: index <= currentIndex,
      active: index === currentIndex
    }));
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="orders-page">
      <h1>Orders Monitoring</h1>
      
      <div className="orders-grid">
        {orders.map((order) => (
          <div key={order.id} className="order-card">
            <div className="order-header">
              <h3>Order #{order.id}</h3>
              <span className={`status ${order.status}`}>
                {order.status.replace('_', ' ')}
              </span>
            </div>
            
            <div className="order-details">
              <p><strong>Customer:</strong> {order.customer}</p>
              <p><strong>Restaurant:</strong> {order.restaurant}</p>
              <p><strong>Delivery Partner:</strong> {order.delivery_partner || 'Not assigned'}</p>
              <p><strong>Amount:</strong> ${order.total_amount}</p>
              <p><strong>Address:</strong> {order.delivery_address}</p>
              <p><strong>Created:</strong> {new Date(order.created_at).toLocaleString()}</p>
            </div>
            
            <div className="status-timeline">
              <h4>Status Timeline</h4>
              <div className="timeline">
                {getStatusSteps(order.status).map((item, index) => (
                  <div 
                    key={item.step} 
                    className={`timeline-step ${item.completed ? 'completed' : ''} ${item.active ? 'active' : ''}`}
                  >
                    <div className="step-indicator"></div>
                    <span className="step-label">
                      {item.step.replace('_', ' ')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Orders;