import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  BadgeCheck,
  BadgeX,
  CalendarDays,
  Clock3,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Paperclip,
  RefreshCcw,
  Search,
  Send,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import "./Bookings.css";

const toArray = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
};

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const UNIVERSITY_OF_JAFFNA_COORDINATES = {
  lat: 9.6848,
  lng: 80.022,
};

const parseCoordinate = (value, axis) => {
  const numeric = toNumber(value);
  if (numeric === null) return null;
  if (axis === "lat" && (numeric < -90 || numeric > 90)) return null;
  if (axis === "lng" && (numeric < -180 || numeric > 180)) return null;
  return numeric;
};

const hasValidCoordinatePair = (latitude, longitude) => {
  if (latitude === null || longitude === null) return false;
  if (Math.abs(latitude) < 0.000001 && Math.abs(longitude) < 0.000001) return false;
  return true;
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

const getRoomDistanceKm = (room) => {
  const latitude = parseCoordinate(room?.latitude, "lat");
  const longitude = parseCoordinate(room?.longitude, "lng");

  if (hasValidCoordinatePair(latitude, longitude)) {
    return calculateDistanceKm(
      latitude,
      longitude,
      UNIVERSITY_OF_JAFFNA_COORDINATES.lat,
      UNIVERSITY_OF_JAFFNA_COORDINATES.lng
    );
  }

  const fallbackDistance = toNumber(room?.distance_from_university);
  if (fallbackDistance === null || fallbackDistance <= 0) return null;
  return fallbackDistance;
};

const formatDistanceForChip = (value) => {
  const numeric = toNumber(value);
  if (numeric === null || numeric < 0) return "Distance unavailable";
  return `${numeric.toFixed(2)} km`;
};

const formatCurrency = (value) => {
  const numeric = Number(value);
  const safe = Number.isFinite(numeric) ? numeric : 0;
  return `LKR ${safe.toLocaleString("en-LK")}`;
};

const formatDate = (value) => {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleDateString("en-LK", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const formatDateTime = (value) => {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleString("en-LK", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const STATUS_META = {
  pending: { label: "Pending", className: "status-pending", icon: Clock3 },
  approved: { label: "Approved", className: "status-approved", icon: BadgeCheck },
  rejected: { label: "Rejected", className: "status-rejected", icon: BadgeX },
};

export default function Bookings() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [chatOpenBookingId, setChatOpenBookingId] = useState(null);
  const [chatMessagesMap, setChatMessagesMap] = useState({});
  const [chatLoadingMap, setChatLoadingMap] = useState({});
  const [chatSendingMap, setChatSendingMap] = useState({});
  const [chatDrafts, setChatDrafts] = useState({});
  const [chatImageFiles, setChatImageFiles] = useState({});
  const [chatImagePreviews, setChatImagePreviews] = useState({});
  const [chatErrorsMap, setChatErrorsMap] = useState({});

  useEffect(() => {
    fetchBookings(true);
  }, []);

  const fetchBookings = async (initialLoad = false) => {
    if (initialLoad) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    try {
      const { data } = await api.get("/bookings/");
      setBookings(toArray(data));
      setError("");
    } catch (fetchError) {
      console.error("Error fetching bookings:", fetchError);
      setError("Unable to load bookings right now. Please refresh.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadChatMessages = async (bookingId, silent = false) => {
    if (!bookingId) return;

    if (!silent) {
      setChatLoadingMap((current) => ({ ...current, [bookingId]: true }));
    }
    setChatErrorsMap((current) => ({ ...current, [bookingId]: "" }));

    try {
      const { data } = await api.get(`/bookings/${bookingId}/messages/`);
      setChatMessagesMap((current) => ({ ...current, [bookingId]: Array.isArray(data) ? data : [] }));
    } catch (chatError) {
      console.error("Failed to load booking chat:", chatError);
      setChatMessagesMap((current) => ({ ...current, [bookingId]: [] }));
      setChatErrorsMap((current) => ({ ...current, [bookingId]: "Unable to load chat messages." }));
    } finally {
      if (!silent) {
        setChatLoadingMap((current) => ({ ...current, [bookingId]: false }));
      }
    }
  };

  const handleToggleChat = async (bookingId) => {
    if (chatOpenBookingId === bookingId) {
      setChatOpenBookingId(null);
      return;
    }

    setChatOpenBookingId(bookingId);
    if (!chatMessagesMap[bookingId]) {
      await loadChatMessages(bookingId);
    }
  };

  const handleSendChatMessage = async (bookingId) => {
    const text = String(chatDrafts[bookingId] || "").trim();
    const imageFile = chatImageFiles[bookingId] || null;
    if (!text && !imageFile) return;

    setChatSendingMap((current) => ({ ...current, [bookingId]: true }));
    setChatErrorsMap((current) => ({ ...current, [bookingId]: "" }));

    try {
      if (imageFile) {
        const payload = new FormData();
        if (text) payload.append("text", text);
        payload.append("image", imageFile);
        await api.post(`/bookings/${bookingId}/messages/`, payload);
      } else {
        await api.post(`/bookings/${bookingId}/messages/`, { text });
      }

      setChatDrafts((current) => ({ ...current, [bookingId]: "" }));
      setChatImageFiles((current) => ({ ...current, [bookingId]: null }));
      setChatImagePreviews((current) => {
        const preview = current[bookingId];
        if (preview) {
          URL.revokeObjectURL(preview);
        }
        return { ...current, [bookingId]: "" };
      });
      await loadChatMessages(bookingId, true);
    } catch (chatError) {
      console.error("Failed to send booking chat message:", chatError);
      setChatErrorsMap((current) => ({ ...current, [bookingId]: "Failed to send message. Please try again." }));
    } finally {
      setChatSendingMap((current) => ({ ...current, [bookingId]: false }));
    }
  };

  useEffect(() => {
    if (!chatOpenBookingId) return;
    const pollId = window.setInterval(() => {
      void loadChatMessages(chatOpenBookingId, true);
    }, 8000);
    return () => window.clearInterval(pollId);
  }, [chatOpenBookingId]);

  useEffect(
    () => () => {
      Object.values(chatImagePreviews).forEach((preview) => {
        if (preview) {
          URL.revokeObjectURL(preview);
        }
      });
    },
    [chatImagePreviews]
  );

  const handleChatImageSelect = (bookingId, file) => {
    if (!file) return;

    if (!String(file.type || "").startsWith("image/")) {
      setChatErrorsMap((current) => ({ ...current, [bookingId]: "Please choose an image file." }));
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setChatErrorsMap((current) => ({ ...current, [bookingId]: "Image size must be 5MB or less." }));
      return;
    }

    setChatErrorsMap((current) => ({ ...current, [bookingId]: "" }));
    setChatImageFiles((current) => ({ ...current, [bookingId]: file }));
    setChatImagePreviews((current) => {
      if (current[bookingId]) {
        URL.revokeObjectURL(current[bookingId]);
      }
      return { ...current, [bookingId]: URL.createObjectURL(file) };
    });
  };

  const clearChatImage = (bookingId) => {
    setChatImageFiles((current) => ({ ...current, [bookingId]: null }));
    setChatImagePreviews((current) => {
      if (current[bookingId]) {
        URL.revokeObjectURL(current[bookingId]);
      }
      return { ...current, [bookingId]: "" };
    });
  };

  const stats = useMemo(() => {
    const pending = bookings.filter((item) => item.status === "pending").length;
    const approved = bookings.filter((item) => item.status === "approved").length;
    const rejected = bookings.filter((item) => item.status === "rejected").length;
    return {
      total: bookings.length,
      pending,
      approved,
      rejected,
    };
  }, [bookings]);

  const visibleBookings = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    const filtered = bookings.filter((booking) => {
      const statusMatch = statusFilter === "all" || booking.status === statusFilter;
      if (!statusMatch) return false;

      if (!query) return true;

      const room = booking.room || {};
      const searchText = [
        room.title,
        room.hostel_name,
        room.address,
        room.hostel_address,
        room.owner_contact,
        room.hostel_phone,
        room.hostel_email,
        booking.message,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchText.includes(query);
    });

    const sorted = [...filtered];
    sorted.sort((a, b) => {
      if (sortBy === "oldest") {
        return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
      }

      if (sortBy === "price_high") {
        return Number(b.room?.price || 0) - Number(a.room?.price || 0);
      }

      if (sortBy === "price_low") {
        return Number(a.room?.price || 0) - Number(b.room?.price || 0);
      }

      return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
    });

    return sorted;
  }, [bookings, searchQuery, statusFilter, sortBy]);

  return (
    <div className="bookings-page">
      <div className="bookings-page__container">
        <header className="bookings-hero">
          <div>
            <h1>Bookings</h1>
            <p>Track every room request with status, owner details, and quick actions.</p>
          </div>
          <button
            type="button"
            className="bookings-btn bookings-btn--outline"
            onClick={() => fetchBookings(false)}
            disabled={refreshing}
          >
            <RefreshCcw size={15} className={refreshing ? "spin" : ""} />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </header>

        <section className="bookings-stats">
          <article className="stat-card">
            <p>Total Bookings</p>
            <strong>{stats.total}</strong>
          </article>
          <article className="stat-card">
            <p>Pending</p>
            <strong>{stats.pending}</strong>
          </article>
          <article className="stat-card">
            <p>Approved</p>
            <strong>{stats.approved}</strong>
          </article>
          <article className="stat-card">
            <p>Rejected</p>
            <strong>{stats.rejected}</strong>
          </article>
        </section>

        <section className="bookings-toolbar">
          <div className="bookings-search">
            <Search size={15} />
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search by room, hostel, owner phone, or message"
            />
          </div>

          <div className="bookings-filters">
            {[
              { key: "all", label: "All" },
              { key: "pending", label: "Pending" },
              { key: "approved", label: "Approved" },
              { key: "rejected", label: "Rejected" },
            ].map((item) => (
              <button
                key={item.key}
                type="button"
                className={`filter-chip ${statusFilter === item.key ? "is-active" : ""}`}
                onClick={() => setStatusFilter(item.key)}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="bookings-sort">
            <label htmlFor="booking-sort">Sort</label>
            <select
              id="booking-sort"
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="price_high">Price High-Low</option>
              <option value="price_low">Price Low-High</option>
            </select>
          </div>
        </section>

        {error ? <div className="bookings-feedback bookings-feedback--error">{error}</div> : null}

        {loading ? (
          <div className="bookings-feedback">Loading your bookings...</div>
        ) : visibleBookings.length === 0 ? (
          <div className="bookings-empty">
            <h2>No bookings found</h2>
            <p>Try another filter or explore available rooms to create a booking request.</p>
            <Link to="/rooms" className="bookings-btn bookings-btn--primary">
              Browse Rooms
            </Link>
          </div>
        ) : (
          <section className="bookings-grid">
            {visibleBookings.map((booking) => {
              const room = booking.room || {};
              const statusKey = String(booking.status || "pending").toLowerCase();
              const statusMeta = STATUS_META[statusKey] || STATUS_META.pending;
              const StatusIcon = statusMeta.icon;
              const roomDistanceKm = getRoomDistanceKm(room);
              const roomImage = room.images?.[0]?.image || "";
              const ownerName = room.hostel_name || "Hostel Owner";
              const ownerPhone = room.hostel_phone || room.owner_contact || "Unavailable";
              const ownerEmail = room.hostel_email || "Unavailable";

              return (
                <article key={booking.id} className="booking-card">
                  <div className="booking-card__media">
                    {roomImage ? (
                      <img src={roomImage} alt={room.title || "Room"} />
                    ) : (
                      <div className="booking-card__media-empty">No Room Image</div>
                    )}
                  </div>

                  <div className="booking-card__body">
                    <div className="booking-card__head">
                      <div>
                        <h3>{room.title || "Room Booking"}</h3>
                        <p>{room.address || room.hostel_address || "Address unavailable"}</p>
                      </div>
                      <span className={`status-badge ${statusMeta.className}`}>
                        <StatusIcon size={14} />
                        {statusMeta.label}
                      </span>
                    </div>

                    <div className="booking-card__chips">
                      <span>{formatCurrency(room.price)} / month</span>
                      <span>{formatDistanceForChip(roomDistanceKm)}</span>
                      <span>{String(room.gender_allowed || "any").toUpperCase()}</span>
                    </div>

                    <div className="booking-card__owner">
                      <div>
                        <p className="owner-title">Hostel Owner</p>
                        <strong>{ownerName}</strong>
                      </div>
                      <div className="owner-contact">
                        <span>
                          <Phone size={13} /> {ownerPhone}
                        </span>
                        <span>
                          <Mail size={13} /> {ownerEmail}
                        </span>
                      </div>
                    </div>

                    <div className="booking-card__meta">
                      <p>
                        <CalendarDays size={14} /> Requested: {formatDate(booking.created_at)}
                      </p>
                      <p>Booking ID: BK-{booking.id}</p>
                    </div>

                    {booking.message ? (
                      <div className="booking-card__message">
                        <strong>Your Message</strong>
                        <p>{booking.message}</p>
                      </div>
                    ) : null}

                    <div className="booking-card__actions">
                      <button
                        type="button"
                        className="bookings-btn bookings-btn--outline"
                        onClick={() => navigate(`/rooms/${room.id}`)}
                      >
                        View Room
                      </button>

                      {ownerPhone !== "Unavailable" ? (
                        <a className="bookings-btn bookings-btn--outline" href={`tel:${ownerPhone}`}>
                          Call Owner
                        </a>
                      ) : null}

                      <button
                        type="button"
                        className="bookings-btn bookings-btn--outline"
                        onClick={() => handleToggleChat(booking.id)}
                      >
                        <MessageCircle size={14} />
                        {chatOpenBookingId === booking.id ? "Close Chat" : "Chat"}
                      </button>
                    </div>

                    {chatOpenBookingId === booking.id ? (
                      <div className="booking-card__chat">
                        <div className="booking-card__chat-list">
                          {chatLoadingMap[booking.id] ? (
                            <p className="booking-card__chat-empty">Loading messages...</p>
                          ) : (chatMessagesMap[booking.id] || []).length === 0 ? (
                            <p className="booking-card__chat-empty">No messages yet. Start the conversation.</p>
                          ) : (
                            (chatMessagesMap[booking.id] || []).map((message) => {
                              const mine = Number(message.sender_id) === Number(user?.id);
                              return (
                                <div
                                  key={message.id}
                                  className={`booking-card__chat-bubble ${mine ? "is-mine" : "is-other"}`}
                                >
                                  <p className="booking-card__chat-author">{message.sender_name}</p>
                                  {message.image ? (
                                    <a
                                      href={message.image}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="booking-card__chat-image-link"
                                    >
                                      <img src={message.image} alt="Chat attachment" className="booking-card__chat-image" />
                                    </a>
                                  ) : null}
                                  {message.text ? <p className="booking-card__chat-text">{message.text}</p> : null}
                                  <p className="booking-card__chat-time">{formatDateTime(message.created_at)}</p>
                                </div>
                              );
                            })
                          )}
                        </div>

                        {chatErrorsMap[booking.id] ? (
                          <p className="booking-card__chat-error">{chatErrorsMap[booking.id]}</p>
                        ) : null}

                        <div className="booking-card__chat-tools">
                          <label className="booking-card__chat-attach">
                            <Paperclip size={14} />
                            Attach Image
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(event) => {
                                const file = event.target.files?.[0];
                                handleChatImageSelect(booking.id, file);
                                event.target.value = "";
                              }}
                            />
                          </label>
                          {chatImageFiles[booking.id] ? (
                            <button
                              type="button"
                              className="booking-card__chat-remove-image"
                              onClick={() => clearChatImage(booking.id)}
                            >
                              Remove image
                            </button>
                          ) : null}
                        </div>

                        {chatImagePreviews[booking.id] ? (
                          <div className="booking-card__chat-preview">
                            <img src={chatImagePreviews[booking.id]} alt="Selected attachment" />
                          </div>
                        ) : null}

                        <div className="booking-card__chat-compose">
                          <textarea
                            value={chatDrafts[booking.id] || ""}
                            onChange={(event) =>
                              setChatDrafts((current) => ({ ...current, [booking.id]: event.target.value }))
                            }
                            placeholder="Type your message to owner..."
                          />
                          <button
                            type="button"
                            className="bookings-btn bookings-btn--outline booking-card__chat-send"
                            onClick={() => handleSendChatMessage(booking.id)}
                            disabled={
                              chatSendingMap[booking.id] ||
                              (!String(chatDrafts[booking.id] || "").trim() && !chatImageFiles[booking.id])
                            }
                          >
                            <Send size={14} />
                            {chatSendingMap[booking.id] ? "Sending..." : "Send"}
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </div>
    </div>
  );
}
