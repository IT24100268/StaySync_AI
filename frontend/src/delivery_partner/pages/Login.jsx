import { useState, useEffect } from 'react'
import { Alert, Box, Button, CircularProgress, Stack, TextField, Typography } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import GlassCard from '../components/GlassCard'
import { useAuth } from '../auth/AuthProvider'

function Login() {
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const { login, authLoading } = useAuth()
  const navigate = useNavigate()
  const fieldSx = {
    '& .MuiInputBase-root': {
      backgroundColor: '#fffdf8',
      color: 'var(--delivery-text)',
      borderRadius: '12px',
    },
    '& .MuiInputLabel-root': {
      color: 'var(--delivery-muted)',
    },
    '& .MuiOutlinedInput-notchedOutline': {
      borderColor: 'var(--delivery-border)',
    },
    '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': {
      borderColor: 'var(--delivery-accent)',
    },
    '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderColor: 'var(--delivery-accent)',
    },
  }

  // Auto-login if tokens are passed via URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const refresh = params.get('refresh');
    
    if (token && refresh) {
      localStorage.setItem('access_token', token);
      localStorage.setItem('refresh_token', refresh);
      localStorage.setItem('user_type', 'delivery');
      // Clear URL params and redirect
      window.history.replaceState({}, '', '/delivery/login');
      navigate('/delivery/dashboard', { replace: true });
    }
  }, [navigate]);

  const onSubmit = async (event) => {
    event.preventDefault()
    setError('')

    // Client-side validation
    if (form.username.trim().length < 3) {
      setError('Username must be at least 3 characters long')
      return
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters long')
      return
    }

    const result = await login(form)
    if (!result.success) {
      setError(result.message)
      return
    }
    navigate('/delivery/dashboard', { replace: true })
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        p: 2,
        background:
          'radial-gradient(800px 300px at -10% -20%, rgba(201,168,76,0.2), transparent 60%), linear-gradient(180deg, #f5f0e8 0%, #f9f5ef 100%)',
      }}
    >
      <GlassCard sx={{ width: '100%', maxWidth: 420, p: 3 }}>
        <Typography variant="h5" sx={{ mb: 0.5, color: 'var(--delivery-text)', fontWeight: 800 }}>
          Delivery Partner Login
        </Typography>
        <Typography variant="body2" sx={{ mb: 2.5, color: 'var(--delivery-muted)' }}>
          Sign in to continue with StaySync AI dashboard.
        </Typography>

        <Box component="form" onSubmit={onSubmit}>
          <Stack spacing={1.4}>
            <TextField
              required
              label="Username"
              value={form.username}
              onChange={(e) => setForm((prev) => ({ ...prev, username: e.target.value }))}
              sx={fieldSx}
            />
            <TextField
              required
              type="password"
              label="Password"
              value={form.password}
              onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
              sx={fieldSx}
            />
            {error ? <Alert severity="error">{error}</Alert> : null}
            <Button type="submit" className="top-pill top-pill-green" variant="contained" size="large" disabled={authLoading}>
              {authLoading ? <CircularProgress size={22} sx={{ color: '#1a0a00' }} /> : 'Login'}
            </Button>
          </Stack>
        </Box>
      </GlassCard>
    </Box>
  )
}

export default Login
