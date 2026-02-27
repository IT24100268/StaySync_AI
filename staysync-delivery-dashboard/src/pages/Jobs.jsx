import { useCallback, useEffect, useState } from 'react'
import { Alert, Box, Button, Grid, Skeleton, Stack } from '@mui/material'
import api from '../api/axios'
import { MiniMap } from '../components/AppLayout'

function Jobs() {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchJobs = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await api.get('/api/jobs/available/')
      const list = Array.isArray(response.data) ? response.data : response?.data?.results || []
      setJobs(list)
    } catch (err) {
      setError(err?.response?.data?.detail || 'Failed to load jobs')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchJobs()
  }, [fetchJobs])

  const acceptJob = async (id) => {
    try {
      await api.post(`/api/jobs/${id}/accept/`)
      await fetchJobs()
    } catch (err) {
      setError(err?.response?.data?.detail || 'Failed to accept job')
    }
  }

  if (loading) {
    return <Skeleton variant="rounded" height={520} sx={{ borderRadius: 5 }} />
  }

  return (
    <Stack spacing={1.4}>
      {error ? <Alert severity="error">{error}</Alert> : null}
      <Grid container spacing={1.5}>
        <Grid size={{ xs: 12, lg: 7.9 }}>
          <Stack spacing={1.1}>
            <Grid container spacing={1.1}>
              <Grid size={{ xs: 12, md: 3 }}>
                <Box className="glass-card" sx={{ p: 1.2 }}>
                  <Box sx={{ color: '#566c95', fontSize: 15 }}>Jobs Nearby</Box>
                  <Box sx={{ color: '#243c73', fontWeight: 700, fontSize: 30 }}>{jobs.length || 8}</Box>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <Box className="glass-card" sx={{ p: 1.2 }}>
                  <Box sx={{ color: '#566c95', fontSize: 15 }}>High Pay Jobs</Box>
                  <Box sx={{ color: '#243c73', fontWeight: 700, fontSize: 30 }}>
                    {jobs.filter((j) => Number(j?.payout || 0) > 200).length || 3}
                  </Box>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <Box className="glass-card" sx={{ p: 1.2 }}>
                  <Box sx={{ color: '#566c95', fontSize: 15 }}>Avg ETA</Box>
                  <Box sx={{ color: '#243c73', fontWeight: 700, fontSize: 30 }}>12 - 18 mins</Box>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <Box className="glass-card" sx={{ p: 1.2 }}>
                  <Box sx={{ color: '#566c95', fontSize: 15 }}>Your Status</Box>
                  <Box sx={{ color: '#2e9c74', fontWeight: 700, fontSize: 30 }}>Online</Box>
                </Box>
              </Grid>
            </Grid>

            {(jobs.length ? jobs : [{ id: 12 }, { id: 13 }, { id: 14 }]).map((job) => (
              <Box key={job.id} className="glass-card" sx={{ p: 1.3 }}>
                <Grid container spacing={1} alignItems="center">
                  <Grid size={{ xs: 12, md: 8 }}>
                    <Box sx={{ color: '#2d477d', fontSize: 20, fontWeight: 700 }}>{job?.title || 'SpiceHub Restaurant'}</Box>
                    <Box sx={{ color: '#243b70', fontSize: 35, fontWeight: 700 }}>#ORD{job?.id || 12}</Box>
                    <Box sx={{ color: '#243b70', fontSize: 44, fontWeight: 700 }}>LKR {job?.payout || 220}</Box>
                    <Box sx={{ color: '#5a6f98', fontSize: 15 }}>Posted 2 mins ago</Box>
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <Box sx={{ color: '#334f83', fontWeight: 700, fontSize: 28 }}>{job?.distance || '2.4 km'}</Box>
                    <Box sx={{ color: '#334f83', fontWeight: 700, fontSize: 34 }}>{job?.eta || '10 - 14 mins'}</Box>
                    <Button className="top-pill top-pill-green" variant="contained" onClick={() => acceptJob(job.id)}>
                      Accept Job
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            ))}
          </Stack>
        </Grid>

        <Grid size={{ xs: 12, lg: 4.1 }}>
          <Stack spacing={1.1}>
            <Box className="glass-card" sx={{ p: 1.3 }}>
              <Box sx={{ color: '#243d72', fontSize: 38, fontWeight: 700, mb: 0.8 }}>Job Preview</Box>
              <MiniMap compact />
              <Grid container sx={{ mt: 1.2 }}>
                <Grid size={4}><Box sx={{ color: '#23396d', fontWeight: 700 }}>2.4 km</Box></Grid>
                <Grid size={4}><Box sx={{ color: '#23396d', fontWeight: 700 }}>10 - 14 ms</Box></Grid>
                <Grid size={4}><Box sx={{ color: '#23396d', fontWeight: 700 }}>LKR 220</Box></Grid>
              </Grid>
              <Button className="top-pill top-pill-green" fullWidth sx={{ mt: 1 }}>Accept This Job</Button>
              <Button className="top-pill" fullWidth sx={{ mt: 1 }}>Open in Google Maps</Button>
            </Box>
            <Box className="glass-card" sx={{ p: 1.4, textAlign: 'center' }}>
              <Box sx={{ color: '#2c4579', fontSize: 24, fontWeight: 700 }}>No jobs available right now</Box>
              <Button className="top-pill top-pill-green" sx={{ mt: 1 }}>Refresh</Button>
            </Box>
          </Stack>
        </Grid>
      </Grid>
    </Stack>
  )
}

export default Jobs
