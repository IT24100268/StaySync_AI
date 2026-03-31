import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Bell, MapPin, Search, SlidersHorizontal, Sparkles, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { hasGoogleMapsApiKey, isGoogleMapsReady, loadGoogleMaps } from "../utils/googleMapsLoader";
import "./Dashboard.css";

const INITIAL_FILTERS = {
  location: "",
  minBudget: "",
  maxBudget: "",
  gender: "",
  facility: "",
};

const BUDGET_PRESETS = [
  { id: "under-25k", label: "Under 25K", minBudget: "", maxBudget: "25000" },
  { id: "25k-40k", label: "25K - 40K", minBudget: "25000", maxBudget: "40000" },
  { id: "40k-plus", label: "40K+", minBudget: "40000", maxBudget: "" },
];

const GENDER_PRESETS = [
  { id: "male", label: "Male", value: "male" },
  { id: "female", label: "Female", value: "female" },
  { id: "any", label: "Any", value: "any" },
];

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

const normalizeBudgetInput = (value) => {
  return String(value ?? "")
    .replace(/[^\d]/g, "")
    .replace(/^0+(?=\d)/, "");
};

const parseBudgetValue = (value) => {
  if (value === "" || value === null || value === undefined) return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return parsed;
};

const splitFacilityTokens = (value) => {
  return String(value || "")
    .split(",")
    .map((token) => token.trim().toLowerCase())
    .filter(Boolean);
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

const DEFAULT_STUDENT_MAP_CENTER = { lat: 9.6848, lng: 80.022 };

const escapeHtml = (value) =>
  String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const ROOM_MARKER_ICON = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
<svg width="38" height="38" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M19 1.6C11.27 1.6 5 7.87 5 15.6c0 9.72 10.59 20.73 13.14 23.22a1.2 1.2 0 0 0 1.72 0C22.41 36.33 33 25.32 33 15.6 33 7.87 26.73 1.6 19 1.6Z" fill="#1F4F96"/>
  <rect x="10.8" y="13.2" width="16.4" height="6.1" rx="2" fill="white"/>
  <rect x="10.8" y="19.4" width="16.4" height="4.2" rx="1.4" fill="white"/>
  <rect x="13.4" y="14.6" width="4.8" height="3.1" rx="0.8" fill="#1F4F96"/>
</svg>
`)}`;

const RESTAURANT_MARKER_ICON = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
<svg width="38" height="38" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M19 1.6C11.27 1.6 5 7.87 5 15.6c0 9.72 10.59 20.73 13.14 23.22a1.2 1.2 0 0 0 1.72 0C22.41 36.33 33 25.32 33 15.6 33 7.87 26.73 1.6 19 1.6Z" fill="#EF7F1A"/>
  <rect x="11" y="13" width="2.2" height="10.6" rx="1" fill="white"/>
  <rect x="14" y="13" width="2.2" height="6.2" rx="1" fill="white"/>
  <rect x="17" y="13" width="2.2" height="6.2" rx="1" fill="white"/>
  <rect x="21.8" y="13" width="5.2" height="10.6" rx="2.2" fill="white"/>
</svg>
`)}`;

const USER_PIN_MARKER_ICON = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
<svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M18 1.8C10.38 1.8 4.2 7.98 4.2 15.6c0 9.14 9.87 19.54 12.24 21.87a1.05 1.05 0 0 0 1.48 0C20.33 35.14 30.2 24.74 30.2 15.6 30.2 7.98 24.02 1.8 18 1.8Z" fill="#EA4335"/>
  <circle cx="18" cy="15.8" r="5.3" fill="white"/>
</svg>
`)}`;

const Dashboard = () => {
  const { user, updateUser } = useAuth();
  const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [quickSearch, setQuickSearch] = useState("");
  const [rooms, setRooms] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [orders, setOrders] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [filterError, setFilterError] = useState("");
  const [error, setError] = useState("");
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState("");
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationSaving, setLocationSaving] = useState(false);
  const [mapsReady, setMapsReady] = useState(false);
  const [mapError, setMapError] = useState("");
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const mapMarkersRef = useRef([]);
  const userMarkerRef = useRef(null);
  const userMarkerDragListenerRef = useRef(null);
  const mapClickListenerRef = useRef(null);
  const infoWindowRef = useRef(null);
  const saveLocationRequestRef = useRef(0);

  const applyLocalRoomFilters = (roomList, nextFilters) => {
    const locationNeedle = String(nextFilters.location || "").trim().toLowerCase();
    const facilityTokens = splitFacilityTokens(nextFilters.facility);
    const minBudget = parseBudgetValue(nextFilters.minBudget);
    const maxBudget = parseBudgetValue(nextFilters.maxBudget);
    const requestedGender = String(nextFilters.gender || "").toLowerCase();

    return roomList.filter((room) => {
      const locationText = [room.title, room.address, room.description, room.hostel_name, room.hostel_address]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const facilities = Array.isArray(room.facilities) ? room.facilities : [];
      const facilitiesText = facilities
        .map((facility) => {
          if (typeof facility === "string") return facility;
          if (facility && typeof facility === "object") return facility.name || facility.title || "";
          return "";
        })
        .join(" ")
        .toLowerCase();
      const roomPrice = Number(room.price);
      const roomGender = String(
        room.gender_allowed || room.gender || room.allowed_gender || room?.hostel?.gender_allowed || ""
      )
        .trim()
        .toLowerCase();

      const locationMatch = !locationNeedle || locationText.includes(locationNeedle);
      const facilityMatch =
        facilityTokens.length === 0 ||
        facilityTokens.every((token) => facilitiesText.includes(token) || locationText.includes(token));
      const minBudgetMatch = minBudget === null || (Number.isFinite(roomPrice) && roomPrice >= minBudget);
      const maxBudgetMatch = maxBudget === null || (Number.isFinite(roomPrice) && roomPrice <= maxBudget);
      const genderMatch =
        !requestedGender ||
        requestedGender === "any" ||
        !roomGender ||
        roomGender === requestedGender ||
        roomGender === "any" ||
        roomGender === "all" ||
        roomGender === "both";

      return locationMatch && facilityMatch && minBudgetMatch && maxBudgetMatch && genderMatch;
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

  const savedStudentLocation = useMemo(() => {
    const latitude = parseCoordinate(user?.profile?.latitude, "lat");
    const longitude = parseCoordinate(user?.profile?.longitude, "lng");
    if (!hasValidCoordinatePair(latitude, longitude)) {
      return null;
    }
    return { lat: latitude, lng: longitude };
  }, [user?.profile?.latitude, user?.profile?.longitude]);

  useEffect(() => {
    setCurrentLocation(savedStudentLocation);
  }, [savedStudentLocation?.lat, savedStudentLocation?.lng]);

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
      .slice(0, 2);
  }, [rooms]);
  const popularRestaurants = useMemo(() => restaurants.slice(0, 4), [restaurants]);
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

    return DEFAULT_STUDENT_MAP_CENTER;
  }, [currentLocation, mapLocations]);

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

  const locationSuggestions = useMemo(() => {
    const suggestions = [];
    const seen = new Set();
    const sources = rooms.flatMap((room) => [room.address, room.hostel_address, room.hostel_name, room.title]);

    sources.forEach((entry) => {
      const candidate = String(entry || "")
        .split(",")[0]
        .trim();
      if (!candidate) return;

      const key = candidate.toLowerCase();
      if (seen.has(key)) return;

      seen.add(key);
      suggestions.push(candidate);
    });

    return suggestions.slice(0, 8);
  }, [rooms]);

  const facilitySuggestions = useMemo(() => {
    const suggestions = [];
    const seen = new Set();

    rooms.forEach((room) => {
      const facilities = Array.isArray(room.facilities) ? room.facilities : [];
      facilities.forEach((facility) => {
        const candidate = toTitleCase(
          typeof facility === "string" ? facility : facility?.name || facility?.title || ""
        );
        if (!candidate) return;
        const key = candidate.toLowerCase();
        if (seen.has(key)) return;
        seen.add(key);
        suggestions.push(candidate);
      });
    });

    return suggestions.slice(0, 12);
  }, [rooms]);

  const validateBudgetRange = useCallback((nextFilters) => {
    const minBudget = parseBudgetValue(nextFilters.minBudget);
    const maxBudget = parseBudgetValue(nextFilters.maxBudget);
    if (minBudget !== null && maxBudget !== null && minBudget > maxBudget) {
      return "Minimum budget cannot be greater than maximum budget.";
    }
    return "";
  }, []);

  const activeQuickFilters = useMemo(() => {
    const list = [];

    if (filters.location.trim()) {
      list.push({
        key: "location",
        label: `Location: ${toTitleCase(filters.location.trim())}`,
      });
    }
    if (filters.gender) {
      list.push({
        key: "gender",
        label: `Gender: ${toTitleCase(filters.gender)}`,
      });
    }
    if (filters.minBudget) {
      list.push({
        key: "minBudget",
        label: `Min: ${formatCurrency(filters.minBudget)}`,
      });
    }
    if (filters.maxBudget) {
      list.push({
        key: "maxBudget",
        label: `Max: ${formatCurrency(filters.maxBudget)}`,
      });
    }

    splitFacilityTokens(filters.facility).forEach((token) => {
      list.push({
        key: `facility:${token}`,
        label: `Facility: ${toTitleCase(token)}`,
      });
    });

    return list;
  }, [filters.location, filters.gender, filters.minBudget, filters.maxBudget, filters.facility]);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    const nextValue = name === "minBudget" || name === "maxBudget" ? normalizeBudgetInput(value) : value;

    setFilters((previous) => {
      const nextFilters = { ...previous, [name]: nextValue };
      setFilterError(validateBudgetRange(nextFilters));
      return nextFilters;
    });
  };

  const handleSearch = async (event) => {
    event.preventDefault();
    const budgetError = validateBudgetRange(filters);
    if (budgetError) {
      setFilterError(budgetError);
      return;
    }
    setFilterError("");
    await fetchRooms(filters);
  };

  const handleClearFilters = async () => {
    const reset = { ...INITIAL_FILTERS };
    setFilters(reset);
    setQuickSearch("");
    setFilterError("");
    await fetchRooms(reset);
  };

  const handleQuickSearchSubmit = async (event) => {
    event.preventDefault();
    const nextFilters = {
      ...filters,
      location: quickSearch.trim(),
    };
    setFilters(nextFilters);
    const budgetError = validateBudgetRange(nextFilters);
    setFilterError(budgetError);
    if (budgetError) return;
    await fetchRooms(nextFilters);
  };

  const handleBudgetPresetSelect = async (preset) => {
    const nextFilters = {
      ...filters,
      minBudget: preset.minBudget,
      maxBudget: preset.maxBudget,
    };
    setFilters(nextFilters);
    const budgetError = validateBudgetRange(nextFilters);
    setFilterError(budgetError);
    if (budgetError) return;
    await fetchRooms(nextFilters);
  };

  const handleGenderPresetSelect = async (gender) => {
    const nextFilters = {
      ...filters,
      gender,
    };
    setFilters(nextFilters);
    const budgetError = validateBudgetRange(nextFilters);
    setFilterError(budgetError);
    if (budgetError) return;
    await fetchRooms(nextFilters);
  };

  const handleRemoveQuickFilter = async (filterKey) => {
    const nextFilters = { ...filters };

    if (filterKey === "location") {
      nextFilters.location = "";
    } else if (filterKey === "gender") {
      nextFilters.gender = "";
    } else if (filterKey === "minBudget") {
      nextFilters.minBudget = "";
    } else if (filterKey === "maxBudget") {
      nextFilters.maxBudget = "";
    } else if (filterKey.startsWith("facility:")) {
      const tokenToRemove = filterKey.replace("facility:", "");
      const remainingTokens = splitFacilityTokens(nextFilters.facility).filter((token) => token !== tokenToRemove);
      nextFilters.facility = remainingTokens.join(", ");
    }

    setFilters(nextFilters);
    const budgetError = validateBudgetRange(nextFilters);
    setFilterError(budgetError);
    if (budgetError) return;
    await fetchRooms(nextFilters);
  };

  const applyLocationSelection = useCallback(async (latitude, longitude, source = "pin") => {
    const nextLocation = {
      lat: Number(Number(latitude).toFixed(6)),
      lng: Number(Number(longitude).toFixed(6)),
    };

    if (!hasValidCoordinatePair(nextLocation.lat, nextLocation.lng)) {
      setLocationStatus("Selected location is invalid. Please try again.");
      return;
    }

    setCurrentLocation(nextLocation);
    setLocationStatus(source === "current" ? "Current location selected. Saving..." : "Pin dropped. Saving location...");
    const requestId = saveLocationRequestRef.current + 1;
    saveLocationRequestRef.current = requestId;
    setLocationSaving(true);

    try {
      const { data } = await api.patch("/auth/profile/", {
        profile: {
          latitude: nextLocation.lat,
          longitude: nextLocation.lng,
        },
      });

      if (requestId !== saveLocationRequestRef.current) {
        return;
      }

      updateUser?.(data);
      setLocationStatus(source === "current" ? "Current location saved." : "Pinned location saved.");
    } catch (saveError) {
      if (requestId !== saveLocationRequestRef.current) {
        return;
      }
      console.error("Failed to save student location:", saveError);
      setLocationStatus("Location updated on map, but saving failed. Please try again.");
    } finally {
      if (requestId === saveLocationRequestRef.current) {
        setLocationSaving(false);
      }
    }
  }, [updateUser]);

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus("Geolocation is not supported in this browser.");
      return;
    }

    setLocationLoading(true);
    setLocationStatus("Requesting location permission...");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        await applyLocationSelection(position.coords.latitude, position.coords.longitude, "current");
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

  useEffect(() => {
    if (!mapsReady || !mapContainerRef.current || !isGoogleMapsReady()) {
      return;
    }

    const maps = window.google.maps;
    const defaultZoom = mapLocations.length > 0 || currentLocation ? 13 : 11;

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

    if (mapClickListenerRef.current) {
      maps.event.removeListener(mapClickListenerRef.current);
      mapClickListenerRef.current = null;
    }
    mapClickListenerRef.current = map.addListener("click", (event) => {
      if (!event?.latLng) return;
      void applyLocationSelection(event.latLng.lat(), event.latLng.lng(), "pin");
    });

    mapMarkersRef.current.forEach((marker) => marker.setMap(null));
    mapMarkersRef.current = [];

    const bounds = new maps.LatLngBounds();
    let boundedPoints = 0;

    mapLocations.forEach((point) => {
      const marker = new maps.Marker({
        map,
        position: { lat: point.latitude, lng: point.longitude },
        title: point.label || toTitleCase(point.type),
        icon: {
          url: point.type === "restaurant" ? RESTAURANT_MARKER_ICON : ROOM_MARKER_ICON,
          scaledSize: new maps.Size(38, 38),
          anchor: new maps.Point(19, 38),
        },
      });

      marker.addListener("click", () => {
        if (!infoWindowRef.current) return;
        infoWindowRef.current.setContent(`<div style="min-width:140px;padding:4px 2px;">
          <div style="font-weight:700;color:#0f2e5f;font-size:12px;">${escapeHtml(point.label)}</div>
          <div style="color:#5b6b8a;font-size:11px;text-transform:capitalize;">${escapeHtml(point.type)}</div>
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

    if (userMarkerDragListenerRef.current) {
      maps.event.removeListener(userMarkerDragListenerRef.current);
      userMarkerDragListenerRef.current = null;
    }
    if (userMarkerRef.current) {
      userMarkerRef.current.setMap(null);
      userMarkerRef.current = null;
    }

    if (currentLocation && hasValidCoordinatePair(currentLocation.lat, currentLocation.lng)) {
      userMarkerRef.current = new maps.Marker({
        map,
        position: { lat: currentLocation.lat, lng: currentLocation.lng },
        title: "Your pinned location",
        draggable: true,
        zIndex: 999,
        icon: {
          url: USER_PIN_MARKER_ICON,
          scaledSize: new maps.Size(36, 36),
          anchor: new maps.Point(18, 35),
        },
      });

      userMarkerRef.current.addListener("click", () => {
        if (!infoWindowRef.current || !userMarkerRef.current) return;
        infoWindowRef.current.setContent(`<div style="min-width:140px;padding:4px 2px;">
          <div style="font-weight:700;color:#0f2e5f;font-size:12px;">Your pinned location</div>
          <div style="color:#5b6b8a;font-size:11px;">${currentLocation.lat.toFixed(6)}, ${currentLocation.lng.toFixed(6)}</div>
        </div>`);
        infoWindowRef.current.open({ map, anchor: userMarkerRef.current });
      });

      userMarkerDragListenerRef.current = userMarkerRef.current.addListener("dragend", (event) => {
        if (!event?.latLng) return;
        void applyLocationSelection(event.latLng.lat(), event.latLng.lng(), "pin");
      });

      const userMarkerPosition = userMarkerRef.current.getPosition();
      if (userMarkerPosition) {
        bounds.extend(userMarkerPosition);
        boundedPoints += 1;
      }
    }

    if (boundedPoints > 1) {
      map.fitBounds(bounds, 44);
    } else if (boundedPoints === 1) {
      map.setCenter(bounds.getCenter());
      map.setZoom(currentLocation ? 15 : 14);
    } else {
      map.setCenter(DEFAULT_STUDENT_MAP_CENTER);
      map.setZoom(11);
    }

    return () => {
      if (mapClickListenerRef.current) {
        maps.event.removeListener(mapClickListenerRef.current);
        mapClickListenerRef.current = null;
      }
    };
  }, [
    mapsReady,
    mapLocations,
    currentLocation?.lat,
    currentLocation?.lng,
    derivedMapCenter.lat,
    derivedMapCenter.lng,
    applyLocationSelection,
  ]);

  useEffect(() => {
    return () => {
      if (window.google?.maps?.event && mapClickListenerRef.current) {
        window.google.maps.event.removeListener(mapClickListenerRef.current);
        mapClickListenerRef.current = null;
      }
      mapMarkersRef.current.forEach((marker) => marker.setMap(null));
      mapMarkersRef.current = [];
      if (window.google?.maps?.event && userMarkerDragListenerRef.current) {
        window.google.maps.event.removeListener(userMarkerDragListenerRef.current);
        userMarkerDragListenerRef.current = null;
      }
      if (userMarkerRef.current) {
        userMarkerRef.current.setMap(null);
        userMarkerRef.current = null;
      }
      if (mapRef.current) {
        if (window.google?.maps?.event) {
          window.google.maps.event.clearInstanceListeners(mapRef.current);
        }
        mapRef.current = null;
      }
      infoWindowRef.current = null;
    };
  }, []);

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
            <button type="button" className="dashboard-toolbar__notify">
              <Bell size={17} />
              {activeOrderCount > 0 ? <span>{activeOrderCount}</span> : null}
            </button>
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
                <h2>
                  <SlidersHorizontal size={18} /> Search Rooms
                </h2>
                <p>Refine your room discovery with precise filters.</p>
              </div>
              <div className="dashboard-filter-meta">
                <span>{rooms.length} rooms</span>
                <span>{activeQuickFilters.length} active</span>
              </div>
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
                  list="dashboard-location-suggestions"
                />
                {locationSuggestions.length > 0 ? (
                  <datalist id="dashboard-location-suggestions">
                    {locationSuggestions.map((suggestion) => (
                      <option key={suggestion} value={suggestion} />
                    ))}
                  </datalist>
                ) : null}
              </label>

              <label className="dashboard-field">
                <span>Gender</span>
                <select name="gender" value={filters.gender} onChange={handleFilterChange}>
                  <option value="">Select Gender</option>
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
                  inputMode="numeric"
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
                  inputMode="numeric"
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
                  list="dashboard-facility-suggestions"
                />
                {facilitySuggestions.length > 0 ? (
                  <datalist id="dashboard-facility-suggestions">
                    {facilitySuggestions.map((facility) => (
                      <option key={facility} value={facility} />
                    ))}
                  </datalist>
                ) : null}
              </label>

              <div className="dashboard-filter-presets dashboard-field--wide">
                <p className="dashboard-filter-presets__label">
                  <Sparkles size={14} /> Smart Presets
                </p>

                <div className="dashboard-preset-row">
                  {BUDGET_PRESETS.map((preset) => {
                    const isActive = filters.minBudget === preset.minBudget && filters.maxBudget === preset.maxBudget;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        className={`dashboard-preset-chip ${isActive ? "is-active" : ""}`}
                        onClick={() => {
                          void handleBudgetPresetSelect(preset);
                        }}
                        disabled={roomsLoading}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>

                <div className="dashboard-preset-row">
                  {GENDER_PRESETS.map((preset) => {
                    const isActive = filters.gender === preset.value;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        className={`dashboard-preset-chip ${isActive ? "is-active" : ""}`}
                        onClick={() => {
                          void handleGenderPresetSelect(preset.value);
                        }}
                        disabled={roomsLoading}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="dashboard-quick-chips">
                {activeQuickFilters.length > 0 ? (
                  activeQuickFilters.map((chip) => (
                    <button
                      key={chip.key}
                      type="button"
                      className="dashboard-quick-chip"
                      onClick={() => {
                        void handleRemoveQuickFilter(chip.key);
                      }}
                      disabled={roomsLoading}
                      aria-label={`Remove ${chip.label}`}
                    >
                      <span>{chip.label}</span>
                      <X size={12} />
                    </button>
                  ))
                ) : (
                  <span className="dashboard-quick-chip dashboard-quick-chip--muted">No quick filters selected</span>
                )}
              </div>

              {filterError ? <p className="dashboard-filter-error">{filterError}</p> : null}

              <div className="dashboard-filter-actions">
                <p className="dashboard-filter-actions__summary">
                  {roomsLoading ? "Refreshing room list..." : `${rooms.length} matching rooms`}
                </p>
                <button
                  type="submit"
                  className="dashboard-btn dashboard-btn--ghost"
                  disabled={roomsLoading}
                >
                  {roomsLoading ? "Applying..." : "Apply Filters"}
                </button>
                <button
                  type="button"
                  className="dashboard-btn dashboard-btn--ghost"
                  onClick={handleClearFilters}
                  disabled={roomsLoading}
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
                  className="dashboard-btn dashboard-btn--ghost"
                  onClick={handleUseCurrentLocation}
                  disabled={locationLoading || locationSaving}
                >
                  {locationLoading ? "Locating..." : locationSaving ? "Saving..." : "Use My Location"}
                </button>
                {locationStatus ? <p className="dashboard-map__status">{locationStatus}</p> : null}
              </div>

              <div className="dashboard-map__canvas">
                {mapsReady ? (
                  <div ref={mapContainerRef} className="dashboard-map__google" />
                ) : (
                  <div className="dashboard-map__placeholder">{mapError || "Loading map..."}</div>
                )}
              </div>
              <p className="dashboard-map__hint">Use My Location or click anywhere on the map to pin and save your location.</p>

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
                {popularRestaurants.slice(0, 2).map((restaurant) => (
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
                        <span className={`status-badge ${badgeClass}`}>{toTitleCase(status)}</span>
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
