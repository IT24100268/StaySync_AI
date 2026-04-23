import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  BedDouble,
  CalendarCheck,
  Heart,
  Home,
  LogOut,
  Menu,
  ShoppingBag,
  Sparkles,
  Star,
  User,
  UtensilsCrossed,
  X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import "./Navbar.css";

const NAV_LINKS = [
  { to: "/student/dashboard", label: "Home", icon: Home, matches: ["/student/dashboard"] },
  { to: "/rooms", label: "Rooms", icon: BedDouble, matches: ["/rooms"] },
  { to: "/favorites", label: "Favorites", icon: Heart, matches: ["/favorites"] },
  { to: "/bookings", label: "Bookings", icon: CalendarCheck, matches: ["/bookings"] },
  { to: "/restaurants", label: "Restaurants", icon: UtensilsCrossed, matches: ["/restaurants"] },
  { to: "/orders", label: "Orders", icon: ShoppingBag, matches: ["/orders", "/tracking"] },
  { to: "/reviews", label: "Reviews", icon: Star, matches: ["/reviews"] },
  { to: "/ai-planner", label: "AI Planner", icon: Sparkles, matches: ["/ai-planner"] },
  { to: "/profile", label: "Profile", icon: User, matches: ["/profile"] },
];

const isLinkActive = (pathname, link) => {
  return link.matches.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
};

const fullNameFromUser = (user) => {
  const fullName = `${user?.first_name || ""} ${user?.last_name || ""}`.trim();
  return fullName || user?.username || "Student";
};

const initialsFromName = (name) => {
  const pieces = String(name || "")
    .trim()
    .split(" ")
    .filter(Boolean)
    .slice(0, 2);
  if (pieces.length === 0) return "SS";
  return pieces.map((item) => item.charAt(0).toUpperCase()).join("");
};

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const profileName = useMemo(() => fullNameFromUser(user), [user]);
  const profileInitials = useMemo(() => initialsFromName(profileName), [profileName]);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!mobileOpen) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [mobileOpen]);

  if (!user) return null;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <>
      <header className="student-mobile-topbar">
        <Link to="/student/dashboard" className="student-mobile-topbar__brand">
          <span className="student-mobile-topbar__logo" />
          <span>StaySync AI</span>
        </Link>
        <button
          type="button"
          className="student-mobile-topbar__menu-btn"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
      </header>

      {mobileOpen ? <button type="button" className="student-sidebar-backdrop" onClick={() => setMobileOpen(false)} /> : null}

      <aside className={`student-sidebar ${mobileOpen ? "is-open" : ""}`}>
        <div className="student-sidebar__header">
          <Link to="/student/dashboard" className="student-sidebar__brand">
            <span className="student-sidebar__logo" />
            <div>
              <strong>StaySync AI</strong>
              <small>Student Console</small>
            </div>
          </Link>

          <button
            type="button"
            className="student-sidebar__close-btn"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="student-sidebar__nav">
          <p className="student-sidebar__section-label">Navigation</p>
          {NAV_LINKS.map((item) => {
            const Icon = item.icon;
            const active = isLinkActive(location.pathname, item);
            return (
              <Link key={item.to} to={item.to} className={`student-sidebar__link ${active ? "is-active" : ""}`}>
                <span className="student-sidebar__link-icon">
                  <Icon size={16} />
                </span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="student-sidebar__footer">
          <p className="student-sidebar__section-label">Account</p>
          <div className="student-sidebar__profile-card">
            <div className="student-sidebar__avatar">
              {user?.profile?.display_image ? (
                <img src={user.profile.display_image} alt={profileName} />
              ) : (
                <span>{profileInitials}</span>
              )}
            </div>
            <div className="student-sidebar__profile-meta">
              <strong>{profileName}</strong>
              <small>{user.email}</small>
            </div>
          </div>

          <button type="button" className="student-sidebar__logout" onClick={handleLogout}>
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
