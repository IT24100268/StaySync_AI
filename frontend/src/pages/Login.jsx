import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!username || username.length < 3) {
      setError('Please enter a valid username');
      return;
    }

    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    try {
      const data = await login(username, password, { remember });

      if (data.is_superuser || data.is_staff) {
        navigate('/admin/dashboard');
      } else if (data.user_type === 'delivery') {
        const token = localStorage.getItem('access_token');
        const refresh = localStorage.getItem('refresh_token');
        navigate(`/delivery/auth-redirect?token=${encodeURIComponent(token)}&refresh=${encodeURIComponent(refresh)}`);
      } else if (data.user_type === 'restaurant_owner') {
        navigate('/restaurant/dashboard');
      } else if (data.user_type === 'hostel_owner') {
        navigate('/owner/dashboard');
      } else {
        navigate('/student/dashboard');
      }
    } catch (err) {
      console.error('Login error:', err);

      if (err.response?.status === 403) {
        const code = err.response?.data?.code;
        const detail = err.response?.data?.detail;
        const reason = err.response?.data?.reason;

        if (code === 'account_blocked') {
          setError(
            reason && reason !== 'No reason was provided.'
              ? `${detail} Reason: ${reason}`
              : detail || 'Your account has been blocked. Please contact support or the admin team.'
          );
        } else if (code === 'account_pending') {
          setError('Account pending admin approval. Please wait.');
        } else {
          setError(detail || 'Access denied');
        }
      } else {
        setError('Invalid credentials');
      }
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.bg} />
      <div style={styles.overlay} />

      <div className="shellGrid" style={styles.shell}>
        <div style={styles.textCol}>
          <div className="heroText" style={styles.hero}>
            <div style={styles.heroTitleBig}>MAKE YOUR</div>
            <div style={styles.heroTitleBig}>RESERVATION</div>

            <p style={styles.heroDesc}>
              Find your perfect room near your university, order meals within your budget,
              and track deliveries live, all in one platform.
            </p>

            <div style={styles.heroPills}>
              <span style={styles.pill}>Room Search</span>
              <span style={styles.pill}>Food Ordering</span>
              <span style={styles.pill}>Live Tracking</span>
            </div>
          </div>
        </div>

        <div className="loginCardFloat" style={styles.formCol}>
          <form onSubmit={handleSubmit} style={styles.card}>
            <div style={styles.brandRow}>
              <div style={styles.logoCircle}>S</div>
              <div>
                <div style={styles.brandName}>StaySync AI</div>
                <div style={styles.brandTag}>Smart Student Living</div>
              </div>
            </div>

            <h2 style={styles.title}>Login</h2>

            {error && <div style={styles.error}>{error}</div>}

            <label style={styles.label}>Username</label>
            <div style={styles.inputWrap}>
              <span style={styles.iconLeft} aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Z"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <path
                    d="M20 21a8 8 0 1 0-16 0"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </span>

              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                style={styles.inputPill}
              />
            </div>

            <label style={styles.label}>Password</label>
            <div style={styles.inputWrap}>
              <span style={styles.iconLeft} aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M17 11H7a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2Z"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <path
                    d="M8 11V8a4 4 0 0 1 8 0v3"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </span>

              <input
                type={showPw ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={styles.inputPill}
              />

              <button
                type="button"
                style={styles.iconRightBtn}
                title={showPw ? 'Hide password' : 'Show password'}
                onClick={() => setShowPw((s) => !s)}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <path
                    d="M12 15a3 3 0 1 0-3-3 3 3 0 0 0 3 3Z"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                </svg>
              </button>
            </div>

            <div style={styles.rowBetween}>
              <label style={styles.rememberRow}>
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  style={styles.checkbox}
                />
                Remember me
              </label>

              <Link to="/forgot-password" style={styles.forgotLink}>
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              style={styles.button}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0px)')}
              onMouseDown={(e) => (e.currentTarget.style.transform = 'translateY(0px) scale(0.99)')}
              onMouseUp={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
            >
              Login
            </button>

            <p style={styles.footerText}>
              Don&apos;t have an account?{' '}
              <Link to="/register" style={styles.link}>
                Register
              </Link>
            </p>
          </form>
        </div>
      </div>

      <style>
        {`
          .shellGrid input:focus {
            outline: none !important;
            border: 1px solid rgba(147,197,253,0.7) !important;
            box-shadow: 0 0 0 4px rgba(59,130,246,0.25) !important;
          }

          @keyframes floaty {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-6px); }
            100% { transform: translateY(0px); }
          }

          .loginCardFloat {
            animation: floaty 5s ease-in-out infinite;
          }

          @media (max-width: 900px) {
            .shellGrid {
              grid-template-columns: 1fr !important;
              gap: 28px !important;
              padding: 24px !important;
            }
          }
        `}
      </style>
    </div>
  );
};

const styles = {
  page: {
    minHeight: '100vh',
    position: 'relative',
    overflow: 'hidden',
    fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif',
  },
  bg: {
    position: 'absolute',
    inset: 0,
    backgroundImage: 'url(/images/Image3.jpeg?v=2)',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    transform: 'scale(1.03)',
    zIndex: 0,
    filter: 'brightness(1.1) saturate(1.05) contrast(1.05)',
  },
  overlay: {
    position: 'absolute',
    inset: 0,
    background: 'rgba(0,0,0,0.28)',
    zIndex: 1,
  },
  shell: {
    position: 'relative',
    zIndex: 2,
    minHeight: '100vh',
    width: '100%',
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 56px',
    display: 'grid',
    gridTemplateColumns: '1fr 420px',
    gap: '10px',
    alignItems: 'center',
  },
  textCol: { justifySelf: 'start' },
  formCol: { justifySelf: 'start' },
  hero: {
    color: 'white',
    textShadow: '0 12px 30px rgba(0,0,0,0.25)',
  },
  heroTitleBig: {
    fontSize: '56px',
    lineHeight: 1.0,
    fontWeight: 900,
    letterSpacing: '0.02em',
  },
  heroDesc: {
    marginTop: '12px',
    fontSize: '16px',
    lineHeight: 1.7,
    maxWidth: '520px',
    opacity: 0.95,
  },
  heroPills: {
    display: 'flex',
    gap: '10px',
    marginTop: '18px',
    flexWrap: 'wrap',
  },
  pill: {
    padding: '10px 12px',
    borderRadius: '999px',
    background: 'rgba(255,255,255,0.18)',
    border: '1px solid rgba(255,255,255,0.25)',
    backdropFilter: 'blur(6px)',
    fontWeight: 800,
    fontSize: '13px',
  },
  card: {
    width: '100%',
    maxWidth: '420px',
    background: 'rgba(255,255,255,0.14)',
    border: '1px solid rgba(255,255,255,0.28)',
    borderRadius: '22px',
    padding: '28px',
    backdropFilter: 'blur(18px)',
    WebkitBackdropFilter: 'blur(18px)',
    boxShadow: '0 26px 70px rgba(0,0,0,0.35)',
  },
  brandRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '10px',
  },
  logoCircle: {
    width: '44px',
    height: '44px',
    borderRadius: '999px',
    display: 'grid',
    placeItems: 'center',
    color: 'white',
    fontWeight: 900,
    background: 'linear-gradient(90deg,#3b82f6,#60a5fa)',
    boxShadow: '0 12px 26px rgba(59,130,246,0.35)',
  },
  brandName: { fontWeight: 800, color: 'white', lineHeight: 1.1 },
  brandTag: { fontSize: '12px', color: 'rgba(255,255,255,0.75)' },
  title: {
    margin: '12px 0 16px',
    fontSize: '26px',
    color: 'white',
    fontWeight: 800,
  },
  label: {
    display: 'block',
    fontSize: '12px',
    color: 'rgba(255,255,255,0.75)',
    marginTop: '14px',
    marginBottom: '8px',
    fontWeight: 700,
  },
  inputWrap: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  iconLeft: {
    position: 'absolute',
    left: '14px',
    color: '#6b7280',
    display: 'grid',
    placeItems: 'center',
  },
  iconRightBtn: {
    position: 'absolute',
    right: '12px',
    border: 'none',
    background: 'transparent',
    color: '#6b7280',
    display: 'grid',
    placeItems: 'center',
    cursor: 'pointer',
    padding: '6px',
    borderRadius: '999px',
  },
  inputPill: {
    width: '100%',
    padding: '14px 44px 14px 44px',
    borderRadius: '16px',
    border: '1px solid rgba(255,255,255,0.3)',
    background: 'rgba(255,255,255,0.95)',
    color: '#1f2937',
    fontSize: '15px',
    outline: 'none',
    boxSizing: 'border-box',
  },
  rowBetween: {
    marginTop: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
  },
  rememberRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: 'rgba(255,255,255,0.85)',
    fontSize: '13px',
    fontWeight: 700,
    userSelect: 'none',
  },
  checkbox: {
    width: '16px',
    height: '16px',
    accentColor: '#60a5fa',
    cursor: 'pointer',
  },
  forgotLink: {
    color: '#93c5fd',
    fontWeight: 800,
    textDecoration: 'none',
    fontSize: '13px',
  },
  button: {
    width: '100%',
    marginTop: '18px',
    padding: '14px',
    borderRadius: '16px',
    border: 'none',
    cursor: 'pointer',
    color: 'white',
    fontWeight: 900,
    fontSize: '15px',
    background: 'linear-gradient(90deg,#3b82f6,#60a5fa)',
    boxShadow: '0 16px 34px rgba(59,130,246,0.35)',
    transition: 'transform 0.15s ease, box-shadow 0.15s ease',
  },
  error: {
    background: 'rgba(220,38,38,0.20)',
    color: 'white',
    border: '1px solid rgba(220,38,38,0.35)',
    padding: '10px 12px',
    borderRadius: '12px',
    marginBottom: '10px',
    fontWeight: 700,
    lineHeight: 1.6,
  },
  footerText: {
    marginTop: '14px',
    fontSize: '13px',
    color: 'rgba(255,255,255,0.80)',
  },
  link: {
    color: '#93c5fd',
    fontWeight: 800,
    textDecoration: 'none',
  },
};

export default Login;
