import { Button, Stack, Typography } from '@mui/material'
import LocationOnRoundedIcon from '@mui/icons-material/LocationOnRounded'
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded'
import PaidRoundedIcon from '@mui/icons-material/PaidRounded'
import GlassCard from './GlassCard'
import StatusChip from './StatusChip'

function JobCard({ job, onAccept, loading }) {
  return (
    <GlassCard>
      <Stack spacing={1.3}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">{job?.title || `Job #${job?.id}`}</Typography>
          <StatusChip status={job?.status || 'pending'} />
        </Stack>

        <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
          <Stack direction="row" alignItems="center" spacing={0.8}>
            <LocationOnRoundedIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
            <Typography variant="body2" color="text.secondary">
              {job?.pickup_address || 'Pickup location unavailable'}
            </Typography>
          </Stack>
          <Stack direction="row" alignItems="center" spacing={0.8}>
            <AccessTimeRoundedIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
            <Typography variant="body2" color="text.secondary">
              {job?.eta || 'ETA not provided'}
            </Typography>
          </Stack>
          <Stack direction="row" alignItems="center" spacing={0.8}>
            <PaidRoundedIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
            <Typography variant="body2" color="text.secondary">
              {job?.payout ? `$${job.payout}` : 'Payout TBD'}
            </Typography>
          </Stack>
        </Stack>

        <Stack direction="row" justifyContent="flex-end">
          <Button variant="contained" onClick={() => onAccept(job?.id)} disabled={loading}>
            Accept Job
          </Button>
        </Stack>
      </Stack>
    </GlassCard>
  )
}

export default JobCard
