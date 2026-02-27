import { useEffect, useState } from 'react'
import { Avatar, Badge, Box, Button, CircularProgress, InputBase, Stack, Switch } from '@mui/material'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded'
import BarChartRoundedIcon from '@mui/icons-material/BarChartRounded'
import NotificationsNoneRoundedIcon from '@mui/icons-material/NotificationsNoneRounded'
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded'
import FilterAltRoundedIcon from '@mui/icons-material/FilterAltRounded'
import { useLocation } from 'react-router-dom'
import api from '../api/axios'

function Topbar() {
  const location = useLocation()
  const showDate = location.pathname === '/earnings'
  const showFilter = location.pathname === '/deliveries' || location.pathname === '/activity'
  const [isOnline, setIsOnline] = useState(false)
  const [loadingStatus, setLoadingStatus] = useState(true)
  const [updatingStatus, setUpdatingStatus] = useState(false)

  useEffect(() => {
    let mounted = true

    const loadStatus = async () => {
      setLoadingStatus(true)
      try {
        const response = await api.get('/api/dashboard/summary/')
        const backendStatus = Boolean(response?.data?.data?.partner?.is_online)
        if (mounted) {
          setIsOnline(backendStatus)
        }
      } catch {
        if (mounted) {
          setIsOnline(false)
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
  }, [])

  const togglePartnerStatus = async (event) => {
    const nextStatus = event.target.checked
    const prevStatus = isOnline
    setIsOnline(nextStatus)
    setUpdatingStatus(true)
    try {
      await api.patch('/api/partner/status/', { is_online: nextStatus })
    } catch {
      setIsOnline(prevStatus)
    } finally {
      setUpdatingStatus(false)
    }
  }

  return (
    <Box className="topbar-gradient" sx={{ px: { xs: 1.2, md: 2.3 }, py: 1.4, color: '#fff' }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
        <Stack direction="row" alignItems="center" spacing={1} className="brand-wrap">
          <Box component="span" sx={{ fontSize: 24 }}>
            🚴
          </Box>
          <Box component="span" sx={{ fontSize: { xs: 25, md: 33 }, fontWeight: 700 }}>
            StaySync AI
          </Box>
        </Stack>

        <Stack direction="row" spacing={0.8} alignItems="center" sx={{ width: { xs: 'auto', md: 'auto' } }}>
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            sx={{
              bgcolor: 'rgba(255,255,255,0.84)',
              border: '1px solid rgba(255,255,255,0.4)',
              borderRadius: '999px',
              px: 1.3,
              py: 0.35,
              minWidth: { xs: 180, md: 420 },
              display: { xs: 'none', md: 'flex' },
            }}
          >
            <SearchRoundedIcon sx={{ color: '#6f81aa', fontSize: 19 }} />
            <InputBase placeholder="Search by restaurant, hostel, or order ID" sx={{ color: '#3e5686', width: '100%' }} />
          </Stack>

          <Stack
            direction="row"
            alignItems="center"
            spacing={0.6}
            sx={{
              borderRadius: '999px',
              px: 0.9,
              py: 0.2,
              bgcolor: 'rgba(255,255,255,0.2)',
              border: '1px solid rgba(255,255,255,0.28)',
              minWidth: 128,
            }}
          >
            <Box sx={{ fontSize: 13, fontWeight: 700, color: '#fff', minWidth: 48 }}>
              {isOnline ? 'Online' : 'Offline'}
            </Box>
            {loadingStatus || updatingStatus ? (
              <CircularProgress size={16} sx={{ color: '#fff' }} />
            ) : (
              <Switch
                size="small"
                checked={isOnline}
                onChange={togglePartnerStatus}
                sx={{
                  '& .MuiSwitch-track': { backgroundColor: 'rgba(255,255,255,0.5)' },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#53c09e' },
                }}
              />
            )}
          </Stack>

          {showDate ? (
            <Button className="top-pill" startIcon={<CalendarMonthRoundedIcon />} variant="contained">
              April 1, 2024 - April 30, 2024
            </Button>
          ) : null}
          {showFilter ? (
            <Button className="top-pill" startIcon={<FilterAltRoundedIcon />} variant="contained">
              Filter
            </Button>
          ) : null}
          <Button
            className="top-pill top-pill-green"
            variant="contained"
            startIcon={<RefreshRoundedIcon />}
          >
            Refresh
          </Button>

          <Badge variant="dot" color="success" overlap="circular">
            <Avatar sx={{ width: 34, height: 34, bgcolor: 'rgba(255,255,255,0.2)' }}>
              <NotificationsNoneRoundedIcon sx={{ color: '#fff', fontSize: 18 }} />
            </Avatar>
          </Badge>
          <Avatar sx={{ width: 34, height: 34, bgcolor: 'rgba(255,255,255,0.2)' }}>
            <BarChartRoundedIcon sx={{ color: '#fff', fontSize: 18 }} />
          </Avatar>
        </Stack>
      </Stack>
    </Box>
  )
}

export default Topbar
