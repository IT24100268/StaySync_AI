import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'
import GlassCard from './GlassCard'

function StatCard({ label, value, hint }) {
  return (
    <GlassCard sx={{ p: 2.5 }}>
      <Stack spacing={0.6}>
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="h5">{value}</Typography>
        {hint ? (
          <Typography variant="caption" color="text.secondary">
            {hint}
          </Typography>
        ) : null}
      </Stack>
    </GlassCard>
  )
}

export default StatCard
