import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Bell,
  ChartNoAxesColumn,
  CircleDollarSign,
  House,
  LayoutDashboard,
  Menu,
  MessageSquare,
  Settings,
  Star,
  UtensilsCrossed,
  X,
} from 'lucide-react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import restaurantApi from '../services/restaurantApi';

const navigation = [
  { label: 'Dashboard', to: '/restaurant/dashboard', icon: LayoutDashboard },
  { label: 'Menu Items', to: '/restaurant/menu', icon: UtensilsCrossed },
  { label: 'Orders', to: '/restaurant/orders', icon: ChartNoAxesColumn, badge: '0' },
  { label: 'Reservations', to: '/restaurant/reservations', icon: MessageSquare },
  { label: 'Earnings', to: '/restaurant/earnings', icon: CircleDollarSign },
  { label: 'Reviews', to: '/restaurant/reviews', icon: Star },
  { label: 'Settings', to: '/restaurant/settings', icon: Settings },
];

function SidebarContent() {
  const [online, setOnline] = useState(true);

  return (
    <>
     <div className="mb-8 flex items-center gap-3">

  {/* Logo Icon */}
  <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center">
    <House size={20} />
  </div>

  {/* Text */}
  <h1 className="text-2xl font-bold text-white tracking-wide">
    StaySync AI
  </h1>

</div>

      <nav className="space-y-1">
        {navigation.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? 'bg-white/20 text-white shadow-sm'
                    : 'text-emerald-50/90 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              <span className="flex items-center gap-3">
                <Icon size={16} />
                {item.label}
              </span>
              {item.badge ? <span className="rounded-full bg-emerald-300 px-2 py-0.5 text-xs text-emerald-900">{item.badge}</span> : null}
            </NavLink>
          );
        })}
      </nav>

      <div className="mt-8 rounded-2xl bg-white/15 p-4 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-white">Restaurant Status</p>
          <button
            type="button"
            onClick={() => setOnline((value) => !value)}
            className={`relative h-6 w-11 rounded-full transition ${online ? 'bg-emerald-300' : 'bg-slate-400/60'}`}
          >
            <span
              className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${online ? 'left-6' : 'left-1'}`}
            />
          </button>
        </div>
        <p className="mt-2 text-xs text-emerald-50/90">{online ? 'Accepting orders now' : 'Temporarily offline'}</p>
      </div>

      <div className="mt-4 rounded-2xl bg-white p-4 text-slate-900 shadow-sm">
        <p className="text-sm font-semibold">Upgrade Plan</p>
        <p className="mt-1 text-xs text-slate-500">Unlock AI demand forecast and advanced analytics.</p>
        <button
          type="button"
          className="mt-3 w-full rounded-xl bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          Go Pro
        </button>
      </div>
    </>
  );
}

function TopNavbar() {
  const { restaurant, logout } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [seenOrderIds, setSeenOrderIds] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem('restaurant_notif_seen_ids') || '[]')); }
    catch { return new Set(); }
  });
  const initialLoadDone = useRef(false);
  const notifRef = useRef(null);

  useEffect(() => {
    const load = () => {
      restaurantApi.getOrders().then((res) => {
        const data = res?.data;
        const fetched = Array.isArray(data) ? data : Array.isArray(data?.results) ? data.results : [];
        setOrders(fetched);

        // On first load, silently mark all existing orders as seen
        // so only orders placed AFTER this point trigger the badge.
        if (!initialLoadDone.current) {
          initialLoadDone.current = true;
          const stored = localStorage.getItem('restaurant_notif_seen_ids');
          if (!stored) {
            const ids = fetched.map((o) => o.id);
            setSeenOrderIds(new Set(ids));
            localStorage.setItem('restaurant_notif_seen_ids', JSON.stringify(ids));
          }
        }
      }).catch(() => {});
    };
    load();
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const notifications = useMemo(() => {
    return orders
      .filter((order) => String(order?.status || '').toLowerCase() === 'pending')
      .map((order) => {
        const name = order.student_name || `Customer ${order.student || ''}`.trim() || 'A customer';
        const time = order.created_at || '';
        return {
          id: order.id,
          message: `🆕 New order #${order.id} from ${name} — waiting for acceptance.`,
          time,
          timestamp: new Date(time).getTime() || 0,
        };
      })
      .sort((a, b) => b.timestamp - a.timestamp);
  }, [orders]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !seenOrderIds.has(n.id)).length,
    [notifications, seenOrderIds]
  );

  const handleNotifOpen = () => {
    setNotifOpen((prev) => {
      if (!prev) {
        const allIds = notifications.map((n) => n.id);
        setSeenOrderIds((current) => {
          const updated = new Set([...current, ...allIds]);
          localStorage.setItem('restaurant_notif_seen_ids', JSON.stringify([...updated]));
          return updated;
        });
      }
      return !prev;
    });
  };

  const profile = useMemo(
    () => ({
      name: restaurant?.name || 'Restaurant Admin',
      role: 'Owner',
      initials: (restaurant?.name || 'RA')
        .split(' ')
        .slice(0, 2)
        .map((segment) => segment[0])
        .join('')
        .toUpperCase(),
    }),
    [restaurant]
  );

  return (
    <header className="sticky top-0 z-30 rounded-2xl bg-white/90 px-4 py-3 shadow-sm backdrop-blur">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-950">Restaurant Dashboard</h2>
          <p className="text-sm text-slate-600">Track performance, manage orders, and optimize service.</p>
        </div>

        <div className="flex flex-1 items-center justify-end gap-3">
          <div className="relative hidden w-full max-w-sm sm:block">
            <input
              type="text"
              placeholder="Search orders, menu, customers..."
              className="w-full rounded-full border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none ring-emerald-200 transition focus:ring-2"
            />
          </div>

          <div className="relative" ref={notifRef}>
            <button
              type="button"
              className="relative rounded-xl bg-slate-100 p-2.5 text-slate-600 hover:bg-slate-200"
              onClick={handleNotifOpen}
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 rounded-full bg-rose-500 px-1.5 text-[10px] font-semibold text-white">
                  {unreadCount}
                </span>
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 rounded-2xl border border-slate-200 bg-white shadow-xl z-50 overflow-hidden">
                <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                  <span className="text-sm font-bold text-slate-800">Notifications</span>
                  <span className="text-xs text-slate-400">{notifications.length} total</span>
                </div>
                {notifications.length === 0 ? (
                  <p className="px-4 py-5 text-center text-sm font-semibold text-slate-400">No notifications yet.</p>
                ) : (
                  <ul className="max-h-80 overflow-y-auto divide-y divide-slate-50">
                    {notifications.map((n) => (
                      <li
                        key={n.id}
                        className={`cursor-pointer px-4 py-3 text-sm transition hover:bg-slate-50 ${
                          !seenOrderIds.has(n.id) ? 'font-semibold text-slate-700 bg-emerald-50' : 'text-slate-400'
                        }`}
                        onClick={() => { setNotifOpen(false); navigate('/restaurant/orders'); }}
                      >
                        {n.message}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          <button type="button" className="rounded-xl bg-slate-100 p-2.5 text-slate-600 hover:bg-slate-200">
            <MessageSquare size={18} />
          </button>
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-700">
              {profile.initials}
            </div>
            <div className="hidden text-left sm:block">
              <p className="text-sm font-semibold">{profile.name}</p>
              <p className="text-xs text-slate-500">{profile.role}</p>
            </div>
            <button type="button" onClick={logout} className="text-xs font-medium text-slate-500 hover:text-slate-700">
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

export default function DashboardLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50">
      <aside className="fixed inset-y-0 left-0 hidden w-72 flex-col bg-gradient-to-b from-emerald-900 via-emerald-800 to-teal-700 p-6 lg:flex">
        <SidebarContent />
      </aside>

      <div className="lg:ml-72">
        <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
          <p className="text-sm font-semibold text-slate-900">StaySync AI</p>
          <button type="button" onClick={() => setMobileOpen(true)} className="rounded-lg bg-slate-100 p-2">
            <Menu size={18} />
          </button>
        </div>

        {mobileOpen ? (
          <div className="fixed inset-0 z-40 bg-slate-900/40 lg:hidden" onClick={() => setMobileOpen(false)}>
            <aside
              className="h-full w-72 bg-gradient-to-b from-emerald-900 via-emerald-800 to-teal-700 p-6"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mb-4 flex justify-end">
                <button type="button" onClick={() => setMobileOpen(false)} className="rounded-lg bg-white/20 p-1.5 text-white">
                  <X size={16} />
                </button>
              </div>
              <SidebarContent />
            </aside>
          </div>
        ) : null}

        <main className="space-y-6 p-4 md:p-6">
          <TopNavbar />
          <Outlet />
        </main>
      </div>
    </div>
  );
}
