import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <nav style={styles.nav}>
      <div style={styles.container}>
        <Link to="/" style={styles.brand}>Student Dashboard</Link>
        <div style={styles.links}>
          <Link to="/" style={styles.link}>Home</Link>
          <Link to="/rooms" style={styles.link}>Rooms</Link>
          <Link to="/favorites" style={styles.link}>Favorites</Link>
          <Link to="/bookings" style={styles.link}>Bookings</Link>
          <Link to="/restaurants" style={styles.link}>Restaurants</Link>
          <Link to="/orders" style={styles.link}>Orders</Link>
          <Link to="/profile" style={styles.link}>Profile</Link>
          <button onClick={handleLogout} style={styles.button}>Logout</button>
        </div>
      </div>
    </nav>
  );
};

const styles = {
  nav: { background: '#1b5e20', padding: '1rem 0', color: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
  container: { maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 1rem' },
  brand: { fontSize: '1.5rem', fontWeight: 'bold', color: 'white', textDecoration: 'none' },
  links: { display: 'flex', gap: '1rem', alignItems: 'center' },
  link: { color: 'white', textDecoration: 'none', padding: '0.5rem', transition: 'opacity 0.2s' },
  button: { background: '#2e7d32', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer' },
};

export default Navbar;
