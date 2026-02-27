import { useState, useEffect } from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

const Rooms = () => {
  const [rooms, setRooms] = useState([]);
  const [filters, setFilters] = useState({ min_price: '', max_price: '', gender_allowed: '', max_distance: '' });
  const navigate = useNavigate();

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      const { data } = await api.get(`/rooms/?${params}`);
      setRooms(data.results || data);
    } catch (error) {
      console.error('Error fetching rooms:', error);
    }
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleSearch = () => {
    fetchRooms();
  };

  const toggleFavorite = async (roomId) => {
    try {
      await api.post('/rooms/favorite/', { room_id: roomId });
      fetchRooms();
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  return (
    <div style={styles.container}>
      <h1>Available Rooms</h1>
      <div style={styles.filters}>
        <input name="min_price" placeholder="Min Price" onChange={handleFilterChange} style={styles.input} />
        <input name="max_price" placeholder="Max Price" onChange={handleFilterChange} style={styles.input} />
        <select name="gender_allowed" onChange={handleFilterChange} style={styles.input}>
          <option value="">All Genders</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="any">Any</option>
        </select>
        <input name="max_distance" placeholder="Max Distance (km)" onChange={handleFilterChange} style={styles.input} />
        <button onClick={handleSearch} style={styles.button}>Search</button>
      </div>
      <div style={styles.grid}>
        {rooms.map((room) => (
          <div key={room.id} style={styles.card}>
            {room.images?.[0] && <img src={room.images[0].image} alt={room.title} style={styles.image} />}
            <h3>{room.title}</h3>
            <p>${room.price}/month</p>
            <p>{room.distance_from_university} km from university</p>
            <p>Gender: {room.gender_allowed}</p>
            <div style={styles.actions}>
              <button onClick={() => navigate(`/rooms/${room.id}`)} style={styles.viewButton}>View Details</button>
              <button onClick={() => toggleFavorite(room.id)} style={styles.favButton}>
                {room.is_favorited ? '❤️' : '🤍'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const styles = {
  container: { maxWidth: '1200px', margin: '2rem auto', padding: '0 1rem' },
  filters: { display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' },
  input: { padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px', flex: '1', minWidth: '150px' },
  button: { padding: '0.5rem 1.5rem', background: '#2e7d32', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' },
  card: { background: 'white', padding: '1rem', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', border: '2px solid #e8f5e9' },
  image: { width: '100%', height: '200px', objectFit: 'cover', borderRadius: '4px', marginBottom: '1rem' },
  actions: { display: 'flex', gap: '0.5rem', marginTop: '1rem' },
  viewButton: { flex: 1, padding: '0.5rem', background: '#2e7d32', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' },
  favButton: { padding: '0.5rem 1rem', background: '#f5f5f5', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '1.2rem' },
};

export default Rooms;
