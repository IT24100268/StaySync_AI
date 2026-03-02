import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const DeliveryDashboard = () => {
  const { user } = useAuth();

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Delivery Partner Dashboard</h1>
        <p style={styles.subtitle}>Welcome, {user?.username}!</p>
      </div>
      
      <div style={styles.grid}>
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Today's Deliveries</h3>
          <p style={styles.cardValue}>0</p>
        </div>
        
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Total Earnings</h3>
          <p style={styles.cardValue}>LKR 0</p>
        </div>
        
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Available Jobs</h3>
          <p style={styles.cardValue}>0</p>
        </div>
        
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Status</h3>
          <p style={styles.cardValue}>Active</p>
        </div>
      </div>
      
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Recent Deliveries</h2>
        <p style={styles.emptyText}>No deliveries yet</p>
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: '40px',
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  },
  header: {
    marginBottom: '40px',
    color: 'white',
  },
  title: {
    fontSize: '36px',
    fontWeight: 'bold',
    margin: 0,
  },
  subtitle: {
    fontSize: '18px',
    marginTop: '10px',
    opacity: 0.9,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
    marginBottom: '40px',
  },
  card: {
    background: 'rgba(255,255,255,0.95)',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
  },
  cardTitle: {
    fontSize: '14px',
    color: '#666',
    margin: '0 0 12px 0',
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  cardValue: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#333',
    margin: 0,
  },
  section: {
    background: 'rgba(255,255,255,0.95)',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
  },
  sectionTitle: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#333',
    marginTop: 0,
  },
  emptyText: {
    color: '#999',
    fontSize: '16px',
  },
};

export default DeliveryDashboard;
