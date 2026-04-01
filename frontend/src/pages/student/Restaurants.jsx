import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  MapPin,
  Phone,
  Mail,
  Search,
  RefreshCcw,
  LocateFixed,
  UtensilsCrossed,
  ChevronRight,
} from "lucide-react";
import api from "../../services/api";
import "./Restaurants.css";

const toArray = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
};

const safeNumber = (value) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
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

const formatCurrency = (value) => {
  const numeric = Number(value);
  const safe = Number.isFinite(numeric) ? numeric : 0;
  return `LKR ${safe.toLocaleString("en-LK")}`;
};

const haversineDistanceKm = (origin, destination) => {
  const R = 6371;
  const dLat = ((destination.lat - origin.lat) * Math.PI) / 180;
  const dLng = ((destination.lng - origin.lng) * Math.PI) / 180;
  const lat1 = (origin.lat * Math.PI) / 180;
  const lat2 = (destination.lat * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export default function Restaurants() {
  const navigate = useNavigate();

  const [restaurants, setRestaurants] = useState([]);
  const [menuMeta, setMenuMeta] = useState({});
  const [selectedRestaurantId, setSelectedRestaurantId] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [locationFilter, setLocationFilter] = useState("all");
  const [menuFilter, setMenuFilter] = useState("all");
  const [sortBy, setSortBy] = useState("recommended");

  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState("");
  const [locating, setLocating] = useState(false);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchRestaurants(true);
  }, []);

  const fetchRestaurants = async (initialLoad = false) => {
    if (initialLoad) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    try {
      const { data } = await api.get("/restaurants/");
      const rows = toArray(data);
      setRestaurants(rows);
      setError("");

      if (rows.length > 0) {
        setSelectedRestaurantId((current) => current || rows[0].id);
      } else {
        setSelectedRestaurantId(null);
      }

      const metaEntries = await Promise.all(
        rows.map(async (restaurant) => {
          try {
            const menuRes = await api.get(`/restaurants/${restaurant.id}/menu/`);
            const items = toArray(menuRes.data);
            const prices = items.map((item) => safeNumber(item.price)).filter((price) => price !== null);
            return [
              restaurant.id,
              {
                count: items.length,
                minPrice: prices.length > 0 ? Math.min(...prices) : null,
                maxPrice: prices.length > 0 ? Math.max(...prices) : null,
              },
            ];
          } catch {
            return [restaurant.id, { count: 0, minPrice: null, maxPrice: null }];
          }
        })
      );

      setMenuMeta(Object.fromEntries(metaEntries));
    } catch (fetchError) {
      console.error("Error fetching restaurants:", fetchError);
      setRestaurants([]);
      setMenuMeta({});
      setError("Unable to load restaurants right now. Please refresh.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const locationOptions = useMemo(() => {
    const addresses = restaurants
      .map((item) => String(item.address || "").trim())
      .filter(Boolean);
    return Array.from(new Set(addresses));
  }, [restaurants]);

  const restaurantsWithComputed = useMemo(() => {
    return restaurants.map((restaurant) => {
      const latitude = parseCoordinate(restaurant.latitude, "lat");
      const longitude = parseCoordinate(restaurant.longitude, "lng");
      const hasCoordinates = hasValidCoordinatePair(latitude, longitude);

      let distanceKm = null;
      if (currentLocation && hasCoordinates) {
        distanceKm = haversineDistanceKm(currentLocation, { lat: latitude, lng: longitude });
      }

      return {
        ...restaurant,
        latitude,
        longitude,
        hasCoordinates,
        distanceKm,
        menu: menuMeta[restaurant.id] || { count: 0, minPrice: null, maxPrice: null },
      };
    });
  }, [restaurants, menuMeta, currentLocation]);

  const filteredRestaurants = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    const filtered = restaurantsWithComputed.filter((restaurant) => {
      const matchesLocation = locationFilter === "all" || restaurant.address === locationFilter;

      const hasMenu = (restaurant.menu?.count || 0) > 0;
      const matchesMenu =
        menuFilter === "all" ||
        (menuFilter === "with_menu" && hasMenu) ||
        (menuFilter === "without_menu" && !hasMenu);

      if (!matchesLocation || !matchesMenu) return false;

      if (!query) return true;
      const haystack = [restaurant.name, restaurant.address, restaurant.phone, restaurant.email]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });

    const sorted = [...filtered];
    sorted.sort((a, b) => {
      if (sortBy === "name") {
        return String(a.name || "").localeCompare(String(b.name || ""));
      }

      if (sortBy === "price_low") {
        const aPrice = a.menu?.minPrice ?? Number.POSITIVE_INFINITY;
        const bPrice = b.menu?.minPrice ?? Number.POSITIVE_INFINITY;
        return aPrice - bPrice;
      }

      if (sortBy === "price_high") {
        const aPrice = a.menu?.minPrice ?? Number.NEGATIVE_INFINITY;
        const bPrice = b.menu?.minPrice ?? Number.NEGATIVE_INFINITY;
        return bPrice - aPrice;
      }

      if (sortBy === "distance") {
        const aDistance = a.distanceKm ?? Number.POSITIVE_INFINITY;
        const bDistance = b.distanceKm ?? Number.POSITIVE_INFINITY;
        return aDistance - bDistance;
      }

      if (sortBy === "newest") {
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      }

      const aScore = (a.menu?.count || 0) + (a.hasCoordinates ? 1 : 0);
      const bScore = (b.menu?.count || 0) + (b.hasCoordinates ? 1 : 0);
      return bScore - aScore;
    });

    return sorted;
  }, [restaurantsWithComputed, searchQuery, locationFilter, menuFilter, sortBy]);

  useEffect(() => {
    if (filteredRestaurants.length === 0) {
      setSelectedRestaurantId(null);
      return;
    }

    const exists = filteredRestaurants.some((item) => item.id === selectedRestaurantId);
    if (!exists) {
      setSelectedRestaurantId(filteredRestaurants[0].id);
    }
  }, [filteredRestaurants, selectedRestaurantId]);

  const selectedRestaurant = useMemo(() => {
    if (filteredRestaurants.length === 0) return null;
    return filteredRestaurants.find((item) => item.id === selectedRestaurantId) || filteredRestaurants[0];
  }, [filteredRestaurants, selectedRestaurantId]);

  const mapEmbedUrl = useMemo(() => {
    if (!selectedRestaurant) {
      return "https://maps.google.com/maps?q=Jaffna%2C%20Sri%20Lanka&z=11&output=embed";
    }

    const query = selectedRestaurant.hasCoordinates
      ? `${selectedRestaurant.latitude},${selectedRestaurant.longitude}`
      : selectedRestaurant.address || selectedRestaurant.name || "Jaffna, Sri Lanka";

    const zoom = selectedRestaurant.hasCoordinates ? 14 : 11;
    return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&z=${zoom}&output=embed`;
  }, [selectedRestaurant]);

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus("Geolocation is not supported in this browser.");
      return;
    }

    setLocating(true);
    setLocationStatus("Requesting location permission...");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCurrentLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setSortBy("distance");
        setLocationStatus("Current location applied. Sorted by nearest.");
        setLocating(false);
      },
      (geoError) => {
        if (geoError.code === 1) {
          setLocationStatus("Location permission denied.");
        } else if (geoError.code === 2) {
          setLocationStatus("Location unavailable. Try again.");
        } else if (geoError.code === 3) {
          setLocationStatus("Location request timed out.");
        } else {
          setLocationStatus("Failed to fetch current location.");
        }
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  };

  return (
    <div className="restaurants-page">
      <div className="restaurants-page__container">
        <header className="restaurants-hero">
          <div>
            <h1>
              <UtensilsCrossed size={30} /> Restaurants
            </h1>
            <p>Discover approved restaurants, compare menus, and order faster.</p>
          </div>
          <button
            type="button"
            className="restaurants-btn restaurants-btn--outline"
            onClick={() => fetchRestaurants(false)}
            disabled={refreshing}
          >
            <RefreshCcw size={15} className={refreshing ? "spin" : ""} />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </header>

        <section className="restaurants-toolbar">
          <div className="restaurants-toolbar__filters">
            <select value={locationFilter} onChange={(event) => setLocationFilter(event.target.value)}>
              <option value="all">All Locations</option>
              {locationOptions.map((address) => (
                <option key={address} value={address}>
                  {address}
                </option>
              ))}
            </select>

            <select value={menuFilter} onChange={(event) => setMenuFilter(event.target.value)}>
              <option value="all">All Menus</option>
              <option value="with_menu">With Menu Items</option>
              <option value="without_menu">Without Menu Yet</option>
            </select>

            <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
              <option value="recommended">Recommended</option>
              <option value="newest">Newest</option>
              <option value="name">Name A-Z</option>
              <option value="price_low">Price Low-High</option>
              <option value="price_high">Price High-Low</option>
              <option value="distance">Nearest First</option>
            </select>
          </div>

          <div className="restaurants-toolbar__search">
            <Search size={16} />
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search by name, location, phone"
            />
            <button type="button" className="restaurants-btn restaurants-btn--primary">
              Search
            </button>
          </div>
        </section>

        <section className="restaurants-location-bar">
          <button
            type="button"
            className="restaurants-btn restaurants-btn--outline"
            onClick={handleUseCurrentLocation}
            disabled={locating}
          >
            <LocateFixed size={15} />
            {locating ? "Locating..." : "Use Current Location"}
          </button>
          {locationStatus ? <p>{locationStatus}</p> : null}
        </section>

        {error ? <div className="restaurants-feedback restaurants-feedback--error">{error}</div> : null}

        {loading ? (
          <div className="restaurants-feedback">Loading restaurants...</div>
        ) : filteredRestaurants.length === 0 ? (
          <div className="restaurants-feedback">No restaurants found for the selected filters.</div>
        ) : (
          <>
            <section className="restaurants-featured-grid">
              <article className="restaurant-feature-card">
                <div className="restaurant-feature-card__media">
                  {selectedRestaurant?.image ? (
                    <img src={selectedRestaurant.image} alt={selectedRestaurant.name} />
                  ) : (
                    <div className="restaurant-feature-card__empty">No Restaurant Image</div>
                  )}
                </div>

                <div className="restaurant-feature-card__body">
                  <h2>{selectedRestaurant?.name}</h2>
                  <p className="restaurant-feature-card__price">
                    {selectedRestaurant?.menu?.minPrice !== null
                      ? `${formatCurrency(selectedRestaurant.menu.minPrice)} starting`
                      : "Menu price not available yet"}
                  </p>
                  <p className="restaurant-feature-card__meta">
                    <MapPin size={14} /> {selectedRestaurant?.address || "Address unavailable"}
                  </p>

                  <div className="restaurant-feature-card__chips">
                    <span>{selectedRestaurant?.menu?.count || 0} menu items</span>
                    {selectedRestaurant?.distanceKm !== null ? (
                      <span>{selectedRestaurant.distanceKm.toFixed(1)} km away</span>
                    ) : null}
                  </div>

                  <div className="restaurant-feature-card__actions">
                    <button
                      type="button"
                      className="restaurants-btn restaurants-btn--primary"
                      onClick={() => navigate(`/restaurants/${selectedRestaurant?.id}`)}
                    >
                      View Menu
                    </button>

                    {selectedRestaurant?.phone ? (
                      <a className="restaurants-btn restaurants-btn--outline" href={`tel:${selectedRestaurant.phone}`}>
                        Call
                      </a>
                    ) : null}
                  </div>
                </div>
              </article>

              <article className="restaurant-map-card">
                <div className="restaurant-map-card__head">
                  <h3>Map Preview</h3>
                  {selectedRestaurant ? (
                    <button
                      type="button"
                      className="restaurants-link-btn"
                      onClick={() => setLocationFilter(selectedRestaurant.address || "all")}
                    >
                      Focus Location <ChevronRight size={14} />
                    </button>
                  ) : null}
                </div>
                <div className="restaurant-map-wrap">
                  <iframe
                    title="Restaurant map preview"
                    src={mapEmbedUrl}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              </article>
            </section>

            <section className="restaurants-grid-card">
              <div className="restaurants-grid-card__head">
                <h3>Popular Restaurants</h3>
                <span>{filteredRestaurants.length} results</span>
              </div>

              <div className="restaurants-grid">
                {filteredRestaurants.map((restaurant) => {
                  const isSelected = restaurant.id === selectedRestaurant?.id;

                  return (
                    <article
                      key={restaurant.id}
                      className={`restaurant-card ${isSelected ? "is-selected" : ""}`}
                      onMouseEnter={() => setSelectedRestaurantId(restaurant.id)}
                    >
                      <div className="restaurant-card__media">
                        {restaurant.image ? (
                          <img src={restaurant.image} alt={restaurant.name} />
                        ) : (
                          <div className="restaurant-card__empty">No Restaurant Image</div>
                        )}
                      </div>

                      <div className="restaurant-card__body">
                        <h4>{restaurant.name}</h4>
                        <p className="restaurant-card__price">
                          {restaurant.menu.minPrice !== null
                            ? `${formatCurrency(restaurant.menu.minPrice)} starting`
                            : "Menu price not available"}
                        </p>
                        <p className="restaurant-card__meta">{restaurant.address || "Address unavailable"}</p>

                        <div className="restaurant-card__contact">
                          <span>
                            <Phone size={13} /> {restaurant.phone || "No phone"}
                          </span>
                          <span>
                            <Mail size={13} /> {restaurant.email || "No email"}
                          </span>
                        </div>

                        <div className="restaurant-card__chips">
                          <span>{restaurant.menu.count} items</span>
                          {restaurant.distanceKm !== null ? (
                            <span>{restaurant.distanceKm.toFixed(1)} km</span>
                          ) : null}
                        </div>

                        <div className="restaurant-card__actions">
                          <button
                            type="button"
                            className="restaurants-btn restaurants-btn--primary"
                            onClick={() => navigate(`/restaurants/${restaurant.id}`)}
                          >
                            View Menu
                          </button>
                          <button
                            type="button"
                            className="restaurants-btn restaurants-btn--outline"
                            onClick={() => setSelectedRestaurantId(restaurant.id)}
                          >
                            Preview Map
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
