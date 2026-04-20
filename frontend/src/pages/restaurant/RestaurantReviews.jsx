import { useEffect, useState } from 'react';
import api from '../../services/api';

export default function RestaurantReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/reviews/restaurants/')
      .then(({ data }) => setReviews(Array.isArray(data) ? data : (data?.results ?? [])))
      .catch(() => setError('Failed to load reviews.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="section-card" style={{ padding: '2rem', color: '#8a6f61' }}>
        Loading reviews...
      </div>
    );
  }

  return (
    <div className="restaurant-orders-page">
      <div className="restaurant-orders-topbar">
        <div className="restaurant-orders-topbar__title">
          <h3>Reviews</h3>
        </div>
      </div>

      {error ? (
        <div className="restaurant-menu-message restaurant-menu-message--error">{error}</div>
      ) : null}

      {reviews.length === 0 ? (
        <div className="section-card">
          <p style={{ color: '#8a6f61', padding: '1rem' }}>No reviews yet.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {reviews.map((review) => (
            <article key={review.id} className="section-card" style={{ display: 'grid', gap: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ color: '#2d170d', fontSize: '0.95rem' }}>
                  {review.user_name || review.student_name || 'Student'}
                </strong>
                <span style={{ color: '#f4b43a', fontWeight: 700 }}>
                  {'★'.repeat(Math.min(5, Math.max(1, Number(review.rating || 0))))}
                  {' '}{review.rating}/5
                </span>
              </div>
              {review.comment ? (
                <p style={{ margin: 0, color: '#5c4338', lineHeight: 1.55 }}>{review.comment}</p>
              ) : null}
              <span style={{ fontSize: '0.8rem', color: '#9a7f71' }}>
                {review.created_at ? new Date(review.created_at).toLocaleDateString('en-LK', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
              </span>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
