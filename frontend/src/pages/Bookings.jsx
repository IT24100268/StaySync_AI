import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  BadgeCheck,
  BadgeX,
  CalendarDays,
  Clock3,
  Mail,
  MapPin,
  Phone,
  RefreshCcw,
  Search,
} from "lucide-react";
import api from "../services/api";
import "./Bookings.css";

const toArray = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
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

const STATUS_META = {
  pending: { label: "Pending", className: "status-pending", icon: Clock3 },
  approved: { label: "Approved", className: "status-approved", icon: BadgeCheck },
  rejected: { label: "Rejected", className: "status-rejected", icon: BadgeX },
};

export default function Bookings() {
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

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
                      <span>{room.distance_from_university || "0"} km</span>
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
                        className="bookings-btn bookings-btn--primary"
                        onClick={() => navigate(`/rooms/${room.id}`)}
                      >
                        View Room
                      </button>

                      {ownerPhone !== "Unavailable" ? (
                        <a className="bookings-btn bookings-btn--outline" href={`tel:${ownerPhone}`}>
                          Call Owner
                        </a>
                      ) : null}
                    </div>
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
