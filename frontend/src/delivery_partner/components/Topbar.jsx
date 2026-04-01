import { useEffect, useState } from 'react'
import { Box, Button, CircularProgress, InputBase, Stack, Switch } from '@mui/material'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded'
import LocalShippingRoundedIcon from '@mui/icons-material/LocalShippingRounded'
import { useLocation, useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { useAuth } from '../auth/AuthProvider'

function Topbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { currentUsername } = useAuth()
  const [isOnline, setIsOnline] = useState(false)
  const [loadingStatus, setLoadingStatus] = useState(true)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [topbarProfileName, setTopbarProfileName] = useState(() => String(currentUsername || 'Delivery Partner').trim())
  const [topbarProfileImage, setTopbarProfileImage] = useState('')
  const profileName = String(topbarProfileName || currentUsername || 'Delivery Partner').trim()
  const profileDisplayName = profileName.length > 18 ? `${profileName.slice(0, 18)}...` : profileName
  const profileInitial = profileName.charAt(0).toUpperCase() || 'D'
  const profileActive = location.pathname === '/delivery/profile'

  useEffect(() => {
    let mounted = true

    const loadStatus = async () => {
      setLoadingStatus(true)
      try {
        const response = await api.get('/api/delivery/dashboard/summary/')
        const backendStatus = Boolean(response?.data?.data?.partner?.is_online)
        if (mounted) {
          setIsOnline(backendStatus)
        }
      } catch {
        if (mounted) {
          setIsOnline(false)
        }
      }

      try {
        const profileResponse = await api.get('/api/auth/profile/')
        const user = profileResponse?.data || {}
        const image = String(user?.profile?.display_image || '').trim()
        if (mounted) {
          setTopbarProfileName(String(user?.username || currentUsername || 'Delivery Partner').trim())
          setTopbarProfileImage(image)
        }
      } catch {
        if (mounted) {
          setTopbarProfileName(String(currentUsername || 'Delivery Partner').trim())
          setTopbarProfileImage('')
        }
      } finally {
        if (mounted) {
          setLoadingStatus(false)
        }
      }
    }

    loadStatus()
    return () => {
      mounted = false
    }
  }, [currentUsername])

  useEffect(() => {
    const syncProfileBadge = (event) => {
      const image = String(event?.detail?.image || '').trim()
      const username = String(event?.detail?.username || currentUsername || 'Delivery Partner').trim()
      setTopbarProfileName(username)
      setTopbarProfileImage(image)
    }

    window.addEventListener('delivery-profile-image-updated', syncProfileBadge)
    return () => {
      window.removeEventListener('delivery-profile-image-updated', syncProfileBadge)
    }
  }, [currentUsername])

  const togglePartnerStatus = async (event) => {
    const nextStatus = event.target.checked
    const prevStatus = isOnline
    setIsOnline(nextStatus)
    setUpdatingStatus(true)
    try {
      await api.patch('/api/delivery/partner/status/', { is_online: nextStatus })
    } catch {
      setIsOnline(prevStatus)
    } finally {
      setUpdatingStatus(false)
    }
  }

  return (
    <Box className="topbar-gradient" sx={{ px: { xs: 1.1, md: 2 }, py: 1.2, color: '#fff7ec' }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1} flexWrap="wrap">
        <Stack direction="row" alignItems="center" spacing={0.9}>
          <Box
            sx={{
              width: 34,
              height: 34,
              borderRadius: 2,
              display: 'grid',
              placeItems: 'center',
              bgcolor: 'rgba(201,168,76,0.2)',
              color: 'var(--delivery-accent)',
              border: '1px solid rgba(201,168,76,0.45)',
            }}
          >
            <LocalShippingRoundedIcon sx={{ fontSize: 19 }} />
          </Box>
          <Box>
            <Box sx={{ fontSize: { xs: 20, md: 26 }, fontWeight: 800, lineHeight: 1.1 }}>StaySync AI</Box>
            <Box sx={{ fontSize: 12, color: 'var(--delivery-muted)' }}>Delivery Operations</Box>
          </Box>
        </Stack>

        <Stack direction="row" spacing={0.8} alignItems="center" sx={{ flexWrap: 'wrap' }}>
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            className="delivery-topbar-search"
            sx={{
              borderRadius: '999px',
              px: 1.2,
              py: 0.35,
              minWidth: { xs: 180, md: 320 },
              display: { xs: 'none', md: 'flex' },
            }}
          >
            <SearchRoundedIcon sx={{ color: 'rgba(255,237,207,0.72)', fontSize: 18 }} />
            <InputBase
              placeholder="Search by order ID or restaurant"
              sx={{ width: '100%', fontSize: 14 }}
            />
          </Stack>

          <Stack
            direction="row"
            alignItems="center"
            spacing={0.6}
            sx={{
              borderRadius: '999px',
              px: 0.9,
              py: 0.18,
              bgcolor: 'rgba(245,240,232,0.12)',
              border: '1px solid rgba(255,243,224,0.28)',
              minWidth: 128,
            }}
          >
            <Box sx={{ fontSize: 12, fontWeight: 700, color: isOnline ? '#b3f0cd' : '#ffc5b8', minWidth: 48 }}>
              {isOnline ? 'Online' : 'Offline'}
            </Box>
            {loadingStatus || updatingStatus ? (
              <CircularProgress size={15} sx={{ color: '#fff3df' }} />
            ) : (
              <Switch
                size="small"
                checked={isOnline}
                onChange={togglePartnerStatus}
                sx={{
                  '& .MuiSwitch-track': { backgroundColor: 'rgba(255,243,224,0.42)' },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#4ea66d' },
                }}
              />
            )}
          </Stack>

          <Button
            className={`delivery-topbar-profile${profileActive ? ' is-active' : ''}`}
            variant="contained"
            onClick={() => navigate('/delivery/profile')}
          >
            <Box className="delivery-topbar-profile__avatar">
              {topbarProfileImage ? (
                <img src={topbarProfileImage} alt={`${profileName} profile`} className="delivery-topbar-profile__avatar-image" />
              ) : (
                profileInitial
              )}
            </Box>
            <Box className="delivery-topbar-profile__meta" title={profileName}>
              <strong>{profileDisplayName}</strong>
            </Box>
          </Button>

          <Button
            className="top-pill top-pill-green"
            variant="contained"
            startIcon={<RefreshRoundedIcon />}
            onClick={() => window.location.reload()}
          >
            Refresh
          </Button>
        </Stack>
      </Stack>
    </Box>
  )
}

export default Topbar
