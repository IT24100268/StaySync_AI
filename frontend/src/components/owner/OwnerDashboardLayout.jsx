import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  List,
  BookOpen,
  MessageSquare,
  DollarSign,
  Settings,
  Bell,
  Mail,
  LogOut,
  ChevronDown,
  Building2,
  User,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useMemo, useState, useRef, useEffect } from "react";

const NAV = [
  { name: "Dashboard", to: "/owner/dashboard", icon: LayoutDashboard },
  { name: "Listings", to: "/owner/listings", icon: List },
  { name: "Bookings", to: "/owner/bookings", icon: BookOpen },
  { name: "Enquiries", to: "/owner/enquiries", icon: MessageSquare },
  { name: "Earnings", to: "/owner/analytics", icon: DollarSign },
  { name: "Settings", to: "/owner/settings", icon: Settings },
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
  const profileRef = useRef(null);

  const name = user?.username || user?.email || "Owner";
  const ini = useMemo(() => initials(name), [name]);

  useEffect(() => {
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

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

        <div className="flex min-w-[220px] items-center justify-end gap-3" ref={profileRef}>
          <button className="relative text-white/85 transition hover:text-[#d4af37]">
            <Bell size={18} />
            <span
              className="absolute -right-1.5 -top-1.5 grid h-4 w-4 place-items-center rounded-full text-[9px] font-bold text-black"
              style={{ background: "#d4af37" }}
            >
              1
            </span>
          </button>

          <button className="relative text-white/85 transition hover:text-[#d4af37]">
            <Mail size={18} />
            <span
              className="absolute -right-1.5 -top-1.5 grid h-4 w-4 place-items-center rounded-full text-[9px] font-bold text-black"
              style={{ background: "#d4af37" }}
            >
              2
            </span>
          </button>

          <div className="relative">
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

                <button
                  onClick={() => {
                    setProfileOpen(false);
                    navigate("/owner/settings");
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-[#524d43] transition hover:bg-[#faf7f1] hover:text-[#a07830]"
                >
                  <Settings size={14} /> Settings
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