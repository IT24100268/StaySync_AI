import { useMemo, useState } from 'react';
import {
  Bell,
  ChartNoAxesColumn,
  CircleDollarSign,
  LayoutDashboard,
  Menu,
  MessageSquare,
  Settings,
  Star,
  UtensilsCrossed,
  X,
} from 'lucide-react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

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
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/10 text-white">
          <span className="text-xl" role="img" aria-label="Home">
            &#127968;
          </span>
        </div>
        <h1 className="text-2xl font-bold text-white tracking-wide">StaySync AI</h1>
      </div>

      <nav className="space-y-1">
        {navigation.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                  isActive
                    ? 'bg-white/20 text-white shadow-sm'
                    : 'text-slate-200 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              <span className="flex items-center gap-3">
                <Icon size={16} />
                {item.label}
              </span>
              {item.badge ? (
                <span className="rounded-full bg-blue-200 px-2 py-0.5 text-xs font-semibold text-blue-900">
                  {item.badge}
                </span>
              ) : null}
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
            className={`relative h-6 w-11 rounded-full transition ${online ? 'bg-blue-400' : 'bg-slate-400/60'}`}
          >
            <span
              className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${online ? 'left-6' : 'left-1'}`}
            />
          </button>
        </div>
        <p className="mt-2 text-xs text-slate-200">{online ? 'Accepting orders now' : 'Temporarily offline'}</p>
      </div>

      <div className="mt-4 rounded-2xl bg-white p-4 text-slate-900 shadow-sm">
        <p className="text-sm font-semibold">Upgrade Plan</p>
        <p className="mt-1 text-xs text-slate-500">Unlock AI demand forecast and advanced analytics.</p>
        <button type="button" className="mt-3 w-full rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700">
          Go Pro
        </button>
      </div>
    </>
  );
}

function TopNavbar() {
  const { restaurant, logout } = useAuth();

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
          <h2 className="text-xl font-bold text-slate-950">Restaurant Dashboard</h2>
          <p className="text-sm text-slate-600">Track performance, manage orders, and optimize service.</p>
        </div>

        <div className="flex flex-1 items-center justify-end gap-3">
          <div className="relative hidden w-full max-w-sm sm:block">
            <input
              type="text"
              placeholder="Search orders, menu, customers..."
              className="w-full rounded-full border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none ring-blue-200 transition focus:ring-2"
            />
          </div>

          <button type="button" className="relative rounded-xl bg-slate-100 p-2.5 text-slate-600 hover:bg-slate-200">
            <Bell size={20} />
            <span className="absolute -right-1 -top-1 rounded-full bg-rose-500 px-1.5 text-[10px] font-semibold text-white">4</span>
          </button>

          <button type="button" className="rounded-xl bg-slate-100 p-2.5 text-slate-600 hover:bg-slate-200">
            <MessageSquare size={18} />
          </button>

          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
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

export default function RestaurantLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50">
      <aside className="fixed inset-y-0 left-0 hidden w-72 flex-col bg-gradient-to-b from-slate-900 to-blue-900 p-6 lg:flex">
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
              className="h-full w-72 bg-gradient-to-b from-slate-900 to-blue-900 p-6"
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