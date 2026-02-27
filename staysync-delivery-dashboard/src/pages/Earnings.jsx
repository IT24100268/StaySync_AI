import { useCallback, useEffect, useState } from 'react'
import { Alert, Box, Button, Grid, Skeleton, Stack } from '@mui/material'
import api from '../api/axios'

function Earnings() {
  const [summary, setSummary] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchEarnings = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await api.get('/api/earnings/summary/')
      setSummary(response.data || {})
    } catch (err) {
      setError(err?.response?.data?.detail || 'Failed to load earnings summary')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchEarnings()
  }, [fetchEarnings])

  if (loading) {
    return <Skeleton variant="rounded" height={520} sx={{ borderRadius: 5 }} />
  }

  return (
    <Stack spacing={1.4}>
      {error ? <Alert severity="error">{error}</Alert> : null}
      <Grid container spacing={1.5}>
        <Grid size={{ xs: 12, lg: 7.9 }}>
          <Stack spacing={1.1}>
            <Grid container spacing={1.1}>
              <Grid size={{ xs: 12, md: 4 }}>
                <Box className="glass-card" sx={{ p: 1.2 }}>
                  <Box sx={{ color: '#566c95', fontSize: 15 }}>Today's Earning</Box>
                  <Box sx={{ color: '#243c73', fontWeight: 700, fontSize: 42 }}>LKR {summary.today || 3450}</Box>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Box className="glass-card" sx={{ p: 1.2 }}>
                  <Box sx={{ color: '#566c95', fontSize: 15 }}>Deliveries Today</Box>
                  <Box sx={{ color: '#243c73', fontWeight: 700, fontSize: 42 }}>{summary.completed_deliveries || 18}</Box>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Box className="glass-card" sx={{ p: 1.2 }}>
                  <Box sx={{ color: '#566c95', fontSize: 15 }}>Avg Delivery Time</Box>
                  <Box sx={{ color: '#243c73', fontWeight: 700, fontSize: 42 }}>15 mins</Box>
                </Box>
              </Grid>
            </Grid>

            <Box className="glass-card" sx={{ p: 1.3 }}>
              <Stack direction="row" justifyContent="space-between">
                <Box sx={{ color: '#243d72', fontSize: 38, fontWeight: 700 }}>Earnings Overview</Box>
                <Button className="top-pill" variant="contained">April 1, 2024 - April 30, 2024</Button>
              </Stack>
              <Box className="map-placeholder" sx={{ height: 180, mt: 1.1, borderRadius: '18px' }} />
              <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                <Button className="top-pill top-pill-green" variant="contained">Daily Earnings</Button>
                <Button className="top-pill" variant="contained">Weekly Earnings</Button>
              </Stack>
            </Box>

            <Box className="glass-card" sx={{ p: 1.2 }}>
              <Box sx={{ color: '#2a4277', fontSize: 30, fontWeight: 700, mb: 1 }}>Recent Deliveries</Box>
              <Box sx={{ borderRadius: 2, overflow: 'hidden', border: '1px solid rgba(152,171,212,0.33)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, color: '#2c4173' }}>
                  <thead style={{ background: 'rgba(234,240,253,0.85)' }}>
                    <tr>
                      <th style={{ textAlign: 'left', padding: 10 }}>Delivery ID</th>
                      <th style={{ textAlign: 'left', padding: 10 }}>Time</th>
                      <th style={{ textAlign: 'left', padding: 10 }}>Restaurant</th>
                      <th style={{ textAlign: 'left', padding: 10 }}>Fee</th>
                      <th style={{ textAlign: 'left', padding: 10 }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr><td style={{ padding: 10 }}>#ORD086</td><td>3:10 PM</td><td>Veggie Delight</td><td>LKR 200</td><td>Delivered</td></tr>
                    <tr><td style={{ padding: 10 }}>#ORD085</td><td>2:45 PM</td><td>Minton Bakery</td><td>LKR 150</td><td>Delivered</td></tr>
                    <tr><td style={{ padding: 10 }}>#ORD084</td><td>2:15 PM</td><td>FreshBite Cafe</td><td>LKR 180</td><td>Delivered</td></tr>
                  </tbody>
                </table>
              </Box>
            </Box>
          </Stack>
        </Grid>

        <Grid size={{ xs: 12, lg: 4.1 }}>
          <Stack spacing={1.1}>
            <Box className="glass-card" sx={{ p: 1.3 }}>
              <Box sx={{ color: '#243d72', fontSize: 36, fontWeight: 700, mb: 0.8 }}>Earnings Breakdown</Box>
              <Box className="map-placeholder" sx={{ height: 200, borderRadius: '18px' }} />
              <Box sx={{ mt: 1, color: '#385183', lineHeight: 1.8 }}>
                <div>Veggie Delight - LKR 14,520</div>
                <div>SpiceHub Restaurant - LKR 12,670</div>
                <div>FreshBite Cafe - LKR 9,120</div>
              </Box>
            </Box>
            <Box className="glass-card" sx={{ p: 1.2 }}>
              <Box sx={{ color: '#2d477d', fontSize: 30, fontWeight: 700, mb: 0.5 }}>Recent Deliveries</Box>
              <Box sx={{ color: '#3e5888', lineHeight: 1.8 }}>
                <div>#ORD086 Veggie Delight LKR 200</div>
                <div>#ORD085 Minton Bakery LKR 150</div>
                <div>#ORD084 FreshBite Cafe LKR 160</div>
              </Box>
            </Box>
          </Stack>
        </Grid>
      </Grid>
    </Stack>
  )
}

export default Earnings
