import Chip from '@mui/material/Chip'

const styleByStatus = {
  active: { bgcolor: 'rgba(47, 123, 75, 0.14)', color: '#2f7b4b' },
  completed: { bgcolor: 'rgba(201, 168, 76, 0.18)', color: '#7f6222' },
  pending: { bgcolor: 'rgba(201, 168, 76, 0.18)', color: '#7f6222' },
  default: { bgcolor: 'rgba(125, 102, 79, 0.14)', color: '#7d664f' },
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
