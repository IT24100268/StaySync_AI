import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Alert, Box, Button, Grid, Skeleton, Stack, Tab, Tabs } from '@mui/material'
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded'
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded'
import WorkHistoryRoundedIcon from '@mui/icons-material/WorkHistoryRounded'
import LocalShippingRoundedIcon from '@mui/icons-material/LocalShippingRounded'
import VerifiedRoundedIcon from '@mui/icons-material/VerifiedRounded'
import PaidRoundedIcon from '@mui/icons-material/PaidRounded'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { useAuth } from '../auth/AuthProvider'
import { hasGoogleMapsApiKey, isGoogleMapsReady, loadGoogleMaps } from '../../utils/googleMapsLoader'

const ACTIVE_STATUS_PRIORITY = [
  'out_for_delivery',
  'assigned',
  'picked',
  'accepted',
  'ready',
  'preparing',
  'pending',
]

const PINNED_COORDS_PATTERN = /pinned delivery location\s*\(\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*\)/i
const DEFAULT_DELIVERY_MAP_CENTER = { lat: 9.6848, lng: 80.022 }
const LIVE_LOCATION_CAPTURE_TIMEOUT_MS = 18000
const LIVE_LOCATION_TARGET_ACCURACY_M = 45
const LIVE_LOCATION_GOOD_ACCURACY_M = 120
const LIVE_LOCATION_MAX_ACCEPTABLE_ACCURACY_M = 600

const ROOM_MARKER_ICON = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
<svg width="38" height="38" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M19 1.6C11.27 1.6 5 7.87 5 15.6c0 9.72 10.59 20.73 13.14 23.22a1.2 1.2 0 0 0 1.72 0C22.41 36.33 33 25.32 33 15.6 33 7.87 26.73 1.6 19 1.6Z" fill="#1F4F96"/>
  <rect x="10.8" y="13.2" width="16.4" height="6.1" rx="2" fill="white"/>
  <rect x="10.8" y="19.4" width="16.4" height="4.2" rx="1.4" fill="white"/>
  <rect x="13.4" y="14.6" width="4.8" height="3.1" rx="0.8" fill="#1F4F96"/>
</svg>
`)}`

const RESTAURANT_MARKER_ICON = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
<svg width="38" height="38" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M19 1.6C11.27 1.6 5 7.87 5 15.6c0 9.72 10.59 20.73 13.14 23.22a1.2 1.2 0 0 0 1.72 0C22.41 36.33 33 25.32 33 15.6 33 7.87 26.73 1.6 19 1.6Z" fill="#EF7F1A"/>
  <rect x="11" y="13" width="2.2" height="10.6" rx="1" fill="white"/>
  <rect x="14" y="13" width="2.2" height="6.2" rx="1" fill="white"/>
  <rect x="17" y="13" width="2.2" height="6.2" rx="1" fill="white"/>
  <rect x="21.8" y="13" width="5.2" height="10.6" rx="2.2" fill="white"/>
</svg>
`)}`

const USER_PIN_MARKER_ICON = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
<svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M18 1.8C10.38 1.8 4.2 7.98 4.2 15.6c0 9.14 9.87 19.54 12.24 21.87a1.05 1.05 0 0 0 1.48 0C20.33 35.14 30.2 24.74 30.2 15.6 30.2 7.98 24.02 1.8 18 1.8Z" fill="#EA4335"/>
  <circle cx="18" cy="15.8" r="5.3" fill="white"/>
</svg>
`)}`

function normalizeList(payload) {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.results)) return payload.results
  if (Array.isArray(payload?.data)) return payload.data
  return []
}

function toNumber(value) {
  const num = Number(value)
  return Number.isFinite(num) ? num : 0
}

function toCoordinateValue(value) {
  const num = Number(value)
  return Number.isFinite(num) ? num : null
}

function parsePinnedCoordinates(text = '') {
  const value = String(text || '')
  const match = value.match(PINNED_COORDS_PATTERN)
  if (!match) return null

  const lat = toCoordinateValue(match[1])
  const lng = toCoordinateValue(match[2])
  if (lat === null || lng === null) return null

  return { lat, lng }
}

function isPinnedCoordinateAddress(address = '') {
  return PINNED_COORDS_PATTERN.test(String(address || ''))
}

function buildCoordinateKey(lat, lng) {
  return `${Number(lat).toFixed(6)},${Number(lng).toFixed(6)}`
}

function hasValidCoordinatePair(lat, lng) {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  )
}

function hasRenderableCoordinatePair(lat, lng) {
  if (!hasValidCoordinatePair(lat, lng)) return false
  if (Math.abs(lat) < 0.000001 && Math.abs(lng) < 0.000001) return false
  return true
}

function chooseBetterLocationSample(previousSample, nextSample) {
  if (!nextSample || !hasRenderableCoordinatePair(nextSample.lat, nextSample.lng)) {
    return previousSample
  }
  if (!previousSample) return nextSample

  const prevAccuracy = Number.isFinite(previousSample.accuracy) ? previousSample.accuracy : Number.POSITIVE_INFINITY
  const nextAccuracy = Number.isFinite(nextSample.accuracy) ? nextSample.accuracy : Number.POSITIVE_INFINITY

  if (nextAccuracy + 10 < prevAccuracy) return nextSample
  if (prevAccuracy === nextAccuracy) return nextSample
  return previousSample
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
    .filter((value, index, arr) => arr.indexOf(value) === index)
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
  if (line1) {
    parts.push(line1)
  } else if (locality) {
    parts.push(locality)
  }

  if (city && !parts.includes(city)) {
    parts.push(city)
  }

  if (country && !parts.includes(country)) {
    parts.push(country)
  }

  const compact = parts.join(', ').trim()
  if (compact) return compact

  return compactDisplayName(payload?.display_name || '')
}

function areaAddressFromNominatim(payload) {
  const addr = payload?.address || {}
  const locality =
    addr.suburb ||
    addr.neighbourhood ||
    addr.city_district ||
    addr.village ||
    addr.town ||
    addr.city ||
    ''
  const city =
    addr.city ||
    addr.town ||
    addr.municipality ||
    addr.state_district ||
    addr.county ||
    ''
  const country = addr.country || ''

  return [locality, city, country]
    .filter(Boolean)
    .filter((value, index, list) => list.indexOf(value) === index)
    .join(', ')
}

function getOrderCoordinates(order) {
  const lat = toCoordinateValue(order?.delivery_latitude)
  const lng = toCoordinateValue(order?.delivery_longitude)
  if (hasValidCoordinatePair(lat, lng)) {
    return { lat, lng }
  }

  return parsePinnedCoordinates(order?.delivery_address)
}

function getRestaurantCoordinates(order) {
  const lat = toCoordinateValue(order?.restaurant?.latitude)
  const lng = toCoordinateValue(order?.restaurant?.longitude)
  if (!hasValidCoordinatePair(lat, lng)) return null
  return { lat, lng }
}

function getReadableDropAddress(order) {
  const rawAddress = String(order?.delivery_address || '').trim()
  if (!rawAddress || isPinnedCoordinateAddress(rawAddress)) return ''
  return rawAddress
}

function getReadablePickupAddress(order) {
  return String(order?.restaurant_address || order?.restaurant?.address || '').trim()
}

async function reverseGeocodeCoordinates(lat, lng, options = {}) {
  const { zoom = 18, preferAreaLabel = false } = options
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}&zoom=${encodeURIComponent(zoom)}&addressdetails=1&accept-language=en`,
      {
        headers: {
          Accept: 'application/json',
        },
      }
    )
    if (!response.ok) return ''
    const payload = await response.json()

    if (preferAreaLabel) {
      const areaLabel = areaAddressFromNominatim(payload)
      if (areaLabel) return areaLabel
    }

    return compactAddressFromNominatim(payload)
  } catch {
    return ''
  }
}

function formatCurrency(value) {
  return `LKR ${toNumber(value).toLocaleString()}`
}

function formatStatus(status = '') {
  const raw = String(status || '').toLowerCase()
  if (!raw) return 'Unknown'
  if (raw === 'out_for_delivery') return 'Out For Delivery'
  if (raw === 'assigned') return 'Assigned'
  if (raw === 'ready') return 'Ready For Pickup'
  if (raw === 'rejected' || raw === 'cancelled' || raw === 'canceled') return 'Cancelled'
  return raw.replaceAll('_', ' ').replace(/\b\w/g, (ch) => ch.toUpperCase())
}

function statusClass(status = '') {
  const key = String(status || '').toLowerCase()
  if (key === 'delivered') return 'is-delivered'
  if (key === 'out_for_delivery') return 'is-active'
  if (key === 'assigned' || key === 'ready' || key === 'accepted') return 'is-progress'
  if (key === 'cancelled' || key === 'canceled' || key === 'rejected') return 'is-cancelled'
  return 'is-pending'
}

function isToday(dateValue) {
  if (!dateValue) return false
  const date = new Date(dateValue)
  if (Number.isNaN(date.getTime())) return false
  const now = new Date()
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  )
}

function mapUrl(order, options = {}) {
  if (!order) return ''
  const { originCoordinates = null, target = 'dropoff' } = options
  const pickupCoordinates = getRestaurantCoordinates(order)
  const dropCoordinates = getOrderCoordinates(order)
  const pickupAddress = getReadablePickupAddress(order)
  const dropAddress = getReadableDropAddress(order)
  const destinationCoordinates = target === 'pickup' ? pickupCoordinates : dropCoordinates
  const destinationAddress = target === 'pickup' ? pickupAddress : dropAddress

  if (
    hasValidCoordinatePair(originCoordinates?.lat, originCoordinates?.lng) &&
    hasValidCoordinatePair(destinationCoordinates?.lat, destinationCoordinates?.lng)
  ) {
    return `https://www.google.com/maps/dir/?api=1&origin=${originCoordinates.lat},${originCoordinates.lng}&destination=${destinationCoordinates.lat},${destinationCoordinates.lng}&travelmode=driving`
  }

  if (
    hasValidCoordinatePair(originCoordinates?.lat, originCoordinates?.lng) &&
    destinationAddress
  ) {
    return `https://www.google.com/maps/dir/?api=1&origin=${originCoordinates.lat},${originCoordinates.lng}&destination=${encodeURIComponent(destinationAddress)}&travelmode=driving`
  }

  if (target === 'dropoff' && order.maps_route_url) {
    return order.maps_route_url
  }

  if (
    target === 'dropoff' &&
    hasValidCoordinatePair(pickupCoordinates?.lat, pickupCoordinates?.lng) &&
    hasValidCoordinatePair(dropCoordinates?.lat, dropCoordinates?.lng)
  ) {
    return `https://www.google.com/maps/dir/?api=1&origin=${pickupCoordinates.lat},${pickupCoordinates.lng}&destination=${dropCoordinates.lat},${dropCoordinates.lng}&travelmode=driving`
  }

  if (hasValidCoordinatePair(destinationCoordinates?.lat, destinationCoordinates?.lng)) {
    return `https://www.google.com/maps/search/?api=1&query=${destinationCoordinates.lat},${destinationCoordinates.lng}`
  }

  if (destinationAddress) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(destinationAddress)}`
  }

  return ''
}

function mapEmbedUrl(order, options = {}) {
  if (!order) return ''
  const { originCoordinates = null } = options
  const pickupCoordinates = getRestaurantCoordinates(order)
  const dropCoordinates = getOrderCoordinates(order)
  const focusCoordinates =
    (hasValidCoordinatePair(dropCoordinates?.lat, dropCoordinates?.lng) && dropCoordinates) ||
    (hasValidCoordinatePair(pickupCoordinates?.lat, pickupCoordinates?.lng) && pickupCoordinates) ||
    (hasValidCoordinatePair(originCoordinates?.lat, originCoordinates?.lng) && originCoordinates) ||
    null

  if (!focusCoordinates) return ''

  // Keep embedded map in marker mode (no route/polyline) for delivery dashboard preview.
  return `https://maps.google.com/maps?q=${focusCoordinates.lat},${focusCoordinates.lng}&z=14&output=embed`
}

function geolocationErrorMessage(error) {
  if (!error) return 'Unable to detect your location right now.'
  if (error.code === 1) return 'Location permission denied. Please allow location access and try again.'
  if (error.code === 2) return 'Location is unavailable. Check GPS or network and try again.'
  if (error.code === 3) return 'Location request timed out. Please retry in an open area.'
  return 'Unable to detect your location right now.'
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

function pickActiveDelivery(deliveries) {
  if (!deliveries.length) return null
  return [...deliveries].sort((a, b) => {
    const left = ACTIVE_STATUS_PRIORITY.indexOf(String(a?.status || '').toLowerCase())
    const right = ACTIVE_STATUS_PRIORITY.indexOf(String(b?.status || '').toLowerCase())
    const leftRank = left === -1 ? ACTIVE_STATUS_PRIORITY.length : left
    const rightRank = right === -1 ? ACTIVE_STATUS_PRIORITY.length : right
    if (leftRank !== rightRank) return leftRank - rightRank

    const leftTime = new Date(a?.updated_at || a?.created_at || 0).getTime()
    const rightTime = new Date(b?.updated_at || b?.created_at || 0).getTime()
    return rightTime - leftTime
  })[0]
}

function Dashboard() {
  const navigate = useNavigate()
  const { currentUsername } = useAuth()

  const [availableJobs, setAvailableJobs] = useState([])
  const [activeDeliveries, setActiveDeliveries] = useState([])
  const [completedDeliveries, setCompletedDeliveries] = useState([])
  const [deliveriesTable, setDeliveriesTable] = useState([])
  const [tab, setTab] = useState('active')
  const [error, setError] = useState('')
  const [loadingOverview, setLoadingOverview] = useState(true)
  const [loadingTable, setLoadingTable] = useState(true)
  const [acceptingJobId, setAcceptingJobId] = useState(null)
  const [cancellingJobId, setCancellingJobId] = useState(null)
  const [refreshing, setRefreshing] = useState(false)
  const [resolvedAddressByCoord, setResolvedAddressByCoord] = useState({})
  const [resolvingCoordMap, setResolvingCoordMap] = useState({})
  const [attemptedCoordMap, setAttemptedCoordMap] = useState({})
  const [currentCoordinates, setCurrentCoordinates] = useState(null)
  const [currentLocationAccuracy, setCurrentLocationAccuracy] = useState(null)
  const [detectingCurrentLocation, setDetectingCurrentLocation] = useState(false)
  const [currentLocationError, setCurrentLocationError] = useState('')
  const [allRooms, setAllRooms] = useState([])
  const [allRestaurants, setAllRestaurants] = useState([])
  const [mapReady, setMapReady] = useState(false)
  const [mapError, setMapError] = useState('')
  const mapContainerRef = useRef(null)
  const mapRef = useRef(null)
  const mapMarkersRef = useRef([])
  const userMarkerRef = useRef(null)
  const infoWindowRef = useRef(null)
  const geoWatchIdRef = useRef(null)
  const geoTimerRef = useRef(null)
  const geoRequestIdRef = useRef(0)
  const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''

  const clearGeoCapture = useCallback(() => {
    if (geoWatchIdRef.current !== null && typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.clearWatch(geoWatchIdRef.current)
    }
    geoWatchIdRef.current = null

    if (geoTimerRef.current !== null) {
      window.clearTimeout(geoTimerRef.current)
    }
    geoTimerRef.current = null
  }, [])

  useEffect(() => {
    return () => {
      clearGeoCapture()
    }
  }, [clearGeoCapture])

  const fetchOverview = useCallback(async () => {
    setLoadingOverview(true)
    try {
      const [jobsRes, activeRes, completedRes] = await Promise.all([
        api.get('/api/orders/delivery/available/'),
        api.get('/api/orders/delivery/my-deliveries/?status=active'),
        api.get('/api/orders/delivery/my-deliveries/?status=completed'),
      ])

      setAvailableJobs(normalizeList(jobsRes?.data))
      setActiveDeliveries(normalizeList(activeRes?.data))
      setCompletedDeliveries(normalizeList(completedRes?.data))
      setError('')
    } catch (err) {
      setError(err?.response?.data?.detail || 'Unable to load delivery overview right now.')
    } finally {
      setLoadingOverview(false)
    }
  }, [])

  const fetchDeliveriesByTab = useCallback(async (selectedTab) => {
    setLoadingTable(true)
    try {
      const statusQuery = selectedTab === 'canceled' ? 'all' : selectedTab
      const response = await api.get(`/api/orders/delivery/my-deliveries/?status=${statusQuery}`)
      const rows = normalizeList(response?.data)

      if (selectedTab === 'canceled') {
        const cancelled = rows.filter((delivery) => {
          const status = String(delivery?.status || '').toLowerCase()
          return status === 'cancelled' || status === 'canceled' || status === 'rejected'
        })
        setDeliveriesTable(cancelled)
      } else {
        setDeliveriesTable(rows)
      }

      setError('')
    } catch (err) {
      setError(err?.response?.data?.detail || 'Unable to load delivery table.')
      setDeliveriesTable([])
    } finally {
      setLoadingTable(false)
    }
  }, [])

  const fetchMapPoints = useCallback(async () => {
    try {
      const [roomsRes, restaurantsRes] = await Promise.all([
        api.get('/api/rooms/'),
        api.get('/api/restaurants/'),
      ])
      setAllRooms(normalizeList(roomsRes?.data))
      setAllRestaurants(normalizeList(restaurantsRes?.data))
    } catch {
      // Map markers are supplementary; keep dashboard functional even if these endpoints fail.
      setAllRooms([])
      setAllRestaurants([])
    }
  }, [])

  useEffect(() => {
    fetchOverview()
    fetchMapPoints()
  }, [fetchOverview, fetchMapPoints])

  useEffect(() => {
    fetchDeliveriesByTab(tab)
  }, [tab, fetchDeliveriesByTab])

  const refreshAllData = async () => {
    setRefreshing(true)
    try {
      await Promise.all([fetchOverview(), fetchDeliveriesByTab(tab), fetchMapPoints()])
    } finally {
      setRefreshing(false)
    }
  }

  const acceptJob = async (orderId) => {
    setAcceptingJobId(orderId)
    try {
      const payload =
        currentCoordinates && hasValidCoordinatePair(currentCoordinates.lat, currentCoordinates.lng)
          ? {
              rider_latitude: currentCoordinates.lat,
              rider_longitude: currentCoordinates.lng,
            }
          : {}

      await api.post(`/api/orders/delivery/${orderId}/accept/`, payload)
      await Promise.all([fetchOverview(), fetchDeliveriesByTab(tab)])
      setError('')
    } catch (err) {
      setError(err?.response?.data?.detail || 'Failed to accept the delivery job.')
    } finally {
      setAcceptingJobId(null)
    }
  }

  const cancelJob = async (orderId) => {
    setCancellingJobId(orderId)
    try {
      await api.post(`/api/orders/delivery/${orderId}/cancel/`, {
        reason: 'Cancelled by delivery partner',
      })
      await Promise.all([fetchOverview(), fetchDeliveriesByTab(tab)])
      setError('')
    } catch (err) {
      const message =
        err?.response?.data?.error ||
        err?.response?.data?.detail ||
        'Failed to cancel this delivery job.'
      setError(message)
    } finally {
      setCancellingJobId(null)
    }
  }

  const activeDelivery = useMemo(
    () => pickActiveDelivery(activeDeliveries),
    [activeDeliveries]
  )

  const jobsToShow = useMemo(() => {
    return [...availableJobs]
      .sort((a, b) => {
        const payoutA = toNumber(a?.delivery_charge || a?.total_price)
        const payoutB = toNumber(b?.delivery_charge || b?.total_price)
        if (payoutB !== payoutA) return payoutB - payoutA
        const timeA = new Date(a?.created_at || 0).getTime()
        const timeB = new Date(b?.created_at || 0).getTime()
        return timeB - timeA
      })
      .slice(0, 4)
  }, [availableJobs])

  const completedTodayCount = useMemo(() => {
    return completedDeliveries.filter((delivery) =>
      isToday(delivery?.updated_at || delivery?.estimated_delivery_at || delivery?.created_at)
    ).length
  }, [completedDeliveries])

  const todayEarnings = useMemo(() => {
    return completedDeliveries
      .filter((delivery) => isToday(delivery?.updated_at || delivery?.estimated_delivery_at || delivery?.created_at))
      .reduce((sum, delivery) => sum + toNumber(delivery?.delivery_charge), 0)
  }, [completedDeliveries])

  const mapPoints = useMemo(() => {
    const roomPoints = allRooms
      .map((room) => {
        const lat = toCoordinateValue(room?.latitude)
        const lng = toCoordinateValue(room?.longitude)
        if (!hasRenderableCoordinatePair(lat, lng)) return null
        return {
          key: `room-${room?.id || `${lat.toFixed(6)}-${lng.toFixed(6)}`}`,
          type: 'room',
          label: room?.hostel_name || room?.title || 'Hostel Room',
          address: room?.hostel_address || room?.address || '',
          lat,
          lng,
        }
      })
      .filter(Boolean)

    const restaurantPoints = allRestaurants
      .map((restaurant) => {
        const lat = toCoordinateValue(restaurant?.latitude)
        const lng = toCoordinateValue(restaurant?.longitude)
        if (!hasRenderableCoordinatePair(lat, lng)) return null
        return {
          key: `restaurant-${restaurant?.id || `${lat.toFixed(6)}-${lng.toFixed(6)}`}`,
          type: 'restaurant',
          label: restaurant?.name || 'Restaurant',
          address: restaurant?.address || '',
          lat,
          lng,
        }
      })
      .filter(Boolean)

    return [...roomPoints, ...restaurantPoints]
  }, [allRooms, allRestaurants])

  const mapCenter = useMemo(() => {
    if (currentCoordinates && hasRenderableCoordinatePair(currentCoordinates.lat, currentCoordinates.lng)) {
      return currentCoordinates
    }
    if (!mapPoints.length) {
      return DEFAULT_DELIVERY_MAP_CENTER
    }

    const lat = mapPoints.reduce((sum, point) => sum + point.lat, 0) / mapPoints.length
    const lng = mapPoints.reduce((sum, point) => sum + point.lng, 0) / mapPoints.length
    return { lat, lng }
  }, [currentCoordinates, mapPoints])

  useEffect(() => {
    let mounted = true

    if (!hasGoogleMapsApiKey(googleMapsApiKey)) {
      setMapReady(false)
      setMapError('Google Maps API key is missing. Configure VITE_GOOGLE_MAPS_API_KEY.')
      return () => {
        mounted = false
      }
    }

    loadGoogleMaps(googleMapsApiKey)
      .then(() => {
        if (!mounted) return
        if (!isGoogleMapsReady()) {
          setMapReady(false)
          setMapError('Google Maps loaded, but map constructors are not ready.')
          return
        }
        setMapReady(true)
        setMapError('')
      })
      .catch((loadError) => {
        if (!mounted) return
        setMapReady(false)
        setMapError(loadError?.message || 'Unable to load Google Maps.')
      })

    return () => {
      mounted = false
    }
  }, [googleMapsApiKey])

  const useCurrentLocation = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setCurrentLocationError('Your browser does not support geolocation.')
      return
    }

    clearGeoCapture()
    const requestId = geoRequestIdRef.current + 1
    geoRequestIdRef.current = requestId

    let bestSample = null
    let sampleCount = 0
    let finalized = false

    const finalizeLocationCapture = async () => {
      if (finalized) return
      finalized = true
      clearGeoCapture()

      if (geoRequestIdRef.current !== requestId) return

      if (!bestSample) {
        setCurrentLocationError('Could not lock your GPS location. Move outdoors and try again.')
        setCurrentLocationAccuracy(null)
        setDetectingCurrentLocation(false)
        return
      }

      const accuracyMeters = Number.isFinite(bestSample.accuracy) ? bestSample.accuracy : null
      if (Number.isFinite(accuracyMeters) && accuracyMeters > LIVE_LOCATION_MAX_ACCEPTABLE_ACCURACY_M) {
        setCurrentLocationError(`GPS is too weak (+/-${Math.round(accuracyMeters)}m). Please retry with stronger signal.`)
        setCurrentLocationAccuracy(accuracyMeters)
        setDetectingCurrentLocation(false)
        return
      }

      const nextCoordinates = {
        lat: Number(bestSample.lat.toFixed(6)),
        lng: Number(bestSample.lng.toFixed(6)),
      }
      const coordKey = buildCoordinateKey(nextCoordinates.lat, nextCoordinates.lng)
      setCurrentCoordinates(nextCoordinates)
      setCurrentLocationAccuracy(accuracyMeters)
      setResolvedAddressByCoord((prev) => {
        const next = { ...prev }
        delete next[coordKey]
        return next
      })

      try {
        const resolvedAddress = await reverseGeocodeCoordinates(nextCoordinates.lat, nextCoordinates.lng, {
          zoom: 17,
          preferAreaLabel: false,
        })

        if (geoRequestIdRef.current !== requestId) return

        if (resolvedAddress) {
          setResolvedAddressByCoord((prev) => ({
            ...prev,
            [coordKey]: resolvedAddress,
          }))
        }

        if (Number.isFinite(accuracyMeters) && accuracyMeters > LIVE_LOCATION_GOOD_ACCURACY_M) {
          setCurrentLocationError(
            `Location updated with low accuracy (+/-${Math.round(accuracyMeters)}m). Move outdoors and tap Update Current Location for a more precise pin.`
          )
        } else {
          setCurrentLocationError('')
        }
      } finally {
        if (geoRequestIdRef.current === requestId) {
          setDetectingCurrentLocation(false)
        }
      }
    }

    setDetectingCurrentLocation(true)
    setCurrentLocationError('')
    setCurrentLocationAccuracy(null)

    geoWatchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const lat = toCoordinateValue(position?.coords?.latitude)
        const lng = toCoordinateValue(position?.coords?.longitude)
        const accuracyMeters = toCoordinateValue(position?.coords?.accuracy)

        const sample = { lat, lng, accuracy: accuracyMeters }
        const previousBest = bestSample
        bestSample = chooseBetterLocationSample(bestSample, sample)
        if (!bestSample) return

        sampleCount += 1
        const bestAccuracy = Number.isFinite(bestSample.accuracy) ? bestSample.accuracy : Number.POSITIVE_INFINITY

        if (bestAccuracy <= LIVE_LOCATION_TARGET_ACCURACY_M && sampleCount >= 2) {
          finalizeLocationCapture()
          return
        }

        if (sampleCount >= 5 && bestAccuracy <= LIVE_LOCATION_GOOD_ACCURACY_M) {
          finalizeLocationCapture()
          return
        }

        if (previousBest !== bestSample && sampleCount >= 4 && bestAccuracy <= LIVE_LOCATION_GOOD_ACCURACY_M) {
          finalizeLocationCapture()
        }
      },
      (geoError) => {
        if (geoRequestIdRef.current !== requestId) return
        if (bestSample) {
          finalizeLocationCapture()
          return
        }
        clearGeoCapture()
        setCurrentLocationError(geolocationErrorMessage(geoError))
        setCurrentLocationAccuracy(null)
        setDetectingCurrentLocation(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 0,
      }
    )

    geoTimerRef.current = window.setTimeout(() => {
      finalizeLocationCapture()
    }, LIVE_LOCATION_CAPTURE_TIMEOUT_MS)
  }, [clearGeoCapture])

  const routeFocusOrder = activeDelivery || jobsToShow[0] || null
  const mapOpenUrl = useMemo(
    () => mapUrl(routeFocusOrder, { originCoordinates: currentCoordinates, target: 'dropoff' }),
    [routeFocusOrder, currentCoordinates]
  )
  const mapOverviewUrl = useMemo(() => {
    const focusPoint =
      (currentCoordinates && hasRenderableCoordinatePair(currentCoordinates.lat, currentCoordinates.lng) && currentCoordinates) ||
      mapCenter
    if (!focusPoint || !hasRenderableCoordinatePair(focusPoint.lat, focusPoint.lng)) return ''
    return `https://www.google.com/maps/search/?api=1&query=${focusPoint.lat},${focusPoint.lng}`
  }, [currentCoordinates, mapCenter])
  const activeStudentPhone = routeFocusOrder?.student_phone || ''
  const currentLocationLabel = useMemo(() => {
    if (!currentCoordinates) return ''
    const coordKey = buildCoordinateKey(currentCoordinates.lat, currentCoordinates.lng)
    const resolvedAddress = resolvedAddressByCoord[coordKey]
    const coordinateText = `${currentCoordinates.lat.toFixed(6)}, ${currentCoordinates.lng.toFixed(6)}`
    if (resolvedAddress) return `${resolvedAddress} (${coordinateText})`
    return coordinateText
  }, [currentCoordinates, resolvedAddressByCoord])

  useEffect(() => {
    if (!mapReady || !mapContainerRef.current || !isGoogleMapsReady()) return

    const maps = window.google.maps
    if (!mapRef.current) {
      mapRef.current = new maps.Map(mapContainerRef.current, {
        center: mapCenter,
        zoom: mapPoints.length ? 13 : 11,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
      })
      infoWindowRef.current = new maps.InfoWindow()
    } else {
      mapRef.current.setCenter(mapCenter)
    }

    const map = mapRef.current
    if (!map) return

    mapMarkersRef.current.forEach((marker) => marker.setMap(null))
    mapMarkersRef.current = []

    const bounds = new maps.LatLngBounds()
    let pointCount = 0

    mapPoints.forEach((point) => {
      const marker = new maps.Marker({
        map,
        position: { lat: point.lat, lng: point.lng },
        title: point.label,
        icon: {
          url: point.type === 'room' ? ROOM_MARKER_ICON : RESTAURANT_MARKER_ICON,
          scaledSize: new maps.Size(38, 38),
          anchor: new maps.Point(19, 38),
        },
      })

      marker.addListener('click', () => {
        if (!infoWindowRef.current) return
        const safeLabel = String(point.label || '').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
        const safeAddress = String(point.address || '').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
        infoWindowRef.current.setContent(
          `<div style="min-width:160px;padding:4px 2px;">
            <div style="font-weight:700;color:#0f2e5f;font-size:12px;">${safeLabel}</div>
            <div style="color:#5b6b8a;font-size:11px;line-height:1.4;">${safeAddress || 'Address unavailable'}</div>
          </div>`
        )
        infoWindowRef.current.open({ map, anchor: marker })
      })

      mapMarkersRef.current.push(marker)
      bounds.extend({ lat: point.lat, lng: point.lng })
      pointCount += 1
    })

    if (userMarkerRef.current) {
      userMarkerRef.current.setMap(null)
      userMarkerRef.current = null
    }

    if (currentCoordinates && hasRenderableCoordinatePair(currentCoordinates.lat, currentCoordinates.lng)) {
      userMarkerRef.current = new maps.Marker({
        map,
        position: { lat: currentCoordinates.lat, lng: currentCoordinates.lng },
        title: 'Your current location',
        zIndex: 999,
        icon: {
          url: USER_PIN_MARKER_ICON,
          scaledSize: new maps.Size(36, 36),
          anchor: new maps.Point(18, 35),
        },
      })

      userMarkerRef.current.addListener('click', () => {
        if (!infoWindowRef.current) return
        infoWindowRef.current.setContent(
          `<div style="min-width:140px;padding:4px 2px;">
            <div style="font-weight:700;color:#9a2f22;font-size:12px;">Your location</div>
            <div style="color:#5b6b8a;font-size:11px;">${currentCoordinates.lat.toFixed(6)}, ${currentCoordinates.lng.toFixed(6)}</div>
          </div>`
        )
        infoWindowRef.current.open({ map, anchor: userMarkerRef.current })
      })

      bounds.extend({ lat: currentCoordinates.lat, lng: currentCoordinates.lng })
      pointCount += 1
    }

    if (pointCount > 1) {
      map.fitBounds(bounds, 48)
    } else if (pointCount === 1) {
      map.setCenter(bounds.getCenter())
      map.setZoom(15)
    } else {
      map.setCenter(DEFAULT_DELIVERY_MAP_CENTER)
      map.setZoom(11)
    }
  }, [
    mapReady,
    mapPoints,
    mapCenter.lat,
    mapCenter.lng,
    currentCoordinates?.lat,
    currentCoordinates?.lng,
  ])

  useEffect(() => {
    return () => {
      mapMarkersRef.current.forEach((marker) => marker.setMap(null))
      mapMarkersRef.current = []
      if (userMarkerRef.current) {
        userMarkerRef.current.setMap(null)
        userMarkerRef.current = null
      }
      if (mapRef.current && window.google?.maps?.event) {
        window.google.maps.event.clearInstanceListeners(mapRef.current)
      }
      mapRef.current = null
      infoWindowRef.current = null
    }
  }, [])

  const ordersForAddressLookup = useMemo(() => {
    return [
      ...jobsToShow,
      ...deliveriesTable.slice(0, 12),
      ...(routeFocusOrder ? [routeFocusOrder] : []),
    ]
  }, [jobsToShow, deliveriesTable, routeFocusOrder])

  useEffect(() => {
    const uniqueCoords = new Map()
    ordersForAddressLookup.forEach((order) => {
      const coords = getOrderCoordinates(order)
      if (!coords) return
      uniqueCoords.set(buildCoordinateKey(coords.lat, coords.lng), coords)
    })

    const pendingEntries = Array.from(uniqueCoords.entries()).filter(
      ([coordKey]) =>
        !resolvedAddressByCoord[coordKey] &&
        !resolvingCoordMap[coordKey] &&
        !attemptedCoordMap[coordKey]
    )

    if (!pendingEntries.length) return

    setResolvingCoordMap((prev) => {
      const next = { ...prev }
      pendingEntries.forEach(([coordKey]) => {
        next[coordKey] = true
      })
      return next
    })

    Promise.all(
      pendingEntries.map(async ([coordKey, coords]) => {
        const address = await reverseGeocodeCoordinates(coords.lat, coords.lng)
        return { coordKey, address }
      })
    )
      .then((results) => {
        setResolvedAddressByCoord((prev) => {
          const next = { ...prev }
          results.forEach(({ coordKey, address }) => {
            if (address) {
              next[coordKey] = address
            }
          })
          return next
        })
      })
      .finally(() => {
        setResolvingCoordMap((prev) => {
          const next = { ...prev }
          pendingEntries.forEach(([coordKey]) => {
            delete next[coordKey]
          })
          return next
        })

        setAttemptedCoordMap((prev) => {
          const next = { ...prev }
          pendingEntries.forEach(([coordKey]) => {
            next[coordKey] = true
          })
          return next
        })
      })
  }, [ordersForAddressLookup, resolvedAddressByCoord, resolvingCoordMap, attemptedCoordMap])

  const getDisplayDropAddress = useCallback(
    (order) => {
      const rawAddress = String(order?.delivery_address || '').trim()
      const looksPinned = isPinnedCoordinateAddress(rawAddress)
      if (rawAddress && !looksPinned) {
        return rawAddress
      }

      const coords = getOrderCoordinates(order)
      if (!coords) {
        return rawAddress || 'Delivery address unavailable'
      }

      const coordKey = buildCoordinateKey(coords.lat, coords.lng)
      if (resolvedAddressByCoord[coordKey]) {
        return resolvedAddressByCoord[coordKey]
      }

      if (resolvingCoordMap[coordKey]) {
        return 'Resolving address...'
      }

      return 'Pinned delivery location'
    },
    [resolvedAddressByCoord, resolvingCoordMap]
  )

  const dashboardStats = [
    {
      label: 'Available Jobs',
      value: availableJobs.length,
      icon: <WorkHistoryRoundedIcon fontSize="small" />,
    },
    {
      label: 'Active Deliveries',
      value: activeDeliveries.length,
      icon: <LocalShippingRoundedIcon fontSize="small" />,
    },
    {
      label: 'Completed Today',
      value: completedTodayCount,
      icon: <VerifiedRoundedIcon fontSize="small" />,
    },
    {
      label: 'Today Earnings',
      value: formatCurrency(todayEarnings),
      icon: <PaidRoundedIcon fontSize="small" />,
    },
  ]

  if (loadingOverview && loadingTable) {
    return <Skeleton variant="rounded" height={540} sx={{ borderRadius: 4 }} />
  }

  return (
    <Stack spacing={1.6}>
      {error ? <Alert severity="error">{error}</Alert> : null}

      <Box className="delivery-hero-card">
        <Box>
          <Box component="h2" className="delivery-hero-title">
            Delivery Control Center
          </Box>
          <Box component="p" className="delivery-hero-subtitle">
            {`Welcome back, ${currentUsername || 'Partner'}. Live jobs, route view, and delivery actions are all synced with real order data.`}
          </Box>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button
            className="top-pill top-pill-green"
            variant="contained"
            startIcon={<RefreshRoundedIcon />}
            disabled={refreshing}
            onClick={refreshAllData}
          >
            {refreshing ? 'Refreshing...' : 'Refresh Data'}
          </Button>
          <Button className="top-pill" variant="contained" onClick={() => navigate('/delivery/jobs')}>
            Open Jobs
          </Button>
        </Stack>
      </Box>

      <Grid container spacing={1.6}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Stack spacing={1.4}>
            <Box className="glass-card delivery-panel">
              <Box className="delivery-panel__title">Delivery Pulse</Box>
              <Grid container spacing={1.1}>
                {dashboardStats.map((stat) => (
                  <Grid key={stat.label} size={{ xs: 12, sm: 6, md: 3 }}>
                    <Box className="delivery-kpi-card">
                      <Box className="delivery-kpi-card__icon">{stat.icon}</Box>
                      <Box className="delivery-kpi-card__label">{stat.label}</Box>
                      <Box className="delivery-kpi-card__value">{stat.value}</Box>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Box>

            <Box className="glass-card delivery-panel">
              <Box className="delivery-panel__header">
                <Box className="delivery-panel__title">
                  Premium Jobs ({availableJobs.length})
                </Box>
                <Button className="top-pill" variant="contained" onClick={() => navigate('/delivery/jobs')}>
                  View All Jobs
                </Button>
              </Box>

              <Grid container spacing={1.1}>
                {jobsToShow.length ? (
                  jobsToShow.map((job) => {
                    const pickupMapUrl = mapUrl(job, {
                      originCoordinates: currentCoordinates,
                      target: 'pickup',
                    })

                    return (
                      <Grid key={job.id} size={{ xs: 12, md: 6 }}>
                        <Box className="delivery-job-card">
                        <Box className="delivery-job-card__top">
                          <Box>
                            <Box className="delivery-job-card__restaurant">{job.restaurant_name || 'Restaurant'}</Box>
                            <Box className="delivery-job-card__order">#ORD{job.id}</Box>
                          </Box>
                          <Box className="delivery-job-card__amount">
                            {formatCurrency(job.delivery_charge || 0)}
                          </Box>
                        </Box>

                        <Box className="delivery-job-card__meta">
                          <span>Pickup</span>
                          <p>{job.restaurant_address || job.restaurant?.address || 'Restaurant address unavailable'}</p>
                        </Box>
                        <Box className="delivery-job-card__meta">
                          <span>Drop-off</span>
                          <p>{getDisplayDropAddress(job)}</p>
                        </Box>
                        <Box className="delivery-job-card__meta-row">
                          <small>{postedLabel(job.created_at)}</small>
                          <small>{job.estimated_delivery_time ? `${job.estimated_delivery_time} min ETA` : 'ETA pending'}</small>
                        </Box>

                        <Grid container spacing={1} sx={{ mt: 1 }}>
                          <Grid size={4}>
                            <Button
                              className="top-pill top-pill-green"
                              variant="contained"
                              fullWidth
                              disabled={acceptingJobId === job.id || cancellingJobId === job.id}
                              onClick={() => acceptJob(job.id)}
                            >
                              {acceptingJobId === job.id ? 'Accepting...' : 'Accept'}
                            </Button>
                          </Grid>
                          <Grid size={4}>
                            <Button
                              className="top-pill top-pill-warn"
                              variant="contained"
                              fullWidth
                              disabled={acceptingJobId === job.id || cancellingJobId === job.id}
                              onClick={() => cancelJob(job.id)}
                            >
                              {cancellingJobId === job.id ? 'Cancelling...' : 'Cancel'}
                            </Button>
                          </Grid>
                          <Grid size={4}>
                            <Button
                              className="top-pill"
                              variant="contained"
                              fullWidth
                              disabled={!pickupMapUrl}
                              component="a"
                              href={pickupMapUrl || '#'}
                              target="_blank"
                              rel="noreferrer"
                            >
                              Map
                            </Button>
                          </Grid>
                        </Grid>
                      </Box>
                    </Grid>
                    )
                  })
                ) : (
                  <Grid size={{ xs: 12 }}>
                    <Box className="delivery-empty-card">
                      No available jobs right now. New requests will appear here in real time.
                    </Box>
                  </Grid>
                )}
              </Grid>
            </Box>

            <Box className="glass-card delivery-panel">
              <Box className="delivery-panel__header">
                <Box className="delivery-panel__title">My Deliveries</Box>
                <Tabs value={tab} onChange={(_, value) => setTab(value)} className="delivery-tabs">
                  <Tab label="Active" value="active" />
                  <Tab label="Completed" value="completed" />
                  <Tab label="Canceled" value="canceled" />
                  <Tab label="All" value="all" />
                </Tabs>
              </Box>

              <Box className="delivery-table-wrap">
                <table className="delivery-table">
                  <thead>
                    <tr>
                      <th>Order</th>
                      <th>Restaurant</th>
                      <th>Student</th>
                      <th>Drop-off</th>
                      <th>Fee</th>
                      <th>Status</th>
                      <th>Map</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingTable ? (
                      <tr>
                        <td colSpan={7} className="delivery-table__empty">
                          Loading deliveries...
                        </td>
                      </tr>
                    ) : null}

                    {!loadingTable &&
                      deliveriesTable.slice(0, 12).map((delivery) => {
                        const deliveryMapLink = mapUrl(delivery, {
                          originCoordinates: currentCoordinates,
                          target: 'dropoff',
                        })

                        return (
                          <tr key={delivery.id}>
                          <td>#ORD{delivery.id}</td>
                          <td>{delivery.restaurant_name || delivery.restaurant?.name || '-'}</td>
                          <td>{delivery.student_name || 'Student'}</td>
                          <td>{getDisplayDropAddress(delivery)}</td>
                          <td>{formatCurrency(delivery.delivery_charge || 0)}</td>
                          <td>
                            <span className={`delivery-status-chip ${statusClass(delivery.status)}`}>
                              {formatStatus(delivery.status)}
                            </span>
                          </td>
                          <td>
                            {deliveryMapLink ? (
                              <a href={deliveryMapLink} target="_blank" rel="noreferrer" className="delivery-table__map-link">
                                Open
                              </a>
                            ) : (
                              <span className="delivery-table__map-link disabled">N/A</span>
                            )}
                          </td>
                        </tr>
                        )
                      })}

                    {!loadingTable && !deliveriesTable.length ? (
                      <tr>
                        <td colSpan={7} className="delivery-table__empty">
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

        <Grid size={{ xs: 12, lg: 4 }}>
          <Stack spacing={1.4}>
            <Box className="glass-card delivery-panel">
              <Box className="delivery-panel__title">Delivery Area Map</Box>

              <Box className="delivery-route-card__meta">
                {routeFocusOrder ? (
                  <>
                    <p>Order #{routeFocusOrder.id}</p>
                    <strong>{routeFocusOrder.restaurant_name || routeFocusOrder.restaurant?.name || 'Restaurant'}</strong>
                    <span>{getDisplayDropAddress(routeFocusOrder)}</span>
                  </>
                ) : (
                  <>
                    <p>Live points overview</p>
                    <strong>{mapPoints.length} mapped locations</strong>
                    <span>Restaurants and hostel rooms shown with symbols.</span>
                  </>
                )}
              </Box>

              <Box className="delivery-current-location-card">
                <Box className="delivery-current-location-card__label">Navigation origin</Box>
                <Box className="delivery-current-location-card__value">
                  {currentCoordinates
                    ? `Current location: ${currentLocationLabel}`
                    : 'Tap Use Current Location to show your live pin on the map.'}
                </Box>
                {currentCoordinates && Number.isFinite(currentLocationAccuracy) ? (
                  <Box sx={{ mt: 0.2, fontSize: 12, color: 'var(--delivery-muted)' }}>
                    GPS accuracy: +/-{Math.round(currentLocationAccuracy)}m
                  </Box>
                ) : null}
                {currentLocationError ? (
                  <Box className="delivery-current-location-card__error">{currentLocationError}</Box>
                ) : null}
                <Button
                  className="top-pill"
                  variant="contained"
                  onClick={useCurrentLocation}
                  disabled={detectingCurrentLocation}
                  sx={{ mt: 0.8 }}
                >
                  {detectingCurrentLocation
                    ? 'Detecting...'
                    : currentCoordinates
                      ? 'Update Current Location'
                      : 'Use Current Location'}
                </Button>
              </Box>

              <Box className="delivery-map-frame">
                {mapReady ? (
                  <Box ref={mapContainerRef} className="delivery-google-map" />
                ) : (
                  <Box className="delivery-map-placeholder delivery-map-placeholder--inside">
                    {mapError || 'Loading map...'}
                  </Box>
                )}
              </Box>

              <Grid container spacing={1} sx={{ mt: 1 }}>
                <Grid size={6}>
                  <Box className="delivery-stat-mini">
                    <span>Mapped Points</span>
                    <strong>{mapPoints.length}</strong>
                  </Box>
                </Grid>
                <Grid size={6}>
                  <Box className="delivery-stat-mini">
                    <span>Focus Order</span>
                    <strong>{routeFocusOrder ? `#ORD${routeFocusOrder.id}` : 'None'}</strong>
                  </Box>
                </Grid>
              </Grid>

              <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                <Button
                  className="top-pill top-pill-green"
                  variant="contained"
                  startIcon={<OpenInNewRoundedIcon />}
                  fullWidth
                  disabled={!mapOpenUrl && !mapOverviewUrl}
                  component="a"
                  href={routeFocusOrder ? mapOpenUrl || '#' : mapOverviewUrl || '#'}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open Maps
                </Button>
                <Button
                  className="top-pill"
                  variant="contained"
                  fullWidth
                  disabled={!activeStudentPhone}
                  component="a"
                  href={activeStudentPhone ? `tel:${activeStudentPhone}` : '#'}
                >
                  Call Student
                </Button>
              </Stack>
            </Box>

            <Box className="glass-card delivery-panel">
              <Box className="delivery-panel__title">Quick Actions</Box>
              <Stack spacing={1}>
                <Button className="top-pill top-pill-green" variant="contained" onClick={() => navigate('/delivery/jobs')}>
                  Accept New Job
                </Button>
                <Button className="top-pill" variant="contained" onClick={() => navigate('/delivery/deliveries')}>
                  Manage Deliveries
                </Button>
                <Button className="top-pill" variant="contained" onClick={() => navigate('/delivery/earnings')}>
                  View Earnings
                </Button>
              </Stack>
            </Box>
          </Stack>
        </Grid>
      </Grid>
    </Stack>
  )
}

export default Dashboard
