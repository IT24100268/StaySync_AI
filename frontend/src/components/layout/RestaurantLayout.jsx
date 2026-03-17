import { useMemo, useState } from 'react';
import '../../pages/RestaurantDashboard.css';
import {
  Bell,
  CircleDollarSign,
  Grid3X3,
  LayoutDashboard,
  LogOut,
  MenuSquare,
  ReceiptText,
  Search,
  Settings,
  Store,
  User,
} from 'lucide-react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const navigation = [
  { label: 'Dashboard', to: '/restaurant/dashboard', icon: LayoutDashboard },
  { label: 'Menu Items', to: '/restaurant/menu', icon: MenuSquare, badge: 12 },
  { label: 'Orders', to: '/restaurant/orders', icon: ReceiptText },
  { label: 'Earnings', to: '/restaurant/earnings', icon: CircleDollarSign },
  { label: 'Settings', to: '/restaurant/settings', icon: Settings },
];

function TopNavigation() {
  const auth = useAuth() || {};
  const { user, logout } = auth;

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
      <header className="lp-navbar">
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
          <div className="lp-navbar__profile">
            <div className="lp-navbar__avatar">{profile.initials}</div>
            <div className="lp-navbar__meta">
              <span className="lp-navbar__meta-role">Restaurant</span>
              <span className="lp-navbar__meta-name">{profile.restaurantName}</span>
            </div>
          </div>
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

function PageToolbar() {
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    restaurant_name: '',
    phone_number: '',
    address: '',
  });
  const [message, setMessage] = useState('');

  const handleOpen = async () => {
    setProfileOpen(true);
    setEditing(false);
    setMessage('');
    try {
      const res = await api.get('/restaurant/profile/');
      const r = res.data;
      setFormData({
        username: user?.username || '',
        email: r?.email || user?.email || '',
        restaurant_name: r?.name || '',
        phone_number: r?.phone || '',
        address: r?.address || '',
      });
    } catch {
      setFormData({
        username: user?.username || '',
        email: user?.email || '',
        restaurant_name: '',
        phone_number: '',
        address: '',
      });
    }
  };

  const handleSave = async () => {
    try {
      await api.put('/restaurant/profile/', {
        name: formData.restaurant_name,
        email: formData.email,
        phone: formData.phone_number,
        address: formData.address,
      });
      setMessage('Profile updated successfully!');
      setEditing(false);
      setTimeout(() => setMessage(''), 3000);
    } catch {
      setMessage('Failed to update profile.');
    }
  };

  return (
    <section className="restaurant-page-toolbar">
      <div className="restaurant-page-toolbar__title">
        <div className="restaurant-page-toolbar__title-icon">
          <LayoutDashboard size={18} />
        </div>
        <h1>Dashboard</h1>
      </div>

      <div className="restaurant-page-toolbar__controls">
        <div className="restaurant-search">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search orders, menu, customers..."
          />
        </div>

        <button
          type="button"
          className="restaurant-toolbar-icon-btn notification"
          onClick={() => setNotificationOpen(true)}
        >
          <Bell size={18} />
          <span className="dot">3</span>
        </button>

        <button
          type="button"
          className="restaurant-toolbar-icon-btn"
          onClick={handleOpen}
        >
          <User size={18} />
        </button>

        <button type="button" className="restaurant-toolbar-icon-btn">
          <Grid3X3 size={18} />
        </button>
      </div>

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
                    <div className="notification-text">Order placed for ₹450 • 2 items</div>
                    <div className="notification-time">2 minutes ago</div>
                  </div>
                </div>
                <div className="notification-item">
                  <div className="notification-icon payment">
                    <CircleDollarSign size={16} />
                  </div>
                  <div className="notification-content">
                    <div className="notification-title">Payment Received</div>
                    <div className="notification-text">₹1,250 credited to your account</div>
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

      {profileOpen && (
        <div className="modal-overlay" onClick={() => setProfileOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setProfileOpen(false)}>
              &times;
            </button>
            <div className="modal-body">
              <h2 className="modal-title">Restaurant Profile</h2>
              {message && <div className="profile-message">{message}</div>}
              <div className="profile-details">
                <div className="profile-detail-item">
                  <User size={18} className="profile-icon" />
                  <div style={{ flex: 1 }}>
                    <div className="profile-label">Username</div>
                    {editing ? (
                      <input
                        value={formData.username}
                        onChange={(e) =>
                          setFormData({ ...formData, username: e.target.value })
                        }
                        className="profile-input"
                      />
                    ) : (
                      <div className="profile-value">{formData.username || 'N/A'}</div>
                    )}
                  </div>
                </div>

                <div className="profile-detail-item">
                  <Bell size={18} className="profile-icon" />
                  <div style={{ flex: 1 }}>
                    <div className="profile-label">Email</div>
                    {editing ? (
                      <input
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        className="profile-input"
                      />
                    ) : (
                      <div className="profile-value">{formData.email || 'N/A'}</div>
                    )}
                  </div>
                </div>

                <div className="profile-detail-item">
                  <Store size={18} className="profile-icon" />
                  <div style={{ flex: 1 }}>
                    <div className="profile-label">Restaurant Name</div>
                    {editing ? (
                      <input
                        value={formData.restaurant_name}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            restaurant_name: e.target.value,
                          })
                        }
                        className="profile-input"
                      />
                    ) : (
                      <div className="profile-value">
                        {formData.restaurant_name || 'N/A'}
                      </div>
                    )}
                  </div>
                </div>

                <div className="profile-detail-item">
                  <Bell size={18} className="profile-icon" />
                  <div style={{ flex: 1 }}>
                    <div className="profile-label">Phone</div>
                    {editing ? (
                      <input
                        value={formData.phone_number}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            phone_number: e.target.value,
                          })
                        }
                        className="profile-input"
                      />
                    ) : (
                      <div className="profile-value">{formData.phone_number || 'N/A'}</div>
                    )}
                  </div>
                </div>

                <div className="profile-detail-item">
                  <Bell size={18} className="profile-icon" />
                  <div style={{ flex: 1 }}>
                    <div className="profile-label">Address</div>
                    {editing ? (
                      <textarea
                        value={formData.address}
                        onChange={(e) =>
                          setFormData({ ...formData, address: e.target.value })
                        }
                        className="profile-input"
                        rows="2"
                      />
                    ) : (
                      <div className="profile-value">{formData.address || 'N/A'}</div>
                    )}
                  </div>
                </div>
              </div>

              <div className="profile-actions">
                {editing ? (
                  <>
                    <button onClick={handleSave} className="profile-btn-save">
                      Save Changes
                    </button>
                    <button
                      onClick={() => setEditing(false)}
                      className="profile-btn-cancel"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setEditing(true)}
                    className="profile-btn-edit"
                  >
                    Edit Profile
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default function RestaurantLayout() {
  return (
    <div className="restaurant-layout-shell">
      <TopNavigation />
      <main className="restaurant-layout-main">
        <PageToolbar />
        <Outlet />
      </main>
    </div>
  );
}