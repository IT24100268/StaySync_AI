import React, { useState, useEffect } from 'react';
import axios from 'axios';

const RestaurantReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReviews();
  }, []);

  const getAuthHeader = () => {
    const token = localStorage.getItem('access_token') || localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchReviews = async () => {
    try {
      const res = await axios.get('http://localhost:8000/api/reviews/restaurants/', {
        headers: getAuthHeader()
      });
      setReviews(res.data.results || res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={styles.container}>Loading...</div>;

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Restaurant Reviews</h2>
      
      {reviews.length === 0 ? (
        <p style={styles.empty}>No reviews yet</p>
      ) : (
        <div style={styles.list}>
          {reviews.map(review => (
            <div key={review.id} style={styles.card}>
              <div style={styles.header}>
                <span style={styles.user}>{review.user_name}</span>
                <span style={styles.rating}>{review.rating} ★</span>
              </div>
              <p style={styles.comment}>{review.comment}</p>
              <span style={styles.date}>{new Date(review.created_at).toLocaleDateString()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const styles = {
  container: { padding: 20, maxWidth: 1000, margin: '0 auto' },
  title: { fontSize: 24, fontWeight: 700, marginBottom: 20, color: '#1f4f96' },
  empty: { color: '#666', fontSize: 16 },
  list: { display: 'grid', gap: 16 },
  card: { background: '#fff', padding: 16, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' },
  header: { display: 'flex', justifyContent: 'space-between', marginBottom: 12 },
  user: { fontWeight: 600, color: '#333' },
  rating: { color: '#f59e0b', fontWeight: 700 },
  comment: { color: '#555', marginBottom: 8, lineHeight: 1.5 },
  date: { fontSize: 12, color: '#999' }
};

export default RestaurantReviews;
