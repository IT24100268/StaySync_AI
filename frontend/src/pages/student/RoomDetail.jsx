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
import api from "../../services/api";
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

export default function RoomDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState("");
  const [activeImageIndex, setActiveImageIndex] = useState(0);

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
  const hasMapCoordinates = latitude !== null && longitude !== null;
  const mapEmbedUrl = hasMapCoordinates
    ? `https://maps.google.com/maps?q=${latitude},${longitude}&z=15&output=embed`
    : "";

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
            {room.hostel_id && (
              <span style={{ display: "inline-block", marginBottom: 6, padding: "2px 12px", borderRadius: 20, background: "#fff8e8", border: "1px solid #dcc89a", color: "#b98b1f", fontSize: 12, fontWeight: 800, letterSpacing: "0.12em" }}>
                {room.hostel_id}
              </span>
            )}
            <p>
              <MapPin size={14} /> {room.distance_from_university || "0"} km from university | Gender: {toTitleCase(room.gender_allowed)}
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
                {room.hostel_id && (
                  <div className="rd-info-row">
                    <span>Hostel ID</span>
                    <strong>{room.hostel_id}</strong>
                  </div>
                )}
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
                  <span>Distance</span>
                  <strong>{room.distance_from_university || "0"} km</strong>
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

            {hasMapCoordinates ? (
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
                  className="rd-btn rd-btn--primary"
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
