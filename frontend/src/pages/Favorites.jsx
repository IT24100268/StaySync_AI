import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const Favorites = () => {
  const [favorites, setFavorites] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    try {
      const { data } = await api.get('/rooms/favorites/');
      setFavorites(data.results || data);
    } catch (error) {
      console.error('Error fetching favorites:', error);
    }
  };

  return (
    <div style={styles.container}>
      <h1>My Favorite Rooms</h1>
      {favorites.length === 0 ? (
        <p>No favorites yet. Start exploring rooms!</p>
      ) : (
        <div style={styles.grid}>
          {favorites.map((fav) => (
            <div key={fav.id} style={styles.card}>
              {fav.room.images?.[0] && <img src={fav.room.images[0].image} alt={fav.room.title} style={styles.image} />}
              <h3>{fav.room.title}</h3>
              <p>${fav.room.price}/month</p>
              <p>{fav.room.distance_from_university} km from university</p>
              <button onClick={() => navigate(`/rooms/${fav.room.id}`)} style={styles.button}>
                View Details
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const styles = {
  container: { maxWidth: '1200px', margin: '2rem auto', padding: '0 1rem' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem', marginTop: '2rem' },
  card: { background: 'white', padding: '1rem', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' },
  image: { width: '100%', height: '200px', objectFit: 'cover', borderRadius: '4px', marginBottom: '1rem' },
  button: { width: '100%', padding: '0.5rem', background: '#2e7d32', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' },
};

export default Favorites;
