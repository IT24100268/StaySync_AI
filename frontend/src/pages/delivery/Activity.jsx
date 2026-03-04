import { useCallback, useEffect, useState } from 'react'
import { Alert, Box, Button, Skeleton, Stack, Tab, Tabs } from '@mui/material'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import api from '../../services/api'

function Activity() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tab, setTab] = useState('all')

  const fetchActivity = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await api.get('/api/activity/')
      const list = Array.isArray(response.data) ? response.data : response?.data?.results || []
      setItems(list)
    } catch (err) {
      setError(err?.response?.data?.detail || 'Failed to load activity')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchActivity()
  }, [fetchActivity])

  if (loading) {
    return <Skeleton variant="rounded" height={520} sx={{ borderRadius: 5 }} />
  }

  return (
    <Stack spacing={1.2}>
      {error ? <Alert severity="error">{error}</Alert> : null}
      <Box className="glass-card" sx={{ p: 1.1 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" useFlexGap>
          <Tabs value={tab} onChange={(_, v) => setTab(v)}>
            <Tab value="all" label="All" />
            <Tab value="deliveries" label="Deliveries" />
            <Tab value="earnings" label="Earnings" />
            <Tab value="rating" label="Rating" />
            <Tab value="system" label="System" />
          </Tabs>
          <Stack direction="row" className="top-pill" sx={{ px: 1.2, py: 0.3, minWidth: 330, alignItems: 'center' }}>
            <SearchRoundedIcon sx={{ color: '#667ca4', fontSize: 19 }} />
            <Box component="span" sx={{ color: '#667ca4', fontSize: 15, ml: 0.6 }}>
              Search by order ID or keyword
            </Box>
          </Stack>
        </Stack>
      </Box>

      <Box className="glass-card" sx={{ p: 1.2 }}>
        <Box sx={{ color: '#253e73', fontSize: 38, fontWeight: 700, mb: 1 }}>Activity Log</Box>
        <Box sx={{ borderRadius: 2, overflow: 'hidden', border: '1px solid rgba(152,171,212,0.33)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, color: '#2c4173' }}>
            <thead style={{ background: 'rgba(234,240,253,0.85)' }}>
              <tr>
                <th style={{ textAlign: 'left', padding: 10 }}>Activity</th>
                <th style={{ textAlign: 'left', padding: 10 }}>Delivery ID</th>
                <th style={{ textAlign: 'left', padding: 10 }}>Time</th>
                <th style={{ textAlign: 'left', padding: 10 }}>Time</th>
              </tr>
            </thead>
            <tbody>
              {(items.length ? items : [{ id: 12 }, { id: 13 }, { id: 6 }]).map((item, idx) => (
                <tr key={item.id || idx}>
                  <td style={{ padding: 10 }}>{item.message || item.event || `You delivered order #ORD0${idx + 12}`}</td>
                  <td>{item.order_code || `#ORD0${idx + 12}`}</td>
                  <td>{item.timestamp || '10 mins ago'}</td>
                  <td>{item.timestamp || '10 mins ago'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Box>
        <Stack direction="row" justifyContent="center" sx={{ mt: 1.2 }}>
          <Button className="top-pill" variant="contained">Load More</Button>
        </Stack>
      </Box>
    </Stack>
  )
}

export default Activity
