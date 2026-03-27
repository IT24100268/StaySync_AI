import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock3,
  MapPin,
  RefreshCcw,
  Search,
  Store,
  Truck,
  XCircle,
} from "lucide-react";
import api from "../services/api";
import "./Orders.css";

const ACTIVE_STATUSES = ["pending", "accepted", "preparing", "ready", "out_for_delivery"];

const STATUS_META = {
  pending: { label: "Pending", className: "status-pending" },
  accepted: { label: "Accepted", className: "status-accepted" },
  preparing: { label: "Preparing", className: "status-preparing" },
  ready: { label: "Ready", className: "status-ready" },
  out_for_delivery: { label: "On the Way", className: "status-delivery" },
  delivered: { label: "Delivered", className: "status-delivered" },
  rejected: { label: "Canceled", className: "status-canceled" },
};

const TRACK_STEPS = [
  { key: "pending", label: "Placed" },
  { key: "accepted", label: "Confirmed" },
  { key: "preparing", label: "Preparing" },
  { key: "ready", label: "Ready" },
  { key: "out_for_delivery", label: "On the Way" },
  { key: "delivered", label: "Delivered" },
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

const statusForFilter = (order, filter) => {
  const status = String(order?.status || "").toLowerCase();
  if (filter === "all") return true;
  if (filter === "active") return ACTIVE_STATUSES.includes(status);
  if (filter === "completed") return status === "delivered";
  if (filter === "canceled") return status === "rejected";
  return true;
};

export default function Orders() {
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [selectedActiveOrderId, setSelectedActiveOrderId] = useState(null);

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

  const stats = useMemo(() => {
    const active = orders.filter((order) => ACTIVE_STATUSES.includes(String(order.status || "").toLowerCase())).length;
    const completed = orders.filter((order) => String(order.status || "").toLowerCase() === "delivered").length;
    const canceled = orders.filter((order) => String(order.status || "").toLowerCase() === "rejected").length;
    return { active, completed, canceled, total: orders.length };
  }, [orders]);

  const visibleOrders = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    const filtered = orders.filter((order) => {
      if (!statusForFilter(order, statusFilter)) return false;

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

    const sorted = [...filtered];
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
  }, [orders, searchQuery, statusFilter, sortBy]);

  const activeOrders = useMemo(
    () => visibleOrders.filter((order) => ACTIVE_STATUSES.includes(String(order.status || "").toLowerCase())),
    [visibleOrders]
  );

  const completedOrders = useMemo(
    () => visibleOrders.filter((order) => String(order.status || "").toLowerCase() === "delivered"),
    [visibleOrders]
  );

  const canceledOrders = useMemo(
    () => visibleOrders.filter((order) => String(order.status || "").toLowerCase() === "rejected"),
    [visibleOrders]
  );

  useEffect(() => {
    if (activeOrders.length === 0) {
      setSelectedActiveOrderId(null);
      return;
    }

    const exists = activeOrders.some((order) => order.id === selectedActiveOrderId);
    if (!exists) {
      setSelectedActiveOrderId(activeOrders[0].id);
    }
  }, [activeOrders, selectedActiveOrderId]);

  const focusedActiveOrder = useMemo(() => {
    if (activeOrders.length === 0) return null;
    return activeOrders.find((order) => order.id === selectedActiveOrderId) || activeOrders[0];
  }, [activeOrders, selectedActiveOrderId]);

  const mapEmbedUrl = useMemo(() => {
    if (!focusedActiveOrder) {
      return "https://maps.google.com/maps?q=Jaffna%2C%20Sri%20Lanka&z=11&output=embed";
    }

    const latitude = parseCoordinate(focusedActiveOrder.restaurant?.latitude, "lat");
    const longitude = parseCoordinate(focusedActiveOrder.restaurant?.longitude, "lng");

    const query = hasValidCoordinatePair(latitude, longitude)
      ? `${latitude},${longitude}`
      : focusedActiveOrder.restaurant?.address || focusedActiveOrder.delivery_address || "Jaffna, Sri Lanka";

    const zoom = hasValidCoordinatePair(latitude, longitude) ? 14 : 11;
    return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&z=${zoom}&output=embed`;
  }, [focusedActiveOrder]);

  const focusedStatus = String(focusedActiveOrder?.status || "pending").toLowerCase();
  const focusedStepIndex = TRACK_STEPS.findIndex((step) => step.key === focusedStatus);

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
                  <h2>Active Orders</h2>
                  <span>{activeOrders.length} active</span>
                </div>

                {activeOrders.length > 0 ? (
                  <div className="orders-active-list">
                    {activeOrders.map((order) => {
                      const meta = STATUS_META[String(order.status || "").toLowerCase()] || STATUS_META.pending;
                      return (
                        <button
                          key={order.id}
                          type="button"
                          className={`orders-active-pill ${order.id === focusedActiveOrder?.id ? "is-active" : ""}`}
                          onClick={() => setSelectedActiveOrderId(order.id)}
                        >
                          #{order.id} {meta.label}
                        </button>
                      );
                    })}
                  </div>
                ) : null}

                {!focusedActiveOrder ? (
                  <div className="orders-feedback">No active orders right now.</div>
                ) : (
                  <div className="orders-active-content">
                    <div className="orders-active-summary">
                      <div>
                        <h3>{focusedActiveOrder.restaurant?.name || `Order #${focusedActiveOrder.id}`}</h3>
                        <p>{getOrderItemsSummary(focusedActiveOrder)}</p>
                      </div>

                      <span
                        className={`orders-status-badge ${(STATUS_META[focusedStatus] || STATUS_META.pending).className}`}
                      >
                        {(STATUS_META[focusedStatus] || STATUS_META.pending).label}
                      </span>
                    </div>

                    <div className="orders-active-meta">
                      <span>
                        <Store size={14} /> {focusedActiveOrder.order_type === "delivery" ? "Delivery" : "Takeaway"}
                      </span>
                      <span>{formatCurrency(focusedActiveOrder.total_price)}</span>
                      <span>
                        <CalendarDays size={14} /> {formatDateTime(focusedActiveOrder.created_at)}
                      </span>
                      {focusedActiveOrder.estimated_delivery_time ? (
                        <span>
                          <Clock3 size={14} /> ETA {focusedActiveOrder.estimated_delivery_time} min
                        </span>
                      ) : null}
                    </div>

                    <div className="orders-progress">
                      {TRACK_STEPS.map((step, index) => {
                        const isDone = focusedStepIndex >= 0 && index <= focusedStepIndex;
                        const isCurrent = focusedStepIndex === index;
                        return (
                          <div key={step.key} className="orders-progress-step">
                            <div className={`orders-progress-dot ${isDone ? "is-done" : ""} ${isCurrent ? "is-current" : ""}`} />
                            <span>{step.label}</span>
                          </div>
                        );
                      })}
                    </div>

                    <div className="orders-active-actions">
                      {focusedStatus === "out_for_delivery" ? (
                        <button
                          type="button"
                          className="orders-btn orders-btn--primary"
                          onClick={() => navigate(`/tracking/${focusedActiveOrder.id}`)}
                        >
                          <Truck size={15} /> Track Order
                        </button>
                      ) : null}

                      <button
                        type="button"
                        className="orders-btn orders-btn--outline"
                        onClick={() => navigate(`/restaurants/${focusedActiveOrder.restaurant?.id}`)}
                      >
                        View Restaurant
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="orders-map-card">
                <div className="orders-map-card__head">
                  <h2>
                    <MapPin size={16} /> Map Preview
                  </h2>
                </div>
                <div className="orders-map-wrap">
                  <iframe
                    title="Order map preview"
                    src={mapEmbedUrl}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
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
                        <p className="orders-card__price">{formatCurrency(order.total_price)}</p>
                        <p className="orders-card__meta">{formatDate(order.created_at)}</p>
                        <button
                          type="button"
                          className="orders-btn orders-btn--primary"
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
                        <p>{formatDateTime(order.created_at)}</p>
                        {order.rejection_reason ? <small>Reason: {order.rejection_reason}</small> : null}
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
