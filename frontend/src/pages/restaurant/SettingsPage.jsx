import { ArrowRight, Bell, CreditCard, Home, Settings as SettingsIcon, Shield, Store, TrendingUp, User, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const sidebarNav = [
  { label: 'Home', to: '/restaurant/dashboard', icon: Home },
  { label: 'Restaurants', to: '/restaurant/profile', icon: Store },
  { label: 'Earnings', to: '/restaurant/earnings', icon: TrendingUp },
  { label: 'Reviews', to: '/restaurant/reviews', icon: Bell },
  { label: 'Settings', to: '/restaurant/settings', icon: SettingsIcon, active: true },
];

const settingsOptions = [
  {
    id: 'account',
    title: 'Account Settings',
    description: 'Update your profile information and account details.',
    icon: User,
  },
  {
    id: 'restaurant',
    title: 'Restaurant Profile',
    description: 'Manage restaurant information such as name, location, and hours.',
    icon: Store,
  },
  {
    id: 'users',
    title: 'Manage Users',
    description: 'Invite and manage users with different roles and permissions.',
    icon: Users,
  },
  {
    id: 'notifications',
    title: 'Notification Settings',
    description: 'Customize how you receive email and mobile notifications.',
    icon: Bell,
  },
  {
    id: 'payment',
    title: 'Payment Methods',
    description: 'Manage your payment methods and billing information.',
    icon: CreditCard,
  },
  {
    id: 'security',
    title: 'Security Settings',
    description: 'Change your password and configure security settings.',
    icon: Shield,
  },
];

export default function SettingsPage() {
  const navigate = useNavigate();

  const handleSettingClick = (settingId) => {
    console.log('Setting clicked:', settingId);
    // Future: navigate to specific setting page
    // navigate(`/restaurant/settings/${settingId}`);
  };

  const handleNavClick = (to) => {
    navigate(to);
  };

  return (
    <div className="settings-page">
      <div className="settings-header">
        <h2 className="settings-title">Settings</h2>
        <p className="settings-subtitle">Manage your restaurant's menu items and account details.</p>
      </div>

      <div className="settings-layout">
        <div className="settings-left-column">
          <div className="section-card settings-sidebar-nav">
            {sidebarNav.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.to}
                  type="button"
                  className={`settings-nav-item ${item.active ? 'active' : ''}`}
                  onClick={() => handleNavClick(item.to)}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          <div className="section-card" style={{ padding: '1rem' }}>
            <p style={{ margin: 0, color: '#8a6f61', fontSize: '0.9rem', fontWeight: 700 }}>
              More settings options coming soon.
            </p>
          </div>
        </div>

        <div className="settings-right-column">
          <div className="section-card settings-main-card">
            <h3 className="section-title">Settings</h3>
            <p className="settings-main-subtitle">Configure your restaurant dashboard preferences and account settings.</p>

            <div className="settings-options-grid">
              {settingsOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.id}
                    type="button"
                    className="settings-option-card"
                    onClick={() => handleSettingClick(option.id)}
                  >
                    <div className="settings-option-icon">
                      <Icon size={22} />
                    </div>
                    <div className="settings-option-content">
                      <h4>{option.title}</h4>
                      <p>{option.description}</p>
                    </div>
                    <div className="settings-option-arrow">
                      <ArrowRight size={20} />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>


        </div>
      </div>
    </div>
  );
}
