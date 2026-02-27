import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

const RoomDetail = () => {
  const { id } = useParams();
  const [room, setRoom] = useState(null);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchRoom();
  }, [id]);

  const fetchRoom = async () => {
    try {
      const { data } = await api.get(`/rooms/${id}/`);
      setRoom(data);
    } catch (error) {
      console.error('Error fetching room:', error);
    }
  };

  const handleBooking = async () => {
    try {
      await api.post('/bookings/create/', { room_id: id, message });
      alert('Booking request sent!');
      navigate('/bookings');
    } catch (error) {
      alert('Error creating booking');
    }
  };

  if (!room) return <div>Loading...</div>;

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1>{room.title}</h1>
        <div style={styles.images}>
          {room.images?.map((img) => (
            <img key={img.id} src={img.image} alt={room.title} style={styles.image} />
          ))}
        </div>
        <div style={styles.info}>
          <h2>${room.price}/month</h2>
          <p><strong>Description:</strong> {room.description}</p>
          <p><strong>Distance:</strong> {room.distance_from_university} km from university</p>
          <p><strong>Gender Allowed:</strong> {room.gender_allowed}</p>
          <p><strong>Facilities:</strong> {room.facilities?.join(', ')}</p>
          <p><strong>Rules:</strong> {room.rules}</p>
          <p><strong>Contact:</strong> {room.owner_contact}</p>
        </div>
        <div style={styles.booking}>
          <h3>Request Booking</h3>
          <textarea
            placeholder="Add a message (optional)"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            style={styles.textarea}
          />
          <button onClick={handleBooking} style={styles.button}>Send Booking Request</button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: { maxWidth: '900px', margin: '2rem auto', padding: '0 1rem' },
  card: { background: 'white', padding: '2rem', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' },
  images: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' },
  image: { width: '100%', height: '200px', objectFit: 'cover', borderRadius: '4px' },
  info: { lineHeight: '2', marginBottom: '2rem' },
  booking: { borderTop: '1px solid #ddd', paddingTop: '2rem' },
  textarea: { width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '4px', minHeight: '100px', marginBottom: '1rem', boxSizing: 'border-box' },
  button: { padding: '0.75rem 1.5rem', background: '#27ae60', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' },
};

export default RoomDetail;
