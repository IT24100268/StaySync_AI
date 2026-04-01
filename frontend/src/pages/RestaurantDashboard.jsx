import { useEffect, useMemo, useState } from 'react';
import {
  ArrowUpRight,
  CircleDollarSign,
  Flame,
  ListOrdered,
  MapPin,
  MenuSquare,
  MoreHorizontal,
  PackageCheck,
  Sparkles,
  Star,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Link } from 'react-router-dom';
import api from '../services/api';
import restaurantApi from '../services/restaurantApi';
import StatusBadge from '../components/StatusBadge';
import MenuItemModal from '../components/menu/MenuItemModal';
import { useFoodItems } from '../context/FoodItemsContext';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import './RestaurantDashboard.css';

const defaultDashboardImage =
  'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=1400&q=80';
const JAFFNA_UNIVERSITY_CENTER = { lat: 9.6848, lng: 80.0220 };

const toArray = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
};

const toNumber = (value, fallback = 0) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
};

const normalizeStatus = (value = '') =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replaceAll(' ', '_');

const toAbsoluteMediaUrl = (value = '') => {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (/^https?:\/\//i.test(raw)) return raw;
  const host = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api').replace(/\/api\/?$/, '');
  if (raw.startsWith('/')) return `${host}${raw}`;
  return `${host}/${raw}`;
};

const toDate = (value) => {
  const date = new Date(value || '');
  return Number.isNaN(date.getTime()) ? null : date;
};

const isSameDay = (left, right) =>
  left &&
  right &&
  left.getFullYear() === right.getFullYear() &&
  left.getMonth() === right.getMonth() &&
  left.getDate() === right.getDate();

const isSameMonth = (left, right) =>
  left &&
  right &&
  left.getFullYear() === right.getFullYear() &&
  left.getMonth() === right.getMonth();

const isDelivered = (order) => normalizeStatus(order?.status) === 'delivered';

function OrderCustomer({ order }) {
  const label = order.student_name || `Customer ${order.student || ''}`.trim() || 'Customer';
  const avatarUrl = toAbsoluteMediaUrl(order.student_display_image);

  const initials = label
    .split(' ')
    .slice(0, 2)
    .map((segment) => segment[0])
    .join('')
    .toUpperCase();

  return (
    <div className="order-customer">
      {avatarUrl ? (
        <img className="order-customer__avatar order-customer__avatar--image" src={avatarUrl} alt={label} />
      ) : (
        <div className="order-customer__avatar">{initials}</div>
      )}
      <span>{label}</span>
    </div>
  );
}

function FeaturedMenuCard({ item }) {
  return (
    <article className="featured-menu-card">
      <div className="featured-menu-card__image-wrap">
        {item.image ? (
          <img src={item.image} alt={item.name} className="featured-menu-card__image" />
        ) : (
          <div className="featured-menu-card__image-fallback">
            {String(item.name || 'Item').trim().slice(0, 1).toUpperCase() || 'I'}
          </div>
        )}
      </div>

      <div className="featured-menu-card__content">
        <h4>{item.name}</h4>
        <p className="featured-menu-card__price">LKR {toNumber(item.price).toLocaleString()}</p>
        <p className="featured-menu-card__orders">{item.orders} Orders Today</p>

        <div className="featured-menu-card__footer">
          <span className={`featured-menu-card__availability ${item.is_available ? 'is-live' : 'is-paused'}`}>
            {item.is_available ? 'Available' : 'Paused'}
          </span>
        </div>
      </div>
    </article>
  );
}

function HighlightCard({
  icon: Icon,
  title,
  value,
  description,
  actionLabel,
  actionTo,
  accentClass,
}) {
  return (
    <article className={`highlight-card ${accentClass || ''}`}>
      <div className="highlight-card__top">
        <div className="highlight-card__icon">
          <Icon size={20} />
        </div>
        <Link to={actionTo} className="highlight-card__action">
          <span>{actionLabel}</span>
          <ArrowUpRight size={15} />
        </Link>
      </div>

      <div className="highlight-card__body">
        <p>{title}</p>
        <strong>{value}</strong>
        <span>{description}</span>
      </div>
    </article>
  );
}

export default function RestaurantDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [acceptModalOpen, setAcceptModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [prepTime, setPrepTime] = useState('');

  const {
    items,
    loading: itemsLoading,
    error: itemsError,
    createItem,
    updateItem,
    deleteItem,
    toggleAvailability,
  } = useFoodItems();

  const { addToast } = useToast();

  const loadDashboard = async () => {
    const [ordersResult, overviewResult, reviewsResult] = await Promise.allSettled([
      restaurantApi.getOrders(),
      restaurantApi.getDashboardOverview(),
      api.get('/reviews/restaurants/'),
    ]);

    if (ordersResult.status !== 'fulfilled') {
      throw new Error('Orders fetch failed');
    }

    const liveOrders = toArray(ordersResult.value?.data).sort((first, second) => {
      const firstTime = toDate(first?.created_at)?.getTime() || 0;
      const secondTime = toDate(second?.created_at)?.getTime() || 0;
      return secondTime - firstTime;
    });

    const overviewData = overviewResult.status === 'fulfilled' ? overviewResult.value?.data || {} : {};
    const reviews = reviewsResult.status === 'fulfilled' ? toArray(reviewsResult.value?.data) : [];
    const totalReviews = reviews.length;
    const averageRating = totalReviews
      ? reviews.reduce((sum, review) => sum + toNumber(review?.rating), 0) / totalReviews
      : toNumber(overviewData?.ratings, 0);

    setData({
      restaurant_name: user?.profile?.restaurant_name || user?.username || 'Restaurant',
      location: user?.profile?.address || 'Location not updated yet',
      ratings: Number.isFinite(averageRating) ? Number(averageRating.toFixed(1)) : 0,
      total_reviews: totalReviews || toNumber(overviewData?.total_reviews, 0),
      recent_orders: liveOrders.slice(0, 10),
      all_orders: liveOrders,
    });
    setError('');
  };

  useEffect(() => {
    let mounted = true;

    const fetchOverview = async () => {
      try {
        await loadDashboard();
      } catch (err) {
        if (mounted) setError('Failed to load dashboard overview.');
      }
    };

    fetchOverview();
    return () => {
      mounted = false;
    };
  }, [user]);

  const allOrders = useMemo(() => data?.all_orders || [], [data]);

  const recentOrders = useMemo(() => allOrders.slice(0, 10), [allOrders]);

  const deliveredOrders = useMemo(
    () => allOrders.filter((order) => isDelivered(order)),
    [allOrders]
  );

  const todaysRevenue = useMemo(() => {
    const now = new Date();
    return deliveredOrders.reduce((sum, order) => {
      const time = toDate(order?.updated_at || order?.created_at);
      if (!isSameDay(time, now)) return sum;
      return sum + toNumber(order?.total_price ?? order?.total_amount);
    }, 0);
  }, [deliveredOrders]);

  const thisMonthRevenue = useMemo(() => {
    const now = new Date();
    return deliveredOrders.reduce((sum, order) => {
      const time = toDate(order?.updated_at || order?.created_at);
      if (!isSameMonth(time, now)) return sum;
      return sum + toNumber(order?.total_price ?? order?.total_amount);
    }, 0);
  }, [deliveredOrders]);

  const statusData = useMemo(() => {
    const counts = {
      pending: allOrders.filter((order) => normalizeStatus(order?.status) === 'pending').length,
      preparing: allOrders.filter((order) =>
        ['accepted', 'preparing', 'ready'].includes(normalizeStatus(order?.status))
      ).length,
      out_for_delivery: allOrders.filter((order) => normalizeStatus(order?.status) === 'out_for_delivery').length,
      completed: allOrders.filter((order) => isDelivered(order)).length,
    };

    const trackedTotal = counts.pending + counts.preparing + counts.out_for_delivery + counts.completed;
    const total = trackedTotal || 1;

    return [
      {
        name: 'Pending',
        value: counts.pending,
        percent: trackedTotal ? Math.round((counts.pending / total) * 100) : 0,
        color: '#f4b43a',
      },
      {
        name: 'Preparing',
        value: counts.preparing,
        percent: trackedTotal ? Math.round((counts.preparing / total) * 100) : 0,
        color: '#f28c28',
      },
      {
        name: 'Out for delivery',
        value: counts.out_for_delivery,
        percent: trackedTotal ? Math.round((counts.out_for_delivery / total) * 100) : 0,
        color: '#4f7cf7',
      },
      {
        name: 'Completed',
        value: counts.completed,
        percent: trackedTotal ? Math.round((counts.completed / total) * 100) : 0,
        color: '#44b649',
      },
    ];
  }, [allOrders]);

  const statusFocus = useMemo(() => {
    if (!statusData.length) return { name: 'Pending', percent: 0 };
    return statusData.reduce((top, current) =>
      current.value > top.value ? current : top
    );
  }, [statusData]);

  const todayItemStats = useMemo(() => {
    const today = new Date();
    const statsMap = new Map();

    allOrders.forEach((order) => {
      const createdAt = toDate(order?.created_at);
      if (!isSameDay(createdAt, today)) return;
      if (normalizeStatus(order?.status) === 'rejected') return;

      const orderItems = Array.isArray(order?.items) ? order.items : [];
      orderItems.forEach((item) => {
        const menuItem = item?.menu_item || {};
        const id = String(menuItem.id ?? item?.menu_item_id ?? menuItem.name ?? item?.id ?? 'unknown');
        const name = String(menuItem.name || item?.name || 'Menu item').trim() || 'Menu item';
        const quantity = Math.max(toNumber(item?.quantity, 1), 1);
        const unitPrice = toNumber(item?.price ?? menuItem?.price, 0);
        const amount = quantity * unitPrice;
        const image = toAbsoluteMediaUrl(menuItem?.image_url || menuItem?.image || '');

        if (!statsMap.has(id)) {
          statsMap.set(id, {
            id,
            name,
            orders: 0,
            amount: 0,
            unitPrice,
            image,
          });
        }

        const current = statsMap.get(id);
        current.orders += quantity;
        current.amount += amount;
        if (!current.unitPrice && unitPrice) current.unitPrice = unitPrice;
        if (!current.image && image) current.image = image;
      });
    });

    return [...statsMap.values()].sort((first, second) => second.orders - first.orders || second.amount - first.amount);
  }, [allOrders]);

  const todayItemById = useMemo(
    () => new Map(todayItemStats.map((item) => [String(item.id), item])),
    [todayItemStats]
  );

  const featuredItems = useMemo(() => {
    const menuItems = Array.isArray(items) ? items : [];
    if (!menuItems.length) return [];

    return menuItems
      .map((item) => {
        const stat = todayItemById.get(String(item.id));
        return {
          id: item.id,
          name: item.name,
          price: item.price,
          orders: stat?.orders || 0,
          image: toAbsoluteMediaUrl(item.image || item.image_url || stat?.image || ''),
          is_available: item.is_available,
        };
      })
      .sort((first, second) => second.orders - first.orders || toNumber(second.price) - toNumber(first.price))
      .slice(0, 4);
  }, [items, todayItemById]);

  const dashboardInsights = useMemo(() => {
    const menuCount = Array.isArray(items) ? items.length : 0;
    const availableCount = Array.isArray(items) ? items.filter((item) => item.is_available).length : 0;
    const unavailableCount = Math.max(menuCount - availableCount, 0);
    const pendingOrders = allOrders.filter((order) => normalizeStatus(order?.status) === 'pending').length;

    return {
      menuCount,
      availableCount,
      unavailableCount,
      pendingOrders,
    };
  }, [allOrders, items]);

  const snapshotCards = useMemo(() => {
    const bestSeller = todayItemStats[0] || null;
    const revenueGoal = 50000;
    const revenueProgress = Math.min(100, Math.round((thisMonthRevenue / revenueGoal) * 100));

    return [
      {
        id: 'best-seller',
        title: 'Best Seller',
        value: bestSeller?.name || 'No sales today',
        detail: bestSeller
          ? `${bestSeller.orders} orders today • LKR ${toNumber(bestSeller.amount).toLocaleString()}`
          : 'No item has been sold today yet.',
        icon: Flame,
        tone: 'warm',
      },
      {
        id: 'menu-health',
        title: 'Menu Health',
        value: `${dashboardInsights.availableCount}/${dashboardInsights.menuCount || 0}`,
        detail:
          dashboardInsights.menuCount > 0
            ? `${dashboardInsights.unavailableCount} items paused right now`
            : 'No live items yet. Start building your menu.',
        icon: PackageCheck,
        tone: 'fresh',
      },
      {
        id: 'revenue-target',
        title: 'Revenue Target',
        value: `${revenueProgress}%`,
        detail: `LKR ${thisMonthRevenue.toLocaleString()} of LKR ${revenueGoal.toLocaleString()} goal`,
        icon: Sparkles,
        tone: 'glow',
      },
    ];
  }, [dashboardInsights, thisMonthRevenue, todayItemStats]);

  const revenueSeries = useMemo(() => {
    const today = new Date();
    const buckets = [
      { time: 'Morning', value: 0, start: 0, end: 12 },
      { time: 'Afternoon', value: 0, start: 12, end: 16 },
      { time: 'Evening', value: 0, start: 16, end: 20 },
      { time: 'Night', value: 0, start: 20, end: 24 },
    ];

    deliveredOrders.forEach((order) => {
      const orderTime = toDate(order?.updated_at || order?.created_at);
      if (!isSameDay(orderTime, today)) return;

      const hour = orderTime.getHours();
      const revenue = toNumber(order?.total_price ?? order?.total_amount);
      const bucket = buckets.find((item) => hour >= item.start && hour < item.end);
      if (bucket) bucket.value += revenue;
    });

    return buckets.map(({ time, value }) => ({ time, value }));
  }, [deliveredOrders]);

  const restaurantName =
    user?.profile?.restaurant_name ||
    data?.restaurant_name ||
    user?.username ||
    'Restaurant';

  const restaurantLocation =
    user?.profile?.address ||
    data?.location ||
    'Location not updated yet';

  const dashboardImage = user?.profile?.display_image || defaultDashboardImage;
  const locationLatitude = Number.parseFloat(user?.profile?.latitude);
  const locationLongitude = Number.parseFloat(user?.profile?.longitude);
  const hasPinnedLocation =
    Number.isFinite(locationLatitude) && Number.isFinite(locationLongitude);
  const mapCenter = hasPinnedLocation
    ? { lat: locationLatitude, lng: locationLongitude }
    : JAFFNA_UNIVERSITY_CENTER;
  const mapEmbedUrl = `https://maps.google.com/maps?q=${mapCenter.lat},${mapCenter.lng}&z=${
    hasPinnedLocation ? 16 : 13
  }&output=embed`;

  const openAddModal = () => {
    setEditingItem(null);
    setModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setModalOpen(true);
  };

  const handleSave = async (payload) => {
    if (editingItem) {
      await updateItem(editingItem.id, payload);
      addToast({
        title: 'Item updated',
        message: `${editingItem.name} saved successfully.`,
        variant: 'success',
      });
    } else {
      await createItem(payload);
      addToast({
        title: 'Item added',
        message: 'New menu item added to your dashboard.',
        variant: 'success',
      });
    }
    setEditingItem(null);
  };

  const handleDelete = async (item) => {
    if (!item?.name) {
      addToast({ title: 'Error', message: 'Invalid item selected.', variant: 'error' });
      return;
    }

    const confirmed = window.confirm(`Delete ${item.name}? This cannot be undone.`);
    if (!confirmed) return;

    try {
      await deleteItem(item.id);
      addToast({
        title: 'Item deleted',
        message: `${item.name} removed from the menu.`,
        variant: 'success',
      });
    } catch {
      addToast({ title: 'Error', message: 'Failed to delete item.', variant: 'error' });
    }
  };

  const handleToggle = async (item) => {
    if (!item?.name) {
      addToast({ title: 'Error', message: 'Invalid item selected.', variant: 'error' });
      return;
    }

    if (!window.confirm(`Mark ${item.name} as ${item.is_available ? 'out of stock' : 'available'}?`)) return;

    try {
      await toggleAvailability(item.id);
      addToast({
        title: 'Availability updated',
        message: `${item.name} is now ${item.is_available ? 'out of stock' : 'available'}.`,
        variant: 'info',
      });
    } catch {
      addToast({ title: 'Error', message: 'Failed to update availability.', variant: 'error' });
    }
  };

  const refreshOrders = async () => {
    try {
      await loadDashboard();
    } catch {
      addToast({ title: 'Error', message: 'Failed to refresh orders.', variant: 'error' });
    }
  };

  const handleAcceptOrder = (order) => {
    if (order.order_type === 'takeaway') {
      acceptOrderDirectly(order);
    } else {
      setSelectedOrder(order);
      setAcceptModalOpen(true);
    }
  };

  const acceptOrderDirectly = async (order) => {
    try {
      await api.post(`/orders/restaurant/${order.id}/accept/`, { preparation_time: 0 });
      addToast({
        title: 'Order Accepted',
        message: `Takeaway order #${order.id} accepted.`,
        variant: 'success',
      });
      await refreshOrders();
    } catch {
      addToast({ title: 'Error', message: 'Failed to accept order.', variant: 'error' });
    }
  };

  const handleRejectOrder = async (order) => {
    const reason = prompt('Reason for rejection (optional):');
    if (reason === null) return;

    try {
      await api.post(`/orders/restaurant/${order.id}/reject/`, { reason });
      addToast({
        title: 'Order Rejected',
        message: `Order #${order.id} has been rejected.`,
        variant: 'info',
      });
      await refreshOrders();
    } catch {
      addToast({ title: 'Error', message: 'Failed to reject order.', variant: 'error' });
    }
  };

  const confirmAcceptOrder = async () => {
    if (!prepTime || Number(prepTime) < 1) {
      alert('Please enter preparation time (minimum 1 minute)');
      return;
    }

    try {
      await api.post(`/orders/restaurant/${selectedOrder.id}/accept/`, {
        preparation_time: Number(prepTime),
      });

      addToast({
        title: 'Order Accepted',
        message: `Order #${selectedOrder.id} accepted. Prep time: ${prepTime} mins`,
        variant: 'success',
      });

      setAcceptModalOpen(false);
      setPrepTime('');
      setSelectedOrder(null);
      await refreshOrders();
    } catch {
      addToast({ title: 'Error', message: 'Failed to accept order.', variant: 'error' });
    }
  };

  if (error) {
    return (
      <div className="section-card" style={{ background: '#fff1f2', color: '#dc2626' }}>
        {error}
      </div>
    );
  }

  if (!data) {
    return <div className="section-card">Loading dashboard metrics...</div>;
  }

  return (
    <div className="restaurant-dashboard dashboard-mock-theme">
      <section className="dashboard-hero-card">
        <div className="dashboard-hero-card__image">
          <img
            src={dashboardImage}
            alt={`${restaurantName} dashboard`}
          />
        </div>

        <div className="dashboard-hero-card__content">
          <div className="dashboard-hero-card__top">
            <div className="dashboard-hero-card__intro">
              <p className="hero-eyebrow">Modern restaurant command center</p>
              <h2>{restaurantName}</h2>
              <p className="hero-summary">
                Track orders, highlight signature dishes, and keep today&apos;s service moving
                from one polished dashboard.
              </p>
              <p className="hero-location">
                <MapPin size={15} />
                <span>{restaurantLocation}</span>
              </p>
              <div className="hero-rating">
                <div className="hero-rating__stars">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star key={index} size={18} fill="currentColor" />
                  ))}
                </div>
                <span>
                  {data.ratings} ({data.total_reviews})
                </span>
              </div>
            </div>

            <div className="hero-actions">
              <Link to="/restaurant/menu" className="hero-link-btn">
                <span>Manage Menu</span>
                <ArrowUpRight size={15} />
              </Link>
            </div>
          </div>

          <div className="hero-map-card">
            <div className="hero-map-card__header">
              <div>
                <p className="hero-map-card__eyebrow">Location Preview</p>
                <h3>{hasPinnedLocation ? 'Pinned restaurant location' : 'Default Jaffna area view'}</h3>
              </div>
              <div className="flex items-center gap-3">
                <Link to="/restaurant/profile" className="hero-map-card__link">
                  <span>Edit in Profile</span>
                  <ArrowUpRight size={14} />
                </Link>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${mapCenter.lat},${mapCenter.lng}`}
                  target="_blank"
                  rel="noreferrer"
                  className="hero-map-card__link"
                >
                  <span>Open Map</span>
                  <ArrowUpRight size={14} />
                </a>
              </div>
            </div>

            <div className="hero-map-card__frame">
              <iframe
                title="Restaurant location preview"
                src={mapEmbedUrl}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>

            <p className="hero-map-card__note">
              {hasPinnedLocation
                ? 'This dashboard is preview-only. Update the shared location from your profile page.'
                : 'This dashboard is preview-only. Pin your exact restaurant location in Profile to replace this default Jaffna view.'}
            </p>
          </div>
        </div>
      </section>

      <section className="dashboard-highlight-strip">
        <HighlightCard
          icon={ListOrdered}
          title="Pending Queue"
          value={`${dashboardInsights.pendingOrders} orders`}
          description="Check new orders quickly and keep preparation moving without delays."
          actionLabel="Review Orders"
          actionTo="/restaurant/orders"
          accentClass="highlight-card--queue"
        />
        <HighlightCard
          icon={CircleDollarSign}
          title="Today's Revenue"
          value={`LKR ${todaysRevenue.toLocaleString()}`}
          description="Track confirmed earnings from completed orders across today's service."
          actionLabel="View Earnings"
          actionTo="/restaurant/earnings"
          accentClass="highlight-card--revenue"
        />
        <HighlightCard
          icon={MenuSquare}
          title="Menu Availability"
          value={`${dashboardInsights.availableCount} ready to sell`}
          description={`${dashboardInsights.unavailableCount} items are paused, so update the menu when stock changes.`}
          actionLabel="Manage Menu"
          actionTo="/restaurant/menu"
          accentClass="highlight-card--menu"
        />
      </section>

      <div className="dashboard-main-grid">
        <div className="dashboard-left-column">
          <section className="section-card">
            <div className="section-header">
              <h3 className="section-title">Featured Menu Items</h3>
              <Link to="/restaurant/menu" className="soft-action-btn soft-action-btn--link">
                Edit Menu
              </Link>
            </div>

            <div className="featured-menu-grid">
              {featuredItems.length ? (
                featuredItems.map((item) => <FeaturedMenuCard key={item.id} item={item} />)
              ) : (
                <div className="featured-menu-empty">No menu items yet. Add items to start tracking real sales.</div>
              )}
            </div>
          </section>

          <div className="dashboard-bottom-split">
            <section className="section-card orders-panel-card">
              <div className="section-header">
                <h3 className="section-title">Recent Orders</h3>
                <Link to="/restaurant/orders" className="soft-action-btn soft-action-btn--link">
                  View All
                </Link>
              </div>

              <div className="orders-table-wrap">
                <table className="orders-table">
                  <thead>
                    <tr>
                      <th>#ORR ID</th>
                      <th>Customer</th>
                      <th>Items</th>
                      <th>Total</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.length ? (
                      recentOrders.map((order) => (
                        <tr key={order.id}>
                          <td className="order-id">#{order.id}</td>
                          <td>
                            <OrderCustomer order={order} />
                          </td>
                          <td>{order.items?.length || 0} items</td>
                          <td className="order-total">
                            LKR {Number(order.total_price || order.total_amount || 0).toLocaleString()}
                          </td>
                          <td>
                            {order.status === 'pending' ? (
                              <div className="dashboard-order-actions">
                                <button
                                  type="button"
                                  onClick={() => handleAcceptOrder(order)}
                                  className="btn-success"
                                >
                                  Accept
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRejectOrder(order)}
                                  className="btn-danger"
                                >
                                  Reject
                                </button>
                              </div>
                            ) : (
                              <StatusBadge status={order.status} />
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="orders-empty">
                          No orders yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          <section className="section-card snapshot-card">
            <div className="section-header">
              <div>
                <h3 className="section-title">Restaurant Snapshot</h3>
                <p className="snapshot-subtitle">
                  A quick view of what matters most across your menu and daily performance.
                </p>
              </div>
            </div>

            <div className="snapshot-grid">
              {snapshotCards.map((card) => {
                const Icon = card.icon;
                return (
                  <article key={card.id} className={`snapshot-item snapshot-item--${card.tone}`}>
                    <div className="snapshot-item__top">
                      <div className="snapshot-item__icon">
                        <Icon size={18} />
                      </div>
                      <span>{card.title}</span>
                    </div>

                    <strong>{card.value}</strong>
                    <p>{card.detail}</p>

                    {card.id === 'revenue-target' ? (
                      <div className="snapshot-progress">
                        <div
                          className="snapshot-progress__bar"
                          style={{ width: card.value }}
                        />
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          </section>

        </div>

        <aside className="dashboard-right-column">
          <section className="section-card revenue-card">
            <div className="revenue-card__header">
              <div>
                <h3 className="section-title">Today's Revenue</h3>
                <p className="revenue-card__value">
                  LKR {todaysRevenue.toLocaleString()}
                </p>
              </div>

              <button type="button" className="card-icon-btn">
                <MoreHorizontal size={18} />
              </button>
            </div>

            <div className="revenue-chart-wrap">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueSeries} margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="restaurantRevenueFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f28c28" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#f28c28" stopOpacity={0.04} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="time"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#8b6f63', fontSize: 12 }}
                  />
                  <YAxis hide />
                  <Tooltip formatter={(value) => [`LKR ${Number(value).toLocaleString()}`, 'Revenue']} />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#f28c28"
                    strokeWidth={3}
                    fill="url(#restaurantRevenueFill)"
                    dot={{ r: 4, stroke: '#f28c28', strokeWidth: 2, fill: '#fff' }}
                    activeDot={{ r: 5 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="section-card status-chart-card">
            <h3 className="section-title">Order Status</h3>

            <div className="status-chart-card__chart">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    dataKey="value"
                    innerRadius={58}
                    outerRadius={84}
                    paddingAngle={3}
                  >
                    {statusData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>

              <div className="status-chart-card__center">
                <strong>{statusFocus.percent}%</strong>
                <span>{statusFocus.name}</span>
              </div>
            </div>

            <div className="status-list">
              {statusData.map((entry) => (
                <div key={entry.name} className="status-list__item">
                  <div className="status-list__label">
                    <span
                      className="status-list__dot"
                      style={{ backgroundColor: entry.color }}
                    />
                    <span>{entry.name}</span>
                  </div>
                  <span>{entry.percent}%</span>
                </div>
              ))}
            </div>
          </section>

        </aside>
      </div>

      <MenuItemModal
        open={modalOpen}
        item={editingItem}
        onClose={() => {
          setModalOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSave}
      />

      {acceptModalOpen && (
        <div className="modal-overlay" onClick={() => setAcceptModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Accept Delivery Order #{selectedOrder?.id}</h3>
            <p className="modal-description">
              How many minutes for food preparation?
            </p>

            <input
              type="number"
              min="1"
              value={prepTime}
              onChange={(e) => setPrepTime(e.target.value)}
              placeholder="e.g., 15"
              className="modal-input"
            />

            <p className="modal-note">Estimated delivery: Prep time + 30 mins delivery</p>

            <div className="modal-actions">
              <button onClick={confirmAcceptOrder} className="btn-success modal-btn-fill">
                Confirm Accept
              </button>
              <button
                onClick={() => {
                  setAcceptModalOpen(false);
                  setPrepTime('');
                  setSelectedOrder(null);
                }}
                className="btn-secondary modal-btn-fill"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
