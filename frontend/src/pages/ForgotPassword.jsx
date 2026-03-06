import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const ForgotPassword = () => {
  const [step, setStep] = useState(1); // 1: email, 2: otp, 3: new password
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const sendOTP = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await axios.post('http://localhost:8000/api/auth/send-otp/', {
        email,
        purpose: 'password_reset'
      });
      setSuccess('OTP sent to your email!');
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await axios.post('http://localhost:8000/api/auth/verify-otp/', {
        email,
        otp_code: otpCode,
        purpose: 'password_reset'
      });
      setSuccess('OTP verified!');
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      await axios.post('http://localhost:8000/api/auth/reset-password/', {
        email,
        otp_code: otpCode,
        new_password: newPassword
      });
      setSuccess('Password reset successfully! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.bg} />
      <div style={styles.overlay} />

      <div style={styles.container}>
        <div style={styles.card}>
          <h2 style={styles.title}>Forgot Password</h2>

          {error && <div style={styles.error}>{error}</div>}
          {success && <div style={styles.success}>{success}</div>}

          {step === 1 && (
            <form onSubmit={sendOTP}>
              <p style={styles.description}>
                Enter your email address and we'll send you an OTP to reset your password.
              </p>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={styles.input}
              />
              <button type="submit" disabled={loading} style={styles.button}>
                {loading ? 'Sending...' : 'Send OTP'}
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={verifyOTP}>
              <p style={styles.description}>
                Enter the 6-digit OTP sent to {email}
              </p>
              <input
                type="text"
                placeholder="Enter OTP"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                maxLength="6"
                required
                style={styles.input}
              />
              <button type="submit" disabled={loading} style={styles.button}>
                {loading ? 'Verifying...' : 'Verify OTP'}
              </button>
              <button 
                type="button" 
                onClick={() => setStep(1)} 
                style={styles.backBtn}
              >
                ← Back
              </button>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={resetPassword}>
              <p style={styles.description}>
                Enter your new password
              </p>
              <input
                type="password"
                placeholder="New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                style={styles.input}
              />
              <input
                type="password"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                style={styles.input}
              />
              <button type="submit" disabled={loading} style={styles.button}>
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          )}

          <p style={styles.footerText}>
            Remember your password? <Link to="/login" style={styles.link}>Login</Link>
          </p>
        </div>
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
    maxWidth: '450px',
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
    marginBottom: '16px',
    textAlign: 'center',
  },
  description: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: '14px',
    marginBottom: '20px',
    textAlign: 'center',
    lineHeight: '1.5',
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
    marginTop: '8px',
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
    width: '100%',
    padding: '12px',
    marginTop: '8px',
    borderRadius: '12px',
    border: 'none',
    background: 'rgba(255,255,255,0.2)',
    color: 'white',
    fontSize: '14px',
    cursor: 'pointer',
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
    marginTop: '20px',
    fontSize: '14px',
  },
  link: {
    color: '#93c5fd',
    fontWeight: 'bold',
    textDecoration: 'none',
  },
};

export default ForgotPassword;
