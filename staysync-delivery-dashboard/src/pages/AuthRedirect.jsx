import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Box, CircularProgress, Typography } from '@mui/material'

function AuthRedirect() {
  const navigate = useNavigate()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')
    const refresh = params.get('refresh')

    console.log('AuthRedirect - token:', token ? 'present' : 'missing')
    console.log('AuthRedirect - refresh:', refresh ? 'present' : 'missing')

    if (token && refresh) {
      localStorage.setItem('access_token', token)
      localStorage.setItem('refresh_token', refresh)
      console.log('Tokens saved, redirecting to dashboard')
      // Use setTimeout to ensure localStorage is written
      setTimeout(() => {
        navigate('/dashboard', { replace: true })
      }, 100)
    } else {
      console.log('Missing tokens, redirecting to login')
      navigate('/login', { replace: true })
    }
  }, [navigate])

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', gap: 2 }}>
      <CircularProgress size={60} />
      <Typography variant="h6">Logging you in...</Typography>
    </Box>
  )
}

export default AuthRedirect
