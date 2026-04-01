import { useMemo, useState } from 'react';
import '../../pages/restaurant/RestaurantDashboard.css';
import {
  Bell,
  CircleDollarSign,
  LayoutDashboard,
  LogOut,
  MenuSquare,
  ReceiptText,
  Search,
  Store,
  User,
} from 'lucide-react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const navigation = [
  { label: 'Dashboard', to: '/restaurant/dashboard', icon: LayoutDashboard },
  { label: 'Menu Items', to: '/restaurant/menu', icon: MenuSquare },
  { label: 'Orders', to: '/restaurant/orders', icon: ReceiptText },
  { label: 'Earnings', to: '/restaurant/earnings', icon: CircleDollarSign },
];

function TopNavigation() {
  const auth = useAuth() || {};
  const { user, logout } = auth;
  const [notificationOpen, setNotificationOpen] = useState(false);
  const navigate = useNavigate();

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

          <button
            type="button"
            className="lp-navbar__icon-btn notification"
            onClick={() => setNotificationOpen(true)}
          >
            <Bell size={18} />
            <span className="dot">3</span>
          </button>

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

      {notificationOpen && (
        <div className="modal-overlay" onClick={() => setNotificationOpen(false)}>
          <div
            className="modal-content notification-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button className="modal-close" onClick={() => setNotificationOpen(false)}>
              &times;
            </button>
            <div className="modal-body">
              <h2 className="modal-title">Recent Activities</h2>
              <div className="notification-list">
                <div className="notification-item">
                  <div className="notification-icon new-order">
                    <ReceiptText size={16} />
                  </div>
                  <div className="notification-content">
                    <div className="notification-title">New Order #1234</div>
                    <div className="notification-text">Order placed for â‚¹450 â€¢ 2 items</div>
                    <div className="notification-time">2 minutes ago</div>
                  </div>
                </div>
                <div className="notification-item">
                  <div className="notification-icon payment">
                    <CircleDollarSign size={16} />
                  </div>
                  <div className="notification-content">
                    <div className="notification-title">Payment Received</div>
                    <div className="notification-text">â‚¹1,250 credited to your account</div>
                    <div className="notification-time">1 hour ago</div>
                  </div>
                </div>
                <div className="notification-item">
                  <div className="notification-icon review">
                    <Bell size={16} />
                  </div>
                  <div className="notification-content">
                    <div className="notification-title">New Review</div>
                    <div className="notification-text">5 stars - "Excellent food quality!"</div>
                    <div className="notification-time">3 hours ago</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
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
