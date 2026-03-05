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
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useMemo, useState } from "react";

const navigationGroups = [
  {
    title: "Overview",
    items: [{ name: "Dashboard", to: "/admin/dashboard", icon: Home }],
  },
  {
    title: "Moderation",
    items: [
      { name: "Room Approvals", to: "/admin/rooms", icon: Building },
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
    ],
  },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const initials = useMemo(() => {
    const name = user?.username || "Admin";
    return name.slice(0, 2).toUpperCase();
  }, [user]);

  const GLASS =
    "bg-white/55 backdrop-blur-xl border border-white/40 shadow-[0_10px_30px_rgba(15,23,42,0.10)]";

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-200 via-sky-200 to-purple-200" />
      <div className="absolute -top-28 -left-28 w-[26rem] h-[26rem] bg-blue-500/20 rounded-full blur-3xl" />
      <div className="absolute top-20 -right-28 w-[30rem] h-[30rem] bg-purple-500/20 rounded-full blur-3xl" />
      <div className="absolute bottom-[-10rem] left-1/3 w-[34rem] h-[34rem] bg-sky-500/20 rounded-full blur-3xl" />

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 transform transition-transform lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className={`h-full m-4 rounded-3xl ${GLASS}`}>
          <div className="flex flex-col h-full p-5">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white grid place-items-center font-extrabold">
                  S
                </div>
                <div>
                  <p className="font-extrabold text-slate-900 leading-5">
                    StaySync AI
                  </p>
                  <p className="text-xs text-slate-600">Admin Panel</p>
                </div>
              </div>

              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden p-2 rounded-xl hover:bg-white/60"
              >
                <X size={18} className="text-slate-700" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto pr-1 space-y-5">
              {navigationGroups.map((group, idx) => (
                <div key={idx}>
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider px-3 mb-2">
                    {group.title}
                  </p>

                  <div className="space-y-1">
                    {group.items.map((item) => (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        className={({ isActive }) =>
                          [
                            "flex items-center gap-3 px-3 py-3 rounded-2xl transition",
                            "border border-transparent",
                            isActive
                              ? "bg-white/70 border-white/60 text-slate-900 shadow-sm"
                              : "text-slate-700 hover:bg-white/55 hover:border-white/50",
                          ].join(" ")
                        }
                      >
                        <item.icon size={18} className="opacity-90" />
                        <span className="font-semibold">{item.name}</span>
                      </NavLink>
                    ))}
                  </div>
                </div>
              ))}
            </nav>

            <div className="mt-4 pt-4 border-t border-white/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/70 border border-white/50 grid place-items-center font-bold text-slate-800">
                  {initials}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-slate-900">
                    {user?.username || "admin"}
                  </p>
                  <p className="text-xs text-slate-600">Administrator</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-xl hover:bg-white/60"
                  title="Logout"
                >
                  <LogOut size={18} className="text-slate-700" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="relative lg:ml-72">
        {/* Topbar */}
        <header className="sticky top-0 z-40 px-4 pt-4">
          <div className={`rounded-3xl ${GLASS}`}>
            <div className="flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden p-2 rounded-xl hover:bg-white/60"
                >
                  <Menu size={20} className="text-slate-700" />
                </button>
                <p className="font-extrabold text-slate-900">Admin Dashboard</p>
              </div>

              <div className="hidden md:flex items-center gap-3 w-[420px]">
                <div className="relative w-full">
                  <Search
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                  />
                  <input
                    className="w-full pl-10 pr-3 py-2.5 rounded-2xl bg-white/60 border border-white/50 outline-none focus:ring-2 focus:ring-blue-300"
                    placeholder="Search users, rooms, reports..."
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  className="p-2 rounded-xl hover:bg-white/60"
                  title="Notifications"
                >
                  <Bell size={18} className="text-slate-700" />
                </button>
                <div className="w-9 h-9 rounded-2xl bg-white/70 border border-white/50 grid place-items-center font-bold text-slate-800">
                  {initials}
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="p-4 lg:p-6">
          <Outlet />
        </main>
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}