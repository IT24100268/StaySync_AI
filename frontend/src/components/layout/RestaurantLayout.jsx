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
    };
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setNotificationOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const notifications = useMemo(() => {
    const list = [];
    orders.forEach((order) => {
      const status = String(order?.status || '').toLowerCase();
      const key = `order-${order.id}-${status}`;
      let text = '';
      let icon = 'order';
      if (status === 'pending') { text = `New order #${order.id} is waiting for your confirmation.`; icon = 'order'; }
      else if (status === 'accepted') { text = `Order #${order.id} accepted — start preparing.`; icon = 'order'; }
      else if (status === 'delivered') { text = `Order #${order.id} delivered successfully.`; icon = 'payment'; }
      if (text) list.push({ key, text, icon, time: order.updated_at || order.created_at });
    });
    reviews.forEach((review) => {
      const key = `review-${review.id}`;
      const text = `New ${review.rating}★ review: "${String(review.comment || '').slice(0, 60)}${review.comment?.length > 60 ? '…' : ''}"`;
      list.push({ key, text, icon: 'review', time: review.created_at });
    });
    return list.sort((a, b) => new Date(b.time || 0) - new Date(a.time || 0)).slice(0, 10);
  }, [orders, reviews]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !seenIds.has(n.key)).length,
    [notifications, seenIds]
  );

  const handleOpenNotifications = () => {
    setNotificationOpen((prev) => {
      if (!prev) {
        const allIds = notifications.map((n) => n.key);
        const updated = new Set(allIds);
        setSeenIds(updated);
        localStorage.setItem('restaurant_notif_seen', JSON.stringify(allIds));
      }
      return !prev;
    });
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
                {notifications.length === 0 ? (
                  <p className="restaurant-notif-dropdown__empty">No notifications yet.</p>
                ) : (
                  <ul className="restaurant-notif-dropdown__list">
                    {notifications.map((n) => (
                      <li
                        key={n.key}
                        className={`restaurant-notif-item${seenIds.has(n.key) ? ' is-read' : ''}`}
                      >
                        <div className={`notification-icon ${n.icon === 'review' ? 'review' : n.icon === 'payment' ? 'payment' : 'new-order'}`}>
                          {n.icon === 'review' ? <Star size={14} /> : n.icon === 'payment' ? <CircleDollarSign size={14} /> : <ReceiptText size={14} />}
                        </div>
                        <span>{n.text}</span>
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
