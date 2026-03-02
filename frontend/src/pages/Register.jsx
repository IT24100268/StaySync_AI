import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const [step, setStep] = useState(1);
  const [userType, setUserType] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
  });
  const [profileData, setProfileData] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const roleOptions = [
    { value: 'student', label: 'Student', icon: '🎓', desc: 'Find rooms and order food' },
    { value: 'hostel_owner', label: 'Hostel Owner', icon: '🏠', desc: 'List your hostel rooms' },
    { value: 'restaurant_owner', label: 'Restaurant Owner', icon: '🍽️', desc: 'List your restaurant' },
    { value: 'delivery', label: 'Delivery Partner', icon: '🚴', desc: 'Deliver orders' },
  ];

  const handleRoleSelect = (role) => {
    setUserType(role);
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const payload = {
        ...formData,
        user_type: userType,
        profile: profileData,
      };

      await register(payload);
      setSuccess('Registration successful! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      console.error('Registration error:', err);
      const errorData = err.response?.data;
      let errorMsg = 'Registration failed';
      
      if (errorData) {
        if (typeof errorData === 'string') {
          errorMsg = errorData;
        } else if (errorData.detail) {
          errorMsg = errorData.detail;
        } else if (errorData.email) {
          errorMsg = `Email: ${errorData.email[0]}`;
        } else if (errorData.username) {
          errorMsg = `Username: ${errorData.username[0]}`;
        } else if (errorData.password) {
          errorMsg = `Password: ${errorData.password[0]}`;
        } else {
          errorMsg = JSON.stringify(errorData);
        }
      } else if (err.message) {
        errorMsg = err.message;
      }
      
      setError(errorMsg);
    }
  };

  const renderProfileFields = () => {
    switch (userType) {
      case 'student':
        return (
          <>
            <input
              name="university"
              placeholder="University"
              onChange={(e) => setProfileData({ ...profileData, university: e.target.value })}
              required
              style={styles.input}
            />
            <select
              name="gender_preference"
              onChange={(e) => setProfileData({ ...profileData, gender_preference: e.target.value })}
              style={styles.input}
            >
              <option value="any">Gender Preference: Any</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
            <input
              name="budget"
              type="number"
              placeholder="Budget"
              onChange={(e) => setProfileData({ ...profileData, budget: e.target.value })}
              style={styles.input}
            />
            <input
              name="phone_number"
              placeholder="Phone Number"
              onChange={(e) => setProfileData({ ...profileData, phone_number: e.target.value })}
              required
              style={styles.input}
            />
          </>
        );
      case 'hostel_owner':
        return (
          <>
            <input
              name="hostel_name"
              placeholder="Hostel Name"
              onChange={(e) => setProfileData({ ...profileData, hostel_name: e.target.value })}
              required
              style={styles.input}
            />
            <textarea
              name="address"
              placeholder="Address"
              onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
              required
              style={{ ...styles.input, minHeight: '80px' }}
            />
            <input
              name="phone_number"
              placeholder="Phone Number"
              onChange={(e) => setProfileData({ ...profileData, phone_number: e.target.value })}
              required
              style={styles.input}
            />
            <input
              name="business_reg_no"
              placeholder="Business Registration No (Optional)"
              onChange={(e) => setProfileData({ ...profileData, business_reg_no: e.target.value })}
              style={styles.input}
            />
          </>
        );
      case 'restaurant_owner':
        return (
          <>
            <input
              name="restaurant_name"
              placeholder="Restaurant Name"
              onChange={(e) => setProfileData({ ...profileData, restaurant_name: e.target.value })}
              required
              style={styles.input}
            />
            <textarea
              name="address"
              placeholder="Address"
              onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
              required
              style={{ ...styles.input, minHeight: '80px' }}
            />
            <input
              name="phone_number"
              placeholder="Phone Number"
              onChange={(e) => setProfileData({ ...profileData, phone_number: e.target.value })}
              required
              style={styles.input}
            />
          </>
        );
      case 'delivery':
        return (
          <>
            <input
              name="vehicle_type"
              placeholder="Vehicle Type (e.g., Bike, Scooter)"
              onChange={(e) => setProfileData({ ...profileData, vehicle_type: e.target.value })}
              required
              style={styles.input}
            />
            <input
              name="license_no"
              placeholder="License Number"
              onChange={(e) => setProfileData({ ...profileData, license_no: e.target.value })}
              required
              style={styles.input}
            />
            <input
              name="phone_number"
              placeholder="Phone Number"
              onChange={(e) => setProfileData({ ...profileData, phone_number: e.target.value })}
              required
              style={styles.input}
            />
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.bg} />
      <div style={styles.overlay} />

      <div style={styles.container}>
        {step === 1 ? (
          <div style={styles.card}>
            <h2 style={styles.title}>Choose Account Type</h2>
            <div style={styles.roleGrid}>
              {roleOptions.map((role) => (
                <div
                  key={role.value}
                  onClick={() => handleRoleSelect(role.value)}
                  style={styles.roleCard}
                >
                  <div style={styles.roleIcon}>{role.icon}</div>
                  <div style={styles.roleLabel}>{role.label}</div>
                  <div style={styles.roleDesc}>{role.desc}</div>
                </div>
              ))}
            </div>
            <p style={styles.footerText}>
              Already have an account? <Link to="/login" style={styles.link}>Login</Link>
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={styles.card}>
            <button type="button" onClick={() => setStep(1)} style={styles.backBtn}>
              ← Back
            </button>
            <h2 style={styles.title}>Register as {roleOptions.find(r => r.value === userType)?.label}</h2>

            {error && <div style={styles.error}>{error}</div>}
            {success && <div style={styles.success}>{success}</div>}

            <input
              name="email"
              type="email"
              placeholder="Email"
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              style={styles.input}
            />
            <input
              name="username"
              placeholder="Username"
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              required
              style={styles.input}
            />
            <input
              name="password"
              type="password"
              placeholder="Password"
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              style={styles.input}
            />

            <div style={styles.divider} />
            {renderProfileFields()}

            <button type="submit" style={styles.button}>Register</button>
          </form>
        )}
      </div>
    </div>
  );
};

const styles = {
  page: {
    minHeight: '100vh',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  bg: {
    position: 'absolute',
    inset: 0,
    backgroundImage: 'url(/images/Image4.jpeg)',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    zIndex: 0,
  },
  overlay: {
    position: 'absolute',
    inset: 0,
    background: 'rgba(0,0,0,0.4)',
    zIndex: 1,
  },
  container: {
    position: 'relative',
    zIndex: 2,
    width: '100%',
    maxWidth: '600px',
    padding: '20px',
  },
  card: {
    background: 'rgba(255,255,255,0.15)',
    backdropFilter: 'blur(20px)',
    borderRadius: '20px',
    padding: '32px',
    border: '1px solid rgba(255,255,255,0.3)',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
  },
  title: {
    color: 'white',
    fontSize: '28px',
    fontWeight: 'bold',
    marginBottom: '24px',
    textAlign: 'center',
  },
  roleGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
    marginBottom: '24px',
  },
  roleCard: {
    background: 'rgba(255,255,255,0.2)',
    border: '2px solid rgba(255,255,255,0.3)',
    borderRadius: '16px',
    padding: '24px',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.3s',
  },
  roleIcon: {
    fontSize: '48px',
    marginBottom: '12px',
  },
  roleLabel: {
    color: 'white',
    fontSize: '18px',
    fontWeight: 'bold',
    marginBottom: '8px',
  },
  roleDesc: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: '13px',
  },
  input: {
    width: '100%',
    padding: '12px',
    marginBottom: '12px',
    borderRadius: '12px',
    border: '1px solid rgba(255,255,255,0.3)',
    background: 'rgba(255,255,255,0.9)',
    color: '#1f2937',
    fontSize: '15px',
    outline: 'none',
    boxSizing: 'border-box',
  },
  button: {
    width: '100%',
    padding: '14px',
    marginTop: '16px',
    borderRadius: '12px',
    border: 'none',
    background: 'linear-gradient(90deg,#3b82f6,#60a5fa)',
    color: 'white',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    boxShadow: '0 10px 30px rgba(59,130,246,0.4)',
  },
  backBtn: {
    background: 'rgba(255,255,255,0.2)',
    border: 'none',
    color: 'white',
    padding: '8px 16px',
    borderRadius: '8px',
    cursor: 'pointer',
    marginBottom: '16px',
  },
  divider: {
    height: '1px',
    background: 'rgba(255,255,255,0.2)',
    margin: '20px 0',
  },
  error: {
    background: 'rgba(220,38,38,0.2)',
    color: 'white',
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '12px',
    border: '1px solid rgba(220,38,38,0.4)',
  },
  success: {
    background: 'rgba(34,197,94,0.2)',
    color: 'white',
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '12px',
    border: '1px solid rgba(34,197,94,0.4)',
  },
  footerText: {
    color: 'white',
    textAlign: 'center',
    marginTop: '16px',
  },
  link: {
    color: '#93c5fd',
    fontWeight: 'bold',
    textDecoration: 'none',
  },
};

export default Register;
