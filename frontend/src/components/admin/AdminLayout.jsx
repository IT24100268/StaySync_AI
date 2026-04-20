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
  ShoppingBag,
  BarChart3,
  Bell,
  Search,
  User,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useEffect, useMemo, useRef, useState } from "react";
import api from "../../services/api";

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

const NOTIF_ROUTE_MAP = {
  new_owner: "/admin/users",
  new_student: "/admin/users",
  new_restaurant_owner: "/admin/users",
  new_delivery_partner: "/admin/partners",
  pending_room: "/admin/rooms",
  pending_restaurant: "/admin/restaurants",
  pending_partner: "/admin/partners",
  new_report: "/admin/reports",
  new_booking: "/admin/dashboard",
  new_order: "/admin/orders",
  general: "/admin/dashboard",
};

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const notificationRef = useRef(null);

  const initials = useMemo(() => {
    const name = user?.username || "Admin";
    return name.slice(0, 2).toUpperCase();
  }, [user]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setNotificationsLoading(true);
    try {
      const res = await api.get("/admin/notifications/");
      setNotifications(res.data?.results ?? res.data ?? []);
    } catch {
      setNotifications([]);
    } finally {
      setNotificationsLoading(false);
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await api.patch(`/admin/notifications/${id}/mark_read/`);
      setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n));
    } catch {}
  };

  const handleMarkAllRead = async () => {
    try {
      await api.patch("/admin/notifications/mark_all_read/");
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch {}
  };

  const handleDeleteOne = async (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await api.delete(`/admin/notifications/${id}/`);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch {}
  };

  const handleDeleteAll = async () => {
    try {
      await api.delete("/admin/notifications/delete_all/");
      setNotifications([]);
    } catch {}
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(221,214,254,0.7),_transparent_24%),radial-gradient(circle_at_top_right,_rgba(233,213,255,0.5),_transparent_20%),linear-gradient(180deg,#fbf8ff_0%,#f4efff_100%)] font-sans text-slate-900">
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 transform flex-col border-r border-white/10 bg-[linear-gradient(180deg,#231631_0%,#171226_100%)] text-white shadow-[0_30px_70px_-28px_rgba(76,29,149,0.75)] transition-transform lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center gap-3 border-b border-white/10 bg-white/5 px-6 py-5 backdrop-blur-md">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[linear-gradient(135deg,#c4b5fd_0%,#a78bfa_45%,#8b5cf6_100%)] text-white font-bold shadow-[0_14px_28px_rgba(168,85,247,0.45)]">
            S
          </div>
          <div>
            <p className="font-bold tracking-wide text-white">StaySync AI</p>
            <p className="text-xs text-violet-200/80">Admin Portal</p>
          </div>
        </div>

        <nav className="flex-1 space-y-8 overflow-y-auto px-3 py-6">
          {navigationGroups.map((group, idx) => (
            <div key={idx}>
              <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.28em] text-violet-200/65">
                {group.title}
              </p>
              <div className="space-y-1">
                {group.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setSidebarOpen(false)}
                    className={({ isActive }) =>
                      [
                        "flex items-center gap-3 rounded-2xl px-3 py-2.5 transition-all duration-300",
                        isActive
                          ? "border border-violet-300/20 bg-[linear-gradient(135deg,rgba(196,181,253,0.24),rgba(167,139,250,0.14))] text-white shadow-[0_14px_30px_-20px_rgba(196,181,253,0.75)]"
                          : "border border-transparent text-violet-100/75 hover:border-white/8 hover:bg-white/5 hover:text-white",
                      ].join(" ")
                    }
                  >
                    <item.icon size={18} />
                    <span className="text-sm font-medium">{item.name}</span>
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-white/10 bg-black/10 p-4">
          <div className="mb-3 flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl border border-violet-300/20 bg-violet-400/10 font-bold text-violet-100">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">{user?.username || "admin"}</p>
              <p className="text-xs text-violet-200/70">Administrator</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-300/10 bg-rose-400/10 px-3 py-2 text-sm font-medium text-rose-200 transition hover:bg-rose-400/20"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </aside>

      <div className="flex min-h-screen flex-col lg:ml-64">
        <header className="sticky top-0 z-30 border-b border-violet-200/40 bg-white/60 backdrop-blur-xl">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="rounded-xl p-2 text-slate-600 hover:bg-violet-50 lg:hidden"
              >
                <Menu size={20} />
              </button>
              <div>
                <h1 className="text-xl font-black tracking-tight text-slate-900">Admin Dashboard</h1>
                <p className="text-sm font-medium text-violet-500">Powerful • Clear • In Control</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative hidden md:block">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-violet-400" />
                <input
                  placeholder="Search users, rooms, orders..."
                  className="w-80 rounded-full border border-violet-200 bg-white/85 py-2.5 pl-10 pr-4 text-sm text-slate-700 shadow-[0_12px_28px_-24px_rgba(139,92,246,0.55)] transition focus:outline-none focus:ring-2 focus:ring-violet-400/40"
                />
              </div>
              <div className="relative" ref={notificationRef}>
                <button
                  onClick={() => setNotificationsOpen((open) => !open)}
                  className="relative rounded-full border border-violet-200 bg-white/85 p-2.5 text-violet-700 shadow-[0_12px_28px_-24px_rgba(139,92,246,0.55)] transition hover:bg-violet-50"
                  aria-label="Open admin notifications"
                >
                  <Bell size={18} />
                  {unreadCount > 0 ? (
                    <span className="absolute -right-1 -top-1 grid h-5 min-w-[20px] place-items-center rounded-full border-2 border-white bg-rose-500 px-1 text-[10px] font-bold text-white">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  ) : null}
                </button>

                {notificationsOpen ? (
                  <div className="absolute right-0 top-14 z-50 w-[380px] overflow-hidden rounded-[28px] border border-violet-100 bg-white shadow-[0_28px_60px_-24px_rgba(76,29,149,0.32)]">
                    {/* Header */}
                    <div className="border-b border-violet-100 bg-[linear-gradient(135deg,#fbf8ff_0%,#f2ebff_100%)] px-5 py-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-[0.24em] text-violet-500">Notifications</p>
                          <p className="mt-1 text-sm font-semibold text-slate-700">
                            {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
                          </p>
                        </div>
                        <button
                          onClick={fetchNotifications}
                          className="rounded-full border border-violet-200 bg-white px-3 py-1.5 text-xs font-bold text-violet-700 transition hover:bg-violet-50"
                        >
                          Refresh
                        </button>
                      </div>
                      {/* Action bar */}
                      {notifications.length > 0 && (
                        <div className="mt-3 flex items-center gap-2">
                          <button
                            onClick={handleMarkAllRead}
                            className="flex-1 rounded-xl border border-violet-200 bg-white py-1.5 text-xs font-semibold text-violet-700 transition hover:bg-violet-50"
                          >
                            Mark all read
                          </button>
                          <button
                            onClick={handleDeleteAll}
                            className="flex-1 rounded-xl border border-rose-200 bg-white py-1.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-50"
                          >
                            Delete all
                          </button>
                        </div>
                      )}
                    </div>

                    {/* List */}
                    <div className="max-h-[420px] overflow-y-auto p-3">
                      {notificationsLoading ? (
                        <div className="flex items-center justify-center py-12">
                          <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-200 border-t-violet-600" />
                        </div>
                      ) : notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                          <Bell size={32} className="mb-3 opacity-30" />
                          <p className="text-sm font-medium">No notifications yet</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {notifications.map((item) => (
                            <div
                              key={item.id}
                              className={`group relative flex items-start gap-3 rounded-[18px] border px-4 py-3 transition cursor-pointer ${
                                !item.is_read
                                  ? "border-violet-200 bg-violet-50/70 hover:bg-violet-100/70"
                                  : "border-slate-100 bg-white hover:bg-slate-50"
                              }`}
                              onClick={() => {
                                if (!item.is_read) handleMarkRead(item.id);
                                navigate(NOTIF_ROUTE_MAP[item.notification_type] ?? "/admin/dashboard");
                                setNotificationsOpen(false);
                              }}
                            >
                              <div className={`mt-1 h-2 w-2 shrink-0 rounded-full ${!item.is_read ? "bg-rose-500" : "bg-slate-300"}`} />
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-bold text-slate-900 leading-snug">{item.title}</p>
                                <p className="mt-0.5 text-xs leading-5 text-slate-500">{item.body}</p>
                                <p className="mt-1 text-[10px] text-violet-400">
                                  {new Date(item.created_at).toLocaleString()}
                                </p>
                              </div>
                              <button
                                onClick={(e) => handleDeleteOne(e, item.id)}
                                className="ml-1 shrink-0 rounded-full p-1 text-slate-300 opacity-0 transition hover:bg-rose-50 hover:text-rose-500 group-hover:opacity-100"
                                title="Delete"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8">
          <Outlet />
        </main>
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-[#140f21]/72 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
