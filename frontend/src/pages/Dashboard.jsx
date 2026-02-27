import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { user } = useAuth();

  return (
    <div style={styles.container}>
      <h1>Welcome, {user?.first_name}!</h1>
      <div style={styles.grid}>
        <div style={styles.card}>
          <h3>Find Rooms</h3>
          <p>Search for available rooms near your university</p>
          <a href="/rooms" style={styles.link}>Browse Rooms</a>
        </div>
        <div style={styles.card}>
          <h3>Order Food</h3>
          <p>Discover restaurants and order your favorite meals</p>
          <a href="/restaurants" style={styles.link}>View Restaurants</a>
        </div>
        <div style={styles.card}>
          <h3>My Bookings</h3>
          <p>Track your room booking requests</p>
          <a href="/bookings" style={styles.link}>View Bookings</a>
        </div>
        <div style={styles.card}>
          <h3>Order History</h3>
          <p>Check your past and current orders</p>
          <a href="/orders" style={styles.link}>View Orders</a>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: { maxWidth: '1200px', margin: '2rem auto', padding: '0 1rem' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginTop: '2rem' },
  card: { background: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', border: '2px solid #e8f5e9' },
  link: { display: 'inline-block', marginTop: '1rem', padding: '0.5rem 1rem', background: '#2e7d32', color: 'white', textDecoration: 'none', borderRadius: '4px', fontWeight: 'bold' },
};

export default Dashboard;
