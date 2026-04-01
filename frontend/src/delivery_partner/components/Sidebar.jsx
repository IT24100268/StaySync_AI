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
import PaidRoundedIcon from '@mui/icons-material/PaidRounded'
import PersonRoundedIcon from '@mui/icons-material/PersonRounded'
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded'
import WorkRoundedIcon from '@mui/icons-material/WorkRounded'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'

const items = [
  { label: 'Dashboard', path: '/delivery/dashboard', icon: <DashboardRoundedIcon /> },
  { label: 'Available Jobs', path: '/delivery/jobs', icon: <WorkRoundedIcon /> },
  { label: 'My Deliveries', path: '/delivery/deliveries', icon: <LocalShippingRoundedIcon /> },
  { label: 'Earnings', path: '/delivery/earnings', icon: <PaidRoundedIcon /> },
  { label: 'Profile', path: '/delivery/profile', icon: <PersonRoundedIcon /> },
]

function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { logout } = useAuth()

  return (
    <Stack spacing={1.2}>
      <Box className="glass-card" sx={{ p: 1.1 }}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ px: 0.4, py: 0.5 }}>
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: 2,
              bgcolor: 'rgba(201,168,76,0.22)',
              border: '1px solid rgba(201,168,76,0.45)',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <WorkRoundedIcon sx={{ color: 'var(--delivery-accent)', fontSize: 18 }} />
          </Box>
          <Box>
            <Typography sx={{ color: 'var(--delivery-text)', fontSize: 14, fontWeight: 700, lineHeight: 1.2 }}>
              Delivery Workspace
            </Typography>
            <Typography sx={{ color: 'var(--delivery-muted)', fontSize: 11 }}>StaySync AI Partner</Typography>
          </Box>
        </Stack>

        <Divider sx={{ my: 1.1, borderColor: 'rgba(125,102,79,0.22)' }} />

        <List sx={{ py: 0.2 }}>
          {items.map((item) => {
            const selected = location.pathname === item.path
            return (
              <ListItemButton
                key={item.path}
                onClick={() => navigate(item.path)}
                selected={selected}
                className="delivery-sidebar-link"
                sx={{
                  borderRadius: '999px',
                  mb: 0.5,
                  minHeight: 40,
                  color: selected ? '#241204' : 'var(--delivery-text)',
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 36,
                    color: selected ? '#241204' : 'var(--delivery-muted)',
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontSize: 13.5,
                    fontWeight: selected ? 800 : 600,
                  }}
                />
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
          sx={{
            mt: 1,
            borderRadius: '999px',
            borderColor: 'rgba(201,168,76,0.5)',
            color: 'var(--delivery-accent)',
            '&:hover': {
              borderColor: 'rgba(201,168,76,0.85)',
              backgroundColor: 'rgba(201,168,76,0.12)',
            },
          }}
        >
          Logout
        </Button>
      </Box>
    </Stack>
  )
}

export default Sidebar
