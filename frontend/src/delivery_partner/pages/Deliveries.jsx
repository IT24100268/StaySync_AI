import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Alert, Box, Button, Grid, Skeleton, Stack, Tab, Tabs } from '@mui/material'
import MyLocationRoundedIcon from '@mui/icons-material/MyLocationRounded'
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded'
import PhoneRoundedIcon from '@mui/icons-material/PhoneRounded'
import api from '../api/axios'
import { hasGoogleMapsApiKey, isGoogleMapsReady, loadGoogleMaps } from '../../utils/googleMapsLoader'

const DEFAULT_DELIVERY_MAP_CENTER = { lat: 9.6848, lng: 80.022 }
const PINNED_COORDS_PATTERN = /pinned delivery location\s*\(\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*\)/i

function normalizeList(payload) {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.results)) return payload.results
  if (Array.isArray(payload?.data)) return payload.data
  return []
}

function toCoordinateValue(value) {
  const num = Number(value)
  return Number.isFinite(num) ? num : null
}

function hasValidCoordinatePair(lat, lng) {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180 &&
    !(Math.abs(lat) < 0.000001 && Math.abs(lng) < 0.000001)
  )
}

function parsePinnedCoordinates(address = '') {
  const value = String(address || '')
  const match = value.match(PINNED_COORDS_PATTERN)
  if (!match) return null

  const lat = toCoordinateValue(match[1])
  const lng = toCoordinateValue(match[2])
  if (!hasValidCoordinatePair(lat, lng)) return null
  return { lat, lng }
}

function isPinnedCoordinateAddress(address = '') {
  return PINNED_COORDS_PATTERN.test(String(address || ''))
}

function buildCoordinateKey(lat, lng) {
  return `${Number(lat).toFixed(6)},${Number(lng).toFixed(6)}`
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

async function reverseGeocodeCoordinates(lat, lng) {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}&zoom=18&addressdetails=1&accept-language=en`,
      {
        headers: {
          Accept: 'application/json',
        },
      }
    )
    if (!response.ok) return ''
    const payload = await response.json()
    return compactAddressFromNominatim(payload)
  } catch {
    return ''
  }
}

function getDropCoordinates(order) {
  const lat = toCoordinateValue(order?.delivery_latitude)
  const lng = toCoordinateValue(order?.delivery_longitude)
  if (hasValidCoordinatePair(lat, lng)) return { lat, lng }
  return parsePinnedCoordinates(order?.delivery_address)
}

function getPickupCoordinates(order) {
  const lat = toCoordinateValue(order?.restaurant?.latitude || order?.restaurant_latitude)
  const lng = toCoordinateValue(order?.restaurant?.longitude || order?.restaurant_longitude)
  if (!hasValidCoordinatePair(lat, lng)) return null
  return { lat, lng }
}

function haversineDistanceKm(origin, destination) {
  if (!origin || !destination) return null

  const toRadians = (degrees) => (degrees * Math.PI) / 180
  const earthRadiusKm = 6371
  const dLat = toRadians(destination.lat - origin.lat)
  const dLng = toRadians(destination.lng - origin.lng)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(origin.lat)) * Math.cos(toRadians(destination.lat)) * Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return earthRadiusKm * c
}

function estimatedMinutesForDistance(distanceKm) {
  if (!Number.isFinite(distanceKm) || distanceKm <= 0) return null
  const assumedSpeedKmH = 26
  const estimated = Math.round((distanceKm / assumedSpeedKmH) * 60)
  return Math.max(4, estimated)
}

async function fetchOsrmRoute(origin, destination) {
  const url = `https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`OSRM HTTP ${response.status}`)
  }
  const payload = await response.json()
  const route = payload?.routes?.[0]
  const coordinates = route?.geometry?.coordinates
  if (!Array.isArray(coordinates) || coordinates.length < 2) {
    throw new Error('OSRM geometry unavailable')
  }

  const path = coordinates
    .map((pair) => ({ lat: Number(pair?.[1]), lng: Number(pair?.[0]) }))
    .filter((point) => hasValidCoordinatePair(point.lat, point.lng))

  if (path.length < 2) {
    throw new Error('OSRM path invalid')
  }

  return {
    path,
    distanceKm: Number(route?.distance || 0) / 1000,
    durationMinutes: Number(route?.duration || 0) / 60,
  }
}

function formatDistance(value) {
  if (!Number.isFinite(value)) return '--'
  return `${value.toFixed(1)} km`
}

function formatMinutes(value) {
  if (!Number.isFinite(value)) return '--'
  return `${Math.max(1, Math.round(value))} min`
}

function formatCurrency(value) {
  return `LKR ${Number(value || 0).toLocaleString()}`
}

function formatStatus(status = '') {
  const raw = String(status || '').trim().toLowerCase()
  if (!raw) return 'Unknown'
  if (raw === 'rejected' || raw === 'cancelled' || raw === 'canceled') return 'Cancelled'
  return raw.replaceAll('_', ' ').replace(/\b\w/g, (ch) => ch.toUpperCase())
}

function formatDateTime(value) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleString('en-LK', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getPickupReadyAtMs(delivery) {
  const directReadyAt = new Date(delivery?.pickup_ready_at || '').getTime()
  if (Number.isFinite(directReadyAt)) return directReadyAt

  const createdAt = new Date(delivery?.created_at || '').getTime()
  const prepMinutes = Number(delivery?.preparation_time)
  if (Number.isFinite(createdAt) && Number.isFinite(prepMinutes) && prepMinutes > 0) {
    return createdAt + prepMinutes * 60 * 1000
  }
  return null
}

function getPickupCountdown(delivery, nowMs = Date.now()) {
  if (!delivery) return null

  const readyAtMs = getPickupReadyAtMs(delivery)
  const prepMinutes = Number(delivery?.preparation_time)
  const hasPrepMinutes = Number.isFinite(prepMinutes) && prepMinutes > 0

  if (Number.isFinite(readyAtMs)) {
    const minutesLeft = Math.ceil((readyAtMs - nowMs) / (60 * 1000))
    if (minutesLeft > 0) {
      return {
        headline: `Pickup in ${minutesLeft} min`,
        detail: hasPrepMinutes
          ? `Based on restaurant preparation time (${Math.round(prepMinutes)} min).`
          : 'Based on restaurant preparation estimate.',
        isReady: false,
      }
    }

    return {
      headline: 'Pickup ready now',
      detail: '',
      isReady: true,
    }
  }

  if (hasPrepMinutes) {
    return {
      headline: `Prep time ${Math.round(prepMinutes)} min`,
      detail: 'Pickup countdown will appear as soon as ready-time is available.',
      isReady: false,
    }
  }

  return {
    headline: 'Pickup time pending',
    detail: 'Waiting for preparation-time details from restaurant.',
    isReady: false,
  }
}

function buildExternalNavigationUrl(partnerCoords, pickupCoords, dropCoords) {
  if (!pickupCoords && !dropCoords) return ''

  if (partnerCoords && pickupCoords && dropCoords) {
    return `https://www.google.com/maps/dir/?api=1&origin=${partnerCoords.lat},${partnerCoords.lng}&destination=${dropCoords.lat},${dropCoords.lng}&waypoints=${pickupCoords.lat},${pickupCoords.lng}&travelmode=driving`
  }
  if (pickupCoords && dropCoords) {
    return `https://www.google.com/maps/dir/?api=1&origin=${pickupCoords.lat},${pickupCoords.lng}&destination=${dropCoords.lat},${dropCoords.lng}&travelmode=driving`
  }
  const target = dropCoords || pickupCoords
  return target ? `https://www.google.com/maps/search/?api=1&query=${target.lat},${target.lng}` : ''
}

function Deliveries() {
  const [status, setStatus] = useState('active')
  const [list, setList] = useState([])
  const [activeDelivery, setActiveDelivery] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [mapReady, setMapReady] = useState(false)
  const [mapError, setMapError] = useState('')
  const [routeWarning, setRouteWarning] = useState('')
  const [resolvedAddressByCoord, setResolvedAddressByCoord] = useState({})
  const [resolvingCoordMap, setResolvingCoordMap] = useState({})
  const [markingPickedId, setMarkingPickedId] = useState(null)
  const [markingDeliveredId, setMarkingDeliveredId] = useState(null)
  const [currentPartnerCoordinates, setCurrentPartnerCoordinates] = useState(null)
  const [detectingCurrentLocation, setDetectingCurrentLocation] = useState(false)
  const [currentLocationError, setCurrentLocationError] = useState('')
  const [pickupClockMs, setPickupClockMs] = useState(Date.now())
  const [routeStats, setRouteStats] = useState({
    partnerToPickupKm: null,
    pickupToDropKm: null,
    totalKm: null,
    totalMinutes: null,
  })

  const mapContainerRef = useRef(null)
  const mapRef = useRef(null)
  const mapMarkersRef = useRef([])
  const routePolylinesRef = useRef([])
  const infoWindowRef = useRef(null)
  const routeRequestIdRef = useRef(0)
  const googleMapsApiKey = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '').trim()
  const isCanceledView = status === 'canceled'

  const fetchDeliveries = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const statusQuery = isCanceledView ? 'all' : status
      const requests = [api.get(`/api/orders/delivery/my-deliveries/?status=${statusQuery}`)]
      if (!isCanceledView) {
        requests.push(api.get('/api/orders/delivery/my-deliveries/?status=active'))
      }

      const [tabResponse, activeResponse] = await Promise.all(requests)
      const tabItems = normalizeList(tabResponse?.data)
      const visibleItems =
        isCanceledView
          ? tabItems.filter((delivery) => {
              const currentStatus = String(delivery?.status || '').toLowerCase()
              return currentStatus === 'cancelled' || currentStatus === 'canceled' || currentStatus === 'rejected'
            })
          : tabItems
      const activeItems = isCanceledView ? [] : normalizeList(activeResponse?.data)
      setList(visibleItems)
      setActiveDelivery(activeItems[0] || null)
    } catch (err) {
      console.error('Fetch deliveries error:', err)
      setError(err?.response?.data?.detail || 'Failed to load deliveries')
      setList([])
      setActiveDelivery(null)
    } finally {
      setLoading(false)
    }
  }, [isCanceledView, status])

  useEffect(() => {
    fetchDeliveries()
  }, [fetchDeliveries])

  const markPicked = useCallback(async (orderId) => {
    if (!orderId) return
    setMarkingPickedId(orderId)
    setError('')
    try {
      const payload =
        currentPartnerCoordinates && hasValidCoordinatePair(currentPartnerCoordinates.lat, currentPartnerCoordinates.lng)
          ? {
              rider_latitude: currentPartnerCoordinates.lat,
              rider_longitude: currentPartnerCoordinates.lng,
            }
          : {}
      await api.post(`/api/orders/delivery/${orderId}/picked/`, payload)
      await fetchDeliveries()
    } catch (err) {
      setError(err?.response?.data?.error || err?.response?.data?.detail || 'Failed to mark pickup.')
    } finally {
      setMarkingPickedId(null)
    }
  }, [currentPartnerCoordinates, fetchDeliveries])

  const markDelivered = useCallback(async (orderId) => {
    if (!orderId) return
    setMarkingDeliveredId(orderId)
    setError('')
    try {
      await api.post(`/api/orders/delivery/${orderId}/delivered/`)
      await fetchDeliveries()
    } catch (err) {
      setError(err?.response?.data?.error || err?.response?.data?.detail || 'Failed to mark delivered.')
    } finally {
      setMarkingDeliveredId(null)
    }
  }, [fetchDeliveries])

  useEffect(() => {
    let mounted = true

    if (!hasGoogleMapsApiKey(googleMapsApiKey)) {
      setMapReady(false)
      setMapError('Google Maps API key missing. Configure VITE_GOOGLE_MAPS_API_KEY.')
      return () => {
        mounted = false
      }
    }

    loadGoogleMaps(googleMapsApiKey)
      .then(() => {
        if (!mounted) return
        if (!isGoogleMapsReady()) {
          setMapReady(false)
          setMapError('Google Maps loaded but constructors are unavailable.')
          return
        }
        setMapReady(true)
        setMapError('')
      })
      .catch((loadError) => {
        if (!mounted) return
        setMapReady(false)
        setMapError(loadError?.message || 'Unable to load map.')
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

    setDetectingCurrentLocation(true)
    setCurrentLocationError('')
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = toCoordinateValue(position?.coords?.latitude)
        const lng = toCoordinateValue(position?.coords?.longitude)
        if (!hasValidCoordinatePair(lat, lng)) {
          setCurrentLocationError('Could not detect a valid current location.')
          setDetectingCurrentLocation(false)
          return
        }
        setCurrentPartnerCoordinates({
          lat: Number(lat.toFixed(6)),
          lng: Number(lng.toFixed(6)),
        })
        setCurrentLocationError('')
        setDetectingCurrentLocation(false)
      },
      (geoError) => {
        if (geoError?.code === 1) {
          setCurrentLocationError('Location access denied. Allow location permission and try again.')
        } else if (geoError?.code === 2) {
          setCurrentLocationError('Location unavailable. Check GPS/network and try again.')
        } else if (geoError?.code === 3) {
          setCurrentLocationError('Location request timed out. Try again in an open area.')
        } else {
          setCurrentLocationError('Unable to detect your current location.')
        }
        setDetectingCurrentLocation(false)
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
    )
  }, [])

  useEffect(() => {
    useCurrentLocation()
  }, [useCurrentLocation])

  useEffect(() => {
    const timerId = window.setInterval(() => {
      setPickupClockMs(Date.now())
    }, 30000)
    return () => window.clearInterval(timerId)
  }, [])

  const pickupCoordinates = useMemo(() => getPickupCoordinates(activeDelivery), [activeDelivery])
  const dropCoordinates = useMemo(() => getDropCoordinates(activeDelivery), [activeDelivery])
  const pickupCountdown = useMemo(
    () => getPickupCountdown(activeDelivery, pickupClockMs),
    [activeDelivery, pickupClockMs]
  )
  const mapOpenUrl = useMemo(
    () => buildExternalNavigationUrl(currentPartnerCoordinates, pickupCoordinates, dropCoordinates),
    [currentPartnerCoordinates, pickupCoordinates, dropCoordinates]
  )
  const customerPhone = String(activeDelivery?.student_phone || '').trim()
  const activeStatusKey = String(activeDelivery?.status || '').toLowerCase()
  const hasMarkedPicked = activeStatusKey === 'out_for_delivery' || activeStatusKey === 'delivered'
  const canMarkPicked = activeStatusKey === 'ready' || activeStatusKey === 'accepted'
  const canMarkDelivered = activeStatusKey === 'out_for_delivery'
  const showStartRouteButton = !hasMarkedPicked

  useEffect(() => {
    const uniqueCoords = new Map()
    if (activeDelivery) {
      const coords = getDropCoordinates(activeDelivery)
      if (coords) {
        uniqueCoords.set(buildCoordinateKey(coords.lat, coords.lng), coords)
      }
    }

    list.slice(0, 20).forEach((delivery) => {
      const coords = getDropCoordinates(delivery)
      if (coords) {
        uniqueCoords.set(buildCoordinateKey(coords.lat, coords.lng), coords)
      }
    })

    const pendingEntries = Array.from(uniqueCoords.entries()).filter(
      ([coordKey]) => !resolvedAddressByCoord[coordKey] && !resolvingCoordMap[coordKey]
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
      })
  }, [activeDelivery, list, resolvedAddressByCoord, resolvingCoordMap])

  const getDisplayDropAddress = useCallback(
    (delivery) => {
      const rawAddress = String(delivery?.delivery_address || '').trim()
      if (rawAddress && !isPinnedCoordinateAddress(rawAddress)) {
        return rawAddress
      }

      const coords = getDropCoordinates(delivery)
      if (!coords) {
        return rawAddress || 'Drop address unavailable'
      }

      const coordKey = buildCoordinateKey(coords.lat, coords.lng)
      if (resolvedAddressByCoord[coordKey]) {
        return resolvedAddressByCoord[coordKey]
      }
      if (resolvingCoordMap[coordKey]) {
        return 'Resolving drop address...'
      }
      return 'Drop address unavailable'
    },
    [resolvedAddressByCoord, resolvingCoordMap]
  )

  useEffect(() => {
    if (!mapReady || !mapContainerRef.current || !isGoogleMapsReady()) return

    const maps = window.google.maps
    if (!mapRef.current) {
      mapRef.current = new maps.Map(mapContainerRef.current, {
        center: currentPartnerCoordinates || pickupCoordinates || dropCoordinates || DEFAULT_DELIVERY_MAP_CENTER,
        zoom: 13,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
      })
      infoWindowRef.current = new maps.InfoWindow()
    }

    const map = mapRef.current
    if (!map) return

    mapMarkersRef.current.forEach((marker) => marker.setMap(null))
    routePolylinesRef.current.forEach((polyline) => polyline.setMap(null))
    mapMarkersRef.current = []
    routePolylinesRef.current = []
    setRouteWarning('')

    const bounds = new maps.LatLngBounds()
    let plottedPoints = 0

    const addMarker = (coordinates, title, color, detail) => {
      if (!coordinates || !hasValidCoordinatePair(coordinates.lat, coordinates.lng)) return
      const marker = new maps.Marker({
        map,
        position: coordinates,
        title,
        icon: {
          path: maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: color,
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        },
      })
      marker.addListener('click', () => {
        if (!infoWindowRef.current) return
        const safeTitle = String(title || '').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
        const safeDetail = String(detail || '').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
        infoWindowRef.current.setContent(
          `<div style="padding:4px 2px;min-width:160px;">
            <div style="font-weight:700;color:#2a1809;font-size:12px;">${safeTitle}</div>
            <div style="margin-top:2px;color:#6e5a48;font-size:11px;">${safeDetail}</div>
          </div>`
        )
        infoWindowRef.current.open({ map, anchor: marker })
      })
      mapMarkersRef.current.push(marker)
      bounds.extend(coordinates)
      plottedPoints += 1
    }

    if (!hasMarkedPicked) {
      addMarker(
        currentPartnerCoordinates,
        'Your current location',
        '#1d4ed8',
        currentPartnerCoordinates ? `${currentPartnerCoordinates.lat.toFixed(6)}, ${currentPartnerCoordinates.lng.toFixed(6)}` : ''
      )
    }
    addMarker(
      pickupCoordinates,
      activeDelivery?.restaurant_name || 'Pickup restaurant',
      '#f08a24',
      activeDelivery?.restaurant_address || 'Restaurant pickup point'
    )
    addMarker(
      dropCoordinates,
      activeDelivery?.student_name || 'Student drop-off',
      '#2f8f4e',
      getDisplayDropAddress(activeDelivery) || 'Drop-off location'
    )

    const requestId = routeRequestIdRef.current + 1
    routeRequestIdRef.current = requestId

    const drawRoutes = async () => {
      const shouldDrawPartnerToPickup = !hasMarkedPicked
      const canDrawPartnerToPickup =
        shouldDrawPartnerToPickup &&
        currentPartnerCoordinates &&
        pickupCoordinates &&
        hasValidCoordinatePair(currentPartnerCoordinates.lat, currentPartnerCoordinates.lng) &&
        hasValidCoordinatePair(pickupCoordinates.lat, pickupCoordinates.lng)
      const canDrawPickupToDrop =
        pickupCoordinates &&
        dropCoordinates &&
        hasValidCoordinatePair(pickupCoordinates.lat, pickupCoordinates.lng) &&
        hasValidCoordinatePair(dropCoordinates.lat, dropCoordinates.lng)

      if (!canDrawPartnerToPickup && !canDrawPickupToDrop) {
        if (plottedPoints > 1) {
          map.fitBounds(bounds, 52)
        } else if (plottedPoints === 1) {
          map.setCenter(bounds.getCenter())
          map.setZoom(15)
        } else {
          map.setCenter(DEFAULT_DELIVERY_MAP_CENTER)
          map.setZoom(11)
        }

        setRouteStats({
          partnerToPickupKm: null,
          pickupToDropKm: null,
          totalKm: null,
          totalMinutes: null,
        })
        return
      }

      let leg1 = null
      let leg2 = null
      let fallbackUsed = false

      if (canDrawPartnerToPickup) {
        try {
          leg1 = await fetchOsrmRoute(currentPartnerCoordinates, pickupCoordinates)
        } catch {
          fallbackUsed = true
        }
      }

      if (canDrawPickupToDrop) {
        try {
          leg2 = await fetchOsrmRoute(pickupCoordinates, dropCoordinates)
        } catch {
          fallbackUsed = true
        }
      }

      if (requestId !== routeRequestIdRef.current) return

      const drawPolyline = (path, color) => {
        if (!Array.isArray(path) || path.length < 2) return
        const polyline = new maps.Polyline({
          path,
          geodesic: true,
          strokeColor: color,
          strokeOpacity: 0.92,
          strokeWeight: 6,
          map,
        })
        routePolylinesRef.current.push(polyline)
        path.forEach((point) => bounds.extend(point))
      }

      if (canDrawPartnerToPickup) {
        if (leg1?.path?.length) {
          drawPolyline(leg1.path, '#2563eb')
        } else {
          drawPolyline([currentPartnerCoordinates, pickupCoordinates], '#2563eb')
        }
      }

      if (canDrawPickupToDrop) {
        if (leg2?.path?.length) {
          drawPolyline(leg2.path, '#ef7f1a')
        } else {
          drawPolyline([pickupCoordinates, dropCoordinates], '#ef7f1a')
        }
      }

      if (plottedPoints > 1 || routePolylinesRef.current.length) {
        map.fitBounds(bounds, 52)
      } else if (plottedPoints === 1) {
        map.setCenter(bounds.getCenter())
        map.setZoom(15)
      } else {
        map.setCenter(DEFAULT_DELIVERY_MAP_CENTER)
        map.setZoom(11)
      }

      const leg1Km = canDrawPartnerToPickup
        ? leg1?.distanceKm ?? haversineDistanceKm(currentPartnerCoordinates, pickupCoordinates)
        : null
      const leg2Km = canDrawPickupToDrop
        ? leg2?.distanceKm ?? haversineDistanceKm(pickupCoordinates, dropCoordinates)
        : null
      const leg1Minutes = canDrawPartnerToPickup
        ? leg1?.durationMinutes ?? estimatedMinutesForDistance(leg1Km)
        : null
      const leg2Minutes = canDrawPickupToDrop
        ? leg2?.durationMinutes ?? estimatedMinutesForDistance(leg2Km)
        : null

      const totalKm =
        (Number.isFinite(leg1Km) ? leg1Km : 0) +
        (Number.isFinite(leg2Km) ? leg2Km : 0)
      const totalMinutes =
        (Number.isFinite(leg1Minutes) ? leg1Minutes : 0) +
        (Number.isFinite(leg2Minutes) ? leg2Minutes : 0)

      setRouteStats({
        partnerToPickupKm: leg1Km,
        pickupToDropKm: leg2Km,
        totalKm: Number.isFinite(totalKm) && totalKm > 0 ? totalKm : null,
        totalMinutes: Number.isFinite(totalMinutes) && totalMinutes > 0 ? totalMinutes : null,
      })
      setRouteWarning(
        fallbackUsed
          ? 'One route segment is using fallback line. Live roads may be temporarily unavailable.'
          : ''
      )
    }

    drawRoutes()
  }, [mapReady, activeDelivery, hasMarkedPicked, currentPartnerCoordinates, pickupCoordinates, dropCoordinates, getDisplayDropAddress])

  useEffect(() => {
    return () => {
      mapMarkersRef.current.forEach((marker) => marker.setMap(null))
      routePolylinesRef.current.forEach((polyline) => polyline.setMap(null))
      mapMarkersRef.current = []
      routePolylinesRef.current = []
      if (mapRef.current && window.google?.maps?.event) {
        window.google.maps.event.clearInstanceListeners(mapRef.current)
      }
      mapRef.current = null
      infoWindowRef.current = null
    }
  }, [])

  if (loading) {
    return <Skeleton variant='rounded' height={520} sx={{ borderRadius: 5 }} />
  }

  return (
    <Stack spacing={1.4}>
      {error ? <Alert severity='error'>{error}</Alert> : null}

      <Grid container spacing={1.5}>
        <Grid size={{ xs: 12, lg: isCanceledView ? 12 : 7.9 }}>
          <Stack spacing={1.1}>
            <Box className='glass-card' sx={{ p: 1.1 }}>
              <Tabs value={status} onChange={(_, nextStatus) => setStatus(nextStatus)} className='delivery-tabs'>
                <Tab label='Active' value='active' />
                <Tab label='Completed' value='completed' />
                <Tab label='Cancelled' value='canceled' />
              </Tabs>
            </Box>

            {!isCanceledView ? (
              <Box className='glass-card delivery-active-card' sx={{ p: 1.2 }}>
                {activeDelivery ? (
                  <>
                    <Box className='delivery-active-card__eyebrow'>Current Assignment</Box>
                    <Box className='delivery-active-card__order-id'>
                      #ORD{String(activeDelivery.id).padStart(3, '0')}
                    </Box>
                    <Box className='delivery-active-card__restaurant'>
                      {activeDelivery.restaurant_name || activeDelivery.restaurant?.name || 'Restaurant'}
                    </Box>

                    <Box className='delivery-active-card__address-grid'>
                      <Box className='delivery-active-card__address-pill'>
                        <span>Pickup</span>
                        <strong>{activeDelivery.restaurant_address || 'Restaurant location unavailable'}</strong>
                      </Box>
                      <Box className='delivery-active-card__address-pill'>
                        <span>Drop</span>
                        <strong>{getDisplayDropAddress(activeDelivery)}</strong>
                      </Box>
                    </Box>

                    <Box className='delivery-active-card__meta-row'>
                      <Box className='delivery-active-card__meta-chip'>Status: {formatStatus(activeDelivery.status)}</Box>
                      <Box className='delivery-active-card__meta-chip'>Charge: {formatCurrency(activeDelivery.delivery_charge)}</Box>
                      {pickupCountdown ? (
                        <Box className='delivery-active-card__meta-chip'>
                          {pickupCountdown.headline}
                        </Box>
                      ) : null}
                    </Box>
                    {pickupCountdown?.detail ? (
                      <Box
                        sx={{
                          mt: 0.4,
                          fontSize: 13,
                          fontWeight: 700,
                          color: pickupCountdown.isReady ? 'var(--delivery-success)' : 'var(--delivery-muted)',
                        }}
                      >
                        {pickupCountdown.detail}
                      </Box>
                    ) : null}

                    <Box className='route-progress' />
                    <Grid container spacing={1} sx={{ mt: 1.2 }}>
                      <Grid size={{ xs: 12, md: showStartRouteButton ? 4 : 6 }}>
                        <Button
                          className='top-pill top-pill-green'
                          fullWidth
                          onClick={() => markPicked(activeDelivery.id)}
                          disabled={!canMarkPicked || markingPickedId === activeDelivery.id || markingDeliveredId === activeDelivery.id}
                        >
                          {markingPickedId === activeDelivery.id ? 'Updating...' : 'Mark Picked'}
                        </Button>
                      </Grid>
                      {showStartRouteButton ? (
                        <Grid size={{ xs: 12, md: 4 }}>
                          <Button
                            className='top-pill top-pill-green'
                            fullWidth
                            onClick={() => mapOpenUrl && window.open(mapOpenUrl, '_blank', 'noopener,noreferrer')}
                            disabled={!mapOpenUrl || markingPickedId === activeDelivery.id || markingDeliveredId === activeDelivery.id}
                          >
                            Start Route
                          </Button>
                        </Grid>
                      ) : null}
                      <Grid size={{ xs: 12, md: showStartRouteButton ? 4 : 6 }}>
                        <Button
                          className='top-pill'
                          fullWidth
                          onClick={() => markDelivered(activeDelivery.id)}
                          disabled={!canMarkDelivered || markingDeliveredId === activeDelivery.id || markingPickedId === activeDelivery.id}
                        >
                          {markingDeliveredId === activeDelivery.id ? 'Updating...' : 'Mark Delivered'}
                        </Button>
                      </Grid>
                    </Grid>
                  </>
                ) : (
                  <Box sx={{ color: 'var(--delivery-muted)', fontSize: 15 }}>
                    No active delivery found. Accept a delivery to see live route guidance.
                  </Box>
                )}
              </Box>
            ) : null}

            <Box className='glass-card' sx={{ p: 1.2 }}>
              <Box sx={{ color: 'var(--delivery-text)', fontSize: 30, fontWeight: 700, mb: 1 }}>
                {isCanceledView ? 'Cancelled Deliveries' : 'Past Deliveries'}
              </Box>
              <Box className='delivery-table-wrap'>
                <table className='delivery-table'>
                  <thead>
                    {isCanceledView ? (
                      <tr>
                        <th>Delivery ID</th>
                        <th>Restaurant</th>
                        <th>Pickup</th>
                        <th>Drop</th>
                        <th>Charge</th>
                        <th>Cancelled At</th>
                        <th>Reason</th>
                      </tr>
                    ) : (
                      <tr>
                        <th>Delivery ID</th>
                        <th>Restaurant</th>
                        <th>Drop</th>
                        <th>Earnings</th>
                        <th>Status</th>
                      </tr>
                    )}
                  </thead>
                  <tbody>
                    {list.length ? (
                      list.map((delivery) => (
                        <tr key={delivery.id}>
                          {isCanceledView ? (
                            <>
                              <td>#ORD{String(delivery.id).padStart(3, '0')}</td>
                              <td>{delivery.restaurant_name || delivery.restaurant?.name || '-'}</td>
                              <td>{delivery.restaurant_address || delivery.restaurant?.address || '-'}</td>
                              <td>{getDisplayDropAddress(delivery)}</td>
                              <td>{formatCurrency(delivery.delivery_charge)}</td>
                              <td>{formatDateTime(delivery.updated_at || delivery.created_at)}</td>
                              <td>{delivery.rejection_reason || 'Cancelled by delivery partner'}</td>
                            </>
                          ) : (
                            <>
                              <td>#ORD{String(delivery.id).padStart(3, '0')}</td>
                              <td>{delivery.restaurant_name || delivery.restaurant?.name || '-'}</td>
                              <td>{getDisplayDropAddress(delivery)}</td>
                              <td>{formatCurrency(delivery.delivery_charge)}</td>
                              <td>{formatStatus(delivery.status)}</td>
                            </>
                          )}
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={isCanceledView ? 7 : 5} className='delivery-table__empty'>
                          No deliveries found for this filter.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </Box>
            </Box>
          </Stack>
        </Grid>

        {!isCanceledView ? (
          <Grid size={{ xs: 12, lg: 4.1 }}>
            <Stack spacing={1.1}>
              <Box className='glass-card delivery-live-panel' sx={{ p: 1.2 }}>
                <Box sx={{ color: 'var(--delivery-text)', fontSize: 36, fontWeight: 700, mb: 1 }}>Active Delivery</Box>
                <Box className='delivery-live-panel__subtitle'>
                  {activeDelivery ? 'Live Route View' : 'No Active Route'}
                </Box>

                <Box className='delivery-live-panel__legend'>
                  {!hasMarkedPicked ? (
                    <Box className='delivery-live-panel__legend-item'>
                      <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#2563eb', boxShadow: '0 0 0 3px rgba(37,99,235,0.16)' }} />
                      Partner to Pickup
                    </Box>
                  ) : null}
                  <Box className='delivery-live-panel__legend-item'>
                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#ef7f1a', boxShadow: '0 0 0 3px rgba(239,127,26,0.16)' }} />
                    Pickup to Student
                  </Box>
                </Box>

                <Box className='delivery-map-frame delivery-live-panel__map' sx={{ height: 260 }}>
                  {mapReady ? (
                    <Box ref={mapContainerRef} className='delivery-google-map' />
                  ) : (
                    <Box className='delivery-map-placeholder delivery-map-placeholder--inside'>
                      {mapError || 'Loading map...'}
                    </Box>
                  )}
                </Box>

                {currentLocationError ? (
                  <Box sx={{ mt: 0.8, color: 'var(--delivery-danger)', fontSize: 12, fontWeight: 700 }}>
                    {currentLocationError}
                  </Box>
                ) : null}
                  {routeWarning ? (
                  <Box sx={{ mt: 0.4, color: '#8a6f3b', fontSize: 12, fontWeight: 700 }}>
                    {routeWarning}
                  </Box>
                  ) : null}

                <Grid container sx={{ mt: 1.2 }} spacing={1}>
                  <Grid size={4}>
                    <Box className='delivery-stat-mini'>
                      <span>Partner-Pickup</span>
                      <strong>{formatDistance(routeStats.partnerToPickupKm)}</strong>
                    </Box>
                  </Grid>
                  <Grid size={4}>
                    <Box className='delivery-stat-mini'>
                      <span>Pickup-Drop</span>
                      <strong>{formatDistance(routeStats.pickupToDropKm)}</strong>
                    </Box>
                  </Grid>
                  <Grid size={4}>
                    <Box className='delivery-stat-mini'>
                      <span>Total ETA</span>
                      <strong>{formatMinutes(routeStats.totalMinutes)}</strong>
                    </Box>
                  </Grid>
                </Grid>

                  <Grid container spacing={1} sx={{ mt: 1 }}>
                  <Grid size={6}>
                    <Button
                      className='top-pill top-pill-green'
                      fullWidth
                      startIcon={<OpenInNewRoundedIcon />}
                      onClick={() => mapOpenUrl && window.open(mapOpenUrl, '_blank', 'noopener,noreferrer')}
                      disabled={!mapOpenUrl}
                    >
                      Navigate
                    </Button>
                  </Grid>
                  <Grid size={6}>
                    <Button
                      className='top-pill'
                      fullWidth
                      startIcon={<MyLocationRoundedIcon />}
                      onClick={useCurrentLocation}
                      disabled={detectingCurrentLocation}
                    >
                      {detectingCurrentLocation ? 'Detecting...' : 'Use Live Location'}
                    </Button>
                  </Grid>
                </Grid>

                  <Grid container spacing={1} sx={{ mt: 1 }}>
                  <Grid size={6}>
                    <Button
                      className='top-pill'
                      fullWidth
                      startIcon={<PhoneRoundedIcon />}
                      onClick={() => customerPhone && window.open(`tel:${customerPhone}`, '_self')}
                      disabled={!customerPhone}
                    >
                      Call Customer
                    </Button>
                  </Grid>
                  <Grid size={6}>
                    <Box className='delivery-stat-mini' sx={{ height: '100%', display: 'grid', alignContent: 'center' }}>
                      <span>Earnings</span>
                      <strong>{formatCurrency(activeDelivery?.delivery_charge)}</strong>
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            </Stack>
          </Grid>
        ) : null}
      </Grid>
    </Stack>
  )
}

export default Deliveries
