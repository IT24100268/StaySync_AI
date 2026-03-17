import { useEffect, useMemo, useState } from 'react';
import {
  ChevronDown,
  MapPin,
  MoreHorizontal,
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
import api from '../services/api';
import StatusBadge from '../components/StatusBadge';
import MenuItemModal from '../components/menu/MenuItemModal';
import MenuItemsSection from '../components/menu/MenuItemsSection';
import { useFoodItems } from '../context/FoodItemsContext';
import { useToast } from '../context/ToastContext';
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

function DashboardStat({ label, value, detail }) {
  return (
    <div className="hero-stat">
      <p className="hero-stat__label">{label}</p>
      <div className="hero-stat__value-row">
        <h3>{value}</h3>
        <span>{detail}</span>
      </div>
    </div>
  );
}

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

          <button type="button" className="featured-menu-card__action" onClick={() => onEdit?.(item)}>
            <ChevronDown size={14} />
          </button>
        </div>
      </div>
    </article>
  );
}

export default function RestaurantDashboard() {
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
        const ordersResponse = await api.get('/orders/restaurant/orders/');
        const rawOrders = Array.isArray(ordersResponse.data)
          ? ordersResponse.data
          : (ordersResponse.data.results || []);

        const today = new Date().toDateString();

        const todays_orders_count = rawOrders.filter(
          (o) => new Date(o.created_at).toDateString() === today
        ).length;

        const total_revenue = rawOrders
          .filter((o) => ['delivered', 'completed'].includes(o.status))
          .reduce((sum, o) => sum + Number(o.total_price || o.total_amount || 0), 0);

        const active_orders = rawOrders.filter((o) =>
          ['pending', 'accepted', 'preparing', 'ready', 'out_for_delivery'].includes(o.status)
        ).length;

        setData({
          todays_orders_count,
          total_revenue,
          active_orders,
          ratings: 4.8,
          recent_orders: rawOrders.slice(0, 5),
          total_reviews: 248,
          restaurant_name: 'Pizza Delight',
          location: 'Malabe',
        });
      } catch (err) {
        setError('Failed to load dashboard overview.');
      }
    };

    fetchOverview();
  }, []);

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
    const ordersResponse = await api.get('/orders/restaurant/orders/');
    const orders = Array.isArray(ordersResponse.data)
      ? ordersResponse.data
      : (ordersResponse.data.results || []);

    setData((prev) => ({
      ...prev,
      recent_orders: orders.slice(0, 5),
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
            src="https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=1400&q=80"
            alt="Restaurant hero"
          />
        </div>

        <div className="dashboard-hero-card__content">
          <div className="dashboard-hero-card__top">
            <div>
              <h2>{data.restaurant_name}</h2>
              <p className="hero-location">
                <MapPin size={15} />
                <span>{data.location}</span>
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

            <button type="button" className="hero-open-btn">
              <span>Open</span>
              <ChevronDown size={16} />
            </button>
          </div>

          <div className="dashboard-hero-card__stats">
            <DashboardStat
              label="Today's Orders"
              value={data.todays_orders_count}
              detail="+ 8.4%"
            />
            <DashboardStat
              label="Active Orders"
              value={data.active_orders}
              detail="+ 2 active now"
            />
          </div>
        </div>
      </section>

      <div className="dashboard-main-grid">
        <div className="dashboard-left-column">
          <section className="section-card">
            <div className="section-header">
              <h3 className="section-title">Featured Menu Items</h3>
              <button type="button" className="soft-action-btn">
                Edit Menu
              </button>
            </div>

            <div className="featured-menu-grid">
              {(items?.length ? items.slice(0, 3).map((item, index) => ({
                id: item.id,
                name: item.name,
                price: item.price,
                rating: 4.5 + index * 0.1,
                orders: 7 + index * 2,
                image:
                  item.image ||
                  item.image_url ||
                  mockFeaturedItems[index]?.image,
              })) : mockFeaturedItems).map((item) => (
                <FeaturedMenuCard key={item.id} item={item} onEdit={openEditModal} />
              ))}
            </div>
          </section>

          <div className="dashboard-bottom-split">
            <section className="promo-status-card">
              <div className="promo-status-card__top">
                <div>
                  <h4>Restaurant Status</h4>
                  <p>Open</p>
                </div>

                <label className="switch">
                  <input type="checkbox" defaultChecked />
                  <span className="slider" />
                </label>
              </div>

              <div className="promo-status-card__body">
                <h5>Upgrade Plan</h5>
                <p>Unlock advanced insights and analytics.</p>
                <button type="button">Go Pro</button>
              </div>
            </section>

            <section className="section-card orders-panel-card">
              <div className="section-header">
                <h3 className="section-title">Recent Orders</h3>
                <button type="button" className="soft-action-btn">
                  View All
                </button>
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

          <section className="section-card popular-list-card">
            <div className="section-header">
              <h3 className="section-title">Recent Orders</h3>
            </div>

            <div className="mini-popular-grid">
              {mockFeaturedItems.map((item) => (
                <article key={item.id} className="mini-popular-item">
                  <img src={item.image} alt={item.name} />
                  <h4>{item.name.replace('Chicken ', '')}</h4>
                  <p>{item.orders + 20} orders</p>
                </article>
              ))}
            </div>
          </section>
        </div>

        <aside className="dashboard-right-column">
          <section className="section-card revenue-card">
            <div className="revenue-card__header">
              <div>
                <h3 className="section-title">Today's Revenue</h3>
                <p className="revenue-card__value">
                  LKR {Number(data.total_revenue || 54320).toLocaleString()}
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

          <section className="section-card popular-items-card">
            <h3 className="section-title">Popular Items Today</h3>

            <div className="popular-items-card__grid">
              {mockFeaturedItems.slice(0, 2).map((item) => (
                <article key={item.id} className="popular-items-card__item">
                  <img src={item.image} alt={item.name} />
                  <h4>{item.name.includes('Pizza') ? 'Pizza' : item.name.includes('Burger') ? 'Burger' : item.name}</h4>
                  <p>{item.orders + 25} orders</p>
                </article>
              ))}
            </div>

            <button type="button" className="popular-items-card__button">
              View Menu
            </button>
          </section>
        </aside>
      </div>

      <section className="menu-items-theme-wrapper">
        <MenuItemsSection
          items={items}
          loading={itemsLoading}
          error={itemsError}
          onAdd={openAddModal}
          onEdit={openEditModal}
          onDelete={handleDelete}
          onToggle={handleToggle}
        />
      </section>

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