import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const [formData, setFormData] = useState({
    email: '', username: '', password: '', password2: '',
    first_name: '', last_name: '',
    university: '', gender_preference: 'any', budget: '', phone_number: ''
  });
  const [error, setError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { university, gender_preference, budget, phone_number, ...userData } = formData;
      await register({
        ...userData,
        user_type: 'student',
        profile: { university, gender_preference, budget, phone_number }
      });
      navigate('/login');
    } catch (err) {
      console.log('Error details:', err.response?.data);
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div style={styles.container}>
      <form onSubmit={handleSubmit} style={styles.form}>
        <h2>Register</h2>
        {error && <div style={styles.error}>{error}</div>}
        <input name="email" type="email" placeholder="Email" onChange={handleChange} required style={styles.input} />
        <input name="username" placeholder="Username" onChange={handleChange} required style={styles.input} />
        <input name="first_name" placeholder="First Name" onChange={handleChange} required style={styles.input} />
        <input name="last_name" placeholder="Last Name" onChange={handleChange} required style={styles.input} />
        <input name="password" type="password" placeholder="Password" onChange={handleChange} required style={styles.input} />
        <input name="password2" type="password" placeholder="Confirm Password" onChange={handleChange} required style={styles.input} />
        <input name="university" placeholder="University" onChange={handleChange} required style={styles.input} />
        <select name="gender_preference" onChange={handleChange} style={styles.input}>
          <option value="any">Any</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
        </select>
        <input name="budget" type="number" placeholder="Budget" onChange={handleChange} style={styles.input} />
        <input name="phone_number" placeholder="Phone Number" onChange={handleChange} required style={styles.input} />
        <button type="submit" style={styles.button}>Register</button>
        <p>Already have an account? <Link to="/login">Login</Link></p>
      </form>
    </div>
  );
};

const styles = {
  container: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'linear-gradient(135deg, #1b5e20 0%, #2e7d32 100%)' },
  form: { background: 'white', padding: '2rem', borderRadius: '8px', width: '400px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' },
  input: { width: '100%', padding: '0.75rem', margin: '0.5rem 0', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box' },
  button: { width: '100%', padding: '0.75rem', background: '#2e7d32', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginTop: '1rem', fontWeight: 'bold' },
  error: { background: '#c62828', color: 'white', padding: '0.5rem', borderRadius: '4px', marginBottom: '1rem' },
};

export default Register;
