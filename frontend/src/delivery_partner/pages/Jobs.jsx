import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Grid,
  Skeleton,
  Stack,
} from '@mui/material'
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded'
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded'
import PaidRoundedIcon from '@mui/icons-material/PaidRounded'
import PlaceRoundedIcon from '@mui/icons-material/PlaceRounded'
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded'
import api from '../api/axios'

const PINNED_COORDS_PATTERN = /pinned delivery location\s*\(\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*\)/i

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

function toCoordinateValue(value) {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : null
}

function hasValidCoordinatePair(lat, lng) {
  return Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180
}

function parsePinnedCoordinates(text = '') {
  const match = String(text || '').match(PINNED_COORDS_PATTERN)
  if (!match) return null
  const lat = toCoordinateValue(match[1])
  const lng = toCoordinateValue(match[2])
  if (!hasValidCoordinatePair(lat, lng)) return null
  return { lat, lng }
}

function buildCoordinateKey(lat, lng) {
  return `${Number(lat).toFixed(6)},${Number(lng).toFixed(6)}`
}

function isPinnedCoordinateAddress(address = '') {
  return PINNED_COORDS_PATTERN.test(String(address || ''))
}

function getOrderCoordinates(order) {
  const lat = toCoordinateValue(order?.delivery_latitude)
  const lng = toCoordinateValue(order?.delivery_longitude)
  if (hasValidCoordinatePair(lat, lng)) return { lat, lng }
  return parsePinnedCoordinates(order?.delivery_address)
}

function getRestaurantCoordinates(order) {
  const lat = toCoordinateValue(order?.restaurant?.latitude)
  const lng = toCoordinateValue(order?.restaurant?.longitude)
  if (hasValidCoordinatePair(lat, lng)) return { lat, lng }
  return null
}

function formatCurrency(value) {
  return `LKR ${toNumber(value).toLocaleString()}`
}

function postedLabel(createdAt) {
  if (!createdAt) return 'Posted recently'
  const created = new Date(createdAt)
  const now = new Date()
  const diffMin = Math.floor((now.getTime() - created.getTime()) / (1000 * 60))

  if (diffMin <= 1) return 'Posted just now'
  if (diffMin < 60) return `Posted ${diffMin} mins ago`
  const hours = Math.floor(diffMin / 60)
  if (hours < 24) return `Posted ${hours} hour${hours > 1 ? 's' : ''} ago`
  const days = Math.floor(hours / 24)
  return `Posted ${days} day${days > 1 ? 's' : ''} ago`
}

function getPickupAddress(order) {
  return String(order?.restaurant_address || order?.restaurant?.address || '').trim() || 'Pickup address unavailable'
}

function getDropAddress(order) {
  const rawAddress = String(order?.delivery_address || '').trim()
  if (rawAddress && !isPinnedCoordinateAddress(rawAddress)) return rawAddress

  const coords = getOrderCoordinates(order)
  if (coords) return `Pinned delivery location (${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)})`

  return rawAddress || 'Drop address unavailable'
}

function compactDisplayName(displayName = '') {
  const parts = String(displayName || '')
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
  if (!parts.length) return ''

  const first = parts[0]
  const second = parts[1] || ''
  const country = parts[parts.length - 1] || ''

  return [first, second, country]
    .filter(Boolean)
    .filter((value, index, list) => list.indexOf(value) === index)
    .join(', ')
}

function compactAddressFromNominatim(payload) {
  const addr = payload?.address || {}
  const road = addr.road || addr.pedestrian || addr.residential || ''
  const houseNumber = addr.house_number || ''
  const line1 = [houseNumber, road].filter(Boolean).join(' ').trim()
  const locality =
    addr.suburb ||
    addr.neighbourhood ||
    addr.village ||
    addr.town ||
    addr.city ||
    addr.hamlet ||
    ''
  const city =
    addr.city ||
    addr.town ||
    addr.municipality ||
    addr.state_district ||
    addr.county ||
    ''
  const country = addr.country || ''

  const parts = []
  if (line1) parts.push(line1)
  else if (locality) parts.push(locality)
  if (city && !parts.includes(city)) parts.push(city)
  if (country && !parts.includes(country)) parts.push(country)

  const compact = parts.join(', ').trim()
  if (compact) return compact
  return compactDisplayName(payload?.display_name || '')
}

async function reverseGeocodeCoordinates(lat, lng) {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}&zoom=18&addressdetails=1&accept-language=en`,
      { headers: { Accept: 'application/json' } }
    )
    if (!response.ok) return ''
    const payload = await response.json()
    return compactAddressFromNominatim(payload)
  } catch {
    return ''
  }
}

function jobMapUrl(order) {
  if (!order) return ''
  const pickupCoordinates = getRestaurantCoordinates(order)
  const dropCoordinates = getOrderCoordinates(order)
  const pickupAddress = getPickupAddress(order)
  const dropAddress = getDropAddress(order)

  if (
    hasValidCoordinatePair(pickupCoordinates?.lat, pickupCoordinates?.lng) &&
    hasValidCoordinatePair(dropCoordinates?.lat, dropCoordinates?.lng)
  ) {
    return `https://www.google.com/maps/dir/?api=1&origin=${pickupCoordinates.lat},${pickupCoordinates.lng}&destination=${dropCoordinates.lat},${dropCoordinates.lng}&travelmode=driving`
  }

  if (order?.maps_route_url) return order.maps_route_url

  if (hasValidCoordinatePair(dropCoordinates?.lat, dropCoordinates?.lng)) {
    return `https://www.google.com/maps/search/?api=1&query=${dropCoordinates.lat},${dropCoordinates.lng}`
  }

  if (dropAddress) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(dropAddress)}`
  }

  if (pickupAddress) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(pickupAddress)}`
  }

  return ''
}

function jobMapEmbedUrl(order) {
  if (!order) return ''
  const dropCoordinates = getOrderCoordinates(order)
  const pickupCoordinates = getRestaurantCoordinates(order)

  if (hasValidCoordinatePair(dropCoordinates?.lat, dropCoordinates?.lng)) {
    return `https://maps.google.com/maps?q=${dropCoordinates.lat},${dropCoordinates.lng}&z=14&output=embed`
  }

  if (hasValidCoordinatePair(pickupCoordinates?.lat, pickupCoordinates?.lng)) {
    return `https://maps.google.com/maps?q=${pickupCoordinates.lat},${pickupCoordinates.lng}&z=14&output=embed`
  }

  const dropAddress = getDropAddress(order)
  if (dropAddress) {
    return `https://maps.google.com/maps?q=${encodeURIComponent(dropAddress)}&z=13&output=embed`
  }

  return ''
}

function Jobs() {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [acceptingJobId, setAcceptingJobId] = useState(null)
  const [selectedJobId, setSelectedJobId] = useState(null)
  const [resolvedAddressByCoord, setResolvedAddressByCoord] = useState({})
  const [resolvingCoordMap, setResolvingCoordMap] = useState({})

  const fetchJobs = useCallback(async (initialLoad = false) => {
    if (initialLoad) setLoading(true)
    else setRefreshing(true)

    setError('')
    try {
      const response = await api.get('/api/orders/delivery/available/')
      const list = normalizeList(response?.data)
      setJobs(list)
    } catch (err) {
      console.error('Fetch jobs error:', err)
      setJobs([])
      setError(err?.response?.data?.detail || err?.response?.data?.error || 'Failed to load jobs')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchJobs(true)
  }, [fetchJobs])

  useEffect(() => {
    if (!jobs.length) {
      setSelectedJobId(null)
      return
    }

    const exists = jobs.some((job) => job.id === selectedJobId)
    if (!exists) setSelectedJobId(jobs[0].id)
  }, [jobs, selectedJobId])

  const selectedJob = useMemo(() => {
    if (!jobs.length) return null
    return jobs.find((job) => job.id === selectedJobId) || jobs[0]
  }, [jobs, selectedJobId])

  const ordersForAddressLookup = useMemo(() => {
    return jobs
      .map((job) => {
        const rawAddress = String(job?.delivery_address || '').trim()
        const looksPinned = !rawAddress || isPinnedCoordinateAddress(rawAddress)
        if (!looksPinned) return null
        const coords = getOrderCoordinates(job)
        if (!coords) return null
        const coordKey = buildCoordinateKey(coords.lat, coords.lng)
        return { coordKey, coords }
      })
      .filter(Boolean)
  }, [jobs])

  useEffect(() => {
    const pending = ordersForAddressLookup.filter(({ coordKey }) => {
      return !resolvedAddressByCoord[coordKey] && !resolvingCoordMap[coordKey]
    })
    if (!pending.length) return

    const nextResolving = {}
    pending.forEach(({ coordKey }) => {
      nextResolving[coordKey] = true
    })
    setResolvingCoordMap((prev) => ({ ...prev, ...nextResolving }))

    Promise.all(
      pending.map(async ({ coordKey, coords }) => {
        const address = await reverseGeocodeCoordinates(coords.lat, coords.lng)
        return { coordKey, address }
      })
    )
      .then((results) => {
        setResolvedAddressByCoord((prev) => {
          const next = { ...prev }
          results.forEach(({ coordKey, address }) => {
            if (address) next[coordKey] = address
          })
          return next
        })
      })
      .finally(() => {
        setResolvingCoordMap((prev) => {
          const next = { ...prev }
          pending.forEach(({ coordKey }) => {
            delete next[coordKey]
          })
          return next
        })
      })
  }, [ordersForAddressLookup, resolvedAddressByCoord, resolvingCoordMap])

  const getCurrentCoordinatesForAccept = useCallback(async () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      return null
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = toCoordinateValue(position?.coords?.latitude)
          const lng = toCoordinateValue(position?.coords?.longitude)
          if (!hasValidCoordinatePair(lat, lng)) {
            resolve(null)
            return
          }
          resolve({
            lat: Number(lat.toFixed(6)),
            lng: Number(lng.toFixed(6)),
          })
        },
        () => resolve(null),
        { enableHighAccuracy: true, timeout: 7000, maximumAge: 10000 }
      )
    })
  }, [])

  const getDisplayDropAddress = useCallback(
    (job) => {
      const rawAddress = String(job?.delivery_address || '').trim()
      if (rawAddress && !isPinnedCoordinateAddress(rawAddress)) return rawAddress

      const coords = getOrderCoordinates(job)
      if (!coords) return rawAddress || 'Drop address unavailable'

      const coordKey = buildCoordinateKey(coords.lat, coords.lng)
      if (resolvedAddressByCoord[coordKey]) return resolvedAddressByCoord[coordKey]
      if (resolvingCoordMap[coordKey]) return 'Resolving address...'
      return 'Pinned delivery location'
    },
    [resolvedAddressByCoord, resolvingCoordMap]
  )

  const avgEta = useMemo(() => {
    const values = jobs.map((job) => toNumber(job?.estimated_delivery_time)).filter((value) => value > 0)
    if (!values.length) return 0
    const avg = values.reduce((sum, value) => sum + value, 0) / values.length
    return Math.round(avg)
  }, [jobs])

  const avgDistance = useMemo(() => {
    const values = jobs.map((job) => toNumber(job?.route_distance_km)).filter((value) => value > 0)
    if (!values.length) return 0
    const avg = values.reduce((sum, value) => sum + value, 0) / values.length
    return Number(avg.toFixed(1))
  }, [jobs])

  const highPayJobs = useMemo(
    () => jobs.filter((job) => toNumber(job?.delivery_charge) >= 200).length,
    [jobs]
  )

  const topFee = useMemo(() => {
    if (!jobs.length) return 0
    return Math.max(...jobs.map((job) => toNumber(job?.delivery_charge)))
  }, [jobs])

  const acceptJob = async (id) => {
    if (!id) return
    if (!window.confirm('Accept this delivery job?')) return

    setAcceptingJobId(id)
    try {
      const currentCoords = await getCurrentCoordinatesForAccept()
      const payload = currentCoords
        ? {
            rider_latitude: currentCoords.lat,
            rider_longitude: currentCoords.lng,
          }
        : {}
      await api.post(`/api/orders/delivery/${id}/accept/`, payload)
      await fetchJobs(false)
      setError('')
    } catch (err) {
      setError(err?.response?.data?.detail || err?.response?.data?.error || 'Failed to accept job')
    } finally {
      setAcceptingJobId(null)
    }
  }

  if (loading) {
    return (
      <Stack spacing={1.1}>
        <Skeleton variant="rounded" height={120} sx={{ borderRadius: 5 }} />
        <Skeleton variant="rounded" height={260} sx={{ borderRadius: 5 }} />
        <Skeleton variant="rounded" height={260} sx={{ borderRadius: 5 }} />
      </Stack>
    )
  }

  return (
    <Stack spacing={1.4}>
      {error ? <Alert severity="error">{error}</Alert> : null}

      <Grid container spacing={1.1}>
        <Grid size={{ xs: 12, md: 3 }}>
          <Box className="glass-card" sx={{ p: 1.2 }}>
            <Box sx={{ color: 'var(--delivery-muted)', fontSize: 15 }}>Available Jobs</Box>
            <Box sx={{ color: 'var(--delivery-text)', fontWeight: 700, fontSize: 30 }}>{jobs.length}</Box>
          </Box>
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <Box className="glass-card" sx={{ p: 1.2 }}>
            <Box sx={{ color: 'var(--delivery-muted)', fontSize: 15 }}>High Pay Jobs</Box>
            <Box sx={{ color: 'var(--delivery-text)', fontWeight: 700, fontSize: 30 }}>{highPayJobs}</Box>
          </Box>
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <Box className="glass-card" sx={{ p: 1.2 }}>
            <Box sx={{ color: 'var(--delivery-muted)', fontSize: 15 }}>Average ETA</Box>
            <Box sx={{ color: 'var(--delivery-text)', fontWeight: 700, fontSize: 30 }}>
              {avgEta ? `${avgEta} min` : '--'}
            </Box>
          </Box>
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <Box className="glass-card" sx={{ p: 1.2 }}>
            <Box sx={{ color: 'var(--delivery-muted)', fontSize: 15 }}>Average Distance</Box>
            <Box sx={{ color: 'var(--delivery-text)', fontWeight: 700, fontSize: 30 }}>
              {avgDistance ? `${avgDistance} km` : '--'}
            </Box>
          </Box>
        </Grid>
      </Grid>

      <Grid container spacing={1.5}>
        <Grid size={{ xs: 12, lg: 7.8 }}>
          <Stack spacing={1.1}>
            {jobs.length ? (
              jobs.map((job) => {
                const selected = job.id === selectedJob?.id
                return (
                  <Box
                    key={job.id}
                    className="delivery-job-card"
                    sx={{
                      borderColor: selected ? 'rgba(201,168,76,0.78)' : '#e2d2bc',
                      boxShadow: selected ? '0 0 0 2px rgba(201,168,76,0.18)' : 'none',
                      cursor: 'pointer',
                    }}
                    onClick={() => setSelectedJobId(job.id)}
                  >
                    <Grid container spacing={1} alignItems="center">
                      <Grid size={{ xs: 12, md: 8 }}>
                        <Box className="delivery-job-card__top">
                          <Box>
                            <Box className="delivery-job-card__restaurant">{job?.restaurant_name || 'Restaurant'}</Box>
                            <Box className="delivery-job-card__order">#ORD{job?.id}</Box>
                          </Box>
                          <Box className="delivery-job-card__amount">
                            {formatCurrency(job?.delivery_charge)}
                          </Box>
                        </Box>

                        <Box className="delivery-job-card__meta">
                          <span>Pickup</span>
                          <p>{getPickupAddress(job)}</p>
                        </Box>
                        <Box className="delivery-job-card__meta">
                          <span>Drop-off</span>
                          <p>{getDisplayDropAddress(job)}</p>
                        </Box>
                        <Box className="delivery-job-card__meta-row">
                          <small>{postedLabel(job?.created_at)}</small>
                          <small>{job?.student_name || 'Student'}</small>
                        </Box>
                      </Grid>

                      <Grid size={{ xs: 12, md: 4 }}>
                        <Stack spacing={0.85}>
                          <Stack direction="row" alignItems="center" spacing={0.6}>
                            <AccessTimeRoundedIcon sx={{ fontSize: 17, color: 'var(--delivery-muted)' }} />
                            <Box sx={{ color: 'var(--delivery-text)', fontWeight: 700 }}>
                              {toNumber(job?.estimated_delivery_time) > 0 ? `${toNumber(job?.estimated_delivery_time)} min` : 'ETA pending'}
                            </Box>
                          </Stack>
                          <Stack direction="row" alignItems="center" spacing={0.6}>
                            <PlaceRoundedIcon sx={{ fontSize: 17, color: 'var(--delivery-muted)' }} />
                            <Box sx={{ color: 'var(--delivery-text)', fontWeight: 700 }}>
                              {toNumber(job?.route_distance_km) > 0 ? `${toNumber(job?.route_distance_km).toFixed(2)} km` : 'Distance pending'}
                            </Box>
                          </Stack>
                          <Stack direction="row" alignItems="center" spacing={0.6}>
                            <PaidRoundedIcon sx={{ fontSize: 17, color: 'var(--delivery-muted)' }} />
                            <Box sx={{ color: 'var(--delivery-muted)', fontSize: 13 }}>
                              Food {formatCurrency(job?.food_price)} + Fee {formatCurrency(job?.delivery_charge)}
                            </Box>
                          </Stack>

                          <Button
                            className="top-pill top-pill-green"
                            variant="contained"
                            disabled={acceptingJobId === job.id}
                            onClick={(event) => {
                              event.stopPropagation()
                              acceptJob(job.id)
                            }}
                          >
                            {acceptingJobId === job.id ? 'Accepting...' : 'Accept Job'}
                          </Button>
                        </Stack>
                      </Grid>
                    </Grid>
                  </Box>
                )
              })
            ) : (
              <Box className="glass-card" sx={{ p: 1.6, textAlign: 'center' }}>
                <Box sx={{ color: 'var(--delivery-text)', fontSize: 22, fontWeight: 700 }}>
                  No jobs available right now
                </Box>
                <Box sx={{ color: 'var(--delivery-muted)', mt: 0.6, mb: 1.1 }}>
                  New delivery requests will appear here automatically.
                </Box>
                <Button
                  className="top-pill top-pill-green"
                  variant="contained"
                  startIcon={<RefreshRoundedIcon />}
                  disabled={refreshing}
                  onClick={() => fetchJobs(false)}
                >
                  {refreshing ? 'Refreshing...' : 'Refresh Jobs'}
                </Button>
              </Box>
            )}
          </Stack>
        </Grid>

        <Grid size={{ xs: 12, lg: 4.2 }}>
          <Stack spacing={1.1}>
            <Box className="glass-card" sx={{ p: 1.3 }}>
              <Box sx={{ color: 'var(--delivery-text)', fontSize: 28, fontWeight: 700, mb: 0.8 }}>
                Job Preview
              </Box>

              {selectedJob ? (
                <>
                  <Box
                    sx={{
                      border: '1px solid rgba(201,168,76,0.35)',
                      borderRadius: '18px',
                      overflow: 'hidden',
                      height: 190,
                      background: '#f7efe1',
                    }}
                  >
                    {jobMapEmbedUrl(selectedJob) ? (
                      <iframe
                        title={`Job ${selectedJob.id} map`}
                        src={jobMapEmbedUrl(selectedJob)}
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        style={{ width: '100%', height: '100%', border: 'none' }}
                      />
                    ) : (
                      <Box className="map-placeholder" sx={{ height: '100%' }} />
                    )}
                  </Box>

                  <Grid container sx={{ mt: 1.2 }}>
                    <Grid size={4}>
                      <Box sx={{ color: 'var(--delivery-text)', fontWeight: 700 }}>
                        {toNumber(selectedJob?.route_distance_km) > 0
                          ? `${toNumber(selectedJob?.route_distance_km).toFixed(2)} km`
                          : '--'}
                      </Box>
                    </Grid>
                    <Grid size={4}>
                      <Box sx={{ color: 'var(--delivery-text)', fontWeight: 700 }}>
                        {toNumber(selectedJob?.estimated_delivery_time) > 0
                          ? `${toNumber(selectedJob?.estimated_delivery_time)} min`
                          : '--'}
                      </Box>
                    </Grid>
                    <Grid size={4}>
                      <Box sx={{ color: 'var(--delivery-accent)', fontWeight: 700 }}>
                        {formatCurrency(selectedJob?.delivery_charge)}
                      </Box>
                    </Grid>
                  </Grid>

                  <Button
                    className="top-pill top-pill-green"
                    fullWidth
                    sx={{ mt: 1 }}
                    disabled={acceptingJobId === selectedJob.id}
                    onClick={() => acceptJob(selectedJob.id)}
                  >
                    {acceptingJobId === selectedJob.id ? 'Accepting...' : 'Accept This Job'}
                  </Button>
                  <Button
                    className="top-pill"
                    fullWidth
                    sx={{ mt: 1 }}
                    disabled={!jobMapUrl(selectedJob)}
                    component="a"
                    href={jobMapUrl(selectedJob) || '#'}
                    target="_blank"
                    rel="noreferrer"
                    startIcon={<OpenInNewRoundedIcon />}
                  >
                    Open in Google Maps
                  </Button>
                </>
              ) : (
                <Box sx={{ color: 'var(--delivery-muted)', fontSize: 14 }}>
                  Select a job to see route preview and actions.
                </Box>
              )}
            </Box>

            <Box className="glass-card" sx={{ p: 1.2 }}>
              <Box sx={{ color: 'var(--delivery-muted)', fontSize: 14 }}>Best current fee</Box>
              <Box sx={{ color: 'var(--delivery-accent)', fontWeight: 800, fontSize: 26 }}>
                {formatCurrency(topFee)}
              </Box>
            </Box>
          </Stack>
        </Grid>
      </Grid>
    </Stack>
  )
}

export default Jobs
