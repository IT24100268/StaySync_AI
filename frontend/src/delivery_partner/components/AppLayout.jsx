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
                <Box component="h1" sx={{ m: 0, color: '#23396f', fontSize: { xs: 34, md: 44 }, lineHeight: 1.05 }}>
                  {title}
                </Box>
                <Box component="p" sx={{ m: 0, mt: 0.4, color: '#536993', fontSize: { xs: 15, md: 17 } }}>
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
      <Box sx={{ fontSize: 36, fontWeight: 700, color: '#1e3367', mb: 1 }}>{label}</Box>
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
    <Box sx={{ py: 0.9, borderRight: '1px solid rgba(146,167,210,0.35)', '&:last-of-type': { borderRight: 'none' } }}>
      <Box sx={{ color: '#52668f', fontSize: 14 }}>{label}</Box>
      <Box sx={{ color: '#1f3368', fontSize: 33, fontWeight: 700 }}>{value}</Box>
    </Box>
  )
}

export function RightPanelCard({ title, children }) {
  return (
    <Box className="glass-card" sx={{ p: 1.4 }}>
      <Box sx={{ fontSize: 38, fontWeight: 700, color: '#243c72', mb: 1 }}>{title}</Box>
      {children}
    </Box>
  )
}

export default AppLayout
