import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Compass, Heart, MapPin, Phone, RefreshCcw, Search, X } from "lucide-react";
import api from "../services/api";
import "./Favorites.css";

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

const formatCurrency = (value) => {
  const amount = toNumber(value) ?? 0;
  return `LKR ${amount.toLocaleString("en-LK", { maximumFractionDigits: 0 })}`;
};

const formatDate = (value) => {
  if (!value) return "N/A";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "N/A";
  return parsed.toLocaleDateString("en-LK", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const formatDistance = (value) => {
  const amount = toNumber(value);
  if (amount === null) return "Distance unavailable";
  return `${amount.toFixed(2)} km from University`;
};

const normalizeFacilities = (value) => {
  if (Array.isArray(value)) return value.filter(Boolean).map((item) => String(item));
  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
};

const normalizeGender = (value) => {
  const key = String(value || "any").toLowerCase();
  if (key === "male") return "Male";
  if (key === "female") return "Female";
  return "Any";
};

const sortFavorites = (items, sortBy) => {
  const sorted = [...items];

  sorted.sort((a, b) => {
    const aRoom = a.room || {};
    const bRoom = b.room || {};

    if (sortBy === "price_low") {
      return (toNumber(aRoom.price) ?? 0) - (toNumber(bRoom.price) ?? 0);
    }

    if (sortBy === "price_high") {
      return (toNumber(bRoom.price) ?? 0) - (toNumber(aRoom.price) ?? 0);
    }

    if (sortBy === "nearest") {
      return (getRoomDistanceKm(aRoom) ?? Number.MAX_VALUE) - (getRoomDistanceKm(bRoom) ?? Number.MAX_VALUE);
    }

    if (sortBy === "oldest") {
      return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
    }

    return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
  });

  return sorted;
};

export default function Favorites() {
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [removingRoomIds, setRemovingRoomIds] = useState([]);

  const fetchFavorites = async (initialLoad = false) => {
    if (initialLoad) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    try {
      const { data } = await api.get("/rooms/favorites/");
      setFavorites(toArray(data));
      setError("");
    } catch (fetchError) {
      console.error("Error fetching favorites:", fetchError);
      setError("Unable to load your favorites right now. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void fetchFavorites(true);
  }, []);

  const handleRemoveFavorite = async (roomId) => {
    if (!roomId || removingRoomIds.includes(roomId)) return;

    setRemovingRoomIds((current) => [...current, roomId]);
    try {
      await api.post("/rooms/favorite/", { room_id: roomId });
      setFavorites((current) => current.filter((item) => item.room?.id !== roomId));
    } catch (removeError) {
      console.error("Error removing favorite:", removeError);
      setError("Could not remove this room from favorites. Please try again.");
    } finally {
      setRemovingRoomIds((current) => current.filter((id) => id !== roomId));
    }
  };

  const filteredFavorites = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const searched = favorites.filter((favorite) => {
      if (!query) return true;
      const room = favorite.room || {};
      const facilities = normalizeFacilities(room.facilities);
      const searchBody = [
        room.title,
        room.address,
        room.hostel_name,
        room.hostel_address,
        room.owner_contact,
        room.hostel_phone,
        room.description,
        ...facilities,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return searchBody.includes(query);
    });

    return sortFavorites(searched, sortBy);
  }, [favorites, searchQuery, sortBy]);

  const stats = useMemo(() => {
    const prices = favorites.map((item) => toNumber(item.room?.price)).filter((value) => value !== null);
    const distances = favorites.map((item) => getRoomDistanceKm(item.room)).filter((value) => value !== null);

    const total = favorites.length;
    const averagePrice = prices.length ? prices.reduce((sum, value) => sum + value, 0) / prices.length : null;
    const nearestDistance = distances.length ? Math.min(...distances) : null;

    return { total, averagePrice, nearestDistance };
  }, [favorites]);

  return (
    <div className="favorites-page">
      <div className="favorites-shell">
        <header className="favorites-hero">
          <div>
            <h1>Favorite Rooms</h1>
            <p>Shortlist premium stays, compare faster, and contact owners instantly.</p>
          </div>

          <div className="favorites-hero__actions">
            <span className="favorites-count">{stats.total} saved</span>
            <button
              type="button"
              className="favorites-btn favorites-btn--ghost"
              onClick={() => fetchFavorites(false)}
              disabled={refreshing}
            >
              <RefreshCcw size={14} className={refreshing ? "spin" : ""} />
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </header>

        <section className="favorites-stats">
          <article className="favorites-stat-card">
            <p>Saved Rooms</p>
            <strong>{stats.total}</strong>
          </article>
          <article className="favorites-stat-card">
            <p>Average Rent</p>
            <strong>{stats.averagePrice !== null ? formatCurrency(stats.averagePrice) : "N/A"}</strong>
          </article>
          <article className="favorites-stat-card">
            <p>Closest Room</p>
            <strong>{stats.nearestDistance !== null ? `${stats.nearestDistance.toFixed(2)} km` : "N/A"}</strong>
          </article>
        </section>

        <section className="favorites-toolbar">
          <div className="favorites-search">
            <Search size={15} />
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search by room, area, owner, or facilities"
            />
          </div>

          <div className="favorites-sort">
            <label htmlFor="favorites-sort">Sort</label>
            <select id="favorites-sort" value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
              <option value="newest">Newest saved</option>
              <option value="oldest">Oldest saved</option>
              <option value="nearest">Nearest to university</option>
              <option value="price_low">Price: Low to High</option>
              <option value="price_high">Price: High to Low</option>
            </select>
          </div>
        </section>

        {error ? <div className="favorites-feedback favorites-feedback--error">{error}</div> : null}

        {loading ? (
          <section className="favorites-grid">
            {[1, 2, 3].map((item) => (
              <div key={item} className="favorite-skeleton" />
            ))}
          </section>
        ) : filteredFavorites.length === 0 ? (
          <section className="favorites-empty">
            <Heart size={24} />
            <h2>No favorites match your search</h2>
            <p>Try a different keyword, or explore rooms and save your best options here.</p>
            <Link to="/rooms" className="favorites-btn favorites-btn--primary">
              Browse Rooms
            </Link>
          </section>
        ) : (
          <section className="favorites-grid">
            {filteredFavorites.map((favorite, index) => {
              const room = favorite.room || {};
              const image = room.images?.[0]?.image || "";
              const facilities = normalizeFacilities(room.facilities).slice(0, 4);
              const ownerPhone = room.hostel_phone || room.owner_contact || "";
              const roomDistanceKm = getRoomDistanceKm(room);
              const latitude = parseCoordinate(room.latitude, "lat");
              const longitude = parseCoordinate(room.longitude, "lng");
              const hasCoordinates = hasValidCoordinatePair(latitude, longitude);
              const mapLink = hasCoordinates
                ? `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`
                : null;
              const isRemoving = removingRoomIds.includes(room.id);

              return (
                <article
                  key={favorite.id}
                  className="favorite-card"
                  style={{ animationDelay: `${Math.min(index * 45, 260)}ms` }}
                >
                  <div className="favorite-card__media">
                    {image ? (
                      <img src={image} alt={room.title || "Saved room"} />
                    ) : (
                      <div className="favorite-card__media-empty">No image available</div>
                    )}
                    <span className="favorite-card__price">{formatCurrency(room.price)} / month</span>
                    <span className="favorite-card__saved">Saved {formatDate(favorite.created_at)}</span>
                  </div>

                  <div className="favorite-card__body">
                    <div className="favorite-card__header">
                      <div>
                        <h3>{room.title || "Room"}</h3>
                        <p className="favorite-card__address">
                          <MapPin size={14} />
                          {room.address || room.hostel_address || "Address unavailable"}
                        </p>
                      </div>
                      <span className="favorite-card__gender">{normalizeGender(room.gender_allowed)}</span>
                    </div>

                    <div className="favorite-card__details">
                      <span>
                        <Compass size={13} />
                        {formatDistance(roomDistanceKm)}
                      </span>
                      <span>
                        <Phone size={13} />
                        {ownerPhone || "Owner phone unavailable"}
                      </span>
                    </div>

                    {facilities.length ? (
                      <div className="favorite-card__chips">
                        {facilities.map((facility) => (
                          <span key={`${favorite.id}-${facility}`}>{facility}</span>
                        ))}
                      </div>
                    ) : null}

                    <div className="favorite-card__actions">
                      <button
                        type="button"
                        className="favorites-btn favorites-btn--soft"
                        onClick={() => navigate(`/rooms/${room.id}`)}
                      >
                        View Details
                      </button>

                      {ownerPhone ? (
                        <a className="favorites-btn favorites-btn--soft" href={`tel:${ownerPhone}`}>
                          Call Owner
                        </a>
                      ) : null}

                      {mapLink ? (
                        <a className="favorites-btn favorites-btn--soft" href={mapLink} target="_blank" rel="noreferrer">
                          Open Map
                        </a>
                      ) : null}

                      <button
                        type="button"
                        className="favorites-btn favorites-btn--danger"
                        onClick={() => handleRemoveFavorite(room.id)}
                        disabled={isRemoving}
                      >
                        <X size={14} />
                        {isRemoving ? "Removing..." : "Remove"}
                      </button>
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
