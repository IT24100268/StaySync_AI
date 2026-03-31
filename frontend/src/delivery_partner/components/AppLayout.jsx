import { Box, Grid } from '@mui/material'
import Topbar from './Topbar'
import Sidebar from './Sidebar'

function AppLayout({ title, subtitle, children }) {
  return (
    <Box className="dashboard-shell" sx={{ p: { xs: 1.2, md: 2 }, minHeight: '100vh' }}>
      <Topbar />
      <Box sx={{ mt: 2 }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 3, lg: 2.15 }}>
            <Sidebar />
          </Grid>
          <Grid size={{ xs: 12, md: 9, lg: 9.85 }}>
            <Box className="page-shell">
              <Box sx={{ mb: 2.2 }}>
                <Box component="h1" className="delivery-page-title">
                  {title}
                </Box>
                <Box component="p" className="delivery-page-subtitle">
                  {subtitle}
                </Box>
              </Box>
              {children}
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Box>
  )
}

export function MiniMap({ label = 'On the way', compact = false }) {
  return (
    <Box className="glass-card" sx={{ p: 1.2 }}>
      <Box sx={{ fontSize: 28, fontWeight: 700, color: 'var(--delivery-text)', mb: 1 }}>{label}</Box>
      <Box
        className="map-placeholder"
        sx={{
          height: compact ? 140 : 230,
          borderRadius: '20px',
        }}
      />
      <Box sx={{ mt: 1.1 }} className="route-progress" />
    </Box>
  )
}

export function RightMetric({ label, value }) {
  return (
    <Box sx={{ py: 0.9, borderRight: '1px solid rgba(201,168,76,0.3)', '&:last-of-type': { borderRight: 'none' } }}>
      <Box sx={{ color: 'var(--delivery-muted)', fontSize: 14 }}>{label}</Box>
      <Box sx={{ color: 'var(--delivery-text)', fontSize: 33, fontWeight: 700 }}>{value}</Box>
    </Box>
  )
}

export function RightPanelCard({ title, children }) {
  return (
    <Box className="glass-card" sx={{ p: 1.4 }}>
      <Box sx={{ fontSize: 32, fontWeight: 700, color: 'var(--delivery-text)', mb: 1 }}>{title}</Box>
      {children}
    </Box>
  )
}

export default AppLayout
