import Chip from '@mui/material/Chip'

const styleByStatus = {
  active: { bgcolor: 'rgba(42, 185, 122, 0.14)', color: '#168b5a' },
  completed: { bgcolor: 'rgba(47, 124, 251, 0.12)', color: '#2f7cfb' },
  pending: { bgcolor: 'rgba(239, 154, 43, 0.2)', color: '#b56f10' },
  default: { bgcolor: 'rgba(64, 108, 165, 0.12)', color: '#4b6287' },
}

function StatusChip({ status = 'default', label }) {
  const key = String(status).toLowerCase()
  const style = styleByStatus[key] || styleByStatus.default

  return (
    <Chip
      size="small"
      label={label || status}
      sx={{
        ...style,
        borderRadius: '999px',
        fontWeight: 700,
        textTransform: 'capitalize',
      }}
    />
  )
}

export default StatusChip
