import { useEffect, useMemo, useState } from 'react';
import {
  ArrowUpRight,
  CircleDollarSign,
  ChevronDown,
  Clock3,
  Flame,
  ListOrdered,
  MapPin,
  MenuSquare,
  MoreHorizontal,
  PackageCheck,
  Sparkles,
  Star,
  Store,
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

const revenueSeries = [
  { time: 'Morning', value: 9000 },
  { time: 'Afternoon', value: 14000 },
  { time: 'Evening', value: 26500 },
  { time: 'Night', value: 32000 },
];

const mockFeaturedItems = [
  {
    id: 1,
    name: 'Margherita Pizza',
    price: 1200,
    rating: 4.7,
    orders: 14,
    image:
      'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 2,
    name: 'Chicken Burger',
    price: 350,
    rating: 4.6,
    orders: 9,
    image:
      'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 3,
    name: 'Caesar Salad',
    price: 900,
    rating: 4.5,
    orders: 7,
    image:
      'https://images.unsplash.com/photo-1546793665-c74683f339c1?auto=format&fit=crop&w=1200&q=80',
  },
];

const defaultDashboardImage =
  'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=1400&q=80';
const JAFFNA_UNIVERSITY_CENTER = { lat: 9.6848, lng: 80.0220 };

function OrderCustomer({ order }) {
  const label = order.student_name || `Customer ${order.student || ''}`.trim() || 'Customer';

  const initials = label
    .split(' ')
    .slice(0, 2)
    .map((segment) => segment[0])
    .join('')
    .toUpperCase();

  return (
    <div className="order-customer">
      <div className="order-customer__avatar">{initials}</div>
      <span>{label}</span>
    </div>
  );
}

function FeaturedMenuCard({ item, onEdit }) {
  return (
    <article className="featured-menu-card">
      <div className="featured-menu-card__image-wrap">
        <img src={item.image} alt={item.name} className="featured-menu-card__image" />
      </div>

      <div className="featured-menu-card__content">
        <h4>{item.name}</h4>
        <p className="featured-menu-card__price">
          LKR {Number(item.price).toLocaleString()}
          <span>
            <Star size={13} fill="currentColor" />
            {item.rating}
          </span>
        </p>
        <p className="featured-menu-card__orders">{item.orders} Orders Today</p>

        <div className="featured-menu-card__footer">
          <div className="featured-menu-card__mini-rating">
            <Star size={14} fill="currentColor" />
            <span>{item.rating}</span>
          </div>
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

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        const response = await restaurantApi.getDashboardOverview();
        setData({
          total_reviews: 248,
          restaurant_name: user?.profile?.restaurant_name || user?.username || 'Restaurant',
          location: user?.profile?.address || 'Location not updated yet',
          ...response.data,
          recent_orders: response.data?.recent_orders || [],
        });
      } catch (err) {
        setError('Failed to load dashboard overview.');
      }
    };

    fetchOverview();
  }, [user]);

  const statusData = useMemo(() => {
    const orders = data?.recent_orders || [];
    const total = orders.length || 1;

    const counts = {
      pending: orders.filter((o) => o.status === 'pending').length,
      preparing: orders.filter((o) => ['accepted', 'preparing'].includes(o.status)).length,
      out_for_delivery: orders.filter((o) => o.status === 'out_for_delivery').length,
      completed: orders.filter((o) => ['delivered', 'completed'].includes(o.status)).length,
    };

    return [
      {
        name: 'Pending',
        value: counts.pending,
        percent: Math.round((counts.pending / total) * 100),
        color: '#f4b43a',
      },
      {
        name: 'Preparing',
        value: counts.preparing,
        percent: Math.round((counts.preparing / total) * 100),
        color: '#f28c28',
      },
      {
        name: 'Out for delivery',
        value: counts.out_for_delivery,
        percent: Math.round((counts.out_for_delivery / total) * 100),
        color: '#4f7cf7',
      },
      {
        name: 'Completed',
        value: counts.completed,
        percent: Math.round((counts.completed / total) * 100),
        color: '#44b649',
      },
    ].filter((item) => item.value > 0 || orders.length === 0);
  }, [data]);

  const pendingPercent = useMemo(() => {
    const pending = statusData.find((item) => item.name === 'Pending');
    return pending?.percent || 0;
  }, [statusData]);

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

  const featuredItems = useMemo(() => {
    if (items?.length) {
      return items.slice(0, 4).map((item, index) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        rating: item.rating || 4.5 + index * 0.1,
        orders: item.orders_today || item.order_count || 8 + index * 2,
        image: item.image || item.image_url || mockFeaturedItems[index % mockFeaturedItems.length]?.image,
        is_available: item.is_available,
      }));
    }

    return mockFeaturedItems;
  }, [items]);

  const dashboardInsights = useMemo(() => {
    const menuCount = items?.length || 0;
    const availableCount = items?.filter((item) => item.is_available).length || 0;
    const unavailableCount = Math.max(menuCount - availableCount, 0);
    const pendingOrders =
      data?.recent_orders?.filter((order) => order.status === 'pending').length || 0;

    return {
      menuCount,
      availableCount,
      unavailableCount,
      pendingOrders,
      featuredNames: featuredItems.slice(0, 3).map((item) => item.name),
    };
  }, [data, featuredItems, items]);

  const snapshotCards = useMemo(() => {
    const bestSeller = featuredItems[0];
    const revenueGoal = 50000;
    const revenueProgress = Math.min(
      100,
      Math.round((Number(data?.total_revenue || 0) / revenueGoal) * 100)
    );

    return [
      {
        id: 'best-seller',
        title: 'Best Seller',
        value: bestSeller?.name || 'Add menu items',
        detail: bestSeller
          ? `${bestSeller.orders} orders today • LKR ${Number(bestSeller.price || 0).toLocaleString()}`
          : 'Showcase your top dish by adding menu items',
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
        detail: `LKR ${Number(data?.total_revenue || 0).toLocaleString()} of LKR ${revenueGoal.toLocaleString()} goal`,
        icon: Sparkles,
        tone: 'glow',
      },
    ];
  }, [data, dashboardInsights, featuredItems]);

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
    const response = await restaurantApi.getDashboardOverview();
    setData((prev) => ({
      ...prev,
      ...response.data,
      recent_orders: response.data?.recent_orders || [],
    }));
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
          value={`LKR ${Number(data.total_revenue || 0).toLocaleString()}`}
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
              {featuredItems.map((item) => (
                <FeaturedMenuCard key={item.id} item={item} onEdit={openEditModal} />
              ))}
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
                    {data.recent_orders.length ? (
                      data.recent_orders.map((order) => (
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
                  LKR {Number(data.total_revenue || 0).toLocaleString()}
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
                <strong>{pendingPercent}%</strong>
                <span>Pending</span>
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
