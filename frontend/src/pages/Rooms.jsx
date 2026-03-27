import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  BedDouble,
  ChevronRight,
  Heart,
  Search,
} from "lucide-react";
import api from "../services/api";
import "./Rooms.css";

const INITIAL_FILTERS = {
  location: "",
  facility: "",
  min_price: "",
  max_price: "",
  gender_allowed: "",
  max_distance: "",
  owner_contact: "",
};

const toArray = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
};

const safeNumber = (value, fallback = 0) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
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
  if (Math.abs(latitude) < 0.000001 && Math.abs(longitude) < 0.000001) return false;
  return true;
};

const formatCurrency = (value) => `LKR ${safeNumber(value).toLocaleString("en-LK")}`;

export default function Rooms() {
  const location = useLocation();
  const navigate = useNavigate();
  const ownerContactFromQuery = useMemo(
    () => new URLSearchParams(location.search).get("owner_contact") || "",
    [location.search]
  );
  const hostelNameFromQuery = useMemo(
    () => new URLSearchParams(location.search).get("hostel") || "",
    [location.search]
  );

  const [filters, setFilters] = useState({ ...INITIAL_FILTERS, owner_contact: ownerContactFromQuery });
  const [sortBy, setSortBy] = useState("price_asc");
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const nextFilters = { ...INITIAL_FILTERS, owner_contact: ownerContactFromQuery };
    setFilters(nextFilters);
    fetchRooms(nextFilters, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ownerContactFromQuery]);

  const fetchRooms = async (overrideFilters = filters, initialLoad = false) => {
    if (!initialLoad) {
      setSearching(true);
    }

    try {
      const params = new URLSearchParams();
      if (overrideFilters.min_price) params.append("min_price", overrideFilters.min_price);
      if (overrideFilters.max_price) params.append("max_price", overrideFilters.max_price);
      if (overrideFilters.gender_allowed) params.append("gender_allowed", overrideFilters.gender_allowed);
      if (overrideFilters.max_distance) params.append("max_distance", overrideFilters.max_distance);
      if (overrideFilters.owner_contact) params.append("owner_contact", overrideFilters.owner_contact);

      const query = params.toString();
      const endpoint = query ? `/rooms/?${query}` : "/rooms/";
      const { data } = await api.get(endpoint);
      setRooms(toArray(data));
      setError("");
    } catch (fetchError) {
      console.error("Failed to load rooms:", fetchError);
      setRooms([]);
      setError("Failed to load room listings. Please try again.");
    } finally {
      setLoading(false);
      setSearching(false);
    }
  };

  const displayedRooms = useMemo(() => {
    const locationNeedle = String(filters.location || "").trim().toLowerCase();
    const facilityNeedle = String(filters.facility || "").trim().toLowerCase();

    const locallyFiltered = rooms.filter((room) => {
      const locationText = [room.hostel_name, room.title, room.address, room.hostel_address, room.description]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const facilities = Array.isArray(room.facilities) ? room.facilities : [];
      const facilitiesText = facilities.join(" ").toLowerCase();

      const locationMatch = !locationNeedle || locationText.includes(locationNeedle);
      const facilityMatch = !facilityNeedle || facilitiesText.includes(facilityNeedle);
      return locationMatch && facilityMatch;
    });

    const sorted = [...locallyFiltered];
    sorted.sort((a, b) => {
      if (sortBy === "price_desc") {
        return safeNumber(b.price) - safeNumber(a.price);
      }
      if (sortBy === "distance_asc") {
        return (
          safeNumber(a.distance_from_university, Number.POSITIVE_INFINITY) -
          safeNumber(b.distance_from_university, Number.POSITIVE_INFINITY)
        );
      }
      if (sortBy === "newest") {
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      }
      return safeNumber(a.price) - safeNumber(b.price);
    });

    return sorted;
  }, [rooms, filters.location, filters.facility, sortBy]);

  const mapPoints = useMemo(() => {
    return displayedRooms
      .map((room) => ({
        latitude: parseCoordinate(room.latitude, "lat"),
        longitude: parseCoordinate(room.longitude, "lng"),
      }))
      .filter((point) => hasValidCoordinatePair(point.latitude, point.longitude))
      .slice(0, 8);
  }, [displayedRooms]);

  const mapCenter = useMemo(() => {
    if (mapPoints.length === 0) {
      return { lat: 9.6848, lng: 80.022 };
    }

    const lat = mapPoints.reduce((sum, point) => sum + point.latitude, 0) / mapPoints.length;
    const lng = mapPoints.reduce((sum, point) => sum + point.longitude, 0) / mapPoints.length;
    return { lat, lng };
  }, [mapPoints]);

  const mapZoom = mapPoints.length > 0 ? 13 : 11;
  const mapEmbedUrl = `https://maps.google.com/maps?q=${mapCenter.lat},${mapCenter.lng}&z=${mapZoom}&output=embed`;

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((current) => ({ ...current, [name]: value }));
  };

  const handleSearch = async (event) => {
    event.preventDefault();
    await fetchRooms(filters);
  };

  const handleClear = async () => {
    const reset = { ...INITIAL_FILTERS };
    setFilters(reset);
    await fetchRooms(reset);
    if (ownerContactFromQuery) {
      navigate("/rooms");
    }
  };

  const clearHostelFilter = async () => {
    const reset = { ...INITIAL_FILTERS };
    setFilters(reset);
    await fetchRooms(reset);
    navigate("/rooms");
  };

  const toggleFavorite = async (roomId) => {
    try {
      await api.post("/rooms/favorite/", { room_id: roomId });
      setRooms((current) =>
        current.map((room) =>
          room.id === roomId ? { ...room, is_favorited: !room.is_favorited } : room
        )
      );
    } catch (favoriteError) {
      console.error("Failed to update favorite:", favoriteError);
    }
  };

  return (
    <div className="rooms-page">
      <div className="rooms-page__container">
        <header className="rooms-page__header">
          <h1>
            <BedDouble size={30} />
            Rooms
          </h1>
          <p>Discover approved listings with real-time room data.</p>
        </header>

        <div className="rooms-shell">
          <main className="rooms-main">
            <section className="rooms-sortbar">
              <label htmlFor="rooms-sort">Sort by:</label>
              <select id="rooms-sort" value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="distance_asc">Distance: Nearest First</option>
                <option value="newest">Newest</option>
              </select>
              {ownerContactFromQuery ? (
                <div className="rooms-sortbar__hostel">
                  <span>{hostelNameFromQuery || "Selected hostel"}</span>
                  <button type="button" className="rooms-btn rooms-btn--outline" onClick={clearHostelFilter}>
                    Show All Hostels
                  </button>
                </div>
              ) : null}
              <span>{displayedRooms.length} rooms</span>
            </section>

            <section className="rooms-filter-card">
              <div className="rooms-filter-card__head">
                <h2>Filter Rooms</h2>
                <button type="button" className="rooms-link-btn" onClick={handleClear}>
                  Stay Filters <ChevronRight size={14} />
                </button>
              </div>

              <div className="rooms-filter-card__content">
                <form className="rooms-filter-form" onSubmit={handleSearch}>
                  <label>
                    <span>Location</span>
                    <input
                      type="text"
                      name="location"
                      value={filters.location}
                      onChange={handleFilterChange}
                      placeholder="University Area"
                    />
                  </label>

                  <label>
                    <span>Budget (Min)</span>
                    <input
                      type="number"
                      name="min_price"
                      value={filters.min_price}
                      onChange={handleFilterChange}
                      placeholder="20000"
                      min="0"
                    />
                  </label>

                  <label>
                    <span>Budget (Max)</span>
                    <input
                      type="number"
                      name="max_price"
                      value={filters.max_price}
                      onChange={handleFilterChange}
                      placeholder="35000"
                      min="0"
                    />
                  </label>

                  <label>
                    <span>Facilities</span>
                    <input
                      type="text"
                      name="facility"
                      value={filters.facility}
                      onChange={handleFilterChange}
                      placeholder="WiFi, Parking, Attached Bath"
                    />
                  </label>

                  <label>
                    <span>Gender</span>
                    <select
                      name="gender_allowed"
                      value={filters.gender_allowed}
                      onChange={handleFilterChange}
                    >
                      <option value="">Any</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                  </label>

                  <label>
                    <span>Distance (km)</span>
                    <input
                      type="number"
                      name="max_distance"
                      value={filters.max_distance}
                      onChange={handleFilterChange}
                      placeholder="5"
                      min="0"
                      step="0.1"
                    />
                  </label>

                  <div className="rooms-filter-form__actions">
                    <button type="submit" className="rooms-btn rooms-btn--primary">
                      <Search size={15} />
                      {searching ? "Searching..." : "Search"}
                    </button>
                    <button type="button" className="rooms-btn rooms-btn--outline" onClick={handleClear}>
                      Clear
                    </button>
                  </div>
                </form>

                <div className="rooms-map">
                  <iframe
                    title="Rooms map preview"
                    src={mapEmbedUrl}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                  <p>{mapPoints.length} mapped points</p>
                </div>
              </div>
            </section>

            <section className="rooms-list-card">
              <div className="rooms-list-card__head">
                <h2>Recommended Rooms</h2>
                <Link to="/rooms" className="rooms-link-btn">
                  View All <ChevronRight size={14} />
                </Link>
              </div>

              {error ? <div className="rooms-feedback rooms-feedback--error">{error}</div> : null}
              {loading ? <div className="rooms-feedback">Loading rooms...</div> : null}

              {!loading && displayedRooms.length === 0 ? (
                <div className="rooms-feedback">No approved rooms found for this filter set.</div>
              ) : (
                <div className="rooms-grid">
                  {displayedRooms.map((room) => {
                    const title = room.hostel_name || room.title || "Hostel";
                    const subtitle =
                      room.hostel_name && room.title
                        ? room.title
                        : room.address || room.hostel_address || "Address unavailable";
                    const facilities = Array.isArray(room.facilities) ? room.facilities.slice(0, 3) : [];
                    const roomImage = room.images?.[0]?.image || room.hostel_image || "";

                    return (
                      <article key={room.id} className="room-card">
                        <div className="room-card__media">
                          {roomImage ? (
                            <img src={roomImage} alt={title} />
                          ) : (
                            <div className="room-card__placeholder">No Image</div>
                          )}

                          <button
                            type="button"
                            className={`room-card__save ${room.is_favorited ? "is-active" : ""}`}
                            onClick={() => toggleFavorite(room.id)}
                            aria-label={room.is_favorited ? "Remove from favorites" : "Save room"}
                          >
                            <Heart size={16} fill={room.is_favorited ? "currentColor" : "none"} />
                          </button>
                        </div>

                        <div className="room-card__body">
                          <h3>{title}</h3>
                          <p className="room-card__price">{formatCurrency(room.price)} / month</p>
                          <p className="room-card__meta">{subtitle}</p>
                          <div className="room-card__tags">
                            {facilities.length > 0 ? (
                              facilities.map((item) => <span key={`${room.id}-${item}`}>{item}</span>)
                            ) : (
                              <span>{room.gender_allowed || "Any"}</span>
                            )}
                          </div>
                          <button
                            type="button"
                            className="rooms-btn rooms-btn--primary"
                            onClick={() => navigate(`/rooms/${room.id}`)}
                          >
                            View Details
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}
