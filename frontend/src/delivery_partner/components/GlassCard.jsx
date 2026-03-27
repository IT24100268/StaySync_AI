import Paper from '@mui/material/Paper'

function GlassCard({ children, sx }) {
  return (
    <Paper
      className="glass-card"
      sx={{
        p: 2.25,
        borderRadius: '24px',
        ...sx,
      }}
    >
      {children}
    </Paper>
  )
}

export default GlassCard
