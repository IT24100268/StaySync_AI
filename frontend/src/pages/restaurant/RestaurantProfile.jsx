import { useEffect, useRef, useState } from 'react';
import {
  Crosshair,
  ImagePlus,
  LoaderCircle,
  Mail,
  MapPin,
  Phone,
  Save,
  Store,
  Trash2,
  User,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

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

  if (window.google?.maps?.Map) {
    return Promise.resolve(window.google.maps);
  }

  const existingScript = document.getElementById(GOOGLE_MAP_SCRIPT_ID);
  if (existingScript) {
    return new Promise((resolve, reject) => {
      if (window.google?.maps?.Map) return resolve(window.google.maps);
      const prev = window.__googleMapsReady__;
      window.__googleMapsReady__ = () => {
        if (prev) prev();
        resolve(window.google.maps);
      };
      existingScript.addEventListener('error', () => reject(new Error('Failed to load Google Maps.')), { once: true });
    });
  }

  return new Promise((resolve, reject) => {
    const callbackName = '__googleMapsReady__';
    window[callbackName] = () => {
      delete window[callbackName];
      resolve(window.google.maps);
    };
    const script = document.createElement('script');
    script.id = GOOGLE_MAP_SCRIPT_ID;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=${callbackName}`;
    script.async = true;
    script.defer = true;
    script.onerror = () => {
      delete window[callbackName];
      reject(new Error('Failed to load Google Maps.'));
    };
    document.head.appendChild(script);
  });
}

function parseCoordinate(value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function Field({ icon: Icon, label, children, wide = false }) {
  return (
    <div className={`${wide ? 'md:col-span-2' : ''} rounded-[22px] border border-[#ece3d3] bg-[#fcfbf8] p-4`}>
      <label className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-[#6f6a5f]">
        <Icon size={13} className="text-[#ef7f1a]" />
        {label}
      </label>
      {children}
    </div>
  );
}

export default function RestaurantProfile() {
  const { updateUser } = useAuth();
  const emptyForm = {
    username: '',
    email: '',
    restaurant_name: '',
    phone_number: '',
    address: '',
    latitude: '',
    longitude: '',
  };

  const [form, setForm] = useState(emptyForm);
  const [originalForm, setOriginalForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState(null);
  const [displayImage, setDisplayImage] = useState('');
  const [originalDisplayImage, setOriginalDisplayImage] = useState('');
  const [displayImageFile, setDisplayImageFile] = useState(null);
  const [previewObjectUrl, setPreviewObjectUrl] = useState('');
  const [removeDisplayImage, setRemoveDisplayImage] = useState(false);
  const [mapsReady, setMapsReady] = useState(false);
  const [mapError, setMapError] = useState('');
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [resolvingLocation, setResolvingLocation] = useState(false);
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const geocoderRef = useRef(null);
  const mapListenersRef = useRef([]);
  const isEditingRef = useRef(false);
  const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  useEffect(() => {
    api
      .get('/auth/profile/')
      .then(({ data }) => {
        const nextForm = {
          username: data.username || '',
          email: data.email || '',
          restaurant_name: data.profile?.restaurant_name || '',
          phone_number: data.profile?.phone_number || '',
          address: data.profile?.address || '',
          latitude: data.profile?.latitude ?? '',
          longitude: data.profile?.longitude ?? '',
        };
        const nextImage = data.profile?.display_image || '';

        setForm(nextForm);
        setOriginalForm(nextForm);
        setDisplayImage(nextImage);
        setOriginalDisplayImage(nextImage);
      })
      .catch(() => setMessage({ type: 'error', text: 'Failed to load profile.' }))
      .finally(() => setLoading(false));
  }, []);

  useEffect(
    () => () => {
      if (previewObjectUrl) {
        URL.revokeObjectURL(previewObjectUrl);
      }
    },
    [previewObjectUrl]
  );

  useEffect(() => {
    isEditingRef.current = isEditing;
  }, [isEditing]);

  useEffect(() => {
    let isMounted = true;

    loadGoogleMaps(googleMapsApiKey)
      .then(() => {
        if (!isMounted) return;
        setMapsReady(true);
        setMapError('');
      })
      .catch((error) => {
        if (!isMounted) return;
        setMapsReady(false);
        setMapError(error.message || 'Unable to load Google Maps.');
      });

    return () => {
      isMounted = false;
    };
  }, [googleMapsApiKey]);

  useEffect(() => {
    if (loading || !mapsReady || !mapContainerRef.current || !window.google?.maps) {
      return;
    }

    const latitude = parseCoordinate(form.latitude);
    const longitude = parseCoordinate(form.longitude);
    const center =
      latitude !== null && longitude !== null
        ? { lat: latitude, lng: longitude }
        : JAFFNA_UNIVERSITY_CENTER;

    if (!mapRef.current) {
      mapRef.current = new window.google.maps.Map(mapContainerRef.current, {
        center,
        zoom: latitude !== null && longitude !== null ? 16 : 13,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        gestureHandling: 'greedy',
      });

      markerRef.current = new window.google.maps.Marker({
        map: mapRef.current,
        position: center,
        draggable: isEditing,
        animation: window.google.maps.Animation.DROP,
      });

      geocoderRef.current = new window.google.maps.Geocoder();

      mapListenersRef.current.push(
        mapRef.current.addListener('click', (event) => {
          if (!isEditingRef.current || !event.latLng) return;
          updateSelectedLocation({
            lat: event.latLng.lat(),
            lng: event.latLng.lng(),
            shouldPan: false,
          });
        }),
        markerRef.current.addListener('dragend', (event) => {
          if (!isEditingRef.current || !event.latLng) return;
          updateSelectedLocation({
            lat: event.latLng.lat(),
            lng: event.latLng.lng(),
            shouldPan: false,
          });
        })
      );
    } else {
      markerRef.current?.setDraggable(isEditing);
      markerRef.current?.setPosition(center);
      mapRef.current.setCenter(center);
    }

    return () => {};
  }, [loading, mapsReady, isEditing]);

  useEffect(() => {
    if (!mapRef.current || !markerRef.current) {
      return;
    }

    const latitude = parseCoordinate(form.latitude);
    const longitude = parseCoordinate(form.longitude);

    if (latitude !== null && longitude !== null) {
      const nextPosition = { lat: latitude, lng: longitude };
      markerRef.current.setPosition(nextPosition);
      mapRef.current.panTo(nextPosition);
    }
  }, [form.latitude, form.longitude]);

  useEffect(() => {
    return () => {
      mapListenersRef.current.forEach((listener) => listener?.remove?.());
      mapListenersRef.current = [];
    };
  }, []);

  const applyProfileData = (data) => {
    const nextForm = {
      username: data.username || '',
      email: data.email || '',
      restaurant_name: data.profile?.restaurant_name || '',
      phone_number: data.profile?.phone_number || '',
      address: data.profile?.address || '',
      latitude: data.profile?.latitude ?? '',
      longitude: data.profile?.longitude ?? '',
    };
    const nextImage = data.profile?.display_image || '';

    setForm(nextForm);
    setOriginalForm(nextForm);
    setDisplayImage(nextImage);
    setOriginalDisplayImage(nextImage);
    setDisplayImageFile(null);
    setRemoveDisplayImage(false);
    setIsEditing(false);
    updateUser?.(data);
  };

  const reverseGeocode = async (lat, lng) => {
    if (!geocoderRef.current) {
      return;
    }

    setResolvingLocation(true);

    try {
      const response = await geocoderRef.current.geocode({ location: { lat, lng } });
      const formattedAddress = response.results?.[0]?.formatted_address || '';
      if (formattedAddress) {
        setForm((current) => ({ ...current, address: formattedAddress }));
      }
    } catch {
      setMessage((current) => current || { type: 'error', text: 'Map moved, but the location name could not be resolved.' });
    } finally {
      setResolvingLocation(false);
    }
  };

  const updateSelectedLocation = async ({ lat, lng, shouldPan = true }) => {
    const nextLat = Number(lat).toFixed(6);
    const nextLng = Number(lng).toFixed(6);

    setForm((current) => ({
      ...current,
      latitude: nextLat,
      longitude: nextLng,
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

  const handleImageChange = (event) => {
    if (!isEditing) return;
    const file = event.target.files?.[0];
    if (!file) return;

    if (previewObjectUrl) {
      URL.revokeObjectURL(previewObjectUrl);
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewObjectUrl(objectUrl);
    setDisplayImageFile(file);
    setDisplayImage(objectUrl);
    setRemoveDisplayImage(false);
  };

  const clearImage = () => {
    if (!isEditing) return;
    if (previewObjectUrl) {
      URL.revokeObjectURL(previewObjectUrl);
      setPreviewObjectUrl('');
    }
    setDisplayImage('');
    setDisplayImageFile(null);
    setRemoveDisplayImage(true);
  };

  const handleEdit = () => {
    setMessage(null);
    setIsEditing(true);
  };

  const handleCancel = () => {
    if (previewObjectUrl) {
      URL.revokeObjectURL(previewObjectUrl);
      setPreviewObjectUrl('');
    }

    setForm(originalForm);
    setDisplayImage(originalDisplayImage);
    setDisplayImageFile(null);
    setRemoveDisplayImage(false);
    setMessage(null);
    setDetectingLocation(false);
    setResolvingLocation(false);
    setIsEditing(false);
  };

  const handleUseCurrentLocation = () => {
    if (!isEditing || !navigator.geolocation) {
      return;
    }

    setDetectingLocation(true);
    setMessage(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        await updateSelectedLocation({ lat: latitude, lng: longitude });
        setDetectingLocation(false);
      },
      () => {
        setDetectingLocation(false);
        setMessage({ type: 'error', text: 'Unable to access your current location. Please allow location permission and try again.' });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!isEditing) return;

    setSaving(true);
    setMessage(null);
    if (!/^0[0-9]{9}$/.test(form.phone_number)) {
      setMessage({ type: 'error', text: 'Enter a valid Sri Lankan phone number (e.g. 0771234567)' })
      setSaving(false)
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setMessage({ type: 'error', text: 'Enter a valid email address (e.g. name@example.com)' })
      setSaving(false)
      return
    }

    try {
      const payload = new FormData();
      payload.append('username', form.username);
      payload.append('email', form.email);
      payload.append('profile.restaurant_name', form.restaurant_name);
      payload.append('profile.phone_number', form.phone_number);
      payload.append('profile.address', form.address);
      payload.append('profile.latitude', form.latitude);
      payload.append('profile.longitude', form.longitude);
      payload.append('remove_display_image', removeDisplayImage ? 'true' : 'false');

      if (displayImageFile) {
        payload.append('profile.display_image', displayImageFile);
      }

      const { data } = await api.put('/auth/profile/', payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (previewObjectUrl) {
        URL.revokeObjectURL(previewObjectUrl);
        setPreviewObjectUrl('');
      }

      applyProfileData(data);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (error) {
      const detail = error.response?.data;
      const text =
        typeof detail === 'object'
          ? Object.values(detail).flat().join(' ')
          : 'Failed to update profile.';
      setMessage({ type: 'error', text });
    } finally {
      setSaving(false);
    }
  };

  const setField = (key) => (event) => {
    const val = event.target.value
    if (key === 'phone_number' && !/^[0-9]*$/.test(val)) return
    setForm((current) => ({ ...current, [key]: val }));
  };

  return (
    <div className="max-w-6xl space-y-6">
      <div className="rounded-[28px] border border-[#ecd8cf] bg-gradient-to-br from-[#fffaf7] via-white to-[#fff4ec] p-6 shadow-[0_18px_42px_rgba(126,78,46,0.08)]">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#ef7f1a]">Restaurant Profile</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-[#2d170d]">Manage your restaurant identity</h1>
            <p className="mt-2 max-w-2xl text-sm text-[#7b6356]">
              Add one shared restaurant image here. That same image will be shown on your restaurant
              dashboard as the main branded image.
            </p>
          </div>

          {!loading && (
            <div className="flex flex-wrap gap-3">
              {isEditing ? (
                <>
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="rounded-xl border border-[#ead8cf] bg-white px-5 py-3 font-semibold text-[#6a4b3c] transition hover:bg-[#fff7f2]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    form="restaurant-profile-form"
                    disabled={saving}
                    className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#ef7f1a] to-[#f49a3a] px-5 py-3 font-semibold text-white shadow-[0_12px_24px_rgba(239,127,26,0.25)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    <Save size={18} />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={handleEdit}
                  className="rounded-xl bg-gradient-to-r from-[#ef7f1a] to-[#f49a3a] px-5 py-3 font-semibold text-white shadow-[0_12px_24px_rgba(239,127,26,0.25)] transition hover:brightness-105"
                >
                  Edit Profile
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {message && (
        <div
          className="rounded-2xl px-4 py-3 text-sm font-semibold"
          style={{
            background: message.type === 'success' ? '#edf7f0' : '#fdeeee',
            color: message.type === 'success' ? '#1f7a3f' : '#b42318',
            border: `1px solid ${message.type === 'success' ? '#b6e8c6' : '#f5c0c0'}`,
          }}
        >
          {message.text}
        </div>
      )}

      <form id="restaurant-profile-form" onSubmit={handleSubmit} className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
        <section className="rounded-[28px] border border-[#ecd8cf] bg-white p-5 shadow-[0_14px_34px_rgba(126,78,46,0.07)]">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-[18px] bg-[#fff1e6] text-[#ef7f1a]">
              <Store size={22} />
            </div>
            <div>
              <h2 className="text-lg font-black text-[#2d170d]">Shared Restaurant Image</h2>
              <p className="text-sm text-[#8a6f61]">Used in your dashboard hero and profile presence.</p>
            </div>
          </div>

          <div className="mt-5 overflow-hidden rounded-[24px] border border-[#ecd8cf] bg-[#fff8f4]">
            {displayImage ? (
              <img
                src={displayImage}
                alt={form.restaurant_name || 'Restaurant'}
                className="h-[260px] w-full object-cover"
              />
            ) : (
              <div className="flex h-[260px] flex-col items-center justify-center gap-3 px-6 text-center text-[#8a6f61]">
                <div className="grid h-16 w-16 place-items-center rounded-full bg-[#fff1e6] text-[#ef7f1a]">
                  <ImagePlus size={28} />
                </div>
                <div>
                  <p className="font-bold text-[#5d3d2d]">No restaurant image added yet</p>
                  <p className="mt-1 text-sm">Upload one shared image to make your dashboard feel branded.</p>
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 space-y-3">
            <label
              className={`flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed px-4 py-4 text-sm font-semibold transition ${
                isEditing
                  ? 'cursor-pointer border-[#efc9ae] bg-[#fff7f2] text-[#7a5540] hover:bg-[#fff1e8]'
                  : 'cursor-not-allowed border-[#efe5df] bg-[#faf7f5] text-[#ae9a8f]'
              }`}
            >
              <ImagePlus size={18} />
              <span>{displayImage ? 'Change Shared Image' : 'Upload Shared Image'}</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                disabled={!isEditing}
                className="hidden"
              />
            </label>

            <button
              type="button"
              onClick={clearImage}
              disabled={!isEditing || (!displayImage && !displayImageFile && !originalDisplayImage)}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[#f0d8d2] bg-white px-4 py-3 text-sm font-semibold text-[#9b4b4b] transition hover:bg-[#fff5f5] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Trash2 size={16} />
              Remove Image
            </button>
          </div>

          <div className="mt-4 rounded-[20px] bg-[#fff7f2] p-4 text-sm text-[#7a5c4d]">
            <p className="font-bold text-[#5d3d2d]">Where this image appears</p>
            <p className="mt-1">The restaurant dashboard will use this uploaded image instead of a fixed sample image.</p>
          </div>
        </section>

        <section className="rounded-[28px] border border-[#ecd8cf] bg-white p-6 shadow-[0_14px_34px_rgba(126,78,46,0.07)]">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((item) => (
                <div key={item} className="h-16 animate-pulse rounded-[18px] bg-[#f3ebe6]" />
              ))}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              <Field icon={User} label="Username">
                <input
                  name="username"
                  value={form.username}
                  onChange={setField('username')}
                  disabled={!isEditing}
                  className="w-full rounded-xl border border-[#eaded7] bg-white px-4 py-3 outline-none transition focus:border-[#ef7f1a] focus:ring-4 focus:ring-[#fff0e5] disabled:bg-[#f8f4f1] disabled:text-[#8d7a6d]"
                />
              </Field>

              <Field icon={Mail} label="Email">
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={setField('email')}
                  disabled={!isEditing}
                  className="w-full rounded-xl border border-[#eaded7] bg-white px-4 py-3 outline-none transition focus:border-[#ef7f1a] focus:ring-4 focus:ring-[#fff0e5] disabled:bg-[#f8f4f1] disabled:text-[#8d7a6d]"
                />
              </Field>

              <Field icon={Store} label="Restaurant Name">
                <input
                  name="restaurant_name"
                  value={form.restaurant_name}
                  onChange={setField('restaurant_name')}
                  disabled={!isEditing}
                  className="w-full rounded-xl border border-[#eaded7] bg-white px-4 py-3 outline-none transition focus:border-[#ef7f1a] focus:ring-4 focus:ring-[#fff0e5] disabled:bg-[#f8f4f1] disabled:text-[#8d7a6d]"
                />
              </Field>

              <Field icon={Phone} label="Phone Number">
                <input
                  name="phone_number"
                  value={form.phone_number}
                  onChange={setField('phone_number')}
                  disabled={!isEditing}
                  className="w-full rounded-xl border border-[#eaded7] bg-white px-4 py-3 outline-none transition focus:border-[#ef7f1a] focus:ring-4 focus:ring-[#fff0e5] disabled:bg-[#f8f4f1] disabled:text-[#8d7a6d]"
                />
              </Field>

              <Field icon={MapPin} label="Location" wide>
                <div className="space-y-4">
                  <div className="flex flex-col gap-3 rounded-[20px] border border-[#f0e1d8] bg-white p-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-sm font-bold text-[#5d3d2d]">Pin your restaurant near its actual pickup point</p>
                      <p className="mt-1 text-xs text-[#8a6f61]">
                        The map opens around the University of Jaffna so nearby restaurants can place their location faster.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleUseCurrentLocation}
                      disabled={!isEditing || detectingLocation || !mapsReady}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#efc9ae] bg-[#fff7f2] px-4 py-2 text-sm font-semibold text-[#8b4d21] transition hover:bg-[#fff0e7] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {detectingLocation ? <LoaderCircle size={16} className="animate-spin" /> : <Crosshair size={16} />}
                      {detectingLocation ? 'Locating...' : 'Use Current Location'}
                    </button>
                  </div>

                  <div className="overflow-hidden rounded-[22px] border border-[#eaded7] bg-[#f8f4f1]">
                    {mapError ? (
                      <div className="flex h-[320px] w-full items-center justify-center px-6 text-center">
                        <div className="max-w-md space-y-2">
                          <p className="text-base font-bold text-[#7f1d1d]">Google Maps is unavailable</p>
                          <p className="text-sm text-[#8a6f61]">{mapError}</p>
                        </div>
                      </div>
                    ) : (
                      <div ref={mapContainerRef} className="h-[320px] w-full" />
                    )}
                  </div>

                  {mapError && (
                    <div className="rounded-2xl border border-[#f5c0c0] bg-[#fdeeee] px-4 py-3 text-sm font-semibold text-[#b42318]">
                      {mapError}
                    </div>
                  )}

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.14em] text-[#6f6a5f]">
                        Latitude
                      </label>
                      <input
                        value={form.latitude}
                        disabled
                        className="w-full rounded-xl border border-[#eaded7] bg-[#f8f4f1] px-4 py-3 text-[#8d7a6d] outline-none"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.14em] text-[#6f6a5f]">
                        Longitude
                      </label>
                      <input
                        value={form.longitude}
                        disabled
                        className="w-full rounded-xl border border-[#eaded7] bg-[#f8f4f1] px-4 py-3 text-[#8d7a6d] outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.14em] text-[#6f6a5f]">
                      Location Label
                    </label>
                    <textarea
                      name="address"
                      value={form.address}
                      onChange={setField('address')}
                      disabled={!isEditing}
                      rows="3"
                      placeholder="Selected place name or delivery landmark"
                      className="w-full rounded-xl border border-[#eaded7] bg-white px-4 py-3 outline-none transition focus:border-[#ef7f1a] focus:ring-4 focus:ring-[#fff0e5] disabled:bg-[#f8f4f1] disabled:text-[#8d7a6d]"
                    />
                    <p className="mt-2 text-xs text-[#8a6f61]">
                      {resolvingLocation
                        ? 'Updating the place name from the map...'
                        : 'Click on the map or drag the marker to adjust the exact location.'}
                    </p>
                  </div>
                </div>
              </Field>
            </div>
          )}
        </section>
      </form>
    </div>
  );
}
