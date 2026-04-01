import { useEffect, useMemo, useRef, useState } from "react";
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
import api from "../services/api";
import { hasGoogleMapsApiKey, isGoogleMapsReady, loadGoogleMaps } from "../utils/googleMapsLoader";
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

const escapeHtml = (value) =>
  String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

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

const DEFAULT_RESTAURANT_MAP_CENTER = { lat: 9.6848, lng: 80.022 };

const RESTAURANT_MARKER_ICON = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
<svg width="38" height="38" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M19 1.6C11.27 1.6 5 7.87 5 15.6c0 9.72 10.59 20.73 13.14 23.22a1.2 1.2 0 0 0 1.72 0C22.41 36.33 33 25.32 33 15.6 33 7.87 26.73 1.6 19 1.6Z" fill="#EF7F1A"/>
  <rect x="11" y="13" width="2.2" height="10.6" rx="1" fill="white"/>
  <rect x="14" y="13" width="2.2" height="6.2" rx="1" fill="white"/>
  <rect x="17" y="13" width="2.2" height="6.2" rx="1" fill="white"/>
  <rect x="21.8" y="13" width="5.2" height="10.6" rx="2.2" fill="white"/>
</svg>
`)}`;

const SELECTED_RESTAURANT_MARKER_ICON = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
<svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M22 2.2C13.08 2.2 5.8 9.48 5.8 18.4c0 10.6 11.55 22.39 14.33 25.04a1.35 1.35 0 0 0 1.87 0C26.65 40.79 38.2 29 38.2 18.4 38.2 9.48 30.92 2.2 22 2.2Z" fill="#D9511E"/>
  <circle cx="22" cy="19" r="6.4" fill="white"/>
</svg>
`)}`;

export default function Restaurants() {
  const navigate = useNavigate();
  const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

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
  const [mapsReady, setMapsReady] = useState(false);
  const [mapError, setMapError] = useState("");
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const mapMarkersRef = useRef([]);
  const infoWindowRef = useRef(null);

  useEffect(() => {
    fetchRestaurants(true);
  }, []);

  useEffect(() => {
    let isMounted = true;

    if (!hasGoogleMapsApiKey(googleMapsApiKey)) {
      setMapsReady(false);
      setMapError("Google Maps API key is missing. Configure VITE_GOOGLE_MAPS_API_KEY.");
      return () => {
        isMounted = false;
      };
    }

    loadGoogleMaps(googleMapsApiKey)
      .then(() => {
        if (!isMounted) return;
        if (!isGoogleMapsReady()) {
          setMapsReady(false);
          setMapError("Google Maps loaded, but map constructors are not ready.");
          return;
        }
        setMapsReady(true);
        setMapError("");
      })
      .catch((loadError) => {
        if (!isMounted) return;
        setMapsReady(false);
        setMapError(loadError.message || "Unable to load Google Maps.");
      });

    return () => {
      isMounted = false;
    };
  }, [googleMapsApiKey]);

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

  const mapPoints = useMemo(() => {
    return filteredRestaurants
      .filter((restaurant) => restaurant.hasCoordinates)
      .map((restaurant) => ({
        id: restaurant.id,
        name: restaurant.name,
        address: restaurant.address,
        latitude: restaurant.latitude,
        longitude: restaurant.longitude,
      }));
  }, [filteredRestaurants]);

  const derivedMapCenter = useMemo(() => {
    if (selectedRestaurant?.hasCoordinates) {
      return {
        lat: selectedRestaurant.latitude,
        lng: selectedRestaurant.longitude,
      };
    }

    if (mapPoints.length > 0) {
      const lat = mapPoints.reduce((sum, point) => sum + point.latitude, 0) / mapPoints.length;
      const lng = mapPoints.reduce((sum, point) => sum + point.longitude, 0) / mapPoints.length;
      return { lat, lng };
    }

    return DEFAULT_RESTAURANT_MAP_CENTER;
  }, [selectedRestaurant?.hasCoordinates, selectedRestaurant?.latitude, selectedRestaurant?.longitude, mapPoints]);

  useEffect(() => {
    if (!mapsReady || !mapContainerRef.current || !isGoogleMapsReady()) {
      return;
    }

    const maps = window.google.maps;
    const defaultZoom = mapPoints.length > 0 ? 13 : 11;

    if (!mapRef.current) {
      mapRef.current = new maps.Map(mapContainerRef.current, {
        center: derivedMapCenter,
        zoom: defaultZoom,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
        gestureHandling: "greedy",
      });
      infoWindowRef.current = new maps.InfoWindow();
    } else {
      mapRef.current.setCenter(derivedMapCenter);
      mapRef.current.setZoom(defaultZoom);
    }

    const map = mapRef.current;
    if (!map) {
      return;
    }

    mapMarkersRef.current.forEach((marker) => marker.setMap(null));
    mapMarkersRef.current = [];

    const bounds = new maps.LatLngBounds();
    let boundedPoints = 0;

    mapPoints.forEach((point) => {
      const isSelected = point.id === selectedRestaurant?.id;
      const marker = new maps.Marker({
        map,
        position: { lat: point.latitude, lng: point.longitude },
        title: point.name || "Restaurant",
        zIndex: isSelected ? 999 : 100,
        icon: {
          url: isSelected ? SELECTED_RESTAURANT_MARKER_ICON : RESTAURANT_MARKER_ICON,
          scaledSize: isSelected ? new maps.Size(44, 44) : new maps.Size(38, 38),
          anchor: isSelected ? new maps.Point(22, 43) : new maps.Point(19, 37),
        },
      });

      marker.addListener("click", () => {
        setSelectedRestaurantId(point.id);
        if (!infoWindowRef.current) return;

        infoWindowRef.current.setContent(`<div style="min-width:170px;padding:4px 2px;">
          <div style="font-weight:700;color:#11274b;font-size:12px;">${escapeHtml(point.name)}</div>
          <div style="color:#5b6b8a;font-size:11px;line-height:1.4;">${escapeHtml(point.address || "Address unavailable")}</div>
        </div>`);
        infoWindowRef.current.open({ map, anchor: marker });
      });

      mapMarkersRef.current.push(marker);
      const markerPosition = marker.getPosition();
      if (markerPosition) {
        bounds.extend(markerPosition);
        boundedPoints += 1;
      }
    });

    if (boundedPoints > 1) {
      map.fitBounds(bounds, 44);
    } else if (boundedPoints === 1) {
      map.setCenter(bounds.getCenter());
      map.setZoom(selectedRestaurant?.hasCoordinates ? 15 : 14);
    } else {
      map.setCenter(DEFAULT_RESTAURANT_MAP_CENTER);
      map.setZoom(11);
    }
  }, [
    mapsReady,
    mapPoints,
    derivedMapCenter.lat,
    derivedMapCenter.lng,
    selectedRestaurant?.id,
    selectedRestaurant?.hasCoordinates,
  ]);

  useEffect(() => {
    return () => {
      mapMarkersRef.current.forEach((marker) => marker.setMap(null));
      mapMarkersRef.current = [];
      if (mapRef.current) {
        if (window.google?.maps?.event) {
          window.google.maps.event.clearInstanceListeners(mapRef.current);
        }
        mapRef.current = null;
      }
      infoWindowRef.current = null;
    };
  }, []);

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
                      className="restaurants-btn restaurants-btn--outline"
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
                  {mapsReady ? (
                    <div ref={mapContainerRef} className="restaurant-map-canvas" />
                  ) : (
                    <div className="restaurant-map-placeholder">{mapError || "Loading map..."}</div>
                  )}
                </div>
                <p className="restaurant-map-note">{mapPoints.length} mapped restaurants</p>
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
                            className="restaurants-btn restaurants-btn--outline"
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
