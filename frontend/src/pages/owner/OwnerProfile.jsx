import { useEffect, useRef, useState } from "react";
import {
  Building2,
  Crosshair,
  FilePenLine,
  ImagePlus,
  LoaderCircle,
  Mail,
  MapPin,
  Phone,
  Save,
  Trash2,
  User,
} from "lucide-react";
import ownerApi from "../../api/ownerApi.js";
import { cardCls, cardStyle, inputCls, btnGold, btnGhost, PageHeader, Avatar } from "./ownerTheme.jsx";
import { useAuth } from "../../context/AuthContext.jsx";

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
    return new Promise((resolve, reject) => {
      const startedAt = Date.now();
      const pollTimer = window.setInterval(() => {
        if (isGoogleMapsReady()) {
          window.clearInterval(pollTimer);
          resolve(window.google.maps);
          return;
        }

        if (Date.now() - startedAt >= 12000) {
          window.clearInterval(pollTimer);
          reject(new Error("Failed to load Google Maps."));
        }
      }, 120);

      existingScript.addEventListener(
        "error",
        () => {
          window.clearInterval(pollTimer);
          reject(new Error("Failed to load Google Maps."));
        },
        { once: true }
      );
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.id = GOOGLE_MAP_SCRIPT_ID;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&loading=async`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      const startedAt = Date.now();
      const pollTimer = window.setInterval(() => {
        if (isGoogleMapsReady()) {
          window.clearInterval(pollTimer);
          resolve(window.google.maps);
          return;
        }
        if (Date.now() - startedAt >= 12000) {
          window.clearInterval(pollTimer);
          reject(new Error("Failed to load Google Maps."));
        }
      }, 120);
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

function Field({ icon: Icon, label, children }) {
  return (
    <div className="rounded-[20px] border border-[#ece3d3] bg-[#fcfbf8] p-4">
      <label className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-[#6f6a5f]">
        <Icon size={12} className="text-[#b98b1f]" />
        {label}
      </label>
      {children}
    </div>
  );
}

export default function OwnerProfile() {
  const { updateUser } = useAuth();
  const emptyForm = {
    username: "",
    email: "",
    hostel_name: "",
    phone_number: "",
    address: "",
    latitude: "",
    longitude: "",
  };
  const [form, setForm] = useState(emptyForm);
  const [originalForm, setOriginalForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState(null);
  const [displayImage, setDisplayImage] = useState("");
  const [originalDisplayImage, setOriginalDisplayImage] = useState("");
  const [displayImageFile, setDisplayImageFile] = useState(null);
  const [previewObjectUrl, setPreviewObjectUrl] = useState("");
  const [removeDisplayImage, setRemoveDisplayImage] = useState(false);
  const [mapsReady, setMapsReady] = useState(false);
  const [mapError, setMapError] = useState("");
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
    ownerApi
      .get("/auth/profile/")
      .then(({ data }) => {
        setForm({
          username: data.username || "",
          email: data.email || "",
          hostel_name: data.profile?.hostel_name || "",
          phone_number: data.profile?.phone_number || "",
          address: data.profile?.address || "",
          latitude: data.profile?.latitude ?? "",
          longitude: data.profile?.longitude ?? "",
        });
        setDisplayImage(data.profile?.display_image || "");
      })
      .catch(() => setMessage({ type: "error", text: "Failed to load profile." }))
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
    let isMounted = true;

    loadGoogleMaps(googleMapsApiKey)
      .then(() => {
        if (!isMounted) return;
        setMapsReady(true);
        setMapError("");
      })
      .catch((error) => {
        if (!isMounted) return;
        setMapsReady(false);
        setMapError(error.message || "Unable to load Google Maps.");
      });

    return () => {
      isMounted = false;
    };
  }, [googleMapsApiKey]);

  useEffect(() => {
    isEditingRef.current = isEditing;
  }, [isEditing]);

  useEffect(() => {
    if (loading || !mapsReady || !mapContainerRef.current || !isGoogleMapsReady()) {
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
        gestureHandling: "greedy",
      });

      markerRef.current = new window.google.maps.Marker({
        map: mapRef.current,
        position: center,
        draggable: isEditing,
      });

      geocoderRef.current = new window.google.maps.Geocoder();

      mapListenersRef.current.push(
        mapRef.current.addListener("click", (event) => {
          if (!isEditingRef.current || !event.latLng) return;
          updateSelectedLocation({
            lat: event.latLng.lat(),
            lng: event.latLng.lng(),
            shouldPan: false,
          });
        }),
        markerRef.current.addListener("dragend", (event) => {
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
  }, [loading, mapsReady, isEditing]);

  useEffect(() => {
    if (!mapRef.current || !markerRef.current) return;

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
      username: data.username || "",
      email: data.email || "",
      hostel_name: data.profile?.hostel_name || "",
      phone_number: data.profile?.phone_number || "",
      address: data.profile?.address || "",
      latitude: data.profile?.latitude ?? "",
      longitude: data.profile?.longitude ?? "",
    };
    const nextImage = data.profile?.display_image || "";
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
      const formattedAddress = response.results?.[0]?.formatted_address || "";
      if (formattedAddress) {
        setForm((current) => ({ ...current, address: formattedAddress }));
      }
    } catch {
      setMessage((current) => current || { type: "error", text: "Map moved, but the location name could not be resolved." });
    } finally {
      setResolvingLocation(false);
    }
  };

  const updateSelectedLocation = async ({ lat, lng, shouldPan = true }) => {
    setForm((current) => ({
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
      setPreviewObjectUrl("");
    }
    setDisplayImage("");
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
      setPreviewObjectUrl("");
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
        setMessage({ type: "error", text: "Unable to access your current location. Please allow location permission and try again." });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!isEditing) return;
    setSaving(true);
    setMessage(null);
    try {
      const payload = new FormData();
      payload.append("username", form.username);
      payload.append("email", form.email);
      payload.append("profile.hostel_name", form.hostel_name);
      payload.append("profile.phone_number", form.phone_number);
      payload.append("profile.address", form.address);
      payload.append("profile.latitude", form.latitude);
      payload.append("profile.longitude", form.longitude);
      payload.append("remove_display_image", removeDisplayImage ? "true" : "false");

      if (displayImageFile) {
        payload.append("profile.display_image", displayImageFile);
      }

      const { data } = await ownerApi.put("/auth/profile/", payload, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (previewObjectUrl) {
        URL.revokeObjectURL(previewObjectUrl);
        setPreviewObjectUrl("");
      }

      applyProfileData(data);
      setMessage({ type: "success", text: "Profile updated successfully!" });
    } catch (err) {
      const detail = err.response?.data;
      const msg =
        typeof detail === "object"
          ? Object.values(detail).flat().join(" ")
          : "Failed to save changes.";
      setMessage({ type: "error", text: msg });
    } finally {
      setSaving(false);
    }
  };

  const set = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }));

  return (
    <div className="space-y-6">
      <PageHeader
        icon={User}
        title="My Profile"
        subtitle="Manage your owner account, shared hostel image, and contact details."
      />

      <section
        className={`${cardCls("p-6")} grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_420px]`}
        style={cardStyle()}
      >
        <div className="space-y-6">
          <div
            className="rounded-[24px] border p-5"
            style={{
              background: "linear-gradient(135deg,#fffaf0 0%, #ffffff 100%)",
              borderColor: "#e7d29d",
              boxShadow: "0 10px 26px rgba(201,168,76,0.12)",
            }}
          >
            <div className="flex flex-col gap-5 md:flex-row md:items-center">
              <Avatar name={form.username || "Owner"} size="lg" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="truncate text-[30px] font-black tracking-tight text-[#1e1d1a]">
                    {form.hostel_name || form.username || "Hostel Owner"}
                  </h2>
                  <span className="inline-flex rounded-full border border-[#e7d29d] bg-[#fff8e8] px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-[#9a6a00]">
                    Owner Profile
                  </span>
                </div>
                <p className="mt-2 text-sm text-[#6f6a5f]">{form.email || "No email provided"}</p>
                <p className="mt-1 text-sm text-[#8b8578]">
                  Keep this profile polished so your dashboard and admin review panels always look trustworthy.
                </p>
              </div>
              {!loading && (
                <div className="flex flex-wrap gap-3">
                  {isEditing ? (
                    <>
                      <button type="button" onClick={handleCancel} className={btnGhost}>
                        Cancel
                      </button>
                      <button
                        type="submit"
                        form="owner-profile-form"
                        disabled={saving}
                        className={btnGold}
                        style={{
                          background: "linear-gradient(135deg,#c9a84c,#a07830)",
                          boxShadow: "0 10px 24px rgba(201,168,76,0.24)",
                        }}
                      >
                        <Save size={15} />
                        {saving ? "Saving..." : "Save Changes"}
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={handleEdit}
                      className={btnGold}
                      style={{
                        background: "linear-gradient(135deg,#c9a84c,#a07830)",
                        boxShadow: "0 10px 24px rgba(201,168,76,0.24)",
                      }}
                    >
                      <FilePenLine size={15} />
                      Edit Profile
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          <form id="owner-profile-form" onSubmit={handleSave} className="space-y-5">
            {message && (
              <div
                className="rounded-[16px] px-4 py-3 text-sm font-semibold"
                style={{
                  background: message.type === "success" ? "#edf7f0" : "#fdeeee",
                  color: message.type === "success" ? "#1f7a3f" : "#b42318",
                  border: `1px solid ${message.type === "success" ? "#b6e8c6" : "#f5c0c0"}`,
                }}
              >
                {message.text}
              </div>
            )}

            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-14 animate-pulse rounded-[16px] bg-[#eee7db]" />
                ))}
              </div>
            ) : (
              <>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field icon={User} label="Username">
                    <input
                      className={inputCls}
                      value={form.username}
                      onChange={set("username")}
                      placeholder="username"
                      disabled={!isEditing}
                    />
                  </Field>

                  <Field icon={Mail} label="Email">
                    <input
                      type="email"
                      className={inputCls}
                      value={form.email}
                      onChange={set("email")}
                      placeholder="email@example.com"
                      disabled={!isEditing}
                    />
                  </Field>

                  <Field icon={Building2} label="Hostel Name">
                    <input
                      className={inputCls}
                      value={form.hostel_name}
                      onChange={set("hostel_name")}
                      placeholder="Your hostel name"
                      disabled={!isEditing}
                    />
                  </Field>

                  <Field icon={Phone} label="Phone Number">
                    <input
                      className={inputCls}
                      value={form.phone_number}
                      onChange={set("phone_number")}
                      placeholder="+94 77 000 0000"
                      disabled={!isEditing}
                    />
                  </Field>
                </div>

                <Field icon={MapPin} label="Location">
                  <div className="space-y-4">
                    <div className="flex flex-col gap-3 rounded-[20px] border border-[#f0e1d8] bg-white p-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-sm font-bold text-[#5d3d2d]">Pin your hostel near its real location</p>
                        <p className="mt-1 text-xs text-[#8a6f61]">
                          The map opens around the University of Jaffna so nearby hostels can place their location faster.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={handleUseCurrentLocation}
                        disabled={!isEditing || detectingLocation || !mapsReady}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#dccba4] bg-[#fff8e8] px-4 py-2 text-sm font-semibold text-[#9a6a00] transition hover:bg-[#fff2cf] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {detectingLocation ? <LoaderCircle size={16} className="animate-spin" /> : <Crosshair size={16} />}
                        {detectingLocation ? "Locating..." : "Use Current Location"}
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

                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.14em] text-[#6f6a5f]">
                          Latitude
                        </label>
                        <input
                          className={inputCls}
                          value={form.latitude}
                          disabled
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.14em] text-[#6f6a5f]">
                          Longitude
                        </label>
                        <input
                          className={inputCls}
                          value={form.longitude}
                          disabled
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.14em] text-[#6f6a5f]">
                        Location Label
                      </label>
                      <textarea
                        className={inputCls}
                        rows={3}
                        value={form.address}
                        onChange={set("address")}
                        placeholder="Selected place name or landmark"
                        disabled={!isEditing}
                        style={{ resize: "none" }}
                      />
                      <p className="mt-2 text-xs text-[#8a6f61]">
                        {resolvingLocation
                          ? "Updating the place name from the map..."
                          : "Click on the map or drag the marker to adjust the exact location."}
                      </p>
                    </div>
                  </div>
                </Field>
              </>
            )}
          </form>
        </div>

        <div className="space-y-5">
          <div className={`${cardCls("p-5")}`} style={cardStyle()}>
            <div className="mb-4 flex items-center gap-3">
              <div
                className="grid h-11 w-11 place-items-center rounded-[14px]"
                style={{ background: "#fff8e8", border: "1px solid #eadab1" }}
              >
                <ImagePlus size={18} className="text-[#b98b1f]" />
              </div>
              <div>
                <h3 className="text-[18px] font-extrabold tracking-tight text-[#1e1d1a]">Hostel Overview Image</h3>
                <p className="text-sm text-[#6f6a5f]">Shared image used in your dashboard and admin review panels.</p>
              </div>
            </div>

            <div className="overflow-hidden rounded-[22px] border border-[#e6dece] bg-[#f1eadf]">
              {displayImage ? (
                <img
                  src={displayImage}
                  alt="Hostel overview preview"
                  className="h-[290px] w-full bg-[#f1eadf] object-contain"
                />
              ) : (
                <div className="flex h-[290px] items-center justify-center px-6 text-center text-sm font-semibold text-[#8d8678]">
                  Upload one shared image for the owner dashboard and admin review panels.
                </div>
              )}
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label
                className={`inline-flex items-center justify-center gap-2 rounded-[14px] border px-4 py-3 text-sm font-bold transition ${
                  isEditing
                    ? "cursor-pointer border-[#d9cfbb] bg-white text-[#5a513f] hover:bg-[#faf6ef]"
                    : "cursor-not-allowed border-[#ece3d3] bg-[#f7f2e8] text-[#aaa18f]"
                }`}
              >
                <ImagePlus size={16} />
                Change Image
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                  disabled={!isEditing}
                />
              </label>

              <button
                type="button"
                onClick={clearImage}
                disabled={!isEditing}
                className="inline-flex items-center justify-center gap-2 rounded-[14px] border border-[#ead6d6] bg-[#fff7f7] px-4 py-3 text-sm font-bold text-[#a24040] transition hover:bg-[#fff0f0]"
              >
                <Trash2 size={16} />
                Remove Image
              </button>
            </div>
          </div>

        </div>
      </section>
    </div>
  );
}
