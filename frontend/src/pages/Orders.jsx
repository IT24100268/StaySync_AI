import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CalendarDays,
  ClipboardList,
  Clock3,
  MapPin,
  RefreshCcw,
  Search,
  Store,
  Truck,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import "./Orders.css";

const normalizeOrderStatus = (status) => {
  const raw = String(status || "").trim().toLowerCase();
  if (raw === "completed") return "delivered";
  if (raw === "canceled" || raw === "cancelled") return "rejected";
  return raw;
};

const ACTIVE_STATUSES = ["pending", "accepted", "preparing", "ready", "out_for_delivery"];

const STATUS_META = {
  pending: { label: "Pending", className: "status-pending" },
  accepted: { label: "Accepted", className: "status-accepted" },
  preparing: { label: "Preparing", className: "status-preparing" },
  ready: { label: "Ready", className: "status-ready" },
  out_for_delivery: { label: "On the Way", className: "status-delivery" },
  delivered: { label: "Delivered", className: "status-delivered" },
  completed: { label: "Delivered", className: "status-delivered" },
  rejected: { label: "Canceled", className: "status-canceled" },
  canceled: { label: "Canceled", className: "status-canceled" },
  cancelled: { label: "Canceled", className: "status-canceled" },
};

const TRACK_STEPS = [
  { key: "pending", label: "Placed" },
  { key: "accepted", label: "Confirmed" },
  { key: "preparing", label: "Preparing" },
  { key: "ready", label: "Ready" },
  { key: "out_for_delivery", label: "On the Way" },
  { key: "delivered", label: "Delivered" },
];

const TAKEAWAY_TRACK_STEPS = [
  { key: "pending", label: "Placed" },
  { key: "accepted", label: "Confirmed" },
  { key: "preparing", label: "Preparing" },
  { key: "ready", label: "Ready for Pickup" },
  { key: "picked_up", label: "Picked Up" },
];

const toArray = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
};

const safeNumber = (value, fallback = 0) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
};

const formatCurrency = (value) => `LKR ${safeNumber(value).toLocaleString("en-LK")}`;

const formatDate = (value) => {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleDateString("en-LK", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const formatDateTime = (value) => {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleString("en-LK", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getOrderItemsSummary = (order) => {
  const items = Array.isArray(order?.items) ? order.items : [];
  if (items.length === 0) return "No item details available";

  const names = items
    .map((item) => item?.menu_item?.name || "Menu item")
    .filter(Boolean);

  if (names.length === 0) return "No item details available";
  if (names.length <= 3) return names.join(", ");
  return `${names.slice(0, 3).join(", ")} +${names.length - 3} more`;
};

const getDeliveryPartnerName = (order) => {
  const name = String(order?.delivery_partner_name || "").trim();
  return name || "";
};

const getDeliveryPartnerAvatar = (order) => {
  return String(order?.delivery_partner_display_image || "").trim();
};

const getDeliveryPartnerPhone = (order) => {
  return String(order?.delivery_partner_phone || "").trim();
};

const getDeliveryPartnerVehicle = (order) => {
  const type = String(order?.delivery_partner_vehicle_type || "").trim();
  const number = String(order?.delivery_partner_vehicle_number || "").trim();
  return [type, number].filter(Boolean).join(" - ");
};

const getInitials = (value = "") => {
  const clean = String(value || "").trim();
  if (!clean) return "DP";
  const parts = clean.split(/\s+/).slice(0, 2);
  return parts.map((part) => part[0]).join("").toUpperCase();
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

const getOrderType = (order) =>
  String(order?.order_type || "delivery").trim().toLowerCase() === "takeaway" ? "takeaway" : "delivery";

const getProgressStatusKey = (order) => {
  const normalized = normalizeOrderStatus(order?.status || "pending");
  if (getOrderType(order) === "takeaway") {
    if (normalized === "accepted") return "preparing";
    if (normalized === "delivered") return "picked_up";
    if (normalized === "completed") return "picked_up";
    if (normalized === "out_for_delivery") return "ready";
  }
  return normalized;
};

const statusForFilter = (order, filter) => {
  const status = normalizeOrderStatus(order?.status);
  const orderType = getOrderType(order);
  if (filter === "all") return true;
  if (filter === "active") return ACTIVE_STATUSES.includes(status);
  if (filter === "pending_delivery") return orderType === "delivery" && status === "pending";
  if (filter === "pending_takeaway") return orderType === "takeaway" && status === "pending";
  if (filter === "completed") return status === "delivered";
  if (filter === "canceled") return status === "rejected";
  return true;
};

export default function Orders() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [selectedActiveOrderId, setSelectedActiveOrderId] = useState(null);
  const [studentLocation, setStudentLocation] = useState(null);
  const [locatingStudent, setLocatingStudent] = useState(false);
  const [studentLocationStatus, setStudentLocationStatus] = useState("");
  const [locationAutoAttempted, setLocationAutoAttempted] = useState(false);
  const [deliveryTracking, setDeliveryTracking] = useState(null);
  const [deliveryTrackingLoading, setDeliveryTrackingLoading] = useState(false);

  const savedStudentLocation = useMemo(() => {
    const latitude = parseCoordinate(user?.profile?.latitude, "lat");
    const longitude = parseCoordinate(user?.profile?.longitude, "lng");
    if (!hasValidCoordinatePair(latitude, longitude)) {
      return null;
    }
    return { lat: latitude, lng: longitude };
  }, [user?.profile?.latitude, user?.profile?.longitude]);

  useEffect(() => {
    if (!savedStudentLocation) return;
    setStudentLocation((current) => {
      if (current && hasValidCoordinatePair(current.lat, current.lng)) {
        return current;
      }
      return savedStudentLocation;
    });
    setStudentLocationStatus((currentStatus) => currentStatus || "Using your saved profile location for route preview.");
  }, [savedStudentLocation?.lat, savedStudentLocation?.lng]);

  useEffect(() => {
    fetchOrders(true);
  }, []);

  const fetchOrders = async (initialLoad = false) => {
    if (initialLoad) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    try {
      const { data } = await api.get("/orders/");
      setOrders(toArray(data));
      setError("");
    } catch (fetchError) {
      console.error("Error fetching orders:", fetchError);
      setOrders([]);
      setError("Unable to load orders right now. Please refresh.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const requestStudentCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setStudentLocationStatus("Current location is not supported by this browser.");
      return;
    }

    setLocatingStudent(true);
    setStudentLocationStatus("Detecting your current location...");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextLocation = {
          lat: Number(position.coords.latitude),
          lng: Number(position.coords.longitude),
        };

        if (!hasValidCoordinatePair(nextLocation.lat, nextLocation.lng)) {
          setStudentLocationStatus("Location detected, but coordinates were invalid.");
          setLocatingStudent(false);
          return;
        }

        setStudentLocation(nextLocation);
        setStudentLocationStatus("Current location updated for pickup route.");
        setLocatingStudent(false);
      },
      (geoError) => {
        if (geoError.code === 1) {
          setStudentLocationStatus("Location permission denied. Enable it to view route path.");
        } else if (geoError.code === 2) {
          setStudentLocationStatus("Location unavailable right now.");
        } else if (geoError.code === 3) {
          setStudentLocationStatus("Location request timed out.");
        } else {
          setStudentLocationStatus("Failed to fetch current location.");
        }
        setLocatingStudent(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, []);

  const stats = useMemo(() => {
    const active = orders.filter((order) => ACTIVE_STATUSES.includes(normalizeOrderStatus(order.status))).length;
    const completed = orders.filter((order) => normalizeOrderStatus(order.status) === "delivered").length;
    const canceled = orders.filter((order) => normalizeOrderStatus(order.status) === "rejected").length;
    return { active, completed, canceled, total: orders.length };
  }, [orders]);

  const searchedOrders = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return orders.filter((order) => {
      if (!query) return true;
      const searchText = [
        `order ${order.id}`,
        order.restaurant?.name,
        order.restaurant?.address,
        order.status,
        order.delivery_address,
        getOrderItemsSummary(order),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchText.includes(query);
    });
  }, [orders, searchQuery]);

  const sortedOrders = useMemo(() => {
    const sorted = [...searchedOrders];
    sorted.sort((a, b) => {
      if (sortBy === "oldest") {
        return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
      }
      if (sortBy === "price_high") {
        return safeNumber(b.total_price) - safeNumber(a.total_price);
      }
      if (sortBy === "price_low") {
        return safeNumber(a.total_price) - safeNumber(b.total_price);
      }
      return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
    });
    return sorted;
  }, [searchedOrders, sortBy]);

  const panelOrders = useMemo(
    () => sortedOrders.filter((order) => statusForFilter(order, statusFilter)),
    [sortedOrders, statusFilter]
  );

  const activeOrders = useMemo(
    () => sortedOrders.filter((order) => ACTIVE_STATUSES.includes(normalizeOrderStatus(order.status))),
    [sortedOrders]
  );

  const completedOrders = useMemo(
    () => sortedOrders.filter((order) => normalizeOrderStatus(order.status) === "delivered"),
    [sortedOrders]
  );

  const canceledOrders = useMemo(
    () => sortedOrders.filter((order) => normalizeOrderStatus(order.status) === "rejected"),
    [sortedOrders]
  );

  const panelTitle = useMemo(() => {
    if (statusFilter === "pending_delivery") return "Pending Delivery Orders";
    if (statusFilter === "pending_takeaway") return "Pending Takeaway Orders";
    if (statusFilter === "completed") return "Completed Orders";
    if (statusFilter === "canceled") return "Canceled Orders";
    if (statusFilter === "all") return "All Orders";
    return "Active Orders";
  }, [statusFilter]);

  useEffect(() => {
    if (panelOrders.length === 0) {
      setSelectedActiveOrderId(null);
      return;
    }

    const exists = panelOrders.some((order) => order.id === selectedActiveOrderId);
    if (!exists) {
      setSelectedActiveOrderId(panelOrders[0].id);
    }
  }, [panelOrders, selectedActiveOrderId]);

  const focusedPanelOrder = useMemo(() => {
    if (panelOrders.length === 0) return null;
    return panelOrders.find((order) => order.id === selectedActiveOrderId) || panelOrders[0];
  }, [panelOrders, selectedActiveOrderId]);

  const focusedOrderType = getOrderType(focusedPanelOrder);
  const isFocusedTakeaway = focusedOrderType === "takeaway";
  const isFocusedDelivery = focusedOrderType === "delivery";

  const mapEmbedUrl = useMemo(() => {
    if (!focusedPanelOrder) {
      return "https://maps.google.com/maps?q=Jaffna%2C%20Sri%20Lanka&z=11&output=embed";
    }

    const latitude = parseCoordinate(focusedPanelOrder.restaurant?.latitude, "lat");
    const longitude = parseCoordinate(focusedPanelOrder.restaurant?.longitude, "lng");

    const query = hasValidCoordinatePair(latitude, longitude)
      ? `${latitude},${longitude}`
      : focusedPanelOrder.restaurant?.address || focusedPanelOrder.delivery_address || "Jaffna, Sri Lanka";

    const zoom = hasValidCoordinatePair(latitude, longitude) ? 14 : 11;
    return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&z=${zoom}&output=embed`;
  }, [focusedPanelOrder]);

  const focusedProgressStatus = getProgressStatusKey(focusedPanelOrder);
  const focusedTrackSteps = isFocusedTakeaway ? TAKEAWAY_TRACK_STEPS : TRACK_STEPS;
  const focusedStepIndex = focusedTrackSteps.findIndex((step) => step.key === focusedProgressStatus);
  const focusedStatus = normalizeOrderStatus(focusedPanelOrder?.status || "pending");
  const focusedPickupReadyAt = focusedPanelOrder?.pickup_ready_at || focusedPanelOrder?.estimated_delivery_at;
  const isTakeawayPickedUp = isFocusedTakeaway && focusedProgressStatus === "picked_up";
  const showTakeawayRoute = isFocusedTakeaway && !isTakeawayPickedUp && focusedStatus !== "rejected";

  const focusedDeliveryFlow = useMemo(() => {
    const snapshot = focusedPanelOrder?.pricing_snapshot;
    if (!snapshot || typeof snapshot !== "object") return {};
    const flow = snapshot?._delivery_flow;
    if (!flow || typeof flow !== "object") return {};
    return flow;
  }, [focusedPanelOrder?.pricing_snapshot]);

  const deliveryPartnerAssigned = Boolean(focusedPanelOrder?.delivery_partner_id);
  const isDeliveryPickedConfirmed =
    isFocusedDelivery &&
    (Boolean(focusedDeliveryFlow?.picked_confirmed) ||
      focusedStatus === "out_for_delivery" ||
      focusedStatus === "delivered");

  const focusedRestaurantLatitude = parseCoordinate(focusedPanelOrder?.restaurant?.latitude, "lat");
  const focusedRestaurantLongitude = parseCoordinate(focusedPanelOrder?.restaurant?.longitude, "lng");
  const focusedStudentDropLatitude = parseCoordinate(focusedPanelOrder?.delivery_latitude, "lat");
  const focusedStudentDropLongitude = parseCoordinate(focusedPanelOrder?.delivery_longitude, "lng");
  const hasStudentLocation = hasValidCoordinatePair(studentLocation?.lat, studentLocation?.lng);
  const hasRestaurantCoords = hasValidCoordinatePair(focusedRestaurantLatitude, focusedRestaurantLongitude);
  const hasStudentDropCoords = hasValidCoordinatePair(focusedStudentDropLatitude, focusedStudentDropLongitude);

  const restaurantPoint = useMemo(() => {
    if (hasRestaurantCoords) {
      return `${focusedRestaurantLatitude},${focusedRestaurantLongitude}`;
    }
    return String(focusedPanelOrder?.restaurant?.address || "").trim();
  }, [focusedPanelOrder?.restaurant?.address, hasRestaurantCoords, focusedRestaurantLatitude, focusedRestaurantLongitude]);

  const studentDropPoint = useMemo(() => {
    if (hasStudentDropCoords) {
      return `${focusedStudentDropLatitude},${focusedStudentDropLongitude}`;
    }
    return String(focusedPanelOrder?.delivery_address || "").trim();
  }, [focusedPanelOrder?.delivery_address, hasStudentDropCoords, focusedStudentDropLatitude, focusedStudentDropLongitude]);

  useEffect(() => {
    let isMounted = true;

    const loadTracking = async () => {
      if (!focusedPanelOrder || !isFocusedDelivery || !focusedPanelOrder.delivery_partner_id) {
        setDeliveryTracking(null);
        setDeliveryTrackingLoading(false);
        return;
      }

      setDeliveryTrackingLoading(true);
      try {
        const response = await api.get(`/tracking/${focusedPanelOrder.id}/`);
        if (!isMounted) return;
        setDeliveryTracking(response?.data || null);
      } catch {
        if (!isMounted) return;
        setDeliveryTracking(null);
      } finally {
        if (isMounted) {
          setDeliveryTrackingLoading(false);
        }
      }
    };

    loadTracking();
    return () => {
      isMounted = false;
    };
  }, [focusedPanelOrder?.id, focusedPanelOrder?.delivery_partner_id, isFocusedDelivery]);

  const riderLatitude = parseCoordinate(
    deliveryTracking?.current_latitude ?? focusedPanelOrder?.rider_current_latitude,
    "lat"
  );
  const riderLongitude = parseCoordinate(
    deliveryTracking?.current_longitude ?? focusedPanelOrder?.rider_current_longitude,
    "lng"
  );
  const hasRiderCoords = hasValidCoordinatePair(riderLatitude, riderLongitude);
  const riderPoint = hasRiderCoords ? `${riderLatitude},${riderLongitude}` : "";

  const showPickupThenDropRoute =
    isFocusedDelivery &&
    deliveryPartnerAssigned &&
    !isDeliveryPickedConfirmed &&
    Boolean(riderPoint) &&
    Boolean(restaurantPoint) &&
    Boolean(studentDropPoint);

  const showRestaurantToStudentRoute =
    isFocusedDelivery && Boolean(restaurantPoint) && Boolean(studentDropPoint);

  const deliveryRouteEmbedUrl = useMemo(() => {
    if (!isFocusedDelivery) return "";

    if (showPickupThenDropRoute) {
      const destinationWithWaypoint = `${restaurantPoint}+to:${studentDropPoint}`;
      return `https://maps.google.com/maps?saddr=${encodeURIComponent(riderPoint)}&daddr=${encodeURIComponent(
        destinationWithWaypoint
      )}&dirflg=d&output=embed`;
    }

    if (showRestaurantToStudentRoute) {
      return `https://maps.google.com/maps?saddr=${encodeURIComponent(restaurantPoint)}&daddr=${encodeURIComponent(
        studentDropPoint
      )}&dirflg=d&output=embed`;
    }

    return "";
  }, [
    isFocusedDelivery,
    showPickupThenDropRoute,
    showRestaurantToStudentRoute,
    riderPoint,
    restaurantPoint,
    studentDropPoint,
  ]);

  const deliveryRouteLink = useMemo(() => {
    if (!isFocusedDelivery) return "";

    if (showPickupThenDropRoute) {
      const destinationWithWaypoint = `${restaurantPoint}+to:${studentDropPoint}`;
      return `https://maps.google.com/maps?saddr=${encodeURIComponent(riderPoint)}&daddr=${encodeURIComponent(
        destinationWithWaypoint
      )}&dirflg=d`;
    }

    if (showRestaurantToStudentRoute) {
      return `https://maps.google.com/maps?saddr=${encodeURIComponent(restaurantPoint)}&daddr=${encodeURIComponent(
        studentDropPoint
      )}&dirflg=d`;
    }

    return String(focusedPanelOrder?.maps_route_url || "").trim();
  }, [
    isFocusedDelivery,
    showPickupThenDropRoute,
    showRestaurantToStudentRoute,
    riderPoint,
    restaurantPoint,
    studentDropPoint,
    focusedPanelOrder?.maps_route_url,
  ]);

  const deliveryRouteHint = useMemo(() => {
    if (!isFocusedDelivery) return "";

    if (showPickupThenDropRoute) {
      return "Rider -> Restaurant -> Your location";
    }

    if (deliveryPartnerAssigned && !isDeliveryPickedConfirmed && !riderPoint) {
      return deliveryTrackingLoading
        ? "Fetching rider location..."
        : "Rider accepted. Showing restaurant-to-you route until live rider GPS is available.";
    }

    if (showRestaurantToStudentRoute) {
      return isDeliveryPickedConfirmed
        ? "Picked up. Route from restaurant to your location."
        : "Route from restaurant to your location.";
    }

    return "Route preview unavailable for this delivery.";
  }, [
    isFocusedDelivery,
    showPickupThenDropRoute,
    showRestaurantToStudentRoute,
    deliveryPartnerAssigned,
    isDeliveryPickedConfirmed,
    riderPoint,
    deliveryTrackingLoading,
  ]);

  const deliveryMapEmbedUrl = deliveryRouteEmbedUrl || mapEmbedUrl;

  const pickupDestination = useMemo(() => {
    if (!showTakeawayRoute) return "";
    return restaurantPoint;
  }, [showTakeawayRoute, restaurantPoint]);

  const takeawayRouteEmbedUrl = useMemo(() => {
    if (!showTakeawayRoute || !hasStudentLocation || !pickupDestination) {
      return "";
    }
    const origin = `${studentLocation.lat},${studentLocation.lng}`;
    return `https://maps.google.com/maps?saddr=${encodeURIComponent(origin)}&daddr=${encodeURIComponent(
      pickupDestination
    )}&dirflg=d&output=embed`;
  }, [showTakeawayRoute, hasStudentLocation, pickupDestination, studentLocation?.lat, studentLocation?.lng]);

  const takeawayRouteLink = useMemo(() => {
    if (!showTakeawayRoute || !hasStudentLocation || !pickupDestination) {
      return "";
    }
    const origin = `${studentLocation.lat},${studentLocation.lng}`;
    return `https://maps.google.com/maps?saddr=${encodeURIComponent(origin)}&daddr=${encodeURIComponent(
      pickupDestination
    )}&dirflg=d`;
  }, [showTakeawayRoute, hasStudentLocation, pickupDestination, studentLocation?.lat, studentLocation?.lng]);

  useEffect(() => {
    if (!showTakeawayRoute) {
      setLocationAutoAttempted(false);
      return;
    }
    if (hasStudentLocation || locatingStudent || locationAutoAttempted) {
      return;
    }
    setLocationAutoAttempted(true);
    requestStudentCurrentLocation();
  }, [
    showTakeawayRoute,
    hasStudentLocation,
    locatingStudent,
    locationAutoAttempted,
    requestStudentCurrentLocation,
  ]);

  return (
    <div className="orders-page">
      <div className="orders-page__container">
        <header className="orders-hero">
          <div>
            <h1>
              <ClipboardList size={30} /> Orders
            </h1>
            <p>Track food orders, monitor status updates, and jump to live tracking quickly.</p>
          </div>
          <button
            type="button"
            className="orders-btn orders-btn--outline"
            onClick={() => fetchOrders(false)}
            disabled={refreshing}
          >
            <RefreshCcw size={15} className={refreshing ? "spin" : ""} />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </header>

        <section className="orders-stats">
          <article className="orders-stat is-active">
            <p>Active Orders</p>
            <strong>{stats.active}</strong>
          </article>
          <article className="orders-stat is-completed">
            <p>Completed Orders</p>
            <strong>{stats.completed}</strong>
          </article>
          <article className="orders-stat is-canceled">
            <p>Canceled Orders</p>
            <strong>{stats.canceled}</strong>
          </article>
        </section>

        <section className="orders-toolbar">
          <div className="orders-search">
            <Search size={15} />
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search by restaurant, order id, item, or status"
            />
          </div>

          <div className="orders-filters">
            {[
              { key: "all", label: "All" },
              { key: "active", label: "Active" },
              { key: "pending_delivery", label: "Pending Delivery" },
              { key: "pending_takeaway", label: "Pending Takeaway" },
              { key: "completed", label: "Completed" },
              { key: "canceled", label: "Canceled" },
            ].map((item) => (
              <button
                key={item.key}
                type="button"
                className={`orders-filter-chip ${statusFilter === item.key ? "is-active" : ""}`}
                onClick={() => setStatusFilter(item.key)}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="orders-sort">
            <label htmlFor="orders-sort">Sort</label>
            <select id="orders-sort" value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="price_high">Price High-Low</option>
              <option value="price_low">Price Low-High</option>
            </select>
          </div>
        </section>

        {error ? <div className="orders-feedback orders-feedback--error">{error}</div> : null}

        {loading ? (
          <div className="orders-feedback">Loading your orders...</div>
        ) : (
          <>
            <section className="orders-active-panel">
              <div className="orders-active-card">
                <div className="orders-active-card__head">
                  <h2>{panelTitle}</h2>
                  <span>{panelOrders.length} items</span>
                </div>

                {panelOrders.length > 0 ? (
                  <div className="orders-active-list">
                    {panelOrders.map((order) => {
                      const meta = STATUS_META[normalizeOrderStatus(order.status)] || STATUS_META.pending;
                      return (
                        <button
                          key={order.id}
                          type="button"
                          className={`orders-active-pill ${order.id === focusedPanelOrder?.id ? "is-active" : ""}`}
                          onClick={() => setSelectedActiveOrderId(order.id)}
                        >
                          #{order.id} {meta.label}
                        </button>
                      );
                    })}
                  </div>
                ) : null}

                {!focusedPanelOrder ? (
                  <div className="orders-feedback">No orders found for this filter.</div>
                ) : (
                  <div className="orders-active-content">
                    {getDeliveryPartnerName(focusedPanelOrder) ? (
                      <div className="orders-rider-card">
                        {getDeliveryPartnerAvatar(focusedPanelOrder) ? (
                          <img
                            className="orders-rider-card__avatar"
                            src={getDeliveryPartnerAvatar(focusedPanelOrder)}
                            alt={getDeliveryPartnerName(focusedPanelOrder)}
                          />
                        ) : (
                          <span className="orders-rider-card__avatar orders-rider-card__avatar--fallback">
                            {getInitials(getDeliveryPartnerName(focusedPanelOrder))}
                          </span>
                        )}

                        <div className="orders-rider-card__meta">
                          <p>Delivery Partner</p>
                          <strong>{getDeliveryPartnerName(focusedPanelOrder)}</strong>
                          <span>{getDeliveryPartnerPhone(focusedPanelOrder) || "Phone not available"}</span>
                          {getDeliveryPartnerVehicle(focusedPanelOrder) ? (
                            <span>{getDeliveryPartnerVehicle(focusedPanelOrder)}</span>
                          ) : null}
                        </div>
                      </div>
                    ) : null}

                    <div className="orders-active-summary">
                      <div>
                        <h3>{focusedPanelOrder.restaurant?.name || `Order #${focusedPanelOrder.id}`}</h3>
                        <p>{getOrderItemsSummary(focusedPanelOrder)}</p>
                      </div>

                      <span
                        className={`orders-status-badge ${(STATUS_META[focusedStatus] || STATUS_META.pending).className}`}
                      >
                        {(STATUS_META[focusedStatus] || STATUS_META.pending).label}
                      </span>
                    </div>

                    <div className={`orders-active-meta ${isFocusedTakeaway ? "orders-active-meta--takeaway" : ""}`}>
                      <span>
                        <Store size={14} /> {isFocusedTakeaway ? "Takeaway" : "Delivery"}
                      </span>
                      <span>{formatCurrency(focusedPanelOrder.total_price)}</span>
                      <span>
                        <CalendarDays size={14} /> {formatDateTime(focusedPanelOrder.created_at)}
                      </span>

                      {isFocusedTakeaway ? (
                        <>
                          {focusedPickupReadyAt ? (
                            <span>
                              <Clock3 size={14} /> Ready by {formatDateTime(focusedPickupReadyAt)}
                            </span>
                          ) : focusedPanelOrder.estimated_delivery_time ? (
                            <span>
                              <Clock3 size={14} /> Ready in ~{focusedPanelOrder.estimated_delivery_time} min
                            </span>
                          ) : null}
                          {focusedPanelOrder.restaurant_contact ? <span>Contact: {focusedPanelOrder.restaurant_contact}</span> : null}
                        </>
                      ) : (
                        <>
                          <span>Delivery Fee: {formatCurrency(focusedPanelOrder.delivery_charge)}</span>
                          {focusedPanelOrder.route_distance_km ? (
                            <span>Distance: {Number(focusedPanelOrder.route_distance_km).toFixed(2)} km</span>
                          ) : null}
                          {focusedPanelOrder.estimated_delivery_time ? (
                            <span>
                              <Clock3 size={14} /> ETA {focusedPanelOrder.estimated_delivery_time} min
                            </span>
                          ) : null}
                        </>
                      )}
                    </div>

                    {isFocusedTakeaway ? (
                      <div className="orders-takeaway-focus">
                        <div className="orders-takeaway-focus__head">
                          <strong>Pickup Summary</strong>
                          <span>Important details only</span>
                        </div>

                        <div className="orders-takeaway-focus__grid">
                          <article className="orders-takeaway-focus__tile">
                            <p>Order ID</p>
                            <h4>#{focusedPanelOrder.id}</h4>
                          </article>
                          <article className="orders-takeaway-focus__tile">
                            <p>Pickup At</p>
                            <h4>{focusedPanelOrder.restaurant?.name || "Restaurant"}</h4>
                          </article>
                          <article className="orders-takeaway-focus__tile">
                            <p>Ready Time</p>
                            <h4>
                              {focusedPickupReadyAt
                                ? formatDateTime(focusedPickupReadyAt)
                                : focusedPanelOrder.estimated_delivery_time
                                  ? `~${focusedPanelOrder.estimated_delivery_time} min`
                                  : "Updating soon"}
                            </h4>
                          </article>
                          <article className="orders-takeaway-focus__tile">
                            <p>Pickup Address</p>
                            <h4>{focusedPanelOrder.restaurant?.address || "Address not available"}</h4>
                          </article>
                        </div>
                      </div>
                    ) : null}

                    <div className={`orders-progress ${isFocusedTakeaway ? "orders-progress--takeaway" : ""}`}>
                      {focusedTrackSteps.map((step, index) => {
                        const isDone = focusedStepIndex >= 0 && index <= focusedStepIndex;
                        const isCurrent = focusedStepIndex === index;
                        return (
                          <div
                            key={step.key}
                            className={`orders-progress-step ${isFocusedTakeaway ? "orders-progress-step--takeaway" : ""} ${
                              isDone ? "is-done" : ""
                            } ${isCurrent ? "is-current" : ""}`}
                          >
                            <div className={`orders-progress-dot ${isDone ? "is-done" : ""} ${isCurrent ? "is-current" : ""}`}>
                              {isFocusedTakeaway ? <span className="orders-progress-index">{index + 1}</span> : null}
                            </div>
                            <span>{step.label}</span>
                          </div>
                        );
                      })}
                    </div>

                    {!isFocusedTakeaway ? (
                      <div className="orders-active-actions orders-active-actions--premium">
                        {deliveryRouteHint ? <p className="orders-active-actions__hint">{deliveryRouteHint}</p> : null}

                        {deliveryRouteLink ? (
                          <a
                            className="orders-btn orders-btn--route"
                            href={deliveryRouteLink}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <MapPin size={15} /> Open Smart Route
                          </a>
                        ) : null}

                        {focusedStatus === "out_for_delivery" ? (
                          <button
                            type="button"
                            className="orders-btn orders-btn--track"
                            onClick={() => navigate(`/tracking/${focusedPanelOrder.id}`)}
                          >
                            <Truck size={15} /> Live Track
                          </button>
                        ) : null}

                        <button
                          type="button"
                          className="orders-btn orders-btn--restaurant"
                          onClick={() => navigate(`/restaurants/${focusedPanelOrder.restaurant?.id}`)}
                        >
                          View Restaurant
                        </button>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>

              <div className="orders-map-card">
                <div className="orders-map-card__head">
                  <h2>
                    <MapPin size={16} /> {isFocusedTakeaway ? "Pickup Details" : "Delivery Route Map"}
                  </h2>
                </div>

                {isFocusedTakeaway ? (
                  <div className="orders-pickup-card">
                    <div className={`orders-pickup-route ${isTakeawayPickedUp ? "is-complete" : ""}`}>
                      <div className="orders-pickup-route__head">
                        <strong>Route to Pickup</strong>
                        {!isTakeawayPickedUp ? (
                          <button
                            type="button"
                            className="orders-btn orders-btn--outline orders-pickup-route__locate"
                            onClick={requestStudentCurrentLocation}
                            disabled={locatingStudent}
                          >
                            <MapPin size={14} /> {locatingStudent ? "Locating..." : "Use Current Location"}
                          </button>
                        ) : null}
                      </div>

                      {isTakeawayPickedUp ? (
                        <p className="orders-pickup-route__status">
                          Pickup completed. Route tracking is hidden after order is picked up.
                        </p>
                      ) : takeawayRouteEmbedUrl ? (
                        <>
                          {studentLocationStatus ? (
                            <p className="orders-pickup-route__status">{studentLocationStatus}</p>
                          ) : null}

                          <div className="orders-pickup-route__map">
                            <iframe
                              title="Takeaway pickup route"
                              src={takeawayRouteEmbedUrl}
                              loading="lazy"
                              referrerPolicy="no-referrer-when-downgrade"
                            />
                          </div>

                          {takeawayRouteLink ? (
                            <a
                              className="orders-btn orders-btn--outline orders-pickup-route__open"
                              href={takeawayRouteLink}
                              target="_blank"
                              rel="noreferrer"
                            >
                              <MapPin size={14} /> Open Full Route
                            </a>
                          ) : null}
                        </>
                      ) : (
                        <p className="orders-pickup-route__status">
                          Add or allow your current location to display a clear route from you to this restaurant.
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="orders-delivery-map-shell">
                    {deliveryRouteHint ? <p className="orders-delivery-map-shell__hint">{deliveryRouteHint}</p> : null}
                    {deliveryTrackingLoading && deliveryPartnerAssigned && !isDeliveryPickedConfirmed ? (
                      <p className="orders-delivery-map-shell__status">Updating rider position...</p>
                    ) : null}
                    <div className="orders-map-wrap">
                      <iframe
                        title="Order map preview"
                        src={deliveryMapEmbedUrl}
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                      />
                    </div>
                  </div>
                )}
              </div>
            </section>

            <section className="orders-section">
              <div className="orders-section__head">
                <h2>Completed Orders</h2>
                <span>{completedOrders.length} completed</span>
              </div>

              {completedOrders.length === 0 ? (
                <div className="orders-feedback">No completed orders yet.</div>
              ) : (
                <div className="orders-grid">
                  {completedOrders.map((order) => (
                    <article key={order.id} className="orders-card">
                      <div className="orders-card__media">
                        {order.restaurant?.image ? (
                          <img src={order.restaurant.image} alt={order.restaurant?.name || "Restaurant"} />
                        ) : (
                          <div className="orders-card__empty">No Image</div>
                        )}
                      </div>
                      <div className="orders-card__body">
                        <h3>{order.restaurant?.name || `Order #${order.id}`}</h3>
                        <p className="orders-card__meta">Order #{order.id}</p>
                        <p className="orders-card__meta">{getOrderItemsSummary(order)}</p>
                        <p className="orders-card__price">{formatCurrency(order.total_price)}</p>
                        <p className="orders-card__meta">
                          Completed: {formatDateTime(order.updated_at || order.created_at)}
                        </p>
                        {order.order_type === "delivery" ? (
                          <p className="orders-card__meta">
                            Drop: {order.delivery_address || "Address not available"}
                          </p>
                        ) : null}
                        <button
                          type="button"
                          className="orders-btn orders-btn--completed"
                          onClick={() => navigate(`/restaurants/${order.restaurant?.id}`)}
                        >
                          Order Again
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <section className="orders-section">
              <div className="orders-section__head">
                <h2>Canceled Orders</h2>
                <span>{canceledOrders.length} canceled</span>
              </div>

              {canceledOrders.length === 0 ? (
                <div className="orders-feedback">No canceled orders.</div>
              ) : (
                <div className="orders-canceled-list">
                  {canceledOrders.map((order) => (
                    <article key={order.id} className="orders-canceled-card">
                      <div>
                        <h3>{order.restaurant?.name || `Order #${order.id}`}</h3>
                        <p>Order #{order.id}</p>
                        <p>{getOrderItemsSummary(order)}</p>
                        <p>Total: {formatCurrency(order.total_price)}</p>
                        <p>Canceled: {formatDateTime(order.updated_at || order.created_at)}</p>
                        {order.order_type === "delivery" ? (
                          <p>Drop: {order.delivery_address || "Address not available"}</p>
                        ) : null}
                        <small>Reason: {order.rejection_reason || "Not specified"}</small>
                      </div>
                      <span className="orders-status-badge status-canceled">Canceled</span>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}

