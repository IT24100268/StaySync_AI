import {
  Box,
  Button,
  Divider,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Typography,
} from '@mui/material'
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded'
import LocalShippingRoundedIcon from '@mui/icons-material/LocalShippingRounded'
import AssignmentRoundedIcon from '@mui/icons-material/AssignmentRounded'
import PaidRoundedIcon from '@mui/icons-material/PaidRounded'
import HistoryRoundedIcon from '@mui/icons-material/HistoryRounded'
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded'
import WorkRoundedIcon from '@mui/icons-material/WorkRounded'
import CurrencyExchangeRoundedIcon from '@mui/icons-material/CurrencyExchangeRounded'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'

const items = [
  { label: 'Dashboard', path: '/dashboard', icon: <DashboardRoundedIcon /> },
  { label: 'Available Jobs', path: '/jobs', icon: <WorkRoundedIcon /> },
  { label: 'My Deliveries', path: '/deliveries', icon: <LocalShippingRoundedIcon /> },
  { label: 'Earnings', path: '/earnings', icon: <PaidRoundedIcon /> },
  { label: 'Activity Log', path: '/activity', icon: <HistoryRoundedIcon /> },
]

function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { logout } = useAuth()

  return (
    <Stack spacing={1.4}>
      <Box className="glass-card" sx={{ p: 1.3 }}>
        <Stack direction="row" alignItems="center" spacing={1.2} sx={{ px: 0.7, py: 0.8 }}>
          <Box
            sx={{
              width: 33,
              height: 33,
              borderRadius: 2,
              bgcolor: 'primary.main',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <AssignmentRoundedIcon sx={{ color: '#fff', fontSize: 19 }} />
          </Box>
          <Box>
            <Typography variant="subtitle1" sx={{ lineHeight: 1.1 }}>
              StaySync AI
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Delivery Partner
            </Typography>
          </Box>
        </Stack>

        <Divider sx={{ my: 1.1 }} />

        <List sx={{ py: 0.2 }}>
        {items.map((item) => {
          const selected = location.pathname === item.path
          return (
            <ListItemButton
              key={item.path}
              onClick={() => navigate(item.path)}
              selected={selected}
              sx={{
                borderRadius: '999px',
                mb: 0.5,
                minHeight: 42,
                '&.Mui-selected': {
                  bgcolor: 'linear-gradient(145deg, #76a3ff 0%, #4d83ed 100%)',
                  backgroundImage: 'linear-gradient(145deg, #76a3ff 0%, #4d83ed 100%)',
                  color: '#fff',
                },
                '&.Mui-selected .MuiListItemText-primary': {
                  fontWeight: 600,
                },
                '&.Mui-selected .MuiListItemIcon-root': {
                  color: '#fff',
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 38, color: selected ? 'primary.main' : 'text.secondary' }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          )
        })}
        </List>

        <Button
          fullWidth
          variant="outlined"
          startIcon={<LogoutRoundedIcon />}
          onClick={() => {
            logout()
            window.location.href = 'http://localhost:5173'
          }}
          sx={{ mt: 1, borderRadius: '999px' }}
        >
          Logout
        </Button>
      </Box>

      <Box className="glass-card" sx={{ p: 1.4 }}>
        <Typography sx={{ color: '#243c71', fontSize: 17, fontWeight: 600 }}>Restaurant Seliwy</Typography>
        <Stack direction="row" alignItems="center" spacing={0.7} sx={{ mt: 0.8 }}>
          <Box sx={{ width: 30, height: 18, borderRadius: '999px', bgcolor: '#4ac38f' }} />
          <Typography sx={{ color: '#2d8e69', fontSize: 16, fontWeight: 600 }}>Online</Typography>
        </Stack>
        <Button
          className="top-pill top-pill-warn"
          variant="contained"
          startIcon={<CurrencyExchangeRoundedIcon />}
          fullWidth
          sx={{ mt: 1.1 }}
        >
          Upgrade Plan
        </Button>
      </Box>

      <Box className="glass-card" sx={{ p: 1.4 }}>
        <Typography sx={{ color: '#4b618d', fontSize: 14 }}>Today's Completed</Typography>
        <Typography sx={{ color: '#243a6f', fontWeight: 700, fontSize: 26, my: 0.6 }}>LKR 500</Typography>
        <Button className="top-pill" variant="contained" fullWidth>
          View Earnings
        </Button>
      </Box>
    </Stack>
  )
}

export default Sidebar
