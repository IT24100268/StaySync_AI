import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
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
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const notificationRef = useRef(null);

  const initials = useMemo(() => {
    const name = user?.username || "Admin";
    return name.slice(0, 2).toUpperCase();
  }, [user]);

  const unreadCount = notifications.filter((item) => item.highlight).length;

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
      const [summaryRes, analyticsRes, reportsRes] = await Promise.all([
        api.get("/admin/analytics/summary/"),
        api.get("/admin/analytics/detail/"),
        api.get("/admin/reports/"),
      ]);

      const summary = summaryRes.data || {};
      const analytics = analyticsRes.data || {};
      const reports = reportsRes.data?.results || reportsRes.data || [];
      const latestAction = analytics.recent_admin_actions?.[0];
      const pendingReports = reports.filter((report) => report.status === "PENDING").slice(0, 2);

      const nextNotifications = [
        {
          id: "pending-reports",
          title: `${summary.pending_reports || 0} report${summary.pending_reports === 1 ? "" : "s"} waiting`,
          body:
            (summary.pending_reports || 0) > 0
              ? "Open the reports queue to review the latest student or order issues."
              : "Reports queue is currently clear.",
          to: "/admin/reports",
          highlight: (summary.pending_reports || 0) > 0,
        },
        {
          id: "approval-backlog",
          title: `${analytics.metrics?.approval_backlog || 0} approvals need review`,
          body:
            (analytics.metrics?.approval_backlog || 0) > 0
              ? "Rooms, restaurants, or delivery partners are still waiting for admin action."
              : "All approval queues are currently under control.",
          to: "/admin/dashboard",
          highlight: (analytics.metrics?.approval_backlog || 0) > 0,
        },
        {
          id: "orders-today",
          title: `${summary.total_orders_today || 0} food orders today`,
          body:
            (summary.total_orders_today || 0) > 0
              ? "Track live food activity and delivery ownership from the orders monitor."
              : "No food orders have been placed today yet.",
          to: "/admin/orders",
          highlight: (summary.total_orders_today || 0) > 0,
        },
      ];

      if (latestAction) {
        nextNotifications.push({
          id: `latest-action-${latestAction.id}`,
          title: latestAction.action,
          body: `Latest admin activity by ${latestAction.admin__username || "admin"}.`,
          to: "/admin/logs",
          highlight: false,
        });
      }

      pendingReports.forEach((report) => {
        nextNotifications.push({
          id: `report-${report.id}`,
          title: `Report #${report.id} is pending`,
          body: report.reason || "Needs admin review.",
          to: "/admin/reports",
          highlight: true,
        });
      });

      setNotifications(nextNotifications);
    } catch (error) {
      console.error("Failed to load admin notifications", error);
      setNotifications([
        {
          id: "fallback",
          title: "Notifications unavailable",
          body: "Try refreshing the panel in a moment.",
          to: "/admin/dashboard",
          highlight: false,
        },
      ]);
    } finally {
      setNotificationsLoading(false);
    }
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
                  <div className="absolute right-0 top-14 z-50 w-[360px] overflow-hidden rounded-[28px] border border-violet-100 bg-white shadow-[0_28px_60px_-24px_rgba(76,29,149,0.32)]">
                    <div className="border-b border-violet-100 bg-[linear-gradient(135deg,#fbf8ff_0%,#f2ebff_100%)] px-5 py-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-[0.24em] text-violet-500">Notifications</p>
                          <p className="mt-1 text-sm font-semibold text-slate-700">
                            {unreadCount > 0 ? `${unreadCount} item${unreadCount > 1 ? "s" : ""} need attention` : "Everything looks calm right now"}
                          </p>
                        </div>
                        <button
                          onClick={fetchNotifications}
                          className="rounded-full border border-violet-200 bg-white px-3 py-1.5 text-xs font-bold text-violet-700 transition hover:bg-violet-50"
                        >
                          Refresh
                        </button>
                      </div>
                    </div>

                    <div className="max-h-[420px] overflow-y-auto p-3">
                      {notificationsLoading ? (
                        <div className="flex items-center justify-center py-12">
                          <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-200 border-t-violet-600" />
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {notifications.map((item) => (
                            <Link
                              key={item.id}
                              to={item.to}
                              onClick={() => setNotificationsOpen(false)}
                              className={`block rounded-[22px] border px-4 py-4 transition ${
                                item.highlight
                                  ? "border-violet-200 bg-violet-50/70 hover:bg-violet-100/70"
                                  : "border-slate-200 bg-white hover:bg-slate-50"
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <div className={`mt-0.5 h-2.5 w-2.5 rounded-full ${item.highlight ? "bg-rose-500" : "bg-violet-300"}`} />
                                <div className="min-w-0">
                                  <p className="text-sm font-bold text-slate-900">{item.title}</p>
                                  <p className="mt-1 text-xs leading-5 text-slate-500">{item.body}</p>
                                </div>
                              </div>
                            </Link>
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
