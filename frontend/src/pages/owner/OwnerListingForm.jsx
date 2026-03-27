import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Upload, X, MapPin, Home, ShieldCheck, ImagePlus, Crosshair, LoaderCircle } from "lucide-react";
import ownerApi from "../../api/ownerApi";
import { cardCls, cardStyle, inputCls, btnGold, btnGhost, PageHeader } from "./ownerTheme.jsx";

const JAFFNA_UNIVERSITY_CENTER = { lat: 9.6848, lng: 80.0220 };
const GOOGLE_MAP_SCRIPT_ID = "google-maps-script";

function isConfiguredGoogleMapsKey(apiKey) {
  return Boolean(apiKey && apiKey.trim() && apiKey !== "your-google-maps-api-key");
}

function isGoogleMapsReady() {
  const maps = window.google?.maps;
  return Boolean(
    maps &&
      typeof maps.Map === "function" &&
      typeof maps.Marker === "function" &&
      typeof maps.Geocoder === "function"
  );
}

function waitForGoogleMaps(timeoutMs = 12000) {
  return new Promise((resolve, reject) => {
    const startedAt = Date.now();
    const checkReady = () => {
      if (isGoogleMapsReady()) {
        resolve(window.google.maps);
        return true;
      }
      return false;
    };

    if (checkReady()) {
      return;
    }

    const pollTimer = window.setInterval(() => {
      if (checkReady()) {
        window.clearInterval(pollTimer);
        return;
      }

      if (Date.now() - startedAt >= timeoutMs) {
        window.clearInterval(pollTimer);
        reject(new Error("Failed to load Google Maps."));
      }
    }, 120);
  });
}

function loadGoogleMaps(apiKey) {
  if (!isConfiguredGoogleMapsKey(apiKey)) {
    return Promise.reject(
      new Error("Google Maps is not configured yet. Add a real VITE_GOOGLE_MAPS_API_KEY in frontend/.env and restart the frontend.")
    );
  }

  if (isGoogleMapsReady()) {
    return Promise.resolve(window.google.maps);
  }

  const existingScript = document.getElementById(GOOGLE_MAP_SCRIPT_ID);
  if (existingScript) {
    return waitForGoogleMaps();
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.id = GOOGLE_MAP_SCRIPT_ID;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&loading=async`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      waitForGoogleMaps().then(resolve).catch(reject);
    };
    script.onerror = () => reject(new Error("Failed to load Google Maps."));
    document.head.appendChild(script);
  });
}

function parseCoordinate(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatCoordinateAddress(lat, lng) {
  return `Lat ${Number(lat).toFixed(6)}, Lng ${Number(lng).toFixed(6)}`;
}

function getCurrentPosition(options) {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, options);
  });
}

function Section({ title, icon: Icon, children }) {
  return (
    <div className={cardCls("p-6")} style={cardStyle()}>
      <div className="mb-5 flex items-center gap-3">
        <div
          className="grid h-10 w-10 place-items-center rounded-[12px]"
          style={{ background: "#fff8e8", border: "1px solid #eadab1" }}
        >
          <Icon size={15} className="text-[#b98b1f]" />
        </div>
        <p className="text-[15px] font-extrabold text-[#1e1d1a]">{title}</p>
      </div>
      {children}
    </div>
  );
}

export default function OwnerListingForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [photos, setPhotos] = useState([]);
  const [error, setError] = useState("");
  const [mapsReady, setMapsReady] = useState(false);
  const [mapError, setMapError] = useState("");
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [resolvingLocation, setResolvingLocation] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    rent: "",
    deposit: "",
    facilities: [],
    genderAllowed: "any",
    latitude: "",
    longitude: "",
    address: "",
  });
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const geocoderRef = useRef(null);
  const mapListenersRef = useRef([]);
  const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  const facilityOptions = useMemo(
    () => ["WiFi", "AC", "Parking", "Kitchen", "Laundry", "Security", "Water 24/7"],
    []
  );

  useEffect(() => {
    if (id) fetchListing();
  }, [id]);

  useEffect(() => {
    let isMounted = true;

    loadGoogleMaps(googleMapsApiKey)
      .then(() => {
        if (!isMounted) return;
        setMapsReady(true);
        setMapError("");
      })
      .catch((err) => {
        if (!isMounted) return;
        setMapsReady(false);
        setMapError(err.message || "Unable to load Google Maps.");
      });

    return () => {
      isMounted = false;
    };
  }, [googleMapsApiKey]);

  useEffect(() => {
    if (!mapsReady || !mapContainerRef.current || !isGoogleMapsReady()) {
      return;
    }

    const latitude = parseCoordinate(formData.latitude);
    const longitude = parseCoordinate(formData.longitude);
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
        gestureHandling: "greedy",
      });

      markerRef.current = new window.google.maps.Marker({
        map: mapRef.current,
        position: center,
        draggable: true,
      });

      geocoderRef.current = new window.google.maps.Geocoder();

      mapListenersRef.current.push(
        mapRef.current.addListener("click", (event) => {
          if (!event.latLng) return;
          updateSelectedLocation({
            lat: event.latLng.lat(),
            lng: event.latLng.lng(),
            shouldPan: false,
          });
        }),
        markerRef.current.addListener("dragend", (event) => {
          if (!event.latLng) return;
          updateSelectedLocation({
            lat: event.latLng.lat(),
            lng: event.latLng.lng(),
            shouldPan: false,
          });
        })
      );
    } else {
      markerRef.current?.setPosition(center);
      mapRef.current.setCenter(center);
    }
  }, [mapsReady, formData.latitude, formData.longitude]);

  useEffect(() => {
    return () => {
      mapListenersRef.current.forEach((listener) => listener?.remove?.());
      mapListenersRef.current = [];
    };
  }, []);

  const fetchListing = async () => {
    try {
      const { data } = await ownerApi.get(`/owner/listings/${id}/`);
      setFormData({
        title: data.title || "",
        description: data.description || "",
        rent: data.rent ?? "",
        deposit: data.deposit ?? "",
        facilities: data.facilities || [],
        genderAllowed: data.gender_allowed || "any",
        latitude: data.latitude || "",
        longitude: data.longitude || "",
        address: data.address || "",
      });
      setPhotos(data.images || []);
    } catch (e) {
      console.error(e);
    }
  };

  const toggleFacility = (f) =>
    setFormData((p) => ({
      ...p,
      facilities: p.facilities.includes(f)
        ? p.facilities.filter((x) => x !== f)
        : [...p.facilities, f],
    }));

  const handlePhotoChange = (e) => setPhotos((p) => [...p, ...Array.from(e.target.files || [])]);
  const removePhoto = (i) => setPhotos((p) => p.filter((_, idx) => idx !== i));

  const uploadPhotos = async (lid) => {
    const fd = new FormData();
    const hasNewFiles = photos.some((p) => p instanceof File);

    if (id) {
      fd.append("sync_existing", "true");
      photos.forEach((p) => {
        if (!(p instanceof File) && p?.id) {
          fd.append("keep_existing_ids", String(p.id));
        }
      });
    }

    photos.forEach((p) => {
      if (p instanceof File) fd.append("photos", p);
    });

    if (id && hasNewFiles) {
      fd.append("replace", "true");
    }

    await ownerApi.post(`/owner/listings/${lid}/photos/`, fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  };

  const reverseGeocode = async (lat, lng) => {
    if (!geocoderRef.current) {
      setFormData((current) =>
        current.address?.trim()
          ? current
          : { ...current, address: formatCoordinateAddress(lat, lng) }
      );
      return;
    }

    setResolvingLocation(true);

    try {
      const response = await geocoderRef.current.geocode({ location: { lat, lng } });
      const formattedAddress = response.results?.[0]?.formatted_address || "";
      if (formattedAddress) {
        setFormData((current) => ({ ...current, address: formattedAddress }));
      }
    } catch (geocodeError) {
      console.error("Reverse geocoding failed:", geocodeError);
      setFormData((current) =>
        current.address?.trim()
          ? current
          : { ...current, address: formatCoordinateAddress(lat, lng) }
      );
    } finally {
      setResolvingLocation(false);
    }
  };

  const updateSelectedLocation = async ({ lat, lng, shouldPan = true }) => {
    setFormData((current) => ({
      ...current,
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

  const handleUseCurrentLocation = async () => {
    if (!navigator.geolocation) {
      setError("Location is not supported in this browser.");
      return;
    }

    setDetectingLocation(true);
    setError("");

    try {
      if (navigator.permissions?.query) {
        const permission = await navigator.permissions.query({ name: "geolocation" });
        if (permission.state === "denied") {
          setError("Location access is blocked in browser settings. Enable it for this site and try again.");
          return;
        }
      }

      let position;
      try {
        position = await getCurrentPosition({ enableHighAccuracy: true, timeout: 12000, maximumAge: 0 });
      } catch (firstAttemptError) {
        if (firstAttemptError?.code !== 2 && firstAttemptError?.code !== 3) {
          throw firstAttemptError;
        }
        position = await getCurrentPosition({ enableHighAccuracy: false, timeout: 20000, maximumAge: 300000 });
      }

      const { latitude, longitude } = position.coords;
      await updateSelectedLocation({ lat: latitude, lng: longitude });
    } catch (geoError) {
      if (geoError?.code === 1) {
        setError("Location permission denied. Please allow location access in your browser and try again.");
      } else if (geoError?.code === 2) {
        setError("Location unavailable right now. Please check GPS/network and try again.");
      } else if (geoError?.code === 3) {
        setError("Location request timed out. Please try again.");
      } else {
        setError("Unable to access your current location. Please allow location permission and try again.");
      }
    } finally {
      setDetectingLocation(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.title || formData.title.length < 5) return setError("Title must be at least 5 characters");
    if (!formData.description || formData.description.length < 20) return setError("Description must be at least 20 characters");
    if (!formData.rent || Number(formData.rent) < 1000) return setError("Rent must be at least LKR 1,000");
    if (Number(formData.deposit) < 0) return setError("Deposit cannot be negative");
    if (!formData.address || formData.address.length < 10) return setError("Please provide a complete location");
    if (!formData.latitude || !formData.longitude) return setError("Please choose the listing location on the map");
    if (formData.facilities.length === 0) return setError("Please select at least one facility");

    setLoading(true);

    try {
      let lid = id;

      if (id) {
        await ownerApi.put(`/owner/listings/${id}/`, formData);
      } else {
        const { data } = await ownerApi.post("/owner/listings/", formData);
        lid = data.id;
      }

      if (lid && (id || photos.filter((p) => p instanceof File).length > 0)) {
        try {
          await uploadPhotos(lid);
        } catch (e) {
          console.error("Photo upload failed:", e);
        }
      }

      navigate("/owner/listings");
    } catch (e) {
      setError(e.response?.data?.message || "Failed to save listing");
    } finally {
      setLoading(false);
    }
  };

  const label = (text, required = false) => (
    <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.12em] text-[#6f6a5f]">
      {text}
      {required && <span className="ml-1 text-[#b98b1f]">*</span>}
    </label>
  );

  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader
        icon={Home}
        title={id ? "Edit Listing" : "Create New Listing"}
        subtitle="Fill in the details carefully for better conversion and trust."
      />

      {error && (
        <div className="rounded-[14px] border border-red-200 bg-red-50 px-4 py-3 text-[13px] font-semibold text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <Section title="Basic Information" icon={Home}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              {label("Title", true)}
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className={inputCls}
                placeholder="Ex: Premium single room near university"
                required
              />
            </div>

            <div className="md:col-span-2">
              {label("Description", true)}
              <textarea
                rows={5}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className={`${inputCls} resize-none`}
                placeholder="Explain room type, rules, distance to campus, facilities…"
                required
              />
            </div>

            <div>
              {label("Monthly Rent (LKR)", true)}
              <input
                type="number"
                value={formData.rent}
                onChange={(e) => setFormData({ ...formData, rent: e.target.value })}
                className={inputCls}
                required
              />
            </div>

            <div>
              {label("Deposit (LKR)", true)}
              <input
                type="number"
                value={formData.deposit}
                onChange={(e) => setFormData({ ...formData, deposit: e.target.value })}
                className={inputCls}
                required
              />
            </div>

            <div>
              {label("Gender Allowed")}
              <select
                value={formData.genderAllowed}
                onChange={(e) => setFormData({ ...formData, genderAllowed: e.target.value })}
                className={inputCls}
              >
                <option value="any">Any</option>
                <option value="male">Male Only</option>
                <option value="female">Female Only</option>
              </select>
            </div>
          </div>
        </Section>

        <Section title="Facilities" icon={ShieldCheck}>
          <div className="flex flex-wrap gap-2">
            {facilityOptions.map((f) => {
              const active = formData.facilities.includes(f);
              return (
                <button
                  key={f}
                  type="button"
                  onClick={() => toggleFacility(f)}
                  className={`rounded-[12px] border px-4 py-2 text-[12px] font-bold transition-all ${
                    active
                      ? "border-[#dcc89a] bg-[#fff8e8] text-[#b98b1f]"
                      : "border-[#ebe4d8] bg-white text-[#6f6a5f] hover:bg-[#faf7f1]"
                  }`}
                >
                  {f}
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-[11px] text-[#8b8578]">Select at least one facility.</p>
        </Section>

        <Section title="Location" icon={MapPin}>
          <div className="space-y-4">
            <div className="flex flex-col gap-3 rounded-[18px] border border-[#eadfc7] bg-[#fffaf2] p-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-[14px] font-extrabold text-[#2b2823]">Pin the exact listing location</p>
                <p className="mt-1 text-[12px] text-[#8b8578]">
                  The map starts near the University of Jaffna so nearby listings can be placed quickly.
                </p>
              </div>
              <button
                type="button"
                onClick={handleUseCurrentLocation}
                disabled={detectingLocation}
                className="inline-flex items-center justify-center gap-2 rounded-[14px] border border-[#dcc89a] bg-[#fff8e8] px-4 py-3 text-[12px] font-bold text-[#b98b1f] transition hover:bg-[#fff1d2] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {detectingLocation ? <LoaderCircle size={15} className="animate-spin" /> : <Crosshair size={15} />}
                {detectingLocation ? "Locating..." : "Use Current Location"}
              </button>
            </div>

            <div className="overflow-hidden rounded-[18px] border border-[#eadfc7] bg-[#fffaf2]">
              {mapError ? (
                <div className="flex h-[320px] items-center justify-center px-6 text-center text-[14px] font-bold text-[#7f1d1d]">
                  {mapError}
                </div>
              ) : (
                <div ref={mapContainerRef} className="h-[320px] w-full" />
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                {label("Latitude")}
                <input
                  type="text"
                  value={formData.latitude}
                  readOnly
                  className={inputCls}
                />
              </div>

              <div>
                {label("Longitude")}
                <input
                  type="text"
                  value={formData.longitude}
                  readOnly
                  className={inputCls}
                />
              </div>
            </div>

            <div>
              {label("Location Label", true)}
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className={inputCls}
                required
              />
              <p className="mt-2 text-[11px] text-[#8b8578]">
                {resolvingLocation
                  ? "Updating the place name from the map..."
                  : "Click the map or drag the marker to adjust the exact listing location."}
              </p>
            </div>
          </div>
        </Section>

        <Section title="Photos" icon={ImagePlus}>
          <div className="rounded-[16px] border-2 border-dashed border-[#eadfc7] bg-[#fffaf2] p-8 transition hover:border-[#dcc89a]">
            <input
              id="photo-upload"
              type="file"
              multiple
              accept="image/*"
              onChange={handlePhotoChange}
              className="hidden"
            />
            <label htmlFor="photo-upload" className="flex cursor-pointer flex-col items-center text-center">
              <div
                className="grid h-14 w-14 place-items-center rounded-[16px]"
                style={{ background: "#fff8e8", border: "1px solid #eadab1" }}
              >
                <Upload size={20} className="text-[#b98b1f]" />
              </div>
              <p className="mt-3 text-[13px] font-bold text-[#2b2823]">Click to upload photos</p>
              <p className="text-[11px] text-[#8b8578]">JPG / PNG recommended</p>
            </label>
          </div>

          {photos.length > 0 && (
            <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
              {photos.map((p, i) => (
                <div key={i} className="relative">
                  <img
                    src={p instanceof File ? URL.createObjectURL(p) : p.url}
                    alt={`Photo ${i + 1}`}
                    className="h-28 w-full rounded-[14px] border border-[#eadfc7] object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(i)}
                    className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full bg-black/80 text-white transition hover:bg-black"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Section>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="submit"
            disabled={loading}
            className={`flex-1 ${btnGold}`}
            style={{
              background: "linear-gradient(135deg,#c9a84c,#a07830)",
              boxShadow: "0 6px 20px rgba(201,168,76,0.22)",
            }}
          >
            {loading ? "Saving…" : id ? "Update Listing" : "Create Listing"}
          </button>

          <button type="button" onClick={() => navigate("/owner/listings")} className={btnGhost}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
