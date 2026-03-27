import { useCallback, useEffect, useState } from 'react'
import { Alert, Box, Button, Grid, Skeleton, Stack, Tab, Tabs } from '@mui/material'
import api from '../api/axios'
import { MiniMap } from '../components/AppLayout'

function Deliveries() {
  const [status, setStatus] = useState('active')
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchDeliveries = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await api.get(`/api/orders/delivery/my-deliveries/?status=${status}`)
      const items = Array.isArray(response.data) ? response.data : response?.data?.results || []
      setList(items)
    } catch (err) {
      console.error('Fetch deliveries error:', err)
      setError(err?.response?.data?.detail || 'Failed to load deliveries')
    } finally {
      setLoading(false)
    }
  }, [status])

  useEffect(() => {
    fetchDeliveries()
  }, [fetchDeliveries])

  if (loading) {
    return <Skeleton variant="rounded" height={520} sx={{ borderRadius: 5 }} />
  }

  return (
    <Stack spacing={1.4}>
      {error ? <Alert severity="error">{error}</Alert> : null}
      <Grid container spacing={1.5}>
        <Grid size={{ xs: 12, lg: 7.9 }}>
          <Stack spacing={1.1}>
            <Box className="glass-card" sx={{ p: 1.1 }}>
              <Tabs value={status} onChange={(_, v) => setStatus(v)}>
                <Tab label="Active" value="active" />
                <Tab label="Completed" value="completed" />
                <Tab label="Cancelled" value="all" />
              </Tabs>
            </Box>

            <Box className="glass-card" sx={{ p: 1.2 }}>
              <Box sx={{ color: '#243b70', fontSize: 32, fontWeight: 700 }}>#ORD012</Box>
              <Box sx={{ color: '#2b4478', fontSize: 22, fontWeight: 700, mb: 1 }}>SpiceHub Restaurant</Box>
              <Box sx={{ color: '#5c709a', fontSize: 15, mb: 1.2 }}>Pickup SpiceHub Restaurant | Drop Greenview Hostel</Box>
              <Box className="route-progress" />
              <Grid container spacing={1} sx={{ mt: 1.2 }}>
                <Grid size={{ xs: 12, md: 4 }}><Button className="top-pill top-pill-green" fullWidth>Mark Picked</Button></Grid>
                <Grid size={{ xs: 12, md: 4 }}><Button className="top-pill top-pill-green" fullWidth>Start Route</Button></Grid>
                <Grid size={{ xs: 12, md: 4 }}><Button className="top-pill" fullWidth>Mark Delivered</Button></Grid>
              </Grid>
            </Box>

            <Box className="glass-card" sx={{ p: 1.2 }}>
              <Box sx={{ color: '#2a4277', fontSize: 30, fontWeight: 700, mb: 1 }}>Past Deliveries</Box>
              <Box sx={{ borderRadius: 2, overflow: 'hidden', border: '1px solid rgba(152,171,212,0.33)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, color: '#2c4173' }}>
                  <thead style={{ background: 'rgba(234,240,253,0.85)' }}>
                    <tr>
                      <th style={{ textAlign: 'left', padding: 10 }}>Delivery ID</th>
                      <th style={{ textAlign: 'left', padding: 10 }}>Restaurant</th>
                      <th style={{ textAlign: 'left', padding: 10 }}>Drop</th>
                      <th style={{ textAlign: 'left', padding: 10 }}>Earnings</th>
                      <th style={{ textAlign: 'left', padding: 10 }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(list.length ? list : [{ id: 6 }, { id: 5 }, { id: 4 }]).map((d) => (
                      <tr key={d.id}>
                        <td style={{ padding: 10 }}>#ORD{String(d.id).padStart(3, '0')}</td>
                        <td>{d.restaurant_name || 'Veggie Delight'}</td>
                        <td>{d.delivery_address || 'Greenview Hostel'}</td>
                        <td>LKR {d.delivery_charge || 170}</td>
                        <td>{d.status || 'Delivered'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Box>
            </Box>
          </Stack>
        </Grid>

        <Grid size={{ xs: 12, lg: 4.1 }}>
          <Stack spacing={1.1}>
            <Box className="glass-card" sx={{ p: 1.2 }}>
              <Box sx={{ color: '#243c72', fontSize: 36, fontWeight: 700, mb: 1 }}>Active Delivery</Box>
              <MiniMap compact />
              <Grid container sx={{ mt: 1.2 }}>
                <Grid size={4}><Box sx={{ color: '#23396d', fontWeight: 700 }}>2.4 km</Box></Grid>
                <Grid size={4}><Box sx={{ color: '#23396d', fontWeight: 700 }}>8 - 12 mins</Box></Grid>
                <Grid size={4}><Box sx={{ color: '#23396d', fontWeight: 700 }}>LKR 220</Box></Grid>
              </Grid>
              <Grid container spacing={1} sx={{ mt: 1 }}>
                <Grid size={6}><Button className="top-pill top-pill-green" fullWidth>Navigate</Button></Grid>
                <Grid size={6}><Button className="top-pill" fullWidth>Call Customer</Button></Grid>
              </Grid>
              <Button className="top-pill" fullWidth sx={{ mt: 1 }}>Chat Support</Button>
            </Box>
          </Stack>
        </Grid>
      </Grid>
    </Stack>
  )
}

export default Deliveries
