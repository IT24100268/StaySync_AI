import { useEffect, useRef, useState } from 'react'
import { Alert, Box, Button, Grid, Stack, TextField } from '@mui/material'
import PersonRoundedIcon from '@mui/icons-material/PersonRounded'
import TwoWheelerRoundedIcon from '@mui/icons-material/TwoWheelerRounded'
import AlternateEmailRoundedIcon from '@mui/icons-material/AlternateEmailRounded'
import PhoneAndroidRoundedIcon from '@mui/icons-material/PhoneAndroidRounded'
import SaveRoundedIcon from '@mui/icons-material/SaveRounded'
import EditRoundedIcon from '@mui/icons-material/EditRounded'
import CloudUploadRoundedIcon from '@mui/icons-material/CloudUploadRounded'
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'
import api from '../api/axios'
import { useAuth } from '../auth/AuthProvider'

function Profile() {
  const { currentUsername } = useAuth()
  const imageInputRef = useRef(null)
  const [formData, setFormData] = useState({
    username: currentUsername || '',
    email: '',
    phone: '',
    vehicle_type: '',
    vehicle_number: ''
  })
  const [isEditing, setIsEditing] = useState(false)
  const [profileSnapshot, setProfileSnapshot] = useState(null)
  const [profileImageUrl, setProfileImageUrl] = useState('')
  const [pendingImageFile, setPendingImageFile] = useState(null)
  const [pendingImagePreviewUrl, setPendingImagePreviewUrl] = useState('')
  const [uploadingImage, setUploadingImage] = useState(false)
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(true)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const fieldSx = {
    '& .MuiInputBase-root': {
      backgroundColor: '#fffdf8',
      color: 'var(--delivery-text)',
      borderRadius: '12px',
    },
    '& .MuiInputLabel-root': {
      color: 'var(--delivery-muted)',
    },
    '& .MuiOutlinedInput-notchedOutline': {
      borderColor: 'var(--delivery-border)',
    },
    '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': {
      borderColor: 'var(--delivery-accent)',
    },
    '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderColor: 'var(--delivery-accent)',
    },
  }

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const [deliveryResponse, authResponse] = await Promise.all([
          api.get('/api/delivery/auth/profile/'),
          api.get('/api/auth/profile/').catch(() => null),
        ])
        const user = deliveryResponse?.data?.data?.user || {}
        const authUser = authResponse?.data || {}
        const authProfile = authUser?.profile || {}

        const nextFormData = {
          username: user.username || authUser.username || '',
          email: user.email || authUser.email || '',
          phone: user.phone || authProfile.phone_number || '',
          vehicle_type: user.vehicle_type || authProfile.vehicle_type || '',
          vehicle_number: user.vehicle_number || authProfile.license_no || ''
        }

        setFormData({
          ...nextFormData,
        })
        setProfileSnapshot({
          ...nextFormData,
        })
        setProfileImageUrl(String(authProfile.display_image || '').trim())
      } catch (err) {
        console.error('Profile fetch error:', err)
        setError('Failed to load profile')
      } finally {
        setFetchLoading(false)
      }
    }
    fetchProfile()
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    if (name === 'phone' && !/^[0-9]*$/.test(value)) return
    setFormData({ ...formData, [name]: value })
  }

  const validate = () => {
    const errors = {}
    const phoneRegex = /^0[0-9]{9}$/
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (!phoneRegex.test(formData.phone))
      errors.phone = 'Enter a valid Sri Lankan phone number (e.g. 0771234567)'

    if (!emailRegex.test(formData.email))
      errors.email = 'Enter a valid email address (e.g. name@example.com)'

    return errors
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSuccess('')
    setError('')

    const errors = validate()
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }
    setFieldErrors({})

    setLoading(true)
    try {
      await api.put('/api/delivery/auth/profile/', formData)
      setProfileSnapshot({ ...formData })
      setSuccess('Profile updated successfully!')
      setIsEditing(false)
    } catch (err) {
      setError(err?.response?.data?.detail || 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  const handlePhotoPickClick = () => {
    imageInputRef.current?.click()
  }

  const handlePhotoSelected = (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!String(file.type || '').startsWith('image/')) {
      setError('Please choose a valid image file.')
      return
    }

    if (pendingImagePreviewUrl) {
      URL.revokeObjectURL(pendingImagePreviewUrl)
    }

    const previewUrl = URL.createObjectURL(file)
    setPendingImageFile(file)
    setPendingImagePreviewUrl(previewUrl)
    setSuccess('')
    setError('')
    event.target.value = ''
  }

  const handleUploadPhoto = async () => {
    if (!pendingImageFile) return

    setUploadingImage(true)
    setSuccess('')
    setError('')

    try {
      const payload = new FormData()
      payload.append('profile.display_image', pendingImageFile)

      const response = await api.put('/api/auth/profile/', payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      const nextImage = String(response?.data?.profile?.display_image || '').trim()
      setProfileImageUrl(nextImage)
      setPendingImageFile(null)
      if (pendingImagePreviewUrl) {
        URL.revokeObjectURL(pendingImagePreviewUrl)
      }
      setPendingImagePreviewUrl('')
      setSuccess('Profile photo updated successfully.')
      window.dispatchEvent(
        new CustomEvent('delivery-profile-image-updated', {
          detail: {
            username: String(response?.data?.username || formData.username || currentUsername || '').trim(),
            image: nextImage,
          },
        })
      )
    } catch (err) {
      setError(err?.response?.data?.detail || 'Failed to upload profile photo.')
    } finally {
      setUploadingImage(false)
    }
  }

  const handleRemovePhoto = async () => {
    setUploadingImage(true)
    setSuccess('')
    setError('')

    try {
      const payload = new FormData()
      payload.append('remove_display_image', 'true')

      const response = await api.put('/api/auth/profile/', payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setProfileImageUrl('')
      setPendingImageFile(null)
      if (pendingImagePreviewUrl) {
        URL.revokeObjectURL(pendingImagePreviewUrl)
      }
      setPendingImagePreviewUrl('')
      setSuccess('Profile photo removed.')
      window.dispatchEvent(
        new CustomEvent('delivery-profile-image-updated', {
          detail: {
            username: String(response?.data?.username || formData.username || currentUsername || '').trim(),
            image: '',
          },
        })
      )
    } catch (err) {
      setError(err?.response?.data?.detail || 'Failed to remove profile photo.')
    } finally {
      setUploadingImage(false)
    }
  }

  const startEditing = () => {
    setSuccess('')
    setError('')
    setIsEditing(true)
  }

  const cancelEditing = () => {
    if (profileSnapshot) {
      setFormData({ ...profileSnapshot })
    }
    setIsEditing(false)
    setError('')
    setFieldErrors({})
  }

  const profileName = String(formData.username || currentUsername || 'Delivery Partner').trim()
  const profileInitial = profileName.charAt(0).toUpperCase() || 'D'
  const displayAvatarUrl = pendingImagePreviewUrl || profileImageUrl

  useEffect(() => {
    return () => {
      if (pendingImagePreviewUrl) {
        URL.revokeObjectURL(pendingImagePreviewUrl)
      }
    }
  }, [pendingImagePreviewUrl])

  if (fetchLoading) {
    return <Box sx={{ color: 'var(--delivery-text)', fontSize: 18 }}>Loading profile...</Box>
  }

  return (
    <Stack spacing={2}>
      {success && <Alert severity="success">{success}</Alert>}
      {error && <Alert severity="error">{error}</Alert>}

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, lg: 8.3 }}>
          <Stack spacing={1.5}>
            <Box className="glass-card delivery-profile-hero">
              <Box className="delivery-profile-hero__left">
                <Box className="delivery-profile-avatar">
                  {displayAvatarUrl ? (
                    <img src={displayAvatarUrl} alt={`${profileName} profile`} className="delivery-profile-avatar__image" />
                  ) : (
                    profileInitial
                  )}
                </Box>
                <Box>
                  <Box className="delivery-profile-hero__name">{profileName}</Box>
                  <Box className="delivery-profile-hero__role">Delivery Partner</Box>
                </Box>
              </Box>

              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', rowGap: 0.7 }}>
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  className="delivery-profile-image-input"
                  onChange={handlePhotoSelected}
                />
                <Button
                  className="top-pill"
                  variant="contained"
                  startIcon={<CloudUploadRoundedIcon />}
                  onClick={handlePhotoPickClick}
                  disabled={uploadingImage}
                >
                  Choose Photo
                </Button>
                {pendingImageFile ? (
                  <Button
                    className="top-pill top-pill-green"
                    variant="contained"
                    onClick={handleUploadPhoto}
                    disabled={uploadingImage}
                  >
                    {uploadingImage ? 'Uploading...' : 'Upload Photo'}
                  </Button>
                ) : null}
                {profileImageUrl ? (
                  <Button
                    className="top-pill"
                    variant="contained"
                    startIcon={<DeleteOutlineRoundedIcon />}
                    onClick={handleRemovePhoto}
                    disabled={uploadingImage}
                  >
                    Remove Photo
                  </Button>
                ) : null}
              </Stack>
            </Box>

            <Box className="glass-card delivery-profile-form-card">
              <Box className="delivery-panel__header" sx={{ mb: 1.2 }}>
                <Box className="delivery-panel__title" sx={{ mb: 0 }}>
                  Profile Settings
                </Box>
                {!isEditing ? (
                  <Button className="top-pill top-pill-green" variant="contained" startIcon={<EditRoundedIcon />} onClick={startEditing}>
                    Edit Profile
                  </Button>
                ) : null}
              </Box>

              <form onSubmit={handleSubmit}>
                <Grid container spacing={1.2}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      label="Username"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      fullWidth
                      disabled
                      InputProps={{ readOnly: true }}
                      sx={fieldSx}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      label="Email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      fullWidth
                      disabled={!isEditing}
                      InputProps={{ readOnly: !isEditing }}
                      error={!!fieldErrors.email}
                      helperText={fieldErrors.email || ''}
                      sx={fieldSx}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      label="Phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleChange}
                      fullWidth
                      disabled={!isEditing}
                      InputProps={{ readOnly: !isEditing }}
                      error={!!fieldErrors.phone}
                      helperText={fieldErrors.phone || 'Sri Lankan format: 0771234567'}
                      sx={fieldSx}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      label="Vehicle Type"
                      name="vehicle_type"
                      value={formData.vehicle_type}
                      onChange={handleChange}
                      placeholder="e.g., Bike, Scooter"
                      fullWidth
                      disabled={!isEditing}
                      InputProps={{ readOnly: !isEditing }}
                      sx={fieldSx}
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <TextField
                      label="Vehicle Number"
                      name="vehicle_number"
                      value={formData.vehicle_number}
                      onChange={handleChange}
                      fullWidth
                      disabled={!isEditing}
                      InputProps={{ readOnly: !isEditing }}
                      sx={fieldSx}
                    />
                  </Grid>
                </Grid>

                {isEditing ? (
                  <Stack direction="row" spacing={1.2} sx={{ mt: 1.6, flexWrap: 'wrap', rowGap: 0.8 }}>
                    <Button
                      type="submit"
                      className="top-pill top-pill-green"
                      variant="contained"
                      startIcon={<SaveRoundedIcon />}
                      disabled={loading}
                    >
                      {loading ? 'Saving...' : 'Save Changes'}
                    </Button>
                    <Button className="top-pill" variant="contained" onClick={cancelEditing} disabled={loading}>
                      Cancel
                    </Button>
                  </Stack>
                ) : null}
              </form>
            </Box>
            </Stack>
        </Grid>

        <Grid size={{ xs: 12, lg: 3.7 }}>
          <Stack spacing={1.3}>
            <Box className="glass-card delivery-profile-summary">
              <Box className="delivery-panel__title" sx={{ mb: 1 }}>
                Profile Overview
              </Box>

              <Box className="delivery-profile-summary__metric">
                <PersonRoundedIcon fontSize="small" />
                <Box>
                  <span>Partner Name</span>
                  <strong>{profileName}</strong>
                </Box>
              </Box>

              <Box className="delivery-profile-summary__metric">
                <AlternateEmailRoundedIcon fontSize="small" />
                <Box>
                  <span>Email</span>
                  <strong>{formData.email || 'Not added'}</strong>
                </Box>
              </Box>

              <Box className="delivery-profile-summary__metric">
                <PhoneAndroidRoundedIcon fontSize="small" />
                <Box>
                  <span>Phone</span>
                  <strong>{formData.phone || 'Not added'}</strong>
                </Box>
              </Box>

              <Box className="delivery-profile-summary__metric">
                <TwoWheelerRoundedIcon fontSize="small" />
                <Box>
                  <span>Vehicle</span>
                  <strong>{[formData.vehicle_type, formData.vehicle_number].filter(Boolean).join(' - ') || 'Not added'}</strong>
                </Box>
              </Box>

                <Box className="delivery-profile-completion">
                <Box className="delivery-profile-completion__head">
                  <span>Profile Photo</span>
                  <strong>{profileImageUrl ? 'Added' : 'Not Added'}</strong>
                </Box>
              </Box>
            </Box>
          </Stack>
        </Grid>
      </Grid>
    </Stack>
  )
}

export default Profile
