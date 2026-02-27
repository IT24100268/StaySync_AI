import { useCallback, useEffect, useState } from 'react'
import { Alert, Box, Button, Grid, Skeleton, Stack, Tab, Tabs } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { MiniMap } from '../components/AppLayout'
import { useAuth } from '../auth/AuthProvider'

function Dashboard() {
  const navigate = useNavigate()
  const [summary, setSummary] = useState({})
  const [deliveries, setDeliveries] = useState([])
  const [availableJobs, setAvailableJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [tableLoading, setTableLoading] = useState(true)
  const [error, setError] = useState('')
  const [tab, setTab] = useState('active')
  const [acceptingJobId, setAcceptingJobId] = useState(null)
  const { currentUsername } = useAuth()

  const fetchDeliveriesByTab = useCallback(async (selectedTab) => {
    setTableLoading(true)
    try {
      const statusForApi = selectedTab === 'canceled' ? 'all' : selectedTab
      const response = await api.get(`/api/my/deliveries/?status=${statusForApi}`)
      const rows = response?.data?.data || []

      if (selectedTab === 'canceled') {
        const canceledRows = rows.filter((delivery) => {
          const s = String(delivery?.status || '').toLowerCase()
          return s === 'cancelled' || s === 'canceled'
        })
        setDeliveries(canceledRows)
      } else {
        setDeliveries(rows)
      }
    } catch (err) {
      setError(err?.response?.data?.detail || 'Failed to load deliveries')
      setDeliveries([])
    } finally {
      setTableLoading(false)
    }
  }, [])

  const fetchSummary = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [summaryResponse, jobsResponse] = await Promise.all([
        api.get('/api/dashboard/summary/'),
        api.get('/api/jobs/available/?page_size=10'),
      ])
      setSummary(summaryResponse?.data?.data || {})
      setAvailableJobs(jobsResponse?.data?.data || [])
    } catch (err) {
      setError(err?.response?.data?.detail || 'Failed to load dashboard summary')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSummary()
  }, [fetchSummary])

  useEffect(() => {
    fetchDeliveriesByTab(tab)
  }, [tab, fetchDeliveriesByTab])

  if (loading) {
    return <Skeleton variant="rounded" height={520} sx={{ borderRadius: 5 }} />
  }

  const counts = summary?.counts || {}
  const partner = summary?.partner || {}
  const earnings = summary?.earnings || {}
  const activeDelivery = summary?.active_delivery || null
  const displayName = currentUsername || partner?.username || 'Partner'
  const topJobs = [...availableJobs]
    .sort((a, b) => {
      const priceA = Number(a?.total_price || 0)
      const priceB = Number(b?.total_price || 0)
      if (priceB !== priceA) {
        return priceB - priceA
      }
      const timeA = new Date(a?.created_at || 0).getTime()
      const timeB = new Date(b?.created_at || 0).getTime()
      return timeB - timeA
    })
    .slice(0, 2)
  const filteredDeliveries = deliveries

  const statusPillStyles = {
    track: {
      background: 'linear-gradient(145deg, #63a1ff 0%, #4a85ea 100%)',
      color: '#fff',
    },
    delivered: {
      background: 'linear-gradient(145deg, #5ac7a1 0%, #44ae88 100%)',
      color: '#fff',
    },
    picked: {
      background: 'linear-gradient(145deg, #8bd9cf 0%, #62bfb3 100%)',
      color: '#1c5f58',
    },
    canceled: {
      background: 'linear-gradient(145deg, #f4a4a4 0%, #df7f7f 100%)',
      color: '#7b1d1d',
    },
  }

  const renderStatusPill = (status) => {
    const value = String(status || '').toLowerCase()
    let label = 'Track'
    let style = statusPillStyles.track

    if (value === 'delivered') {
      label = 'Delivered'
      style = statusPillStyles.delivered
    } else if (value === 'picked') {
      label = 'Picked'
      style = statusPillStyles.picked
    } else if (value === 'cancelled' || value === 'canceled') {
      label = 'Canceled'
      style = statusPillStyles.canceled
    } else if (value === 'assigned' || value === 'onway') {
      label = 'Track'
      style = statusPillStyles.track
    }

    return (
      <Button
        size="small"
        sx={{
          borderRadius: '999px',
          minWidth: 84,
          fontSize: 12,
          px: 1.5,
          py: 0.2,
          ...style,
        }}
      >
        {label}
      </Button>
    )
  }

  const formatPosted = (createdAt) => {
    if (!createdAt) {
      return 'Posted recently'
    }
    const created = new Date(createdAt)
    const now = new Date()
    const diffMs = now.getTime() - created.getTime()
    const minutes = Math.max(1, Math.floor(diffMs / (1000 * 60)))
    if (minutes < 60) {
      return `Posted ${minutes} mins ago`
    }
    const hours = Math.floor(minutes / 60)
    return `Posted ${hours} hour${hours > 1 ? 's' : ''} ago`
  }

  const acceptJobFromDashboard = async (orderId) => {
    setAcceptingJobId(orderId)
    try {
      await api.post(`/api/jobs/${orderId}/accept/`)
      await fetchSummary()
      await fetchDeliveriesByTab(tab)
    } catch (err) {
      setError(err?.response?.data?.message || err?.response?.data?.detail || 'Failed to accept job')
    } finally {
      setAcceptingJobId(null)
    }
  }

  return (
    <Stack spacing={1.5}>
      {error ? <Alert severity="error">{error}</Alert> : null}
      <Box sx={{ color: '#2a4479', fontSize: 38, fontWeight: 700 }}>
        Welcome, {displayName}! <span style={{ fontWeight: 500 }}>View and manage your deliveries.</span>
      </Box>
      <Grid container spacing={1.5}>
        <Grid size={{ xs: 12, lg: 7.6 }}>
          <Stack spacing={1.4}>
            <Box className="glass-card" sx={{ p: 1.4 }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Box sx={{ color: '#2a447c', fontSize: 22, fontWeight: 700 }}>
                  <span style={{ color: '#2b8d69' }}>{counts.available_jobs ?? 0} New</span> Delivery Jobs
                </Box>
                <Button className="top-pill top-pill-green" variant="contained" onClick={fetchSummary}>
                  Refresh
                </Button>
              </Stack>

              <Grid container spacing={1.1} sx={{ mt: 0.6 }}>
                {topJobs.length ? (
                  topJobs.map((job) => (
                    <Grid key={job.id} size={{ xs: 12, md: 6 }}>
                      <Box className="glass-card" sx={{ p: 1.2 }}>
                        <Box sx={{ color: '#344f84', fontWeight: 700, fontSize: 18 }}>{job.restaurant_name}</Box>
                        <Box sx={{ color: '#1f3368', fontWeight: 800, fontSize: 36 }}>#ORD{job.id}</Box>
                        <Box sx={{ color: '#233a6f', fontSize: 44, fontWeight: 700 }}>
                          LKR {Number(job.total_price || 0).toFixed(0)}
                        </Box>
                        <Box sx={{ color: '#60759b', fontSize: 14, my: 0.2 }}>
                          Pickup: {job.pickup_address}
                        </Box>
                        <Box sx={{ color: '#60759b', fontSize: 14, mb: 0.4 }}>
                          Drop: {job.drop_address}
                        </Box>
                        <Box sx={{ color: '#60759b', fontSize: 15, my: 0.4 }}>{formatPosted(job.created_at)}</Box>
                        <Button
                          className="top-pill top-pill-green"
                          variant="contained"
                          fullWidth
                          disabled={acceptingJobId === job.id}
                          onClick={() => acceptJobFromDashboard(job.id)}
                        >
                          {acceptingJobId === job.id ? 'Accepting...' : 'Accept'}
                        </Button>
                      </Box>
                    </Grid>
                  ))
                ) : (
                  <Grid size={{ xs: 12 }}>
                    <Box className="glass-card" sx={{ p: 1.2, color: '#60759b' }}>
                      No new delivery jobs available right now.
                    </Box>
                  </Grid>
                )}
              </Grid>
            </Box>

            <Box className="glass-card" sx={{ p: 1.2 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Box sx={{ color: '#253d73', fontWeight: 700, fontSize: 42 }}>My Deliveries</Box>
                  <Tabs value={tab} onChange={(_, value) => setTab(value)} sx={{ minHeight: 30 }}>
                    <Tab label="Active" value="active" />
                    <Tab label="Completed" value="completed" />
                    <Tab label="Canceled" value="canceled" />
                    <Tab label="All" value="all" />
                  </Tabs>
                </Stack>
                <Button className="top-pill" variant="contained" onClick={() => navigate('/deliveries')}>
                  View All
                </Button>
              </Stack>
              <Box sx={{ borderRadius: 2, overflow: 'hidden', border: '1px solid rgba(152,171,212,0.33)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, color: '#2c4173' }}>
                  <thead style={{ background: 'rgba(234,240,253,0.85)' }}>
                    <tr>
                      <th style={{ textAlign: 'left', padding: 10 }}>Delivery ID</th>
                      <th style={{ textAlign: 'left', padding: 10 }}>Order</th>
                      <th style={{ textAlign: 'left', padding: 10 }}>Drop-off</th>
                      <th style={{ textAlign: 'left', padding: 10 }}>Earnings</th>
                      <th style={{ textAlign: 'left', padding: 10 }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableLoading ? (
                      <tr>
                        <td style={{ padding: 10 }} colSpan={5}>
                          Loading deliveries...
                        </td>
                      </tr>
                    ) : null}
                    {!tableLoading && filteredDeliveries.slice(0, 10).map((delivery) => (
                      <tr key={delivery.id}>
                        <td style={{ padding: 10 }}>#ORD{String(delivery?.order || '').padStart(3, '0')}</td>
                        <td>{delivery?.restaurant_name || delivery?.order_details?.restaurant_name || '-'}</td>
                        <td>{delivery?.drop_address || delivery?.order_details?.drop_address || '-'}</td>
                        <td>LKR {delivery?.earning_amount || delivery?.order_details?.total_price || '-'}</td>
                        <td>{renderStatusPill(delivery?.status)}</td>
                      </tr>
                    ))}
                    {!tableLoading && !filteredDeliveries.length ? (
                      <tr>
                        <td style={{ padding: 10 }} colSpan={5}>
                          No deliveries found for this filter.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </Box>
            </Box>
          </Stack>
        </Grid>

        <Grid size={{ xs: 12, lg: 4.4 }}>
          <Stack spacing={1.4}>
            <MiniMap label="On the way" />
            <Box className="glass-card" sx={{ p: 1.2 }}>
              <Box sx={{ color: '#2a447a', fontSize: 34, fontWeight: 700, mb: 0.8 }}>Active Delivery</Box>
              <Box sx={{ color: '#2e4b81', fontSize: 20, fontWeight: 700, mb: 0.8 }}>
                {activeDelivery ? `#ORD${activeDelivery.order}` : 'No Active Delivery'}
              </Box>
              <Box className="map-placeholder" sx={{ height: 150, borderRadius: '18px' }} />
              <Box className="route-progress" sx={{ mt: 1.2 }} />
            </Box>
          </Stack>
        </Grid>
      </Grid>
    </Stack>
  )
}

export default Dashboard
