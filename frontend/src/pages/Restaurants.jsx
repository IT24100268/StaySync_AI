import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const Restaurants = () => {
  const [restaurants, setRestaurants] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const fetchRestaurants = async () => {
    try {
      const { data } = await api.get('/restaurants/');
      setRestaurants(data.results || data);
    } catch (error) {
      console.error('Error fetching restaurants:', error);
    }
  };

  return (
    <div style={styles.container}>
      <h1>Restaurants Near You</h1>
      <div style={styles.grid}>
        {restaurants.map((restaurant) => (
          <div key={restaurant.id} style={styles.card} onClick={() => navigate(`/restaurants/${restaurant.id}`)}>
            {restaurant.image && <img src={restaurant.image} alt={restaurant.name} style={styles.image} />}
            <h3>{restaurant.name}</h3>
            <button style={styles.button}>View Menu</button>
          </div>
        ))}
      </div>
    </div>
  );
};

const styles = {
  container: { maxWidth: '1200px', margin: '2rem auto', padding: '0 1rem' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem', marginTop: '2rem' },
  card: { background: 'white', padding: '1rem', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', cursor: 'pointer', border: '2px solid #e8f5e9' },
  image: { width: '100%', height: '200px', objectFit: 'cover', borderRadius: '4px', marginBottom: '1rem' },
  button: { width: '100%', padding: '0.5rem', background: '#2e7d32', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' },
};

export default Restaurants;
