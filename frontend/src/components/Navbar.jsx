import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Home,
  BedDouble,
  Heart,
  CalendarCheck,
  UtensilsCrossed,
  ShoppingBag,
  User,
  LogOut,
} from "lucide-react";
import { STUDENT_THEME as THEME } from "../styles/studentTheme";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  if (!user) return null;

  const links = [
    { to: "/student/dashboard", label: "Home", icon: Home },
    { to: "/rooms", label: "Rooms", icon: BedDouble },
    { to: "/favorites", label: "Favorites", icon: Heart },
    { to: "/bookings", label: "Bookings", icon: CalendarCheck },
    { to: "/restaurants", label: "Restaurants", icon: UtensilsCrossed },
    { to: "/orders", label: "Orders", icon: ShoppingBag },
    { to: "/profile", label: "Profile", icon: User },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav style={styles.nav}>
      <div style={styles.container}>
        <Link to="/student/dashboard" style={styles.brand}>
          <span style={styles.brandDot} />
          StaySync AI
        </Link>

        <div style={styles.links}>
          {links.map((l) => {
            const Icon = l.icon;
            const active = isActive(l.to);
            return (
              <Link
                key={l.to}
                to={l.to}
                style={{ ...styles.link, ...(active ? styles.linkActive : {}) }}
              >
                <Icon size={16} />
                <span>{l.label}</span>
              </Link>
            );
          })}

          <button onClick={handleLogout} style={styles.logoutBtn}>
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </nav>
  );
};

const styles = {
  nav: {
    position: "sticky",
    top: 12,
    zIndex: 50,
    borderRadius: 14,
    margin: "0 auto",
    maxWidth: 1200,
    background: `linear-gradient(90deg, ${THEME.navy}, ${THEME.navy2})`,
    boxShadow: THEME.shadow,
  },
  container: {
    height: 64,
    padding: "0 14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    fontWeight: 900,
    color: "#fff",
    textDecoration: "none",
    whiteSpace: "nowrap",
  },
  brandDot: {
    width: 30,
    height: 30,
    borderRadius: 10,
    background: "rgba(255,255,255,0.25)",
    border: "1px solid rgba(255,255,255,0.35)",
  },
  links: {
    display: "flex",
    gap: 10,
    alignItems: "center",
    flexWrap: "wrap",
    justifyContent: "flex-end",
  },
  link: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    color: "rgba(255,255,255,0.95)",
    textDecoration: "none",
    fontWeight: 900,
    fontSize: 13,
    padding: "8px 10px",
    borderRadius: 12,
    background: "rgba(255,255,255,0.10)",
    border: "1px solid rgba(255,255,255,0.18)",
  },
  linkActive: {
    background: "rgba(255,255,255,0.22)",
    border: "1px solid rgba(255,255,255,0.35)",
  },
  logoutBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "8px 12px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.25)",
    background: "rgba(15, 23, 42, 0.22)",
    color: "#fff",
    cursor: "pointer",
    fontWeight: 900,
  },
};

export default Navbar;