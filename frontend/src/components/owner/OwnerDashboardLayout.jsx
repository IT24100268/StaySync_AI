import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  List,
  BookOpen,
  MessageSquare,
  DollarSign,
  Settings,
  Bell,
  LogOut,
  ChevronDown,
  Building2,
  User,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useMemo, useState, useRef, useEffect } from "react";
import ownerApi from "../../api/ownerApi";

const NAV = [
  { name: "Dashboard", to: "/owner/dashboard", icon: LayoutDashboard },
  { name: "Listings", to: "/owner/listings", icon: List },
  { name: "Bookings", to: "/owner/bookings", icon: BookOpen },
  { name: "Enquiries", to: "/owner/enquiries", icon: MessageSquare },
  { name: "Analytics", to: "/owner/analytics", icon: DollarSign },
  { name: "Validation", to: "/owner/verification", icon: Settings },
];

function initials(str = "") {
  const p = String(str).trim().split(" ").filter(Boolean);
  if (!p.length) return "U";
  if (p.length === 1) return p[0].slice(0, 2).toUpperCase();
  return (p[0][0] + p[p.length - 1][0]).toUpperCase();
}

export default function OwnerDashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const profileRef = useRef(null);
  const notificationRef = useRef(null);

  const name = user?.username || user?.email || "Owner";
  const ini = useMemo(() => initials(name), [name]);
  const unreadCount = notifications.filter((item) => item.highlight).length;

  useEffect(() => {
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(e.target)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setNotificationsLoading(true);
    try {
      const [enquiriesRes, listingsRes, ownerRes] = await Promise.all([
        ownerApi.get("/owner/enquiries/"),
        ownerApi.get("/owner/listings/"),
        ownerApi.get("/auth/profile/").catch(() => ({ data: null })),
      ]);

      const enquiries = Array.isArray(enquiriesRes.data) ? enquiriesRes.data : [];
      const listingsData = listingsRes.data?.results || listingsRes.data || [];
      const listings = Array.isArray(listingsData) ? listingsData : [];
      const verification = ownerRes.data?.verification || {
        status: ownerRes.data?.is_approved ? "approved" : "pending",
      };

      const pendingEnquiries = enquiries.filter((item) => item.status === "pending");
      const approvedBookings = enquiries.filter((item) => item.status === "approved");
      const pendingListings = listings.filter(
        (item) => String(item.status || "").toUpperCase() === "PENDING"
      );
      const approvedListings = listings.filter(
        (item) => String(item.status || "").toUpperCase() === "APPROVED"
      );

      const nextNotifications = [
        {
          id: "pending-enquiries",
          title: `${pendingEnquiries.length} pending enquiry${pendingEnquiries.length === 1 ? "" : "ies"}`,
          body:
            pendingEnquiries.length > 0
              ? "Students are waiting for your reply on room requests."
              : "No pending student enquiries right now.",
          to: "/owner/enquiries",
          highlight: pendingEnquiries.length > 0,
        },
        {
          id: "listing-review",
          title: `${pendingListings.length} listing${pendingListings.length === 1 ? "" : "s"} under review`,
          body:
            pendingListings.length > 0
              ? "Your latest room submissions are still waiting for admin approval."
              : "All room listings are clear of review backlog.",
          to: "/owner/listings",
          highlight: pendingListings.length > 0,
        },
        {
          id: "verification-status",
          title:
            verification?.status === "approved"
              ? "Validation approved"
              : verification?.status === "rejected"
              ? "Validation needs updates"
              : "Validation still pending",
          body:
            verification?.status === "approved"
              ? "Your owner identity is verified and trusted."
              : verification?.status === "rejected"
              ? "Please review and resubmit your validation details."
              : "Complete or check your validation details to improve trust.",
          to: "/owner/verification",
          highlight: verification?.status !== "approved",
        },
        {
          id: "approved-bookings",
          title: `${approvedBookings.length} approved booking${approvedBookings.length === 1 ? "" : "s"}`,
          body:
            approvedBookings.length > 0
              ? "Confirmed stays are now contributing to your hostel momentum."
              : "No approved bookings yet. New approvals will appear here.",
          to: "/owner/bookings",
          highlight: approvedBookings.length > 0,
        },
      ];

      const latestPending = pendingEnquiries.slice(0, 2).map((item) => ({
        id: `booking-${item.id}`,
        title: `${item.student_name || "Student"} asked about ${item.room_title || "your room"}`,
        body: item.message || "A new booking enquiry needs your response.",
        to: "/owner/enquiries",
        highlight: true,
      }));

      if (approvedListings.length > 0) {
        nextNotifications.push({
          id: "approved-listings",
          title: `${approvedListings.length} active approved listing${approvedListings.length === 1 ? "" : "s"}`,
          body: "Your approved rooms are visible and ready to attract more students.",
          to: "/owner/listings",
          highlight: false,
        });
      }

      setNotifications([...latestPending, ...nextNotifications]);
    } catch (error) {
      console.error("Failed to load owner notifications", error);
      setNotifications([
        {
          id: "fallback",
          title: "Notifications unavailable",
          body: "Try refreshing the bell panel in a moment.",
          to: "/owner/dashboard",
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
    <div
      className="min-h-screen"
      style={{
        background: "linear-gradient(180deg,#f7f4ee 0%, #f3efe8 55%, #f8f5ef 100%)",
      }}
    >
      <div
        className="h-[88px] w-full"
        style={{
          background:
            "radial-gradient(circle at top center, rgba(255,255,255,0.04), transparent 32%), linear-gradient(180deg,#151519 0%, #1b1b20 100%)",
        }}
      />

      <header
        className="sticky top-0 z-50 -mt-[20px] mx-auto flex max-w-[1400px] items-center gap-4 border-y px-6 py-3"
        style={{
          background: "rgba(12,12,15,0.97)",
          borderColor: "rgba(212,175,55,0.10)",
          backdropFilter: "blur(12px)",
          boxShadow: "0 8px 24px rgba(0,0,0,0.10)",
        }}
      >
        <div className="flex min-w-[185px] items-center gap-3">
          <Building2 size={22} className="text-[#d4af37]" />
          <div className="leading-tight">
            <p className="text-[15px] font-extrabold tracking-wide text-white">
              StaySync <span className="text-[#d4af37]">AI</span>
            </p>
          </div>
        </div>

        <nav className="flex flex-1 items-center justify-center gap-1">
          {NAV.map(({ name: label, to }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/owner/dashboard"}
              className={({ isActive }) =>
                `relative px-4 py-2 text-[15px] font-medium transition ${
                  isActive ? "text-white" : "text-white/80 hover:text-white"
                }`
              }
            >
              {({ isActive }) => (
                <span className="relative">
                  {label}
                  {isActive && (
                    <span
                      className="absolute left-0 top-[30px] h-[2.5px] w-full rounded-full"
                      style={{
                        background: "linear-gradient(90deg,#c9a84c,#f0d682,#c9a84c)",
                        boxShadow: "0 0 12px rgba(201,168,76,0.55)",
                      }}
                    />
                  )}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="flex min-w-[220px] items-center justify-end gap-3">
          <div className="relative" ref={notificationRef}>
            <button
              onClick={() => setNotificationsOpen((open) => !open)}
              className="relative text-white/85 transition hover:text-[#d4af37]"
              aria-label="Open owner notifications"
            >
              <Bell size={18} />
              {unreadCount > 0 ? (
                <span
                  className="absolute -right-1.5 -top-1.5 grid h-5 min-w-[20px] place-items-center rounded-full px-1 text-[9px] font-bold text-black"
                  style={{ background: "#d4af37" }}
                >
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              ) : null}
            </button>

            {notificationsOpen ? (
              <div
                className="absolute right-0 top-10 z-50 w-[360px] overflow-hidden rounded-[28px] border"
                style={{
                  background: "#ffffff",
                  borderColor: "#eadfcb",
                  boxShadow: "0 28px 60px rgba(0,0,0,0.16)",
                }}
              >
                <div
                  className="border-b px-5 py-4"
                  style={{
                    background: "linear-gradient(135deg,#fffaf0 0%, #ffffff 100%)",
                    borderColor: "#f0e8db",
                  }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#b58c2f]">
                        Notifications
                      </p>
                      <p className="mt-1 text-sm font-semibold text-[#5f5a4f]">
                        {unreadCount > 0
                          ? `${unreadCount} item${unreadCount > 1 ? "s" : ""} need your attention`
                          : "Everything looks calm right now"}
                      </p>
                    </div>
                    <button
                      onClick={fetchNotifications}
                      className="rounded-full border border-[#e7d29d] bg-[#fff8e8] px-3 py-1.5 text-xs font-bold text-[#9a6a00] transition hover:bg-[#fff3cf]"
                    >
                      Refresh
                    </button>
                  </div>
                </div>

                <div className="max-h-[420px] overflow-y-auto p-3">
                  {notificationsLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#eadab1] border-t-[#b58c2f]" />
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
                              ? "border-[#e7d29d] bg-[#fff8e8] hover:bg-[#fff3cf]"
                              : "border-[#ece3d3] bg-[#fcfbf8] hover:bg-[#faf7f1]"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={`mt-1 h-2.5 w-2.5 rounded-full ${
                                item.highlight ? "bg-[#c88b00]" : "bg-[#d7cfbf]"
                              }`}
                            />
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-[#1e1d1a]">{item.title}</p>
                              <p className="mt-1 text-xs leading-5 text-[#6f6a5f]">{item.body}</p>
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

          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setProfileOpen((v) => !v)}
              className="flex items-center gap-3 rounded-full px-2 py-1 transition hover:bg-white/5"
            >
              <div
                className="grid h-9 w-9 place-items-center rounded-full text-xs font-extrabold text-white"
                style={{
                  background: "linear-gradient(135deg,#c9a84c,#a07830)",
                  boxShadow: "0 4px 12px rgba(201,168,76,0.35)",
                }}
              >
                {ini}
              </div>

              <div className="hidden text-left sm:block">
                <p className="text-[14px] font-bold leading-tight text-white">{name}</p>
                <p className="text-[11px] text-white/55">Hostel Owner</p>
              </div>

              <ChevronDown size={14} className="text-white/55" />
            </button>

            {profileOpen && (
              <div
                className="absolute right-0 top-14 w-60 rounded-2xl border p-2"
                style={{
                  background: "#ffffff",
                  borderColor: "#eadfcb",
                  boxShadow: "0 20px 50px rgba(0,0,0,0.12)",
                }}
              >
                <div className="flex items-center gap-3 border-b border-[#f0e8db] px-3 py-3">
                  <div
                    className="grid h-10 w-10 place-items-center rounded-full text-sm font-extrabold text-white"
                    style={{ background: "linear-gradient(135deg,#c9a84c,#a07830)" }}
                  >
                    {ini}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#1e1d1a]">{name}</p>
                    <p className="text-xs text-[#7b7568]">{user?.email}</p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setProfileOpen(false);
                    navigate("/owner/profile");
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-[#524d43] transition hover:bg-[#faf7f1] hover:text-[#a07830]"
                >
                  <User size={14} /> Profile
                </button>

                <div className="my-1 border-t border-[#f0e8db]" />

                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-red-600 transition hover:bg-red-50"
                >
                  <LogOut size={14} /> Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}
