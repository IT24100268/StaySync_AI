import { useEffect, useState } from 'react'
import { Alert, Box, Button, Grid, Stack, TextField } from '@mui/material'
import api from '../api/axios'
import { useAuth } from '../auth/AuthProvider'

function Profile() {
  const { currentUsername } = useAuth()
  const [formData, setFormData] = useState({
    username: currentUsername || '',
    email: '',
    phone: '',
    vehicle_type: '',
    vehicle_number: ''
  })
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(true)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get('/api/delivery/auth/profile/')
        const user = response?.data?.data?.user || {}
        setFormData({
          username: user.username || '',
          email: user.email || '',
          phone: user.phone || '',
          vehicle_type: user.vehicle_type || '',
          vehicle_number: user.vehicle_number || ''
        })
      } catch (err) {
        console.error('Profile fetch error:', err)
        setError('Failed to load profile')
      } finally {
        setFetchLoading(false)
      }
    }
    fetchProfile()
  }, [])

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setSuccess('')
    setError('')
    try {
      await api.put('/api/delivery/auth/profile/', formData)
      setSuccess('Profile updated successfully!')
      setIsEditing(false)
    } catch (err) {
      setError(err?.response?.data?.detail || 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  if (fetchLoading) {
    return <Box sx={{ color: '#243c72', fontSize: 18 }}>Loading profile...</Box>
  }

  return (
    <Stack spacing={2}>
      {success && <Alert severity="success">{success}</Alert>}
      {error && <Alert severity="error">{error}</Alert>}
      
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Box className="glass-card" sx={{ p: 2 }}>
            <Box sx={{ color: '#243c72', fontSize: 28, fontWeight: 700, mb: 2 }}>Profile Settings</Box>
            <form onSubmit={handleSubmit}>
              <Stack spacing={2}>
                <TextField
                  label="Username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  fullWidth
                  disabled
                  InputProps={{ readOnly: true }}
                />
                <TextField
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  fullWidth
                  disabled={!isEditing}
                  InputProps={{ readOnly: !isEditing }}
                />
                <TextField
                  label="Phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  fullWidth
                  disabled={!isEditing}
                  InputProps={{ readOnly: !isEditing }}
                />
                <TextField
                  label="Vehicle Type"
                  name="vehicle_type"
                  value={formData.vehicle_type}
                  onChange={handleChange}
                  placeholder="e.g., Bike, Scooter"
                  fullWidth
                  disabled={!isEditing}
                  InputProps={{ readOnly: !isEditing }}
                />
                <TextField
                  label="Vehicle Number"
                  name="vehicle_number"
                  value={formData.vehicle_number}
                  onChange={handleChange}
                  fullWidth
                  disabled={!isEditing}
                  InputProps={{ readOnly: !isEditing }}
                />
                {!isEditing ? (
                  <Button
                    className="top-pill top-pill-green"
                    variant="contained"
                    onClick={() => setIsEditing(true)}
                    sx={{ mt: 1 }}
                  >
                    Update Profile
                  </Button>
                ) : (
                  <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                    <Button
                      type="submit"
                      className="top-pill top-pill-green"
                      variant="contained"
                      disabled={loading}
                    >
                      {loading ? 'Saving...' : 'Save Changes'}
                    </Button>
                    <Button
                      className="top-pill"
                      variant="contained"
                      onClick={() => setIsEditing(false)}
                      disabled={loading}
                    >
                      Cancel
                    </Button>
                  </Stack>
                )}
              </Stack>
            </form>
          </Box>
        </Grid>
      </Grid>
    </Stack>
  )
}

export default Profile
