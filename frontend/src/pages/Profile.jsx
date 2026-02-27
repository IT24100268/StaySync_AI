import { useAuth } from '../context/AuthContext';

const Profile = () => {
  const { user } = useAuth();

  if (!user) return <div>Loading...</div>;

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2>My Profile</h2>
        <div style={styles.info}>
          <p><strong>Name:</strong> {user.first_name} {user.last_name}</p>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Username:</strong> {user.username}</p>
          <p><strong>University:</strong> {user.profile.university}</p>
          <p><strong>Phone:</strong> {user.profile.phone_number}</p>
          <p><strong>Gender Preference:</strong> {user.profile.gender_preference}</p>
          <p><strong>Budget:</strong> ${user.profile.budget}</p>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: { maxWidth: '800px', margin: '2rem auto', padding: '0 1rem' },
  card: { background: 'white', padding: '2rem', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', border: '2px solid #e8f5e9' },
  info: { marginTop: '1rem', lineHeight: '2' },
};

export default Profile;
