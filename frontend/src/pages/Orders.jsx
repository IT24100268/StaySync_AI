import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const { data } = await api.get('/orders/');
      setOrders(data.results || data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'delivered': return '#2e7d32';
      case 'on_the_way': return '#1b5e20';
      case 'preparing': return '#f57c00';
      default: return '#757575';
    }
  };

  return (
    <div style={styles.container}>
      <h1>My Orders</h1>
      {orders.length === 0 ? (
        <p>No orders yet.</p>
      ) : (
        <div style={styles.list}>
          {orders.map((order) => (
            <div key={order.id} style={styles.card}>
              <div style={styles.header}>
                <h3>Order #{order.id}</h3>
                <span style={{ ...styles.status, background: getStatusColor(order.status) }}>
                  {order.status.replace('_', ' ').toUpperCase()}
                </span>
              </div>
              <p><strong>Restaurant:</strong> {order.restaurant.name}</p>
              <p><strong>Total:</strong> ${order.total_price}</p>
              <p><strong>Items:</strong> {order.items.length}</p>
              <p><strong>Ordered:</strong> {new Date(order.created_at).toLocaleString()}</p>
              {order.status === 'on_the_way' && (
                <button onClick={() => navigate(`/tracking/${order.id}`)} style={styles.trackButton}>
                  Track Order
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const styles = {
  container: { maxWidth: '900px', margin: '2rem auto', padding: '0 1rem' },
  list: { display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '2rem' },
  card: { background: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', border: '2px solid #e8f5e9' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' },
  status: { padding: '0.5rem 1rem', color: 'white', borderRadius: '4px', fontSize: '0.9rem' },
  trackButton: { marginTop: '1rem', padding: '0.5rem 1rem', background: '#2e7d32', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' },
};

export default Orders;
