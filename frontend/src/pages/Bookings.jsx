import { useState, useEffect } from 'react';
import api from '../services/api';

const Bookings = () => {
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const { data } = await api.get('/bookings/');
      setBookings(data.results || data);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return '#2e7d32';
      case 'rejected': return '#c62828';
      default: return '#f57c00';
    }
  };

  return (
    <div style={styles.container}>
      <h1>My Bookings</h1>
      {bookings.length === 0 ? (
        <p>No bookings yet.</p>
      ) : (
        <div style={styles.list}>
          {bookings.map((booking) => (
            <div key={booking.id} style={styles.card}>
              <h3>{booking.room.title}</h3>
              <p><strong>Price:</strong> ${booking.room.price}/month</p>
              <p><strong>Status:</strong> <span style={{ color: getStatusColor(booking.status) }}>{booking.status.toUpperCase()}</span></p>
              <p><strong>Message:</strong> {booking.message || 'No message'}</p>
              <p><strong>Requested:</strong> {new Date(booking.created_at).toLocaleDateString()}</p>
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
};

export default Bookings;
