import { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const JAFFNA_UNIVERSITY_CENTER = { lat: 9.6848, lng: 80.0220 };
const GOOGLE_MAP_SCRIPT_ID = 'google-maps-script';

function isConfiguredGoogleMapsKey(apiKey) {
  return Boolean(apiKey && apiKey.trim() && apiKey !== 'your-google-maps-api-key');
}

function loadGoogleMaps(apiKey) {
  if (!isConfiguredGoogleMapsKey(apiKey)) {
    return Promise.reject(
      new Error('Google Maps is not configured yet. Add a real VITE_GOOGLE_MAPS_API_KEY in frontend/.env and restart the frontend.')
    );
  }

  if (window.google?.maps) {
    return Promise.resolve(window.google.maps);
  }

  const existingScript = document.getElementById(GOOGLE_MAP_SCRIPT_ID);
  if (existingScript) {
    return new Promise((resolve, reject) => {
      existingScript.addEventListener('load', () => resolve(window.google?.maps), { once: true });
      existingScript.addEventListener('error', () => reject(new Error('Failed to load Google Maps.')), { once: true });
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.id = GOOGLE_MAP_SCRIPT_ID;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&loading=async`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.google?.maps);
    script.onerror = () => reject(new Error('Failed to load Google Maps.'));
    document.head.appendChild(script);
  });
}

const Register = () => {
  const [step, setStep] = useState(1);
  const [userType, setUserType] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
  });
  const [profileData, setProfileData] = useState({});
  const [displayImagePreview, setDisplayImagePreview] = useState('');
  const [mapsReady, setMapsReady] = useState(false);
  const [mapError, setMapError] = useState('');
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [resolvingLocation, setResolvingLocation] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const geocoderRef = useRef(null);
  const mapListenersRef = useRef([]);
  const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const locationMapEnabled = step === 2 && ['hostel_owner', 'restaurant_owner'].includes(userType);

  const roleOptions = [
    { value: 'student', label: 'Student', icon: '🎓', desc: 'Find rooms and order food' },
    { value: 'hostel_owner', label: 'Hostel Owner', icon: '🏠', desc: 'List your hostel rooms' },
    { value: 'restaurant_owner', label: 'Restaurant Owner', icon: '🍽️', desc: 'List your restaurant' },
    { value: 'delivery', label: 'Delivery Partner', icon: '🚴', desc: 'Deliver orders' },
  ];

  const handleRoleSelect = (role) => {
    setUserType(role);
    setProfileData({});
    setDisplayImagePreview('');
    setStep(2);
  };

  useEffect(() => () => {
    if (displayImagePreview?.startsWith('blob:')) {
      URL.revokeObjectURL(displayImagePreview);
    }
  }, [displayImagePreview]);

  useEffect(() => {
    let isMounted = true;

    loadGoogleMaps(googleMapsApiKey)
      .then(() => {
        if (!isMounted) return;
        setMapsReady(true);
        setMapError('');
      })
      .catch((err) => {
        if (!isMounted) return;
        setMapsReady(false);
        setMapError(err.message || 'Unable to load Google Maps.');
      });

    return () => {
      isMounted = false;
    };
  }, [googleMapsApiKey]);

  useEffect(() => {
    if (!locationMapEnabled || !mapsReady || !mapContainerRef.current || !window.google?.maps) {
      return;
    }

    const latitude = Number.parseFloat(profileData.latitude);
    const longitude = Number.parseFloat(profileData.longitude);
    const hasCoordinates = Number.isFinite(latitude) && Number.isFinite(longitude);
    const center = hasCoordinates ? { lat: latitude, lng: longitude } : JAFFNA_UNIVERSITY_CENTER;

    if (!mapRef.current) {
      mapRef.current = new window.google.maps.Map(mapContainerRef.current, {
        center,
        zoom: hasCoordinates ? 16 : 13,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        gestureHandling: 'greedy',
      });

      markerRef.current = new window.google.maps.Marker({
        map: mapRef.current,
        position: center,
        draggable: true,
      });

      geocoderRef.current = new window.google.maps.Geocoder();

      mapListenersRef.current.push(
        mapRef.current.addListener('click', (event) => {
          if (!event.latLng) return;
          updateSelectedLocation(event.latLng.lat(), event.latLng.lng(), false);
        }),
        markerRef.current.addListener('dragend', (event) => {
          if (!event.latLng) return;
          updateSelectedLocation(event.latLng.lat(), event.latLng.lng(), false);
        })
      );
    } else {
      markerRef.current?.setPosition(center);
      mapRef.current.setCenter(center);
    }
  }, [locationMapEnabled, mapsReady, profileData.latitude, profileData.longitude]);

  useEffect(() => {
    return () => {
      mapListenersRef.current.forEach((listener) => listener?.remove?.());
      mapListenersRef.current = [];
    };
  }, []);

  const setProfileValue = (key, value) => {
    setProfileData((previous) => ({ ...previous, [key]: value }));
  };

  const reverseGeocode = async (lat, lng) => {
    if (!geocoderRef.current) return;

    setResolvingLocation(true);

    try {
      const response = await geocoderRef.current.geocode({ location: { lat, lng } });
      const formattedAddress = response.results?.[0]?.formatted_address || '';
      if (formattedAddress) {
        setProfileValue('address', formattedAddress);
      }
    } finally {
      setResolvingLocation(false);
    }
  };

  const updateSelectedLocation = async (lat, lng, shouldPan = true) => {
    setProfileData((previous) => ({
      ...previous,
      latitude: Number(lat).toFixed(6),
      longitude: Number(lng).toFixed(6),
    }));

    if (markerRef.current) {
      markerRef.current.setPosition({ lat, lng });
    }

    if (shouldPan && mapRef.current) {
      mapRef.current.panTo({ lat, lng });
      mapRef.current.setZoom(16);
    }

    await reverseGeocode(lat, lng);
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Location is not supported in this browser.');
      return;
    }

    setDetectingLocation(true);
    setError('');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        await updateSelectedLocation(latitude, longitude);
        setDetectingLocation(false);
      },
      () => {
        setDetectingLocation(false);
        setError('Unable to access your current location. Please allow location permission and try again.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleDisplayImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (displayImagePreview?.startsWith('blob:')) {
      URL.revokeObjectURL(displayImagePreview);
    }

    setProfileValue('display_image', file);
    setDisplayImagePreview(URL.createObjectURL(file));
  };

  const clearDisplayImage = () => {
    if (displayImagePreview?.startsWith('blob:')) {
      URL.revokeObjectURL(displayImagePreview);
    }
    setDisplayImagePreview('');
    setProfileData((previous) => {
      const next = { ...previous };
      delete next.display_image;
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Client-side validation
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (formData.username.length < 3) {
      setError('Username must be at least 3 characters long');
      return;
    }

    // Validate phone number
    const phone = profileData.phone_number;
    if (phone && !/^[0-9+\-\s()]+$/.test(phone)) {
      setError('Please enter a valid phone number');
      return;
    }

    // Validate vehicle number for delivery partners
    if (userType === 'delivery') {
      const vehicleNo = profileData.license_no || '';
      if (!/^[A-Za-z]+\d{4}$/.test(vehicleNo.replace(/[-\s]/g, ''))) {
        setError('Vehicle number must have letters followed by exactly 4 digits (e.g. ABC-1234)');
        return;
      }
    }

    if (userType === 'restaurant_owner' || userType === 'hostel_owner') {
      if (!profileData.latitude || !profileData.longitude) {
        setError(`Please choose your ${userType === 'restaurant_owner' ? 'restaurant' : 'hostel'} location on the map.`);
        return;
      }

      if (!profileData.address || String(profileData.address).trim().length < 3) {
        setError(`Please confirm a location label for your ${userType === 'restaurant_owner' ? 'restaurant' : 'hostel'}.`);
        return;
      }
    }

    try {
      let payload;
      if (profileData.display_image) {
        payload = new FormData();
        payload.append('email', formData.email);
        payload.append('username', formData.username);
        payload.append('password', formData.password);
        payload.append('user_type', userType);

        Object.entries(profileData).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            payload.append(`profile.${key}`, value);
          }
        });
      } else {
        payload = {
          ...formData,
          user_type: userType,
          profile: profileData,
        };
      }

      await register(payload);
      setSuccess('Registration successful! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      console.error('Registration error:', err);
      const errorData = err.response?.data;
      let errorMsg = 'Registration failed';
      
      if (errorData) {
        if (typeof errorData === 'string') {
          errorMsg = errorData;
        } else if (errorData.detail) {
          errorMsg = errorData.detail;
        } else if (errorData.email) {
          errorMsg = `Email: ${Array.isArray(errorData.email) ? errorData.email[0] : errorData.email}`;
        } else if (errorData.username) {
          errorMsg = `Username: ${errorData.username[0]}`;
        } else if (errorData.password) {
          errorMsg = `Password: ${errorData.password[0]}`;
        } else {
          errorMsg = JSON.stringify(errorData);
        }
      } else if (err.message) {
        errorMsg = err.message;
      }
      
      setError(errorMsg);
    }
  };

  const renderProfileFields = () => {
    switch (userType) {
      case 'student':
        return (
          <>
            <input
              name="university"
              placeholder="University"
              onChange={(e) => setProfileValue('university', e.target.value)}
              required
              style={styles.input}
            />
            <select
              name="gender_preference"
              onChange={(e) => setProfileValue('gender_preference', e.target.value)}
              style={styles.input}
            >
              <option value="any">Gender Preference: Any</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
            <input
              name="budget"
              type="number"
              placeholder="Budget"
              onChange={(e) => setProfileValue('budget', e.target.value)}
              style={styles.input}
            />
            <input
              name="phone_number"
              placeholder="Phone Number"
              onChange={(e) => setProfileValue('phone_number', e.target.value)}
              required
              style={styles.input}
            />
          </>
        );
      case 'hostel_owner':
        return (
          <>
            <input
              name="hostel_name"
              placeholder="Hostel Name"
              onChange={(e) => setProfileValue('hostel_name', e.target.value)}
              required
              style={styles.input}
            />
            <input
              name="phone_number"
              placeholder="Phone Number"
              onChange={(e) => setProfileValue('phone_number', e.target.value)}
              required
              style={styles.input}
            />
            <input
              name="business_reg_no"
              placeholder="Business Registration No (Optional)"
              onChange={(e) => setProfileValue('business_reg_no', e.target.value)}
              style={styles.input}
            />
            <div style={styles.mapCard}>
              <div style={styles.mapHeader}>
                <div>
                  <div style={styles.mapTitle}>Hostel Location</div>
                  <div style={styles.mapHint}>
                    Pick the exact hostel location on the map. The view starts near the University of Jaffna.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleUseCurrentLocation}
                  disabled={detectingLocation || !mapsReady}
                  style={{
                    ...styles.locationButton,
                    opacity: detectingLocation || !mapsReady ? 0.7 : 1,
                    cursor: detectingLocation || !mapsReady ? 'not-allowed' : 'pointer',
                  }}
                >
                  {detectingLocation ? 'Locating...' : 'Use Current Location'}
                </button>
              </div>

              <div style={styles.mapShell}>
                {mapError ? (
                  <div style={styles.mapUnavailable}>{mapError}</div>
                ) : (
                  <div ref={mapContainerRef} style={styles.mapCanvas} />
                )}
              </div>

              <div style={styles.coordinateGrid}>
                <input
                  value={profileData.latitude || ''}
                  readOnly
                  placeholder="Latitude"
                  style={{ ...styles.input, marginBottom: 0 }}
                />
                <input
                  value={profileData.longitude || ''}
                  readOnly
                  placeholder="Longitude"
                  style={{ ...styles.input, marginBottom: 0 }}
                />
              </div>

              <textarea
                name="address"
                placeholder="Location label"
                value={profileData.address || ''}
                onChange={(e) => setProfileValue('address', e.target.value)}
                required
                style={{ ...styles.input, minHeight: '80px', marginTop: '12px' }}
              />
              <div style={styles.mapNote}>
                {resolvingLocation
                  ? 'Updating the location label from the map...'
                  : 'Click the map or drag the marker to set the hostel location.'}
              </div>
            </div>
            <div style={styles.uploadCard}>
              <div style={styles.uploadTitle}>Common Hostel Image</div>
              <div style={styles.uploadHint}>
                This image will be used in the admin dashboard and room approvals.
              </div>
              <div style={styles.uploadPreviewWrap}>
                {displayImagePreview ? (
                  <img src={displayImagePreview} alt="Hostel preview" style={styles.uploadPreviewImage} />
                ) : (
                  <div style={styles.uploadPlaceholder}>No image selected yet</div>
                )}
              </div>
              <div style={styles.uploadActions}>
                <label style={styles.uploadButton}>
                  Choose Image
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleDisplayImageChange}
                    style={{ display: 'none' }}
                  />
                </label>
                {profileData.display_image && (
                  <button type="button" onClick={clearDisplayImage} style={styles.removeButton}>
                    Remove
                  </button>
                )}
              </div>
            </div>
          </>
        );
      case 'restaurant_owner':
        return (
          <>
            <input
              name="restaurant_name"
              placeholder="Restaurant Name"
              onChange={(e) => setProfileValue('restaurant_name', e.target.value)}
              required
              style={styles.input}
            />
            <input
              name="phone_number"
              placeholder="Phone Number"
              onChange={(e) => setProfileValue('phone_number', e.target.value)}
              required
              style={styles.input}
            />
            <div style={styles.mapCard}>
              <div style={styles.mapHeader}>
                <div>
                  <div style={styles.mapTitle}>Restaurant Location</div>
                  <div style={styles.mapHint}>
                    Pick the exact location on the map. The view starts near the University of Jaffna.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleUseCurrentLocation}
                  disabled={detectingLocation || !mapsReady}
                  style={{
                    ...styles.locationButton,
                    opacity: detectingLocation || !mapsReady ? 0.7 : 1,
                    cursor: detectingLocation || !mapsReady ? 'not-allowed' : 'pointer',
                  }}
                >
                  {detectingLocation ? 'Locating...' : 'Use Current Location'}
                </button>
              </div>

              <div style={styles.mapShell}>
                {mapError ? (
                  <div style={styles.mapUnavailable}>{mapError}</div>
                ) : (
                  <div ref={mapContainerRef} style={styles.mapCanvas} />
                )}
              </div>

              <div style={styles.coordinateGrid}>
                <input
                  value={profileData.latitude || ''}
                  readOnly
                  placeholder="Latitude"
                  style={{ ...styles.input, marginBottom: 0 }}
                />
                <input
                  value={profileData.longitude || ''}
                  readOnly
                  placeholder="Longitude"
                  style={{ ...styles.input, marginBottom: 0 }}
                />
              </div>

              <textarea
                name="address"
                placeholder="Location label"
                value={profileData.address || ''}
                onChange={(e) => setProfileValue('address', e.target.value)}
                required
                style={{ ...styles.input, minHeight: '80px', marginTop: '12px' }}
              />
              <div style={styles.mapNote}>
                {resolvingLocation
                  ? 'Updating the location label from the map...'
                  : 'Click the map or drag the marker to set the restaurant location.'}
              </div>
            </div>
            <div style={styles.uploadCard}>
              <div style={styles.uploadTitle}>Common Restaurant Image</div>
              <div style={styles.uploadHint}>
                This image will be used in the admin dashboard and restaurant approvals.
              </div>
              <div style={styles.uploadPreviewWrap}>
                {displayImagePreview ? (
                  <img src={displayImagePreview} alt="Restaurant preview" style={styles.uploadPreviewImage} />
                ) : (
                  <div style={styles.uploadPlaceholder}>No image selected yet</div>
                )}
              </div>
              <div style={styles.uploadActions}>
                <label style={styles.uploadButton}>
                  Choose Image
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleDisplayImageChange}
                    style={{ display: 'none' }}
                  />
                </label>
                {profileData.display_image && (
                  <button type="button" onClick={clearDisplayImage} style={styles.removeButton}>
                    Remove
                  </button>
                )}
              </div>
            </div>
          </>
        );
      case 'delivery':
        return (
          <>
            <input
              name="vehicle_type"
              placeholder="Vehicle Type (e.g., Bike, Scooter)"
              onChange={(e) => setProfileValue('vehicle_type', e.target.value)}
              required
              style={styles.input}
            />
            <input
              name="license_no"
              placeholder="Vehicle Number (e.g. ABC-1234)"
              onChange={(e) => {
                const val = e.target.value.toUpperCase();
                setProfileValue('license_no', val);
              }}
              required
              style={styles.input}
            />
            {profileData.license_no && !/^[A-Za-z]+\d{4}$/.test((profileData.license_no || '').replace(/[-\s]/g, '')) && (
              <div style={styles.fieldError}>Must be letters followed by exactly 4 digits (e.g. ABC-1234)</div>
            )}
            <input
              name="phone_number"
              placeholder="Phone Number"
              onChange={(e) => setProfileValue('phone_number', e.target.value)}
              required
              style={styles.input}
            />
            <div style={styles.uploadCard}>
              <div style={styles.uploadTitle}>Partner Profile Image</div>
              <div style={styles.uploadHint}>
                This image will be used in the admin dashboard and partner approvals.
              </div>
              <div style={styles.uploadPreviewWrap}>
                {displayImagePreview ? (
                  <img src={displayImagePreview} alt="Partner preview" style={styles.uploadPreviewImage} />
                ) : (
                  <div style={styles.uploadPlaceholder}>No image selected yet</div>
                )}
              </div>
              <div style={styles.uploadActions}>
                <label style={styles.uploadButton}>
                  Choose Image
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleDisplayImageChange}
                    style={{ display: 'none' }}
                  />
                </label>
                {profileData.display_image && (
                  <button type="button" onClick={clearDisplayImage} style={styles.removeButton}>
                    Remove
                  </button>
                )}
              </div>
            </div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.bg} />
      <div style={styles.overlay} />

      <div style={styles.container}>
        {step === 1 ? (
          <div style={styles.card}>
            <h2 style={styles.title}>Choose Account Type</h2>
            <div style={styles.roleGrid}>
              {roleOptions.map((role) => (
                <div
                  key={role.value}
                  onClick={() => handleRoleSelect(role.value)}
                  style={styles.roleCard}
                >
                  <div style={styles.roleIcon}>{role.icon}</div>
                  <div style={styles.roleLabel}>{role.label}</div>
                  <div style={styles.roleDesc}>{role.desc}</div>
                </div>
              ))}
            </div>
            <p style={styles.footerText}>
              Already have an account? <Link to="/login" style={styles.link}>Login</Link>
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={styles.card}>
            <button type="button" onClick={() => setStep(1)} style={styles.backBtn}>
              ← Back
            </button>
            <h2 style={styles.title}>Register as {roleOptions.find(r => r.value === userType)?.label}</h2>

            {error && <div style={styles.error}>{error}</div>}
            {success && <div style={styles.success}>{success}</div>}

            <input
              name="email"
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              style={styles.input}
            />
            <input
              name="username"
              placeholder="Username"
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              required
              style={styles.input}
            />
            <input
              name="password"
              type="password"
              placeholder="Password"
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              style={styles.input}
            />

            <div style={styles.divider} />
            {renderProfileFields()}

            <button type="submit" style={styles.button}>Register</button>
          </form>
        )}
      </div>
    </div>
  );
};

const styles = {
  page: {
    minHeight: '100vh',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  bg: {
    position: 'absolute',
    inset: 0,
    backgroundImage: 'url(/images/Image4.jpeg)',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    zIndex: 0,
  },
  overlay: {
    position: 'absolute',
    inset: 0,
    background: 'rgba(0,0,0,0.4)',
    zIndex: 1,
  },
  container: {
    position: 'relative',
    zIndex: 2,
    width: '100%',
    maxWidth: '600px',
    padding: '20px',
  },
  card: {
    background: 'rgba(255,255,255,0.15)',
    backdropFilter: 'blur(20px)',
    borderRadius: '20px',
    padding: '32px',
    border: '1px solid rgba(255,255,255,0.3)',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
  },
  title: {
    color: 'white',
    fontSize: '28px',
    fontWeight: 'bold',
    marginBottom: '24px',
    textAlign: 'center',
  },
  roleGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
    marginBottom: '24px',
  },
  roleCard: {
    background: 'rgba(255,255,255,0.2)',
    border: '2px solid rgba(255,255,255,0.3)',
    borderRadius: '16px',
    padding: '24px',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.3s',
  },
  roleIcon: {
    fontSize: '48px',
    marginBottom: '12px',
  },
  roleLabel: {
    color: 'white',
    fontSize: '18px',
    fontWeight: 'bold',
    marginBottom: '8px',
  },
  roleDesc: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: '13px',
  },
  input: {
    width: '100%',
    padding: '12px',
    marginBottom: '12px',
    borderRadius: '12px',
    border: '1px solid rgba(255,255,255,0.3)',
    background: 'rgba(255,255,255,0.9)',
    color: '#1f2937',
    fontSize: '15px',
    outline: 'none',
    boxSizing: 'border-box',
  },
  button: {
    width: '100%',
    padding: '14px',
    marginTop: '16px',
    borderRadius: '12px',
    border: 'none',
    background: 'linear-gradient(90deg,#3b82f6,#60a5fa)',
    color: 'white',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    boxShadow: '0 10px 30px rgba(59,130,246,0.4)',
  },
  backBtn: {
    background: 'rgba(255,255,255,0.2)',
    border: 'none',
    color: 'white',
    padding: '8px 16px',
    borderRadius: '8px',
    cursor: 'pointer',
    marginBottom: '16px',
  },
  divider: {
    height: '1px',
    background: 'rgba(255,255,255,0.2)',
    margin: '20px 0',
  },
  error: {
    background: 'rgba(220,38,38,0.2)',
    color: 'white',
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '12px',
    border: '1px solid rgba(220,38,38,0.4)',
  },
  success: {
    background: 'rgba(34,197,94,0.2)',
    color: 'white',
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '12px',
    border: '1px solid rgba(34,197,94,0.4)',
  },
  footerText: {
    color: 'white',
    textAlign: 'center',
    marginTop: '16px',
  },
  link: {
    color: '#93c5fd',
    fontWeight: 'bold',
    textDecoration: 'none',
  },
  uploadCard: {
    marginTop: '8px',
    marginBottom: '8px',
    padding: '16px',
    borderRadius: '16px',
    background: 'rgba(255,255,255,0.16)',
    border: '1px solid rgba(255,255,255,0.22)',
  },
  mapCard: {
    marginTop: '8px',
    marginBottom: '8px',
    padding: '16px',
    borderRadius: '16px',
    background: 'rgba(255,255,255,0.16)',
    border: '1px solid rgba(255,255,255,0.22)',
  },
  mapHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '12px',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    marginBottom: '12px',
  },
  mapTitle: {
    color: 'white',
    fontSize: '15px',
    fontWeight: 'bold',
    marginBottom: '6px',
  },
  mapHint: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: '13px',
    maxWidth: '360px',
  },
  locationButton: {
    padding: '10px 14px',
    borderRadius: '10px',
    border: '1px solid rgba(255,255,255,0.3)',
    background: 'rgba(255,255,255,0.92)',
    color: '#1e3a8a',
    fontSize: '14px',
    fontWeight: '700',
  },
  mapShell: {
    overflow: 'hidden',
    borderRadius: '14px',
    background: 'rgba(255,255,255,0.94)',
    minHeight: '260px',
    border: '1px solid rgba(255,255,255,0.35)',
  },
  mapCanvas: {
    width: '100%',
    height: '260px',
  },
  mapUnavailable: {
    minHeight: '260px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    padding: '20px',
    color: '#7f1d1d',
    background: '#fff5f5',
    fontWeight: '700',
    lineHeight: 1.5,
  },
  coordinateGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
    marginTop: '12px',
  },
  mapNote: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: '13px',
    marginTop: '10px',
  },
  uploadTitle: {
    color: 'white',
    fontSize: '15px',
    fontWeight: 'bold',
    marginBottom: '6px',
  },
  uploadHint: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: '13px',
    marginBottom: '12px',
  },
  uploadPreviewWrap: {
    overflow: 'hidden',
    borderRadius: '14px',
    background: 'rgba(255,255,255,0.94)',
    minHeight: '180px',
    border: '1px solid rgba(255,255,255,0.35)',
  },
  uploadPreviewImage: {
    width: '100%',
    height: '180px',
    objectFit: 'contain',
    display: 'block',
    background: '#f8fafc',
  },
  uploadPlaceholder: {
    minHeight: '180px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#64748b',
    fontSize: '14px',
    fontWeight: '600',
    textAlign: 'center',
    padding: '16px',
  },
  uploadActions: {
    display: 'flex',
    gap: '12px',
    marginTop: '12px',
    flexWrap: 'wrap',
  },
  uploadButton: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '10px 14px',
    borderRadius: '10px',
    background: 'rgba(255,255,255,0.92)',
    color: '#1e3a8a',
    fontSize: '14px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  removeButton: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '10px 14px',
    borderRadius: '10px',
    border: '1px solid rgba(255,255,255,0.3)',
    background: 'rgba(127,29,29,0.18)',
    color: 'white',
    fontSize: '14px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  fieldError: {
    color: '#fca5a5',
    fontSize: '12px',
    fontWeight: '600',
    marginTop: '-8px',
    marginBottom: '10px',
    paddingLeft: '4px',
  },
};

export default Register;
