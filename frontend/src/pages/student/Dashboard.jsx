import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Bell, MapPin, Search, X } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import "./Dashboard.css";

const INITIAL_FILTERS = {
  location: "",
  minBudget: "",
  maxBudget: "",
  gender: "",
  facility: "",
};

const ORDER_STATUS_CLASS = {
  pending: "status-badge--warning",
  accepted: "status-badge--ok",
  preparing: "status-badge--info",
  ready: "status-badge--info",
  out_for_delivery: "status-badge--info",
  delivered: "status-badge--ok",
  rejected: "status-badge--danger",
};

const BOOKING_STATUS_CLASS = {
  approved: "status-badge--ok",
  pending: "status-badge--warning",
  rejected: "status-badge--danger",
};

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

const formatDate = (dateValue) => {
  if (!dateValue) return "N/A";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleDateString("en-LK", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const toTitleCase = (value) => {
  return String(value || "")
    .replaceAll("_", " ")
    .trim()
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

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
  // Backend defaults missing coordinates to 0,0 in some flows. Exclude that placeholder.
  if (Math.abs(latitude) < 0.000001 && Math.abs(longitude) < 0.000001) return false;
  return true;
};

const encodeQueryValue = (value) => encodeURIComponent(String(value || ""));

const getInitials = (user) => {
  const fullName = `${user?.first_name || ""} ${user?.last_name || ""}`.trim() || user?.username || "Student";
  return fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((chunk) => chunk.charAt(0).toUpperCase())
    .join("");
};

const Dashboard = () => {
  const { user } = useAuth();
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [quickSearch, setQuickSearch] = useState("");
  const [rooms, setRooms] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [orders, setOrders] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState("");
  const [locationLoading, setLocationLoading] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [seenIds, setSeenIds] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem("notif_seen") || "[]")); }
    catch { return new Set(); }
  });
  const notifRef = useRef(null);

  const applyLocalRoomFilters = (roomList, nextFilters) => {
    const locationNeedle = String(nextFilters.location || "").trim().toLowerCase();
    const facilityNeedle = String(nextFilters.facility || "").trim().toLowerCase();

    return roomList.filter((room) => {
      const locationText = [room.title, room.address, room.description]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const facilities = Array.isArray(room.facilities) ? room.facilities : [];
      const facilitiesText = facilities.join(" ").toLowerCase();

      const locationMatch = !locationNeedle || locationText.includes(locationNeedle);
      const facilityMatch = !facilityNeedle || facilitiesText.includes(facilityNeedle);
      return locationMatch && facilityMatch;
    });
  };

  const fetchRooms = async (nextFilters) => {
    setRoomsLoading(true);
    try {
      const params = new URLSearchParams();
      if (nextFilters.minBudget) params.append("min_price", nextFilters.minBudget);
      if (nextFilters.maxBudget) params.append("max_price", nextFilters.maxBudget);
      if (nextFilters.gender) params.append("gender_allowed", nextFilters.gender);

      const query = params.toString();
      const url = query ? `/rooms/?${query}` : "/rooms/";
      const { data } = await api.get(url);
      const filteredRooms = applyLocalRoomFilters(toArray(data), nextFilters);
      setRooms(filteredRooms);
      setError("");
    } catch (fetchError) {
      console.error("Failed to fetch rooms for dashboard:", fetchError);
      setError("Failed to refresh room results.");
    } finally {
      setRoomsLoading(false);
    }
  };

  const fetchFavorites = async () => {
    const { data } = await api.get("/rooms/favorites/");
    setFavorites(toArray(data));
  };

  useEffect(() => {
    let isMounted = true;

    const loadDashboard = async () => {
      setLoading(true);
      setError("");

      try {
        const [roomsRes, restaurantsRes, favoritesRes, ordersRes, bookingsRes] = await Promise.all([
          api.get("/rooms/"),
          api.get("/restaurants/"),
          api.get("/rooms/favorites/"),
          api.get("/orders/"),
          api.get("/bookings/"),
        ]);

        if (!isMounted) return;

        const roomRows = applyLocalRoomFilters(toArray(roomsRes.data), INITIAL_FILTERS);
        const restaurantRows = toArray(restaurantsRes.data);

        setRooms(roomRows);
        setFavorites(toArray(favoritesRes.data));
        setOrders(toArray(ordersRes.data));
        setBookings(toArray(bookingsRes.data));
        setRestaurants(restaurantRows);
      } catch (loadError) {
        console.error("Failed to load dashboard data:", loadError);
        if (isMounted) {
          setError("Failed to load dashboard data.");
          setRooms([]);
          setRestaurants([]);
          setFavorites([]);
          setOrders([]);
          setBookings([]);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadDashboard();
    return () => {
      isMounted = false;
    };
  }, []);

  const mapRooms = useMemo(() => rooms.slice(0, 4), [rooms]);
  const recommendedHostels = useMemo(() => {
    const byHostel = new Map();

    rooms.forEach((room) => {
      const hostelKey = room.hostel_owner_id || room.owner_contact || `room-${room.id}`;
      const price = Number(room.price);
      const distance = Number(room.distance_from_university);
      const safePrice = Number.isFinite(price) ? price : Number.POSITIVE_INFINITY;
      const safeDistance = Number.isFinite(distance) ? distance : Number.POSITIVE_INFINITY;
      const roomTags = Array.isArray(room.facilities) ? room.facilities : [];

      if (!byHostel.has(hostelKey)) {
        byHostel.set(hostelKey, {
          key: hostelKey,
          ownerContact: room.owner_contact || "",
          hostelName: room.hostel_name || room.title || "Hostel",
          hostelAddress: room.hostel_address || room.address || "Address unavailable",
          hostelImage: room.hostel_image || room?.images?.[0]?.image || "",
          hostelPhone: room.hostel_phone || room.owner_contact || "Contact unavailable",
          hostelEmail: room.hostel_email || "",
          minPrice: safePrice,
          minDistance: safeDistance,
          roomCount: 1,
          sampleRoomTitle: room.title || "Room",
          tags: roomTags.slice(0, 3),
          primaryRoomId: room.id,
        });
        return;
      }

      const existing = byHostel.get(hostelKey);
      existing.roomCount += 1;
      existing.minPrice = Math.min(existing.minPrice, safePrice);
      existing.minDistance = Math.min(existing.minDistance, safeDistance);

      if (!existing.hostelImage && (room.hostel_image || room?.images?.[0]?.image)) {
        existing.hostelImage = room.hostel_image || room?.images?.[0]?.image || "";
      }
      if ((!existing.hostelPhone || existing.hostelPhone === "Contact unavailable") && (room.hostel_phone || room.owner_contact)) {
        existing.hostelPhone = room.hostel_phone || room.owner_contact;
      }
      if (!existing.hostelEmail && room.hostel_email) {
        existing.hostelEmail = room.hostel_email;
      }
      if (
        (!existing.hostelAddress || existing.hostelAddress === "Address unavailable") &&
        (room.hostel_address || room.address)
      ) {
        existing.hostelAddress = room.hostel_address || room.address;
      }

      if (!existing.sampleRoomTitle && room.title) {
        existing.sampleRoomTitle = room.title;
      }

      const mergedTags = [...existing.tags, ...roomTags];
      existing.tags = Array.from(new Set(mergedTags)).slice(0, 3);
    });

    return Array.from(byHostel.values())
      .sort((a, b) => {
        if (a.minDistance !== b.minDistance) return a.minDistance - b.minDistance;
        return a.minPrice - b.minPrice;
      })
      .slice(0, 4);
  }, [rooms]);
  const popularRestaurants = useMemo(() => restaurants.slice(0, 6), [restaurants]);
  const savedRooms = useMemo(() => favorites.slice(0, 4), [favorites]);
  const recentOrders = useMemo(() => orders.slice(0, 3), [orders]);
  const recentBookings = useMemo(() => bookings.slice(0, 3), [bookings]);

  const trackableOrder = useMemo(() => {
    return orders.find((order) => String(order?.status || "").toLowerCase() === "out_for_delivery");
  }, [orders]);

  const mapLocations = useMemo(() => {
    return [
      ...mapRooms.map((room) => ({
        key: `room-${room.id}`,
        label: room.title,
        type: "room",
        latitude: parseCoordinate(room.latitude, "lat"),
        longitude: parseCoordinate(room.longitude, "lng"),
      })),
      ...popularRestaurants.map((restaurant) => ({
        key: `restaurant-${restaurant.id}`,
        label: restaurant.name,
        type: "restaurant",
        latitude: parseCoordinate(restaurant.latitude, "lat"),
        longitude: parseCoordinate(restaurant.longitude, "lng"),
      })),
    ].filter((point) => hasValidCoordinatePair(point.latitude, point.longitude));
  }, [mapRooms, popularRestaurants]);

  const derivedMapCenter = useMemo(() => {
    if (currentLocation) {
      return currentLocation;
    }

    if (mapLocations.length > 0) {
      const latitude =
        mapLocations.reduce((sum, point) => sum + point.latitude, 0) / mapLocations.length;
      const longitude =
        mapLocations.reduce((sum, point) => sum + point.longitude, 0) / mapLocations.length;
      return { lat: latitude, lng: longitude };
    }

    return { lat: 6.9271, lng: 79.8612 };
  }, [currentLocation, mapLocations]);

  const mapZoom = currentLocation ? 15 : mapLocations.length > 0 ? 13 : 11;
  const mapEmbedUrl = `https://maps.google.com/maps?q=${derivedMapCenter.lat},${derivedMapCenter.lng}&z=${mapZoom}&output=embed`;

  const studentName = user?.username || "Student";
  const studentInitials = getInitials(user);
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  }, []);
  const activeOrderCount = useMemo(() => {
    return orders.filter((order) =>
      ["pending", "accepted", "preparing", "ready", "out_for_delivery"].includes(String(order?.status || "").toLowerCase())
    ).length;
  }, [orders]);

  const notifications = useMemo(() => {
    const list = [];
    orders.forEach((order) => {
      const status = String(order?.status || "").toLowerCase();
      const key = `order-${order.id}-${status}`;
      let message = "";
      if (status === "accepted") message = `Order #${order.id} has been accepted.`;
      else if (status === "preparing") message = `Order #${order.id} is being prepared.`;
      else if (status === "ready") message = `Order #${order.id} is ready for pickup.`;
      else if (status === "out_for_delivery") message = `Order #${order.id} is out for delivery!`;
      else if (status === "delivered") message = `Order #${order.id} has been delivered.`;
      else if (status === "rejected") message = `Order #${order.id} was rejected.`;
      else if (status === "pending") message = `Order #${order.id} is pending confirmation.`;
      if (message) list.push({ key, message, link: "/orders", time: order.updated_at || order.created_at });
    });
    bookings.forEach((booking) => {
      const status = String(booking?.status || "").toLowerCase();
      const key = `booking-${booking.id}-${status}`;
      let message = "";
      if (status === "approved") message = `Your booking for "${booking.room?.title || "a room"}" was approved!`;
      else if (status === "rejected") message = `Your booking for "${booking.room?.title || "a room"}" was rejected.`;
      else if (status === "pending") message = `Booking for "${booking.room?.title || "a room"}" is pending.`;
      if (message) list.push({ key, message, link: "/bookings", time: booking.updated_at || booking.created_at });
    });
    return list.sort((a, b) => new Date(b.time || 0) - new Date(a.time || 0));
  }, [orders, bookings]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !seenIds.has(n.key)).length,
    [notifications, seenIds]
  );

  const handleNotifOpen = () => {
    setNotifOpen((prev) => {
      if (!prev) {
        const allIds = notifications.map((n) => n.key);
        const updated = new Set(allIds);
        setSeenIds(updated);
        localStorage.setItem("notif_seen", JSON.stringify(allIds));
      }
      return !prev;
    });
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  const locationLabel = useMemo(() => {
    if (currentLocation) {
      return `${currentLocation.lat.toFixed(3)}, ${currentLocation.lng.toFixed(3)}`;
    }
    if (filters.location.trim()) {
      return toTitleCase(filters.location);
    }
    const firstKnown = mapRooms.find((room) => room.address)?.address;
    if (firstKnown) {
      return firstKnown.split(",")[0];
    }
    return "Sri Lanka";
  }, [currentLocation, filters.location, mapRooms]);
  const activeQuickFilters = useMemo(() => {
    const list = [];
    if (filters.gender) list.push(`Gender: ${toTitleCase(filters.gender)}`);
    if (filters.minBudget) list.push(`Min: ${formatCurrency(filters.minBudget)}`);
    if (filters.maxBudget) list.push(`Max: ${formatCurrency(filters.maxBudget)}`);
    if (filters.facility.trim()) list.push(`Facility: ${filters.facility.trim()}`);
    return list;
  }, [filters.gender, filters.minBudget, filters.maxBudget, filters.facility]);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((previous) => ({ ...previous, [name]: value }));
  };

  const handleSearch = async (event) => {
    event.preventDefault();
    await fetchRooms(filters);
  };

  const handleClearFilters = async () => {
    const reset = { ...INITIAL_FILTERS };
    setFilters(reset);
    setQuickSearch("");
    await fetchRooms(reset);
  };

  const handleQuickSearchSubmit = async (event) => {
    event.preventDefault();
    const nextFilters = {
      ...filters,
      location: quickSearch.trim(),
    };
    setFilters(nextFilters);
    await fetchRooms(nextFilters);
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus("Geolocation is not supported in this browser.");
      return;
    }

    setLocationLoading(true);
    setLocationStatus("Requesting location permission...");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCurrentLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLocationStatus("Current location applied.");
        setLocationLoading(false);
      },
      (geoError) => {
        if (geoError.code === 1) {
          setLocationStatus("Location permission denied. Please allow it and try again.");
        } else if (geoError.code === 2) {
          setLocationStatus("Location unavailable. Try again in a moment.");
        } else if (geoError.code === 3) {
          setLocationStatus("Location request timed out. Try again.");
        } else {
          setLocationStatus("Failed to fetch current location.");
        }
        setLocationLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  if (loading) {
    return (
      <div className="student-dashboard">
        <div className="student-dashboard__container">
          <div className="dashboard-card dashboard-loading">Loading dashboard data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="student-dashboard">
      <div className="student-dashboard__container">
        <section className="dashboard-toolbar">
          <form className="dashboard-toolbar__search" onSubmit={handleQuickSearchSubmit}>
            <Search size={18} />
            <input
              type="text"
              value={quickSearch}
              onChange={(event) => setQuickSearch(event.target.value)}
              placeholder="Search by location or area..."
            />
            {quickSearch ? (
              <button type="button" className="dashboard-toolbar__clear" onClick={() => setQuickSearch("")} aria-label="Clear search">
                <X size={16} />
              </button>
            ) : null}
          </form>

          <div className="dashboard-toolbar__actions">
            <div className="dashboard-notif-wrap" ref={notifRef}>
              <button type="button" className="dashboard-toolbar__notify" onClick={handleNotifOpen}>
                <Bell size={17} />
                {unreadCount > 0 ? <span>{unreadCount}</span> : null}
              </button>
              {notifOpen && (
                <div className="dashboard-notif-dropdown">
                  <div className="dashboard-notif-dropdown__head">
                    <strong>Notifications</strong>
                    <span>{notifications.length} total</span>
                  </div>
                  {notifications.length === 0 ? (
                    <p className="dashboard-notif-dropdown__empty">No notifications yet.</p>
                  ) : (
                    <ul className="dashboard-notif-dropdown__list">
                      {notifications.map((n) => (
                        <li key={n.key} className={`dashboard-notif-item${seenIds.has(n.key) ? " is-read" : ""}`}>
                          <Link to={n.link} onClick={() => setNotifOpen(false)}>
                            {n.message}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
            <Link to="/profile" className="dashboard-toolbar__profile">
              {user?.profile?.display_image ? (
                <img src={user.profile.display_image} alt={studentName} />
              ) : (
                <span>{studentInitials}</span>
              )}
            </Link>
          </div>
        </section>

        <section className="dashboard-hero">
          <div>
            <h1>
              {greeting}, {studentName}
            </h1>
            <p>Find your perfect stay and meals near you.</p>
          </div>

          <div className="dashboard-hero__actions">
            <Link to="/rooms" className="dashboard-btn dashboard-btn--primary">
              Find Rooms
            </Link>
            <Link to="/restaurants" className="dashboard-btn dashboard-btn--primary">
              Find Restaurants
            </Link>
            <Link to="/orders" className="dashboard-btn dashboard-btn--primary">
              Track Orders
            </Link>
          </div>
        </section>

        {error ? <div className="dashboard-alert">{error}</div> : null}

        <section className="dashboard-top-grid">
          <div className="dashboard-card dashboard-card--filters">
            <div className="dashboard-card__header">
              <div className="dashboard-card__title-wrap">
                <h2>Search Rooms</h2>
                <p>Refine your room discovery with precise filters.</p>
              </div>
              <span>{rooms.length} rooms</span>
            </div>

            <form className="dashboard-filter-grid" onSubmit={handleSearch}>
              <label className="dashboard-field">
                <span>Location</span>
                <input
                  type="text"
                  name="location"
                  value={filters.location}
                  onChange={handleFilterChange}
                  placeholder="Malabe"
                />
              </label>

              <label className="dashboard-field">
                <span>Gender</span>
                <select name="gender" value={filters.gender} onChange={handleFilterChange}>
                  <option value="">All</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="any">Any</option>
                </select>
              </label>

              <label className="dashboard-field">
                <span>Min Budget</span>
                <input
                  type="number"
                  name="minBudget"
                  value={filters.minBudget}
                  onChange={handleFilterChange}
                  placeholder="20000"
                  min="0"
                />
              </label>

              <label className="dashboard-field">
                <span>Max Budget</span>
                <input
                  type="number"
                  name="maxBudget"
                  value={filters.maxBudget}
                  onChange={handleFilterChange}
                  placeholder="35000"
                  min="0"
                />
              </label>

              <label className="dashboard-field dashboard-field--wide">
                <span>Facility</span>
                <input
                  type="text"
                  name="facility"
                  value={filters.facility}
                  onChange={handleFilterChange}
                  placeholder="wifi, parking, attached bath..."
                />
              </label>

              <div className="dashboard-quick-chips">
                {activeQuickFilters.length > 0 ? (
                  activeQuickFilters.map((chip) => (
                    <span key={chip} className="dashboard-quick-chip">
                      {chip}
                    </span>
                  ))
                ) : (
                  <span className="dashboard-quick-chip dashboard-quick-chip--muted">No quick filters selected</span>
                )}
              </div>

              <div className="dashboard-filter-actions">
                <button type="submit" className="dashboard-btn dashboard-btn--ghost">
                  {roomsLoading ? "Searching..." : "Search"}
                </button>
                <button
                  type="button"
                  className="dashboard-btn dashboard-btn--ghost"
                  onClick={handleClearFilters}
                >
                  Clear
                </button>
              </div>
            </form>
          </div>

          <div className="dashboard-card dashboard-card--map">
            <div className="dashboard-card__header">
              <div className="dashboard-card__title-wrap">
                <h2>
                  <MapPin size={18} /> Your Location: {locationLabel}
                </h2>
                <p>Explore room and restaurant points around your selected area.</p>
              </div>
              <span>{mapLocations.length} points</span>
            </div>

            <div className="dashboard-map">
              <div className="dashboard-map__toolbar">
                <button
                  type="button"
                  className="dashboard-map__geo-btn"
                  onClick={handleUseCurrentLocation}
                  disabled={locationLoading}
                >
                  {locationLoading ? "Locating..." : "Use My Location"}
                </button>
                {locationStatus ? <p className="dashboard-map__status">{locationStatus}</p> : null}
              </div>

              <div className="dashboard-map__canvas">
                <iframe
                  title="Student dashboard map"
                  src={mapEmbedUrl}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>

              {mapLocations.length === 0 ? (
                <p className="dashboard-map__empty-note">
                  Add latitude/longitude to rooms and restaurants to improve map accuracy.
                </p>
              ) : null}
            </div>
          </div>
        </section>

        <section className="dashboard-main-grid">
          <div className="dashboard-card">
            <div className="dashboard-card__header">
              <h2>Recommended Rooms</h2>
              <Link to="/rooms">View All</Link>
            </div>

            {recommendedHostels.length === 0 ? (
              <div className="dashboard-empty">No rooms available for the selected filters.</div>
            ) : (
              <div className="listing-grid">
                {recommendedHostels.map((hostel) => {
                  const detailsLink = hostel.ownerContact
                    ? `/rooms?owner_contact=${encodeQueryValue(hostel.ownerContact)}&hostel=${encodeQueryValue(
                        hostel.hostelName || "Hostel"
                      )}`
                    : `/rooms/${hostel.primaryRoomId}`;
                  const roomImage = hostel.hostelImage || "";
                  const roomTags = Array.isArray(hostel.tags) ? hostel.tags : [];

                  return (
                    <article key={hostel.key} className="listing-card">
                      <div className="listing-card__image-wrap">
                        {roomImage ? (
                          <img
                            src={roomImage}
                            alt={hostel.hostelName}
                            className="listing-card__image"
                          />
                        ) : (
                          <div className="listing-card__image listing-card__image--empty">No Hostel Image</div>
                        )}
                      </div>

                      <div className="listing-card__body">
                        <h3>{hostel.hostelName}</h3>
                        <p className="listing-card__price">{hostel.hostelPhone || "Contact unavailable"}</p>
                        <p className="listing-card__meta">{hostel.hostelEmail || "Email unavailable"}</p>
                        <p className="listing-card__meta">{hostel.hostelAddress}</p>
                        <div className="listing-card__tags">
                          <span className="listing-card__tag">
                            {hostel.roomCount} room{hostel.roomCount > 1 ? "s" : ""}
                          </span>
                          <span className="listing-card__tag">{hostel.sampleRoomTitle}</span>
                          {roomTags.map((tag) => (
                            <span key={`${hostel.key}-${tag}`} className="listing-card__tag">
                              {tag}
                            </span>
                          ))}
                        </div>
                        <Link to={detailsLink} className="dashboard-btn dashboard-btn--primary">
                          View Details
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>

          <div className="dashboard-card">
            <div className="dashboard-card__header">
              <h2>Popular Restaurants</h2>
              <Link to="/restaurants">View All</Link>
            </div>

            {popularRestaurants.length === 0 ? (
              <div className="dashboard-empty">No restaurants available right now.</div>
            ) : (
              <div className="listing-grid">
                {popularRestaurants.map((restaurant) => (
                  <article key={restaurant.id} className="listing-card">
                    <div className="listing-card__image-wrap">
                      {restaurant.image ? (
                        <img
                          src={restaurant.image}
                          alt={restaurant.name}
                          className="listing-card__image"
                        />
                      ) : (
                        <div className="listing-card__image listing-card__image--empty">No Restaurant Image</div>
                      )}
                    </div>

                    <div className="listing-card__body">
                      <h3>{restaurant.name}</h3>
                      <p className="listing-card__meta">ID: {restaurant.restaurant_id || restaurant.id}</p>
                      <p className="listing-card__price">{restaurant.phone || "Contact unavailable"}</p>
                      <p className="listing-card__meta">{restaurant.address || "Address unavailable"}</p>
                      <Link to={`/restaurants/${restaurant.id}`} className="dashboard-btn dashboard-btn--primary">
                        Order Now
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="dashboard-bottom-grid">
          <div className="dashboard-card">
            <div className="dashboard-card__header">
              <h2>Saved Rooms</h2>
              <Link to="/favorites">View All</Link>
            </div>

            {savedRooms.length === 0 ? (
              <div className="dashboard-empty">No saved rooms yet.</div>
            ) : (
              <div className="compact-list">
                {savedRooms.map((favorite) => (
                  <article key={favorite.id} className="compact-item">
                    <div>
                      <h3>{favorite.room?.title || "Room"}</h3>
                      <p>{formatCurrency(favorite.room?.price)} / month</p>
                    </div>
                    <Link to={`/rooms/${favorite.room?.id}`} className="dashboard-btn dashboard-btn--outline">
                      Open
                    </Link>
                  </article>
                ))}
              </div>
            )}
          </div>

          <div className="dashboard-bottom-stack">
            <div className="dashboard-card">
              <div className="dashboard-card__header">
                <h2>Recent Orders</h2>
                <Link to={trackableOrder ? `/tracking/${trackableOrder.id}` : "/orders"}>
                  {trackableOrder ? "Track Order" : "View All"}
                </Link>
              </div>

              {recentOrders.length === 0 ? (
                <div className="dashboard-empty">No orders available yet.</div>
              ) : (
                <div className="compact-list">
                  {recentOrders.map((order) => {
                    const status = String(order?.status || "").toLowerCase();
                    const badgeClass = ORDER_STATUS_CLASS[status] || "status-badge--neutral";

                    return (
                      <article key={order.id} className="compact-item">
                        <div>
                          <h3>{order.restaurant?.name || `Order #${order.id}`}</h3>
                          <p>
                            {formatCurrency(order.total_price)} | {formatDate(order.created_at)}
                          </p>
                        </div>
                        <span className={`status-badge ${badgeClass}`}>{toTitleCase(status)}</span>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="dashboard-card">
              <div className="dashboard-card__header">
                <h2>Recent Bookings</h2>
                <Link to="/bookings">View All</Link>
              </div>

              {recentBookings.length === 0 ? (
                <div className="dashboard-empty">No bookings available yet.</div>
              ) : (
                <div className="compact-list">
                  {recentBookings.map((booking) => {
                    const status = String(booking?.status || "").toLowerCase();
                    const badgeClass = BOOKING_STATUS_CLASS[status] || "status-badge--neutral";

                    return (
                      <article key={booking.id} className="compact-item">
                        <div>
                          <h3>{booking.room?.title || "Room booking"}</h3>
                          <p>Requested on {formatDate(booking.created_at)}</p>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span className={`status-badge ${badgeClass}`}>{toTitleCase(status)}</span>
                          <Link to={`/bookings`} className="dashboard-btn dashboard-btn--primary">View</Link>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
