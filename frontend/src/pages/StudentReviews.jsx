import React, { useState, useEffect } from 'react';
import axios from 'axios';

const StudentReviews = () => {
  const [rooms, setRooms] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [selectedType, setSelectedType] = useState('room');
  const [selectedId, setSelectedId] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchRooms();
    fetchRestaurants();
  }, []);

  const getAuthHeader = () => {
    const token = localStorage.getItem('access_token') || localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchRooms = async () => {
    try {
      const res = await axios.get('http://localhost:8000/api/rooms/', {
        headers: getAuthHeader()
      });
      setRooms(res.data.results || res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchRestaurants = async () => {
    try {
      const res = await axios.get('http://localhost:8000/api/restaurants/', {
        headers: getAuthHeader()
      });
      setRestaurants(res.data.results || res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const endpoint = selectedType === 'room' 
        ? 'http://localhost:8000/api/reviews/rooms/'
        : 'http://localhost:8000/api/reviews/restaurants/';
      
      const data = selectedType === 'room'
        ? { room: selectedId, rating, comment }
        : { restaurant: selectedId, rating, comment };

      await axios.post(endpoint, data, {
        headers: getAuthHeader()
      });
      
      setMessage('Review submitted successfully!');
      setComment('');
      setRating(5);
      setSelectedId('');
    } catch (err) {
      setMessage(err.response?.data?.detail || 'Failed to submit review');
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Submit a Review</h2>
      
      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.field}>
          <label style={styles.label}>Review Type</label>
          <select value={selectedType} onChange={(e) => { setSelectedType(e.target.value); setSelectedId(''); }} style={styles.select}>
            <option value="room">Room</option>
            <option value="restaurant">Restaurant</option>
          </select>
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Select {selectedType === 'room' ? 'Room' : 'Restaurant'}</label>
          <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)} style={styles.select} required>
            <option value="">-- Select --</option>
            {selectedType === 'room' 
              ? rooms.map(r => <option key={r.id} value={r.id}>{r.title}</option>)
              : restaurants.map(r => <option key={r.id} value={r.id}>{r.name}</option>)
            }
          </select>
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Rating</label>
          <select value={rating} onChange={(e) => setRating(e.target.value)} style={styles.select}>
            {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} ★</option>)}
          </select>
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Comment</label>
          <textarea value={comment} onChange={(e) => setComment(e.target.value)} style={styles.textarea} rows="4" required />
        </div>

        <button type="submit" style={styles.button}>Submit Review</button>
      </form>

      {message && <div style={styles.message}>{message}</div>}
    </div>
  );
};

const styles = {
  container: { maxWidth: 600, margin: '40px auto', padding: 20, background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' },
  title: { fontSize: 24, fontWeight: 700, marginBottom: 20, color: '#1f4f96' },
  form: { display: 'flex', flexDirection: 'column', gap: 16 },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 14, fontWeight: 600, color: '#333' },
  select: { padding: 10, borderRadius: 8, border: '1px solid #ddd', fontSize: 14 },
  textarea: { padding: 10, borderRadius: 8, border: '1px solid #ddd', fontSize: 14, fontFamily: 'inherit' },
  button: { padding: 12, background: '#1f4f96', color: '#fff', border: 'none', borderRadius: 8, fontSize: 16, fontWeight: 600, cursor: 'pointer' },
  message: { marginTop: 16, padding: 12, background: '#e8f5e9', color: '#2e7d32', borderRadius: 8, fontSize: 14 }
};

export default StudentReviews;
