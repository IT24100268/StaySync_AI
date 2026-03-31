import { useCallback, useEffect, useMemo, useState } from 'react'
import { Alert, Box, Button, Grid, Skeleton, Stack } from '@mui/material'
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import api from '../api/axios'

const DAY_MS = 24 * 60 * 60 * 1000

function normalizeList(payload) {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.results)) return payload.results
  if (Array.isArray(payload?.data)) return payload.data
  return []
}

function toNumber(value, fallback = 0) {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : fallback
}

function getDate(value) {
  const date = new Date(value || '')
  return Number.isNaN(date.getTime()) ? null : date
}

function getStatus(order) {
  return String(order?.status || '').trim().toLowerCase()
}

function isCompleted(order) {
  return getStatus(order) === 'delivered'
}

function isCanceled(order) {
  const status = getStatus(order)
  return status === 'rejected' || status === 'cancelled' || status === 'canceled'
}

function isActive(order) {
  const status = getStatus(order)
  return status === 'ready' || status === 'accepted' || status === 'out_for_delivery'
}

function getCompletionDate(order) {
  return getDate(order?.updated_at || order?.estimated_delivery_at || order?.created_at)
}

function getPayout(order) {
  return toNumber(order?.delivery_charge ?? order?.delivery_fee_rounded, 0)
}

function formatCurrency(value) {
  return `LKR ${toNumber(value).toLocaleString()}`
}

function formatDateTime(value) {
  const date = getDate(value)
  if (!date) return 'N/A'
  return date.toLocaleString('en-LK', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function statusClass(status = '') {
  const key = String(status || '').toLowerCase()
  if (key === 'delivered') return 'is-delivered'
  if (key === 'out_for_delivery') return 'is-active'
  if (key === 'assigned' || key === 'ready' || key === 'accepted') return 'is-progress'
  if (key === 'cancelled' || key === 'canceled' || key === 'rejected') return 'is-cancelled'
  return 'is-pending'
}

function formatStatus(status = '') {
  const raw = String(status || '').toLowerCase()
  if (!raw) return 'Unknown'
  if (raw === 'out_for_delivery') return 'Out For Delivery'
  if (raw === 'rejected') return 'Cancelled'
  return raw.replaceAll('_', ' ').replace(/\b\w/g, (ch) => ch.toUpperCase())
}

function isSameDay(left, right) {
  return (
    left &&
    right &&
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  )
}

function isWithinLastDays(date, days) {
  if (!date) return false
  const now = new Date()
  const start = new Date(now.getTime() - (days - 1) * DAY_MS)
  start.setHours(0, 0, 0, 0)
  return date >= start && date <= now
}

function isSameMonth(left, right) {
  return left && right && left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth()
}

function getLocalDateKey(date) {
  if (!date) return ''
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function buildLast7DaysSeries(completedDeliveries) {
  const now = new Date()
  const start = new Date(now.getTime() - 6 * DAY_MS)
  start.setHours(0, 0, 0, 0)

  const series = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start.getTime() + index * DAY_MS)
    return {
      key: getLocalDateKey(date),
      label: date.toLocaleDateString('en-LK', { weekday: 'short' }),
      earnings: 0,
      deliveries: 0,
    }
  })

  const indexByDay = new Map(series.map((item, index) => [item.key, index]))

  completedDeliveries.forEach((order) => {
    const completedAt = getCompletionDate(order)
    if (!completedAt || completedAt < start || completedAt > now) return
    const dayKey = getLocalDateKey(completedAt)
    const index = indexByDay.get(dayKey)
    if (index === undefined) return
    series[index].earnings += getPayout(order)
    series[index].deliveries += 1
  })

  return series
}

function Earnings() {
  const [deliveries, setDeliveries] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [tableFilter, setTableFilter] = useState('all')

  const fetchEarnings = useCallback(async (initialLoad = false) => {
    if (initialLoad) setLoading(true)
    else setRefreshing(true)
    setError('')
    try {
      const response = await api.get('/api/orders/delivery/my-deliveries/?status=all')
      setDeliveries(normalizeList(response?.data))
    } catch (err) {
      setDeliveries([])
      setError(err?.response?.data?.detail || err?.response?.data?.error || 'Failed to load earnings data')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchEarnings(true)
  }, [fetchEarnings])

  const sortedDeliveries = useMemo(() => {
    return [...deliveries].sort((first, second) => {
      const firstTime = getDate(first?.updated_at || first?.created_at)?.getTime() || 0
      const secondTime = getDate(second?.updated_at || second?.created_at)?.getTime() || 0
      return secondTime - firstTime
    })
  }, [deliveries])

  const completedDeliveries = useMemo(
    () => sortedDeliveries.filter((delivery) => isCompleted(delivery)),
    [sortedDeliveries]
  )

  const canceledDeliveries = useMemo(
    () => sortedDeliveries.filter((delivery) => isCanceled(delivery)),
    [sortedDeliveries]
  )

  const activeDeliveries = useMemo(
    () => sortedDeliveries.filter((delivery) => isActive(delivery)),
    [sortedDeliveries]
  )

  const now = new Date()

  const todayCompleted = useMemo(
    () => completedDeliveries.filter((delivery) => isSameDay(getCompletionDate(delivery), now)),
    [completedDeliveries, now]
  )

  const todayEarnings = useMemo(
    () => todayCompleted.reduce((sum, delivery) => sum + getPayout(delivery), 0),
    [todayCompleted]
  )

  const weekEarnings = useMemo(
    () =>
      completedDeliveries.reduce((sum, delivery) => {
        const completedAt = getCompletionDate(delivery)
        if (!isWithinLastDays(completedAt, 7)) return sum
        return sum + getPayout(delivery)
      }, 0),
    [completedDeliveries]
  )

  const monthEarnings = useMemo(
    () =>
      completedDeliveries.reduce((sum, delivery) => {
        const completedAt = getCompletionDate(delivery)
        if (!isSameMonth(completedAt, now)) return sum
        return sum + getPayout(delivery)
      }, 0),
    [completedDeliveries, now]
  )

  const totalEarnings = useMemo(
    () => completedDeliveries.reduce((sum, delivery) => sum + getPayout(delivery), 0),
    [completedDeliveries]
  )

  const avgFee = useMemo(
    () => (completedDeliveries.length ? Math.round(totalEarnings / completedDeliveries.length) : 0),
    [completedDeliveries.length, totalEarnings]
  )

  const avgEta = useMemo(() => {
    const etaValues = completedDeliveries
      .map((delivery) => toNumber(delivery?.estimated_delivery_time || delivery?.total_eta_minutes))
      .filter((value) => value > 0)
    if (!etaValues.length) return 0
    return Math.round(etaValues.reduce((sum, value) => sum + value, 0) / etaValues.length)
  }, [completedDeliveries])

  const completionRate = useMemo(() => {
    const finalCount = completedDeliveries.length + canceledDeliveries.length
    if (!finalCount) return 0
    return Math.round((completedDeliveries.length / finalCount) * 100)
  }, [completedDeliveries.length, canceledDeliveries.length])

  const trendSeries = useMemo(
    () => buildLast7DaysSeries(completedDeliveries),
    [completedDeliveries]
  )

  const restaurantBreakdown = useMemo(() => {
    const map = new Map()
    completedDeliveries.forEach((delivery) => {
      const name =
        String(delivery?.restaurant_name || delivery?.restaurant?.name || 'Restaurant').trim() ||
        'Restaurant'

      if (!map.has(name)) {
        map.set(name, { name, deliveries: 0, earnings: 0 })
      }

      const row = map.get(name)
      row.deliveries += 1
      row.earnings += getPayout(delivery)
    })

    return [...map.values()].sort((first, second) => second.earnings - first.earnings).slice(0, 6)
  }, [completedDeliveries])

  const tableRows = useMemo(() => {
    if (tableFilter === 'completed') return completedDeliveries
    if (tableFilter === 'canceled') return canceledDeliveries
    if (tableFilter === 'active') return activeDeliveries
    return sortedDeliveries
  }, [activeDeliveries, canceledDeliveries, completedDeliveries, sortedDeliveries, tableFilter])

  if (loading) {
    return <Skeleton variant="rounded" height={520} sx={{ borderRadius: 5 }} />
  }

  return (
    <Stack spacing={1.4}>
      {error ? <Alert severity="error">{error}</Alert> : null}

      <Grid container spacing={1.1}>
        <Grid size={{ xs: 12, md: 3 }}>
          <Box className="glass-card" sx={{ p: 1.2 }}>
            <Box sx={{ color: 'var(--delivery-muted)', fontSize: 15 }}>Today's Earnings</Box>
            <Box sx={{ color: 'var(--delivery-accent)', fontWeight: 700, fontSize: 34 }}>
              {formatCurrency(todayEarnings)}
            </Box>
            <Box sx={{ color: 'var(--delivery-muted)', fontSize: 12 }}>{todayCompleted.length} completed today</Box>
          </Box>
        </Grid>

        <Grid size={{ xs: 12, md: 3 }}>
          <Box className="glass-card" sx={{ p: 1.2 }}>
            <Box sx={{ color: 'var(--delivery-muted)', fontSize: 15 }}>This Week</Box>
            <Box sx={{ color: 'var(--delivery-text)', fontWeight: 700, fontSize: 34 }}>
              {formatCurrency(weekEarnings)}
            </Box>
            <Box sx={{ color: 'var(--delivery-muted)', fontSize: 12 }}>Last 7 days</Box>
          </Box>
        </Grid>

        <Grid size={{ xs: 12, md: 3 }}>
          <Box className="glass-card" sx={{ p: 1.2 }}>
            <Box sx={{ color: 'var(--delivery-muted)', fontSize: 15 }}>This Month</Box>
            <Box sx={{ color: 'var(--delivery-text)', fontWeight: 700, fontSize: 34 }}>
              {formatCurrency(monthEarnings)}
            </Box>
            <Box sx={{ color: 'var(--delivery-muted)', fontSize: 12 }}>Current month earnings</Box>
          </Box>
        </Grid>

        <Grid size={{ xs: 12, md: 3 }}>
          <Box className="glass-card" sx={{ p: 1.2 }}>
            <Box sx={{ color: 'var(--delivery-muted)', fontSize: 15 }}>Total Earnings</Box>
            <Box sx={{ color: 'var(--delivery-accent)', fontWeight: 700, fontSize: 34 }}>
              {formatCurrency(totalEarnings)}
            </Box>
            <Box sx={{ color: 'var(--delivery-muted)', fontSize: 12 }}>{completedDeliveries.length} completed deliveries</Box>
          </Box>
        </Grid>
      </Grid>

      <Grid container spacing={1.5}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Stack spacing={1.1}>
            <Box className="glass-card" sx={{ p: 1.3 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                <Box sx={{ color: 'var(--delivery-text)', fontSize: 30, fontWeight: 700 }}>
                  Earnings Trend (Last 7 Days)
                </Box>
                <Button
                  className="top-pill"
                  variant="contained"
                  startIcon={<RefreshRoundedIcon />}
                  disabled={refreshing}
                  onClick={() => fetchEarnings(false)}
                >
                  {refreshing ? 'Refreshing...' : 'Refresh'}
                </Button>
              </Stack>

              <Box sx={{ height: 240 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trendSeries}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(170,136,94,0.22)" />
                    <XAxis dataKey="label" tick={{ fill: 'var(--delivery-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: 'var(--delivery-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Tooltip
                      formatter={(value, name) => {
                        if (name === 'earnings') return [formatCurrency(value), 'Earnings']
                        return [value, 'Deliveries']
                      }}
                      labelFormatter={(label) => `Day: ${label}`}
                    />
                    <Bar dataKey="earnings" name="earnings" fill="var(--delivery-accent)" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </Box>

            <Box className="glass-card" sx={{ p: 1.2 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                <Box sx={{ color: 'var(--delivery-text)', fontSize: 28, fontWeight: 700 }}>Recent Delivery Earnings</Box>
                <Stack direction="row" spacing={0.7}>
                  <Button className={`top-pill ${tableFilter === 'all' ? 'top-pill-green' : ''}`} variant="contained" onClick={() => setTableFilter('all')}>
                    All
                  </Button>
                  <Button className={`top-pill ${tableFilter === 'completed' ? 'top-pill-green' : ''}`} variant="contained" onClick={() => setTableFilter('completed')}>
                    Completed
                  </Button>
                  <Button className={`top-pill ${tableFilter === 'canceled' ? 'top-pill-green' : ''}`} variant="contained" onClick={() => setTableFilter('canceled')}>
                    Canceled
                  </Button>
                </Stack>
              </Stack>

              <Box className="delivery-table-wrap">
                <table className="delivery-table">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Completed/Updated</th>
                      <th>Restaurant</th>
                      <th>Payout</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableRows.length ? (
                      tableRows.slice(0, 12).map((delivery) => {
                        const status = getStatus(delivery)
                        const payout = status === 'delivered' ? getPayout(delivery) : 0
                        return (
                          <tr key={delivery.id}>
                            <td>#ORD{delivery.id}</td>
                            <td>{formatDateTime(delivery.updated_at || delivery.created_at)}</td>
                            <td>{delivery.restaurant_name || delivery.restaurant?.name || 'Restaurant'}</td>
                            <td>{formatCurrency(payout)}</td>
                            <td>
                              <span className={`delivery-status-chip ${statusClass(delivery.status)}`}>
                                {formatStatus(delivery.status)}
                              </span>
                            </td>
                          </tr>
                        )
                      })
                    ) : (
                      <tr>
                        <td colSpan={5} className="delivery-table__empty">
                          No deliveries in this filter.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </Box>
            </Box>
          </Stack>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <Stack spacing={1.1}>
            <Box className="glass-card" sx={{ p: 1.3 }}>
              <Box sx={{ color: 'var(--delivery-text)', fontSize: 30, fontWeight: 700, mb: 0.8 }}>
                Useful Insights
              </Box>
              <Stack spacing={0.7} sx={{ color: 'var(--delivery-muted)' }}>
                <Box>Active Deliveries: <strong style={{ color: 'var(--delivery-text)' }}>{activeDeliveries.length}</strong></Box>
                <Box>Canceled Deliveries: <strong style={{ color: 'var(--delivery-text)' }}>{canceledDeliveries.length}</strong></Box>
                <Box>Completion Rate: <strong style={{ color: 'var(--delivery-text)' }}>{completionRate}%</strong></Box>
                <Box>Average Payout: <strong style={{ color: 'var(--delivery-text)' }}>{formatCurrency(avgFee)}</strong></Box>
                <Box>Average ETA: <strong style={{ color: 'var(--delivery-text)' }}>{avgEta ? `${avgEta} min` : '--'}</strong></Box>
              </Stack>
            </Box>

            <Box className="glass-card" sx={{ p: 1.3 }}>
              <Box sx={{ color: 'var(--delivery-text)', fontSize: 30, fontWeight: 700, mb: 0.8 }}>
                Restaurant Breakdown
              </Box>
              <Stack spacing={0.75}>
                {restaurantBreakdown.length ? (
                  restaurantBreakdown.map((row) => (
                    <Box
                      key={row.name}
                      sx={{
                        border: '1px solid rgba(201,168,76,0.28)',
                        borderRadius: '12px',
                        p: 0.8,
                        background: 'rgba(255,252,247,0.65)',
                      }}
                    >
                      <Box sx={{ color: 'var(--delivery-text)', fontWeight: 700 }}>{row.name}</Box>
                      <Box sx={{ color: 'var(--delivery-muted)', fontSize: 13 }}>
                        {row.deliveries} deliveries • {formatCurrency(row.earnings)}
                      </Box>
                    </Box>
                  ))
                ) : (
                  <Box sx={{ color: 'var(--delivery-muted)', fontSize: 14 }}>
                    No completed delivery earnings yet.
                  </Box>
                )}
              </Stack>
            </Box>
          </Stack>
        </Grid>
      </Grid>
    </Stack>
  )
}

export default Earnings
