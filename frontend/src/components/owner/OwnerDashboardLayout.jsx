import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  Home,
  List,
  MessageSquare,
  BarChart3,
  CheckCircle,
  LogOut,
  Menu,
  X,
  Bell,
  Search,
  ChevronDown,
  Building2,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useMemo, useState } from "react";

const navigation = [
  { name: "Dashboard", to: "/owner/dashboard", icon: Home },
  { name: "Listings", to: "/owner/listings", icon: List },
  { name: "Enquiries", to: "/owner/enquiries", icon: MessageSquare },
  { name: "Analytics", to: "/owner/analytics", icon: BarChart3 },
  { name: "Verification", to: "/owner/verification", icon: CheckCircle },
];

function getInitials(nameOrEmail = "") {
  const s = String(nameOrEmail).trim();
  if (!s) return "U";
  const parts = s.split(" ").filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function OwnerDashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const displayName = useMemo(() => {
    return user?.username || user?.email || "Owner";
  }, [user]);

  const initials = useMemo(() => {
    return getInitials(user?.username || user?.email);
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-slate-950 text-white transform transition-transform lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Brand */}
          <div className="px-6 py-5 border-b border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center">
                  <Building2 size={20} />
                </div>
                <div>
                  <p className="text-sm text-white/70">StaySync AI</p>
                  <h1 className="text-lg font-extrabold tracking-tight">
                    Owner Portal
                  </h1>
                </div>
              </div>

              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden p-2 rounded-lg hover:bg-white/10"
                aria-label="Close sidebar"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Nav */}
          <nav className="px-4 py-4 space-y-1 flex-1">
            {navigation.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/owner/dashboard"}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  [
                    "flex items-center gap-3 px-4 py-3 rounded-xl transition",
                    isActive
                      ? "bg-white/12 text-white ring-1 ring-white/10"
                      : "text-white/70 hover:text-white hover:bg-white/8",
                  ].join(" ")
                }
              >
                <item.icon size={18} />
                <span className="font-semibold">{item.name}</span>
              </NavLink>
            ))}
          </nav>

          {/* User + logout */}
          <div className="px-6 py-5 border-t border-white/10">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center font-bold">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="font-semibold truncate">{displayName}</p>
                <p className="text-xs text-white/60 truncate">{user?.email}</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 transition font-semibold"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="lg:ml-72">
        {/* Topbar */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b border-slate-200">
          <div className="px-4 sm:px-6 py-4 flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl hover:bg-slate-100"
              aria-label="Open sidebar"
            >
              <Menu size={22} />
            </button>

            <div className="flex-1">
              {/* Search */}
              <div className="relative max-w-xl">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  placeholder="Search listings, enquiries..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                />
              </div>
            </div>

            {/* Actions */}
            <button
              className="p-2.5 rounded-xl hover:bg-slate-100 relative"
              aria-label="Notifications"
              title="Notifications"
            >
              <Bell size={20} />
              {/* badge */}
              <span className="absolute -top-0.5 -right-0.5 h-4 w-4 text-[10px] bg-blue-600 text-white rounded-full grid place-items-center">
                3
              </span>
            </button>

            {/* Profile dropdown */}
            <div className="relative">
              <button
                onClick={() => setProfileOpen((v) => !v)}
                className="flex items-center gap-3 pl-2 pr-3 py-2 rounded-xl hover:bg-slate-100"
                aria-label="Profile menu"
              >
                <div className="h-9 w-9 rounded-full bg-slate-900 text-white grid place-items-center font-bold">
                  {initials}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-bold leading-4">{displayName}</p>
                  <p className="text-xs text-slate-500">Hostel owner</p>
                </div>
                <ChevronDown size={18} className="text-slate-500" />
              </button>

              {profileOpen && (
                <div
                  className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden"
                  onMouseLeave={() => setProfileOpen(false)}
                >
                  <div className="px-4 py-3 border-b border-slate-100">
                    <p className="text-sm font-bold truncate">{displayName}</p>
                    <p className="text-xs text-slate-500 truncate">
                      {user?.email}
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      navigate("/owner/verification");
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-slate-50 text-sm font-semibold"
                  >
                    Verification
                  </button>

                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-3 hover:bg-slate-50 text-sm font-semibold text-red-600"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="px-4 sm:px-6 py-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}