import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  BadgeDollarSign,
  BedDouble,
  Building2,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import "./RoomDetail.css";

const formatCurrency = (value) => {
  const numeric = Number(value);
  const safe = Number.isFinite(numeric) ? numeric : 0;
  return `LKR ${safe.toLocaleString("en-LK")}`;
};

const toTitleCase = (value) =>
  String(value || "")
    .replaceAll("_", " ")
    .split(" ")
    .filter(Boolean)
    .map((item) => item[0].toUpperCase() + item.slice(1).toLowerCase())
    .join(" ");

const parseCoordinate = (value, axis) => {
  if (value === null || value === undefined || value === "") return null;
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return null;
  if (axis === "lat" && (numeric < -90 || numeric > 90)) return null;
  if (axis === "lng" && (numeric < -180 || numeric > 180)) return null;
  return numeric;
};

const hasValidCoordinatePair = (latitude, longitude) => {
  if (latitude === null || longitude === null) return false;
  if (Math.abs(latitude) < 0.000001 && Math.abs(longitude) < 0.000001) return false;
  return true;
};

const UNIVERSITY_OF_JAFFNA_COORDINATES = {
  lat: 9.6848,
  lng: 80.022,
};

const toRadians = (value) => (value * Math.PI) / 180;

const calculateDistanceKm = (fromLat, fromLng, toLat, toLng) => {
  const earthRadiusKm = 6371;
  const dLat = toRadians(toLat - fromLat);
  const dLng = toRadians(toLng - fromLng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(fromLat)) * Math.cos(toRadians(toLat)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
};

const formatDistanceKm = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < 0) return null;
  return `${numeric.toFixed(2)} km`;
};

const formatCurrentDistance = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < 0) return null;
  if (numeric < 0.001) return "At your current location";
  if (numeric < 1) return `${Math.max(1, Math.round(numeric * 1000))} m`;
  return `${numeric.toFixed(2)} km`;
};

export default function RoomDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState("");
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [userCoordinates, setUserCoordinates] = useState(null);
  const [userDistanceStatus, setUserDistanceStatus] = useState("");

  useEffect(() => {
    fetchRoom();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchRoom = async () => {
    setLoading(true);
    setError("");

    try {
      const { data } = await api.get(`/rooms/${id}/`);
      setRoom(data);
      setActiveImageIndex(0);
    } catch (fetchError) {
      console.error("Failed to fetch room details:", fetchError);
      setRoom(null);
      setError("Failed to load room details.");
    } finally {
      setLoading(false);
    }
  };

  const roomImages = useMemo(() => {
    if (!Array.isArray(room?.images)) return [];
    return room.images.map((item) => item?.image).filter(Boolean);
  }, [room?.images]);

  const featuredImage = roomImages[activeImageIndex] || null;

  const ownerName = room?.hostel_name || "Hostel Owner";
  const ownerPhone = room?.hostel_phone || room?.owner_contact || "Unavailable";
  const ownerEmail = room?.hostel_email || "Unavailable";
  const ownerAddress = room?.hostel_address || room?.address || "Address unavailable";

  const facilities = Array.isArray(room?.facilities) ? room.facilities : [];

  const latitude = parseCoordinate(room?.latitude, "lat");
  const longitude = parseCoordinate(room?.longitude, "lng");
  const hasMapCoordinates = hasValidCoordinatePair(latitude, longitude);
  const addressQuery = String(room?.address || room?.hostel_address || "").trim();
  const mapQuery = hasMapCoordinates ? `${latitude},${longitude}` : addressQuery;
  const hasMapQuery = Boolean(mapQuery);
  const mapEmbedUrl = hasMapQuery
    ? `https://maps.google.com/maps?q=${encodeURIComponent(mapQuery)}&z=${hasMapCoordinates ? 15 : 14}&output=embed`
    : "";

  const computedUniversityDistanceKm = useMemo(() => {
    if (!hasMapCoordinates) return null;
    return calculateDistanceKm(
      latitude,
      longitude,
      UNIVERSITY_OF_JAFFNA_COORDINATES.lat,
      UNIVERSITY_OF_JAFFNA_COORDINATES.lng
    );
  }, [hasMapCoordinates, latitude, longitude]);

  const fallbackUniversityDistanceKm = useMemo(() => {
    const numeric = Number(room?.distance_from_university);
    if (!Number.isFinite(numeric) || numeric < 0) return null;
    return numeric;
  }, [room?.distance_from_university]);

  const universityDistanceText = useMemo(() => {
    const computed = formatDistanceKm(computedUniversityDistanceKm);
    if (computed) return computed;
    const fallback = formatDistanceKm(fallbackUniversityDistanceKm);
    if (fallback) return fallback;
    return "Unavailable";
  }, [computedUniversityDistanceKm, fallbackUniversityDistanceKm]);

  const computedUserDistanceKm = useMemo(() => {
    if (!hasMapCoordinates || !userCoordinates) return null;
    return calculateDistanceKm(latitude, longitude, userCoordinates.lat, userCoordinates.lng);
  }, [hasMapCoordinates, userCoordinates, latitude, longitude]);

  const userDistanceText = useMemo(() => {
    const computed = formatCurrentDistance(computedUserDistanceKm);
    if (computed) return computed;
    if (!hasMapCoordinates) return "Room coordinates unavailable.";
    if (userDistanceStatus) return userDistanceStatus;
    return "Allow location permission to calculate.";
  }, [computedUserDistanceKm, hasMapCoordinates, userDistanceStatus]);

  const heroUserDistanceSummary = useMemo(() => {
    const computed = formatCurrentDistance(computedUserDistanceKm);
    if (computed) return `${computed} from your location`;
    return "Distance from your location unavailable";
  }, [computedUserDistanceKm]);

  const savedUserCoordinates = useMemo(() => {
    const savedLatitude = parseCoordinate(user?.profile?.latitude, "lat");
    const savedLongitude = parseCoordinate(user?.profile?.longitude, "lng");
    if (!hasValidCoordinatePair(savedLatitude, savedLongitude)) {
      return null;
    }
    return { lat: savedLatitude, lng: savedLongitude };
  }, [user?.profile?.latitude, user?.profile?.longitude]);

  useEffect(() => {
    if (!hasMapCoordinates) {
      setUserCoordinates(null);
      setUserDistanceStatus("Room coordinates unavailable.");
      return;
    }

    if (savedUserCoordinates) {
      setUserCoordinates(savedUserCoordinates);
      setUserDistanceStatus("Using your saved location from dashboard map.");
      return;
    }

    setUserCoordinates(null);

    if (!navigator.geolocation) {
      setUserDistanceStatus("Geolocation not supported in this browser.");
      return;
    }

    setUserDistanceStatus("Getting your current location...");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLat = parseCoordinate(position.coords.latitude, "lat");
        const userLng = parseCoordinate(position.coords.longitude, "lng");

        if (!hasValidCoordinatePair(userLat, userLng)) {
          setUserDistanceStatus("Could not read your current location.");
          return;
        }

        setUserCoordinates({ lat: userLat, lng: userLng });
        const accuracy = Number(position.coords.accuracy);
        if (Number.isFinite(accuracy) && accuracy > 800) {
          setUserDistanceStatus(`Live location is low accuracy (~${Math.round(accuracy)} m). Set location on dashboard map for exact distance.`);
        } else {
          setUserDistanceStatus("Using your live browser location.");
        }
      },
      (geoError) => {
        if (geoError.code === 1) {
          setUserDistanceStatus("Location permission denied.");
        } else if (geoError.code === 2) {
          setUserDistanceStatus("Current location unavailable.");
        } else if (geoError.code === 3) {
          setUserDistanceStatus("Current location request timed out.");
        } else {
          setUserDistanceStatus("Could not get current location.");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, [id, hasMapCoordinates, latitude, longitude, savedUserCoordinates]);

  const handleBooking = async () => {
    setBookingError("");
    setSubmitting(true);

    try {
      await api.post("/bookings/create/", { room_id: id, message });
      navigate("/bookings");
    } catch (submitError) {
      console.error("Failed to create booking:", submitError);
      setBookingError("Unable to send booking request right now. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="room-detail-page">
        <div className="room-detail-container">
          <div className="rd-card rd-feedback">Loading room details...</div>
        </div>
      </div>
    );
  }

  if (!room || error) {
    return (
      <div className="room-detail-page">
        <div className="room-detail-container">
          <div className="rd-card rd-feedback rd-feedback--error">{error || "Room not found."}</div>
          <button type="button" className="rd-btn rd-btn--outline" onClick={() => navigate("/rooms")}>
            Back to Rooms
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="room-detail-page">
      <div className="room-detail-container">
        <header className="rd-hero rd-card">
          <div className="rd-hero__left">
            <h1>{room.title || "Room Details"}</h1>
            <p>
              <MapPin size={14} /> {universityDistanceText} from University of Jaffna |{" "}
              {heroUserDistanceSummary} | Gender: {toTitleCase(room.gender_allowed)}
            </p>
          </div>
          <div className="rd-price-pill">
            <BadgeDollarSign size={16} /> {formatCurrency(room.price)} / month
          </div>
        </header>

        <div className="rd-layout">
          <section className="rd-main rd-card">
            <div className="rd-gallery">
              {featuredImage ? (
                <img src={featuredImage} alt={room.title} className="rd-gallery__featured" />
              ) : (
                <div className="rd-gallery__empty">No room images uploaded</div>
              )}

              {roomImages.length > 1 ? (
                <div className="rd-gallery__thumbs">
                  {roomImages.map((image, index) => (
                    <button
                      key={`${image}-${index}`}
                      type="button"
                      className={`rd-thumb ${activeImageIndex === index ? "is-active" : ""}`}
                      onClick={() => setActiveImageIndex(index)}
                    >
                      <img src={image} alt={`Room ${index + 1}`} />
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="rd-section">
              <h2>
                <BedDouble size={16} /> Room Details
              </h2>
              <div className="rd-info-grid">
                <div className="rd-info-row">
                  <span>Room Type</span>
                  <strong>{room.title || "N/A"}</strong>
                </div>
                <div className="rd-info-row">
                  <span>Monthly Rent</span>
                  <strong>{formatCurrency(room.price)}</strong>
                </div>
                <div className="rd-info-row">
                  <span>Deposit</span>
                  <strong>{formatCurrency(room.deposit)}</strong>
                </div>
                <div className="rd-info-row">
                  <span>Gender Allowed</span>
                  <strong>{toTitleCase(room.gender_allowed) || "Any"}</strong>
                </div>
                <div className="rd-info-row">
                  <span>Distance from University of Jaffna</span>
                  <strong>{universityDistanceText}</strong>
                </div>
                <div className="rd-info-row">
                  <span>Distance from Your Location</span>
                  <strong>{userDistanceText}</strong>
                  {userDistanceStatus ? <p className="rd-info-note">{userDistanceStatus}</p> : null}
                </div>
                <div className="rd-info-row">
                  <span>Location</span>
                  <strong>{room.address || "Address unavailable"}</strong>
                </div>
              </div>
            </div>

            <div className="rd-section">
              <h2>
                <ShieldCheck size={16} /> Facilities
              </h2>
              {facilities.length > 0 ? (
                <div className="rd-tags">
                  {facilities.map((item) => (
                    <span key={item}>{item}</span>
                  ))}
                </div>
              ) : (
                <p className="rd-muted">No facilities listed.</p>
              )}
            </div>

            <div className="rd-section">
              <h2>Description</h2>
              <p className="rd-text">{room.description || "No description provided."}</p>
            </div>

            <div className="rd-section">
              <h2>Rules</h2>
              <p className="rd-text">{room.rules || "No specific rules mentioned."}</p>
            </div>
          </section>

          <aside className="rd-side">
            <section className="rd-card rd-owner-card">
              <h2>
                <Building2 size={16} /> Hostel Owner Details
              </h2>

              <div className="rd-owner-grid">
                <div className="rd-owner-row">
                  <span>
                    <UserRound size={14} /> Hostel
                  </span>
                  <strong>{ownerName}</strong>
                </div>
                <div className="rd-owner-row">
                  <span>
                    <Phone size={14} /> Phone
                  </span>
                  <strong>{ownerPhone}</strong>
                </div>
                <div className="rd-owner-row">
                  <span>
                    <Mail size={14} /> Email
                  </span>
                  <strong>{ownerEmail}</strong>
                </div>
                <div className="rd-owner-row">
                  <span>
                    <MapPin size={14} /> Address
                  </span>
                  <strong>{ownerAddress}</strong>
                </div>
              </div>

              <div className="rd-owner-actions">
                {ownerPhone !== "Unavailable" ? (
                  <a className="rd-btn rd-btn--outline" href={`tel:${ownerPhone}`}>
                    Call Owner
                  </a>
                ) : null}
                {ownerEmail !== "Unavailable" ? (
                  <a className="rd-btn rd-btn--outline" href={`mailto:${ownerEmail}`}>
                    Email Owner
                  </a>
                ) : null}
              </div>
            </section>

            {hasMapQuery ? (
              <section className="rd-card rd-map-card">
                <h2>
                  <MapPin size={16} /> Room Location
                </h2>
                <div className="rd-map-wrap">
                  <iframe
                    title="Room location"
                    src={mapEmbedUrl}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              </section>
            ) : null}

            <section className="rd-card rd-booking-card">
              <h2>Request Booking</h2>
              <p>Add a short message to the owner (optional).</p>

              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Hi, I am interested in this room. Can I visit and confirm availability?"
              />

              {bookingError ? <div className="rd-feedback rd-feedback--error">{bookingError}</div> : null}

              <div className="rd-booking-actions">
                <button
                  type="button"
                  className="rd-btn rd-btn--outline"
                  onClick={handleBooking}
                  disabled={submitting}
                >
                  {submitting ? "Sending..." : "Send Booking Request"}
                </button>
                <button type="button" className="rd-btn rd-btn--outline" onClick={() => navigate(-1)}>
                  Back
                </button>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
