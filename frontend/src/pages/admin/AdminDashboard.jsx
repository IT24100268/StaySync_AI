import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  Home,
  Users,
  Building,
  Truck,
  AlertCircle,
  FileText,
  LogOut,
  Menu,
  X,
  ShoppingBag,
  BarChart3,
  Bell,
  Search,
  User,
  ChevronDown,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useMemo, useState, useRef } from "react";

const searchRoutes = [
  { label: "User Management",        keywords: ["user", "users", "student", "block", "warn", "approve"], to: "/admin/users" },
  { label: "Owner Approvals",         keywords: ["room", "hostel", "owner"], to: "/admin/rooms" },
  { label: "Restaurant Approvals",    keywords: ["restaurant", "food"], to: "/admin/restaurants" },
  { label: "Partner Approvals",       keywords: ["partner", "delivery", "driver"], to: "/admin/partners" },
  { label: "Reports Queue",           keywords: ["report", "complaint"], to: "/admin/reports" },
  { label: "Orders Monitor",          keywords: ["order", "monitor"], to: "/admin/orders" },
  { label: "Analytics",               keywords: ["analytics", "stats", "chart"], to: "/admin/analytics" },
  { label: "Activity Logs",           keywords: ["log", "activity"], to: "/admin/logs" },
  { label: "Profile",                 keywords: ["profile"], to: "/admin/profile" },
  { label: "Dashboard",               keywords: ["dashboard", "home", "overview"], to: "/admin/dashboard" },
];

const navigationGroups = [
  {
    title: "Overview",
    items: [{ name: "Dashboard", to: "/admin/dashboard", icon: Home }],
  },
  {
    title: "Moderation",
    items: [
      { name: "Owner Approvals", to: "/admin/rooms", icon: Building },
      { name: "Restaurant Approvals", to: "/admin/restaurants", icon: Building },
      { name: "Partner Approvals", to: "/admin/partners", icon: Truck },
      { name: "Reports Queue", to: "/admin/reports", icon: AlertCircle },
    ],
  },
  {
    title: "Operations",
    items: [
      { name: "Orders Monitor", to: "/admin/orders", icon: ShoppingBag },
      { name: "Analytics", to: "/admin/analytics", icon: BarChart3 },
    ],
  },
  {
    title: "Management",
    items: [
      { name: "User Management", to: "/admin/users", icon: Users },
      { name: "Activity Logs", to: "/admin/logs", icon: FileText },
      { name: "Profile", to: "/admin/profile", icon: User },
    ],
  },
];

function getInitials(name = "Admin") {
  return String(name).slice(0, 2).toUpperCase();
}

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const searchRef = useRef(null);

  const matchRoutes = (val) => {
    const q = val.trim().toLowerCase();
    if (!q) return [];
    return searchRoutes.filter((r) =>
      r.label.toLowerCase().includes(q) ||
      r.keywords.some((k) => k.includes(q))
    );
  };

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    setSearchSuggestions(matchRoutes(val).slice(0, 5));
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const matches = matchRoutes(searchQuery);
    if (matches.length > 0) navigate(matches[0].to);
    setSearchQuery("");
    setSearchSuggestions([]);
  };

  const handleSuggestionClick = (to) => {
    navigate(to);
    setSearchQuery("");
    setSearchSuggestions([]);
  };

  const initials = useMemo(() => {
    return getInitials(user?.username || "Admin");
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-[#eef3fb] text-slate-900">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="m-4 flex h-[calc(100vh-2rem)] flex-col rounded-[30px] border border-[#dfe7f3] bg-[#f8fbff] p-5 shadow-[0_14px_34px_rgba(148,163,184,0.18)]">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white font-extrabold shadow-md">
                S
              </div>
              <div>
                <p className="text-sm font-extrabold text-slate-900">StaySync AI</p>
                <p className="text-xs text-slate-500">Admin Panel</p>
              </div>
            </div>

            <button
              onClick={() => setSidebarOpen(false)}
              className="rounded-xl p-2 text-slate-600 hover:bg-white lg:hidden"
            >
              <X size={18} />
            </button>
          </div>

          <nav className="flex-1 space-y-5 overflow-y-auto pr-1">
            {navigationGroups.map((group) => (
              <div key={group.title}>
                <p className="mb-2 px-3 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                  {group.title}
                </p>

                <div className="space-y-1.5">
                  {group.items.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      className={({ isActive }) =>
                        [
                          "flex items-center gap-3 rounded-2xl px-3 py-3 transition",
                          isActive
                            ? "bg-white text-blue-700 shadow-sm border border-[#e4ebf5]"
                            : "text-slate-600 hover:bg-white hover:text-slate-900",
                        ].join(" ")
                      }
                    >
                      <item.icon size={18} />
                      <span className="font-semibold">{item.name}</span>
                    </NavLink>
                  ))}
                </div>
              </div>
            ))}
          </nav>

          <div className="mt-5 rounded-[24px] border border-[#e4ebf5] bg-white p-4">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#edf3fb] font-bold text-slate-800">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold text-slate-900">{user?.username || "Admin"}</p>
                <p className="truncate text-xs text-slate-500">{user?.email || "admin@staysync.ai"}</p>
              </div>
              <button
                onClick={handleLogout}
                className="rounded-xl p-2 text-slate-600 hover:bg-slate-50"
                title="Logout"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>
      </aside>

      <div className="lg:ml-72">
        <header className="sticky top-0 z-30 px-4 pt-4">
          <div className="rounded-[28px] border border-[#dfe7f3] bg-[#f8fbff]/95 px-5 py-4 shadow-[0_10px_24px_rgba(148,163,184,0.14)] backdrop-blur">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="rounded-2xl p-2.5 text-slate-600 hover:bg-white lg:hidden"
                >
                  <Menu size={20} />
                </button>
                <div>
                  <p className="text-xl font-extrabold text-slate-900">Dashboard</p>
                  <p className="text-xs text-slate-500">All details about your platform are here.</p>
                </div>
              </div>

              <div className="hidden w-full max-w-md md:block" ref={searchRef}>
                <form onSubmit={handleSearchSubmit} className="relative">
                  <Search
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    value={searchQuery}
                    onChange={handleSearchChange}
                    onBlur={() => setTimeout(() => setSearchSuggestions([]), 150)}
                    placeholder="Search users, reports, restaurants..."
                    className="w-full rounded-2xl border border-[#e4ebf5] bg-white px-4 py-2.5 pl-10 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
                  />
                  {searchSuggestions.length > 0 && (
                    <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-2xl border border-[#e4ebf5] bg-white shadow-lg">
                      {searchSuggestions.map((s) => (
                        <button
                          key={s.to}
                          type="button"
                          onMouseDown={() => handleSuggestionClick(s.to)}
                          className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          <Search size={14} className="text-slate-400" />
                          {s.label}
                          <span className="ml-auto text-xs text-slate-400">{s.to.replace("/admin/", "")}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </form>
              </div>

              <div className="flex items-center gap-2">
                <button className="relative rounded-2xl border border-[#e4ebf5] bg-white p-2.5 text-slate-600 hover:bg-slate-50">
                  <Bell size={18} />
                  <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
                    3
                  </span>
                </button>

                <div className="relative">
                  <button
                    onClick={() => setProfileOpen((v) => !v)}
                    className="flex items-center gap-3 rounded-2xl border border-[#e4ebf5] bg-white px-2 py-2 pr-3 hover:bg-slate-50"
                  >
                    <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[#edf3fb] font-bold text-slate-800">
                      {initials}
                    </div>
                    <div className="hidden text-left sm:block">
                      <p className="text-sm font-bold text-slate-900">{user?.username || "Admin"}</p>
                      <p className="text-xs text-slate-500">Administrator</p>
                    </div>
                    <ChevronDown size={16} className="text-slate-400" />
                  </button>

                  {profileOpen && (
                    <div
                      className="absolute right-0 mt-2 w-60 overflow-hidden rounded-[24px] border border-[#e4ebf5] bg-white shadow-[0_18px_44px_rgba(15,23,42,0.10)]"
                      onMouseLeave={() => setProfileOpen(false)}
                    >
                      <div className="border-b border-[#edf2f7] px-4 py-4">
                        <p className="font-bold text-slate-900">{user?.username || "Admin"}</p>
                        <p className="text-xs text-slate-500">{user?.email || "admin@staysync.ai"}</p>
                      </div>

                      <button
                        onClick={() => {
                          setProfileOpen(false);
                          navigate("/admin/profile");
                        }}
                        className="w-full px-4 py-3 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        Profile
                      </button>

                      <button
                        onClick={handleLogout}
                        className="w-full px-4 py-3 text-left text-sm font-semibold text-red-600 hover:bg-red-50"
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}