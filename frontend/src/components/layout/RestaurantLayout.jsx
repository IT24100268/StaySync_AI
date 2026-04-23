import { useEffect, useMemo, useRef, useState } from 'react';
import '../../pages/restaurant/RestaurantDashboard.css';
import {
  Bell,
  CircleDollarSign,
  LayoutDashboard,
  LogOut,
  MenuSquare,
  ReceiptText,
  Search,
  Star,
  Store,
  User,
} from 'lucide-react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import restaurantApi from '../../services/restaurantApi';
import api from '../../services/api';

const navigation = [
  { label: 'Dashboard', to: '/restaurant/dashboard', icon: LayoutDashboard },
  { label: 'Menu Items', to: '/restaurant/menu', icon: MenuSquare },
  { label: 'Orders', to: '/restaurant/orders', icon: ReceiptText },
  { label: 'Earnings', to: '/restaurant/earnings', icon: CircleDollarSign },
];

const toArray = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
};

function TopNavigation() {
  const auth = useAuth() || {};
  const { user, logout } = auth;
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [orders, setOrders] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [adminLogs, setAdminLogs] = useState([]);
  const [restaurantStatus, setRestaurantStatus] = useState(null);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState(new Set());
  const [deletedKeys, setDeletedKeys] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem('restaurant_notif_deleted') || '[]')); }
    catch { return new Set(); }
  });
  const [seenIds, setSeenIds] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem('restaurant_notif_seen') || '[]')); }
    catch { return new Set(); }
  });
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const [ordersRes, reviewsRes] = await Promise.allSettled([
          restaurantApi.getOrders(),
          api.get('/reviews/restaurants/'),
        ]);
        if (ordersRes.status === 'fulfilled') setOrders(toArray(ordersRes.value?.data));
        if (reviewsRes.status === 'fulfilled') setReviews(toArray(reviewsRes.value?.data));
      } catch {}

      // Fetch admin warnings via user-accessible endpoint
      try {
        const myNotifsRes = await api.get('/admin/my-notifications/');
        setAdminLogs(myNotifsRes.data?.notifications || []);
      } catch {}

      // Fetch restaurant status + review_note
      try {
        const restRes = await api.get('/restaurants/');
        const list = toArray(restRes.data?.results || restRes.data);
        if (list.length > 0) setRestaurantStatus(list[0]);
      } catch {}
    };
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setNotificationOpen(false);
        setSelectMode(false);
        setSelectedKeys(new Set());
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const notifications = useMemo(() => {
    const list = [];

    // Order notifications
    orders.forEach((order) => {
      const status = String(order?.status || '').toLowerCase();
      const key = `order-${order.id}-${status}`;
      let text = '';
      let icon = 'order';
      if (status === 'pending') { text = `New order #${order.id} is waiting for your confirmation.`; }
      else if (status === 'accepted') { text = `Order #${order.id} accepted — start preparing.`; }
      else if (status === 'delivered') { text = `Order #${order.id} delivered successfully.`; icon = 'payment'; }
      if (text) list.push({ key, text, icon, time: order.updated_at || order.created_at });
    });

    // Review notifications
    reviews.forEach((review) => {
      const key = `review-${review.id}`;
      const text = `New ${review.rating}★ review: "${String(review.comment || '').slice(0, 60)}${review.comment?.length > 60 ? '…' : ''}"`;
      list.push({ key, text, icon: 'review', time: review.created_at });
    });

    // Admin warning logs
    adminLogs.forEach((log) => {
      let details = log.details || {};
      const key = `log-${log.id}`;
      let text = log.action;
      if (details.warning_note) text = `⚠️ Warning from Admin: ${details.warning_note}`;
      else if (log.action?.toLowerCase().includes('block')) text = `🚫 ${log.action}${details.reason || details.block_reason ? `: ${details.reason || details.block_reason}` : ''}`;
      else if (log.action?.toLowerCase().includes('warn')) text = `⚠️ ${log.action}${details.warning_note ? ` — ${details.warning_note}` : ''}`;
      list.push({ key, text, icon: 'admin', time: log.created_at });
    });

    // Restaurant status notification
    if (restaurantStatus) {
      const r = restaurantStatus;
      let text = '';
      const key = `rest-status-${r.id}`;
      if (r.status === 'REJECTED') text = `❌ Restaurant Rejected: ${r.review_note || 'No reason provided'}`;
      else if (r.status === 'NEEDS_CHANGES') text = `📝 Needs Changes: ${r.review_note || 'No reason provided'}`;
      else if (r.status === 'SUSPENDED') text = `🔴 Restaurant Suspended: ${r.review_note || 'Contact admin'}`;
      else if (r.status === 'APPROVED') text = `✅ Your restaurant has been approved!`;
      else if (r.status === 'PENDING') text = `⏳ Your restaurant is pending admin approval.`;
      if (text) list.push({ key, text, icon: 'admin', time: r.reviewed_at || r.created_at });
    }

    return list
      .filter((n) => !deletedKeys.has(n.key))
      .sort((a, b) => new Date(b.time || 0) - new Date(a.time || 0))
      .slice(0, 20);
  }, [orders, reviews, adminLogs, restaurantStatus, deletedKeys, user]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !seenIds.has(n.key)).length,
    [notifications, seenIds]
  );

  const handleOpenNotifications = () => {
    setNotificationOpen((prev) => {
      if (!prev) {
        const allIds = notifications.map((n) => n.key);
        setSeenIds(new Set(allIds));
        localStorage.setItem('restaurant_notif_seen', JSON.stringify(allIds));
      } else {
        setSelectMode(false);
        setSelectedKeys(new Set());
      }
      return !prev;
    });
  };

  const handleMarkAllRead = () => {
    const allIds = notifications.map((n) => n.key);
    setSeenIds(new Set(allIds));
    localStorage.setItem('restaurant_notif_seen', JSON.stringify(allIds));
  };

  const handleDeleteAll = () => {
    const updated = new Set([...deletedKeys, ...notifications.map((n) => n.key)]);
    setDeletedKeys(updated);
    setSelectedKeys(new Set());
    localStorage.setItem('restaurant_notif_deleted', JSON.stringify([...updated]));
  };

  const handleDeleteSelected = () => {
    const updated = new Set([...deletedKeys, ...selectedKeys]);
    setDeletedKeys(updated);
    setSelectedKeys(new Set());
    localStorage.setItem('restaurant_notif_deleted', JSON.stringify([...updated]));
  };

  const handleToggleSelect = (key) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const handleSelectAll = () => {
    setSelectedKeys(
      selectedKeys.size === notifications.length
        ? new Set()
        : new Set(notifications.map((n) => n.key))
    );
  };

  const formatDate = (value) => {
    if (!value) return '';
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-LK', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const profile = useMemo(() => {
    const restaurantName =
      user?.profile?.restaurant_name ||
      user?.restaurant_name ||
      user?.username ||
      'Restaurant';

    return {
      restaurantName,
      initials: restaurantName
        .split(' ')
        .slice(0, 2)
        .map((part) => part[0])
        .join('')
        .toUpperCase(),
    };
  }, [user]);

  return (
    <div className="lp-navbar-wrap">
      <header className="lp-navbar lp-navbar--restaurant">
        <div className="lp-navbar__brand">
          <div className="lp-navbar__logo">
            <Store size={20} />
          </div>
          <div className="lp-navbar__brand-text">
            <span className="lp-navbar__title">StaySync AI</span>
            <span className="lp-navbar__subtitle">Restaurant</span>
          </div>
        </div>

        <nav className="lp-navbar__nav">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `lp-navbar__link${isActive ? ' active' : ''}`
                }
              >
                <Icon size={15} />
                <span>{item.label}</span>
                {item.badge && <span className="lp-nav-badge">{item.badge}</span>}
              </NavLink>
            );
          })}
        </nav>

        <div className="lp-navbar__actions">
          <label className="lp-navbar__search">
            <Search size={18} />
            <input type="text" placeholder="Search orders, menu, customers..." />
          </label>

          <div style={{ position: 'relative' }} ref={dropdownRef}>
            <button
              type="button"
              className="lp-navbar__icon-btn notification"
              onClick={handleOpenNotifications}
            >
              <Bell size={18} />
              {unreadCount > 0 && <span className="dot">{unreadCount}</span>}
            </button>

            {notificationOpen && (
              <div className="restaurant-notif-dropdown">
                <div className="restaurant-notif-dropdown__head">
                  <strong>Notifications</strong>
                  <span>{notifications.length} total</span>
                </div>

                {notifications.length > 0 && (
                  <div className="rest-notif-dropdown__actions">
                    <button type="button" onClick={() => {
                      if (selectMode) { setSelectMode(false); setSelectedKeys(new Set()); }
                      else setSelectMode(true);
                    }}>
                      {selectMode ? 'Cancel' : 'Select'}
                    </button>
                    {selectMode && (
                      <button type="button" onClick={handleSelectAll}>
                        {selectedKeys.size === notifications.length ? 'Deselect All' : 'Select All'}
                      </button>
                    )}
                    <button type="button" onClick={handleMarkAllRead}>Mark All Read</button>
                    {selectMode && selectedKeys.size > 0 ? (
                      <button type="button" className="rest-notif-btn--danger" onClick={handleDeleteSelected}>
                        Delete ({selectedKeys.size})
                      </button>
                    ) : (
                      <button type="button" className="rest-notif-btn--danger" onClick={handleDeleteAll}>
                        Delete All
                      </button>
                    )}
                  </div>
                )}

                {notifications.length === 0 ? (
                  <p className="restaurant-notif-dropdown__empty">No notifications yet.</p>
                ) : (
                  <ul className="restaurant-notif-dropdown__list">
                    {notifications.map((n) => (
                      <li
                        key={n.key}
                        className={[
                          'rest-notif-item',
                          seenIds.has(n.key) ? 'is-read' : '',
                          selectedKeys.has(n.key) ? 'is-selected' : '',
                        ].join(' ').trim()}
                      >
                        {selectMode && (
                          <input
                            type="checkbox"
                            className="rest-notif-item__check"
                            checked={selectedKeys.has(n.key)}
                            onChange={() => handleToggleSelect(n.key)}
                          />
                        )}
                        <span className="rest-notif-item__text">
                          {n.text}
                          <span className="rest-notif-item__time">{formatDate(n.time)}</span>
                        </span>
                        <button
                          type="button"
                          className="rest-notif-item__del"
                          onClick={() => {
                            const updated = new Set([...deletedKeys, n.key]);
                            setDeletedKeys(updated);
                            localStorage.setItem('restaurant_notif_deleted', JSON.stringify([...updated]));
                          }}
                        >
                          ✕
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          <button
            type="button"
            className="lp-navbar__icon-btn"
            onClick={() => navigate('/restaurant/profile')}
          >
            <User size={18} />
          </button>

          <button
            type="button"
            className="lp-navbar__profile"
            onClick={() => navigate('/restaurant/profile')}
          >
            <div className="lp-navbar__avatar">{profile.initials}</div>
            <div className="lp-navbar__meta">
              <span className="lp-navbar__meta-role">Restaurant</span>
              <span className="lp-navbar__meta-name">{profile.restaurantName}</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => logout?.()}
            className="lp-navbar__logout-btn"
          >
            <LogOut size={15} />
            <span>Logout</span>
          </button>
        </div>
      </header>


    </div>
  );
}

export default function RestaurantLayout() {
  return (
    <div className="restaurant-layout-shell">
      <TopNavigation />
      <main className="restaurant-layout-main">
        <Outlet />
      </main>
    </div>
  );
}
