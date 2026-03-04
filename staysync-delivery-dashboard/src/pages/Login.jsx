import { useState, useEffect } from 'react'
import { Alert, Box, Button, CircularProgress, Stack, TextField, Typography } from '@mui/material'
import { useLocation, useNavigate } from 'react-router-dom'
import GlassCard from '../components/GlassCard'
import { useAuth } from '../auth/AuthProvider'

function Login() {
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const { login, authLoading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const redirectTo = location.state?.from?.pathname || '/dashboard'

  // Auto-login if tokens are passed via URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const refresh = params.get('refresh');
    
    if (token && refresh) {
      localStorage.setItem('access_token', token);
      localStorage.setItem('refresh_token', refresh);
      // Clear URL params and redirect
      window.history.replaceState({}, '', '/dashboard');
      navigate('/dashboard', { replace: true });
    }
  }, [navigate]);

  const onSubmit = async (event) => {
    event.preventDefault()
    setError('')
    const result = await login(form)
    if (!result.success) {
      setError(result.message)
      return
    }
    navigate('/dashboard', { replace: true })
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', p: 2 }}>
      <GlassCard sx={{ width: '100%', maxWidth: 420, p: 3 }}>
        <Typography variant="h5" sx={{ mb: 0.5 }}>
          Delivery Partner Login
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
          Sign in to continue with StaySync AI dashboard.
        </Typography>

        <Box component="form" onSubmit={onSubmit}>
          <Stack spacing={1.4}>
            <TextField
              required
              label="Username"
              value={form.username}
              onChange={(e) => setForm((prev) => ({ ...prev, username: e.target.value }))}
            />
            <TextField
              required
              type="password"
              label="Password"
              value={form.password}
              onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
            />
            {error ? <Alert severity="error">{error}</Alert> : null}
            <Button type="submit" variant="contained" size="large" disabled={authLoading}>
              {authLoading ? <CircularProgress size={22} sx={{ color: '#fff' }} /> : 'Login'}
            </Button>
          </Stack>
        </Box>
      </GlassCard>
    </Box>
  )
}

export default Login
