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
      { name: "Profile", to: "/admin/profile", icon: User },
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

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-slate-200">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } bg-slate-100 border-r border-slate-200`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-200 bg-white">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-500 text-white grid place-items-center font-bold shadow-lg shadow-blue-500/30">
              S
            </div>
            <div>
              <p className="font-bold text-slate-900">StaySync AI</p>
              <p className="text-xs text-slate-500">Admin Panel</p>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto px-3 py-6 space-y-8">
            {navigationGroups.map((group, idx) => (
              <div key={idx}>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 mb-3">
                  {group.title}
                </p>
                <div className="space-y-1">
                  {group.items.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      className={({ isActive }) =>
                        [
                          "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all",
                          isActive
                            ? "bg-blue-50 text-blue-700 border-l-4 border-blue-600 font-semibold shadow-sm"
                            : "text-slate-600 hover:bg-white hover:text-slate-900 border-l-4 border-transparent",
                        ].join(" ")
                      }
                    >
                      <item.icon size={18} />
                      <span className="text-sm">{item.name}</span>
                    </NavLink>
                  ))}
                </div>
              </div>
            ))}
          </nav>

          <div className="border-t border-slate-200 p-4 bg-white">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 grid place-items-center font-bold text-blue-700">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900 text-sm truncate">{user?.username || "admin"}</p>
                <p className="text-xs text-slate-500">Administrator</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium transition"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="lg:ml-64">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-sm">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg hover:bg-slate-100"
              >
                <Menu size={20} />
              </button>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Dashboard</h1>
                <p className="text-sm text-slate-500">Welcome back, {user?.username || "Admin"}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden md:block relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  placeholder="Search users, rooms, restaurants, orders..."
                  className="w-80 pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>
              <button className="relative p-2 rounded-lg hover:bg-slate-100 transition">
                <Bell size={20} className="text-slate-600" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <div className="w-10 h-10 rounded-lg bg-blue-100 grid place-items-center font-bold text-blue-700">
                {initials}
              </div>
            </div>
          </div>
        </header>

        <main className="p-6 bg-slate-200">
          <Outlet />
        </main>
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}