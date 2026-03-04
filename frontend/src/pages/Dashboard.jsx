import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * StaySync AI - Student Dashboard (Mock) - Blue Theme
 * - Uses placeholder images (no local assets required)
 * - Includes AI Smart Package: best room + nearby food analysis + monthly meal package
 */

// Blue Theme (matches your reference image style)
const THEME = {
  navy: "#1f4f96",
  navy2: "#2c66b8",
  sky: "#5aa9ff",
  bg: "#eef3ff",
  card: "rgba(255,255,255,0.86)",
  cardSolid: "#ffffff",
  text: "#0f172a",
  muted: "#5b6b8a",
  border: "rgba(15, 23, 42, 0.10)",
  shadow: "0 12px 34px rgba(20, 45, 90, 0.14)",
  pill: "rgba(31, 79, 150, 0.10)",
};

const phRoom = "/images/Image1.jpg";
const phFood = "/images/Image3.jpeg";

const StudentDashboardMockBlue = () => {
  const { user } = useAuth();

  // Mock filters (top search panel)
  const [filters, setFilters] = useState({
    location: "University Area",
    budget: "LKR 20,000 - 35,000",
    roomType: "Attached Bath",
  });

  // Mock data
  const recommendedRooms = useMemo(
    () => [
      {
        id: 1,
        name: "Greenview Hostel",
        price: 28000,
        location: "Near SLIIT (Malabe)",
        tags: ["Wi-Fi", "Quiet", "Parking"],
        image: phRoom,
      },
      {
        id: 2,
        name: "Maple Residence",
        price: 30000,
        location: "Malabe",
        tags: ["Water Included", "2 Beds"],
        image: phRoom,
      },
      {
        id: 3,
        name: "Cozy Studio",
        price: 34000,
        location: "Kaduwela",
        tags: ["Private", "Attached Bath"],
        image: phRoom,
      },
    ],
    []
  );

  const popularRestaurants = useMemo(
    () => [
      {
        id: 1,
        name: "Pizza Delight",
        type: "Restaurant",
        location: "Malabe",
        image: phFood,
      },
      {
        id: 2,
        name: "Spice Corner",
        type: "Home Food + Restaurant",
        location: "Kaduwela",
        image: phFood,
      },
    ],
    []
  );

  const savedRooms = useMemo(
    () => [
      {
        id: 11,
        name: "Lakeview PG",
        price: 25000,
        location: "Near University",
        image: phRoom,
      },
    ],
    []
  );

  // ✅ Your AI feature (Updated)
  // Under budget -> find best room + analyze nearby providers -> build monthly food package
  const ai = useMemo(() => {
    const budget = 50000;

    const bestRoom = {
      name: "Greenview Hostel",
      price: 28000,
      location: "Near SLIIT (Malabe)",
      reasons: ["Best value under budget", "Short distance to food providers", "Wi-Fi included", "Safe area"],
    };

    const providers = [
      { name: "Aunty’s Home Food", type: "Home Food", distanceKm: 0.8, meals: "Lunch + Dinner", from: 250 },
      { name: "Campus Bites", type: "Restaurant", distanceKm: 1.3, meals: "All day", from: 450 },
      { name: "Healthy Lunch Packs", type: "Home Food", distanceKm: 1.6, meals: "Breakfast + Lunch", from: 300 },
    ];

    // Simple mock monthly package (you can adjust)
    const foodBudget = 18000;

    const packagePlan = {
      breakfast: {
        label: "Breakfast (30 days)",
        items: ["String hoppers + dhal", "Roti + sambol", "Bread + omelette", "Milk tea"],
        avgPerDay: 250,
      },
      lunch: {
        label: "Lunch (30 days)",
        items: ["Rice & curry", "Chicken/Fish 3× week", "Veg curry other days", "Papadam + salad"],
        avgPerDay: 350,
      },
      dinner: {
        label: "Dinner (25 days)",
        items: ["Rice & curry", "Noodles/Fried rice", "Kottu 2× week", "Light soup options"],
        avgPerDay: 300,
      },
    };

    const misc = 4000;
    const total = bestRoom.price + foodBudget + misc;
    const remaining = budget - total;
    const spentPct = Math.min(100, Math.max(0, Math.round((total / budget) * 100)));

    return {
      budget,
      bestRoom,
      providers,
      foodBudget,
      packagePlan,
      misc,
      total,
      remaining,
      spentPct,
    };
  }, []);

  const onSearch = (e) => {
    e.preventDefault();
    // Mock search: no backend call
    // You can show a toast later
  };

  return (
    <div style={styles.page}>
      {/* Top Bar (like your screenshot) */}
      <div style={styles.topbar}>
        <div style={styles.brand}>
          <div style={styles.logoDot} />
          <div style={styles.brandText}>StaySync AI</div>
        </div>

        <div style={styles.navLinks}>
          <Link to="/rooms" style={styles.navLink}>Room Search</Link>
          <Link to="/restaurants" style={styles.navLink}>Restaurants</Link>
          <Link to="/orders" style={styles.navLink}>My Orders</Link>
        </div>

        <div style={styles.userChip}>
          <div style={styles.avatarCircle}>
            {(user?.first_name?.[0] || user?.username?.[0] || "S").toUpperCase()}
          </div>
          <div style={styles.userName}>{user?.first_name || user?.username || "Student"}</div>
        </div>
      </div>

      {/* Welcome line */}
      <div style={styles.welcomeRow}>
        <div>
          <h1 style={styles.welcomeTitle}>
            Welcome, {user?.first_name || user?.username || "Student"}!
          </h1>
          <p style={styles.welcomeSub}>Explore & find your perfect room — and let AI build your monthly plan.</p>
        </div>
      </div>

      {/* Search Panel */}
      <div style={styles.searchPanel}>
        <div style={styles.searchLeft}>
          <div style={styles.sectionLabel}>Filters</div>

          <form onSubmit={onSearch} style={styles.filterRow}>
            <div style={styles.selectBox}>
              <div style={styles.selectLabel}>Location</div>
              <select
                value={filters.location}
                onChange={(e) => setFilters((p) => ({ ...p, location: e.target.value }))}
                style={styles.select}
              >
                <option>University Area</option>
                <option>Malabe</option>
                <option>Kaduwela</option>
                <option>Battaramulla</option>
              </select>
            </div>

            <div style={styles.selectBox}>
              <div style={styles.selectLabel}>Budget</div>
              <select
                value={filters.budget}
                onChange={(e) => setFilters((p) => ({ ...p, budget: e.target.value }))}
                style={styles.select}
              >
                <option>LKR 20,000 - 35,000</option>
                <option>LKR 35,000 - 50,000</option>
                <option>LKR 50,000 - 70,000</option>
              </select>
            </div>

            <div style={styles.selectBox}>
              <div style={styles.selectLabel}>Room Type</div>
              <select
                value={filters.roomType}
                onChange={(e) => setFilters((p) => ({ ...p, roomType: e.target.value }))}
                style={styles.select}
              >
                <option>Attached Bath</option>
                <option>Non-attached Bath</option>
                <option>Shared Room</option>
                <option>Single Room</option>
              </select>
            </div>

            <button type="submit" style={styles.searchBtn}>Search</button>
          </form>
        </div>

        {/* Map placeholder */}
        <div style={styles.mapBox}>
          <div style={styles.mapTitle}>Map Preview</div>
          <div style={styles.mapMock}>
            <div style={styles.pin} />
            <div style={{ ...styles.pin, left: "70%", top: "35%" }} />
            <div style={{ ...styles.pin, left: "40%", top: "65%" }} />
          </div>
        </div>
      </div>

      {/* Main grid like screenshot */}
      <div style={styles.grid2}>
        {/* Recommended Rooms */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <div style={styles.cardTitle}>Recommended Rooms</div>
            <Link to="/rooms" style={styles.cardLink}>View all</Link>
          </div>

          <div style={styles.roomRow}>
            {recommendedRooms.map((r) => (
              <div key={r.id} style={styles.roomCard}>
                <div style={styles.imgWrap}>
                  <img src={r.image} alt={r.name} style={styles.img} />
                  <div style={styles.heart}>♡</div>
                </div>
                <div style={styles.roomBody}>
                  <div style={styles.roomName}>{r.name}</div>
                  <div style={styles.roomPrice}>LKR {r.price.toLocaleString()} / month</div>
                  <div style={styles.roomMeta}>{r.location}</div>
                  <div style={styles.tagRow}>
                    {r.tags.slice(0, 3).map((t) => (
                      <span key={t} style={styles.tag}>{t}</span>
                    ))}
                  </div>
                  <Link to={`/rooms/${r.id}`} style={styles.smallBtn}>View Details</Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Popular Restaurants */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <div style={styles.cardTitle}>Popular Restaurants</div>
            <Link to="/restaurants" style={styles.cardLink}>Explore</Link>
          </div>

          <div style={styles.foodRow}>
            {popularRestaurants.map((p) => (
              <div key={p.id} style={styles.foodCard}>
                <img src={p.image} alt={p.name} style={styles.foodImg} />
                <div style={styles.foodBody}>
                  <div style={styles.foodName}>{p.name}</div>
                  <div style={styles.foodMeta}>
                    <span style={styles.pill}>{p.type}</span> • {p.location}
                  </div>
                  <Link to={`/restaurants/${p.id}`} style={styles.bigBtn}>View Menu</Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ✅ Saved Rooms */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <div style={styles.cardTitle}>Saved Rooms</div>
            <Link to="/favorites" style={styles.cardLink}>View all</Link>
          </div>

          <div style={styles.savedWrap}>
            {savedRooms.map((s) => (
              <div key={s.id} style={styles.savedCard}>
                <img src={s.image} alt={s.name} style={styles.savedImg} />
                <div style={styles.savedBody}>
                  <div style={styles.roomName}>{s.name}</div>
                  <div style={styles.roomPrice}>LKR {s.price.toLocaleString()} / month</div>
                  <div style={styles.roomMeta}>{s.location}</div>
                </div>
                <Link to="/favorites" style={styles.smallBtn}>View All</Link>
              </div>
            ))}
          </div>
        </div>

        {/* Live Order Tracking */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <div style={styles.cardTitle}>Live Order Tracking</div>
            <Link to="/orders" style={styles.cardLink}>My Orders</Link>
          </div>

          <div style={styles.trackWrap}>
            <div style={styles.trackLeft}>
              <div style={styles.trackTitle}>On the Way</div>
              <div style={styles.trackSub}>Arriving in <b>12–15 mins</b></div>

              <div style={styles.timeline}>
                <div style={{ ...styles.step, ...styles.stepDone }}>Picked Up</div>
                <div style={{ ...styles.step, ...styles.stepActive }}>On the Way</div>
                <div style={styles.step}>Arriving Soon</div>
              </div>
              <div style={styles.lineWrap}>
                <div style={styles.lineBase} />
                <div style={styles.lineFill} />
              </div>
            </div>

            <div style={styles.trackArt}>
              <div style={styles.scooterCircle}>🛵</div>
            </div>
          </div>
        </div>

        {/* ✅ AI Smart Package (Your full AI feature) */}
        <div style={{ ...styles.card, gridColumn: "1 / -1" }}>
          <div style={styles.cardHeader}>
            <div style={styles.cardTitle}>🤖 AI Smart Monthly Package (Room + Food)</div>
            <span style={styles.pill}>Mock Preview</span>
          </div>

          <div style={styles.aiGrid}>
            {/* Budget Summary */}
            <div style={styles.aiBox}>
              <div style={styles.aiLabel}>Monthly Budget</div>
              <div style={styles.aiValue}>LKR {ai.budget.toLocaleString()}</div>

              <div style={styles.bar}>
                <div style={{ ...styles.barFill, width: `${ai.spentPct}%` }} />
              </div>
              <div style={styles.aiHint}>
                Used: <b>{ai.spentPct}%</b> • Remaining:{" "}
                <b style={{ color: ai.remaining >= 0 ? THEME.navy : "#b42318" }}>
                  LKR {ai.remaining.toLocaleString()}
                </b>
              </div>
            </div>

            {/* Best Room */}
            <div style={styles.aiBox}>
              <div style={styles.aiLabel}>Best Room Under Budget</div>
              <div style={styles.aiValue}>{ai.bestRoom.name}</div>
              <div style={styles.aiHint}>
                📍 {ai.bestRoom.location} • <b>LKR {ai.bestRoom.price.toLocaleString()}/mo</b>
              </div>
              <div style={styles.list}>
                {ai.bestRoom.reasons.map((x) => (
                  <div key={x} style={styles.listItem}>✅ {x}</div>
                ))}
              </div>
              <div style={styles.aiActions}>
                <Link to="/rooms" style={styles.bigBtn}>See Matching Rooms</Link>
                <Link to="/profile" style={styles.outlineBtn}>Update Preferences</Link>
              </div>
            </div>

            {/* Monthly Food Package */}
            <div style={styles.aiBox}>
              <div style={styles.aiLabel}>Monthly Food Package</div>
              <div style={styles.aiValue}>Breakfast + Lunch + Dinner</div>
              <div style={styles.aiHint}>
                Food budget: <b>LKR {ai.foodBudget.toLocaleString()}/mo</b>
              </div>

              <div style={styles.mealGrid}>
                <div style={styles.mealCard}>
                  <div style={styles.mealTitle}>☀️ Breakfast</div>
                  <div style={styles.mealSub}>{ai.packagePlan.breakfast.label} • Avg/day LKR {ai.packagePlan.breakfast.avgPerDay}</div>
                  <div style={styles.chips}>
                    {ai.packagePlan.breakfast.items.map((i) => <span key={i} style={styles.chip}>{i}</span>)}
                  </div>
                </div>

                <div style={styles.mealCard}>
                  <div style={styles.mealTitle}>🍛 Lunch</div>
                  <div style={styles.mealSub}>{ai.packagePlan.lunch.label} • Avg/day LKR {ai.packagePlan.lunch.avgPerDay}</div>
                  <div style={styles.chips}>
                    {ai.packagePlan.lunch.items.map((i) => <span key={i} style={styles.chip}>{i}</span>)}
                  </div>
                </div>

                <div style={styles.mealCard}>
                  <div style={styles.mealTitle}>🌙 Dinner</div>
                  <div style={styles.mealSub}>{ai.packagePlan.dinner.label} • Avg/day LKR {ai.packagePlan.dinner.avgPerDay}</div>
                  <div style={styles.chips}>
                    {ai.packagePlan.dinner.items.map((i) => <span key={i} style={styles.chip}>{i}</span>)}
                  </div>
                </div>
              </div>

              <div style={styles.aiActions}>
                <Link to="/restaurants" style={styles.bigBtn}>Choose Food Providers</Link>
                <Link to="/orders" style={styles.outlineBtn}>Monthly Orders</Link>
              </div>
            </div>

            {/* Nearby provider analysis */}
            <div style={styles.aiBox}>
              <div style={styles.aiLabel}>Nearby Food Provider Analysis</div>
              <div style={styles.aiHint}>AI checks distance, meal types, and starting prices.</div>

              <div style={styles.providerList}>
                {ai.providers.map((p) => (
                  <div key={p.name} style={styles.providerRow}>
                    <div style={{ minWidth: 0 }}>
                      <div style={styles.providerName}>{p.name}</div>
                      <div style={styles.providerMeta}>
                        <span style={styles.pill}>{p.type}</span> • {p.meals}
                      </div>
                    </div>
                    <div style={styles.providerRight}>
                      <div style={styles.providerDist}>📍 {p.distanceKm} km</div>
                      <div style={styles.providerFrom}>From LKR {p.from}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div style={styles.breakdown}>
                <div style={styles.breakItem}>
                  <div style={styles.breakLabel}>Room</div>
                  <div style={styles.breakVal}>LKR {ai.bestRoom.price.toLocaleString()}</div>
                </div>
                <div style={styles.breakItem}>
                  <div style={styles.breakLabel}>Food</div>
                  <div style={styles.breakVal}>LKR {ai.foodBudget.toLocaleString()}</div>
                </div>
                <div style={styles.breakItem}>
                  <div style={styles.breakLabel}>Travel + Misc</div>
                  <div style={styles.breakVal}>LKR {ai.misc.toLocaleString()}</div>
                </div>
                <div style={styles.breakItem}>
                  <div style={styles.breakLabel}>Remaining</div>
                  <div style={{ ...styles.breakVal, color: ai.remaining >= 0 ? THEME.navy : "#b42318" }}>
                    LKR {ai.remaining.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div style={styles.aiNote}>
            Note: This is a mock preview. Later you will generate these results using your dataset + ML/AI logic.
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  page: {
    minHeight: "100vh",
    background: `radial-gradient(900px 500px at 20% 10%, rgba(90,169,255,0.25), transparent 60%),
                 radial-gradient(900px 500px at 85% 45%, rgba(31,79,150,0.18), transparent 60%),
                 ${THEME.bg}`,
    padding: "18px 18px 40px",
  },

  // Top bar
  topbar: {
    height: 64,
    borderRadius: 14,
    padding: "0 16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    background: `linear-gradient(90deg, ${THEME.navy}, ${THEME.navy2})`,
    color: "#fff",
    boxShadow: THEME.shadow,
    position: "sticky",
    top: 12,
    zIndex: 20,
  },
  brand: { display: "flex", alignItems: "center", gap: 10, fontWeight: 900 },
  logoDot: {
    width: 30,
    height: 30,
    borderRadius: 10,
    background: "rgba(255,255,255,0.25)",
    border: "1px solid rgba(255,255,255,0.35)",
  },
  brandText: { letterSpacing: 0.2, fontSize: 16 },

  navLinks: { display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap" },
  navLink: {
    color: "rgba(255,255,255,0.95)",
    textDecoration: "none",
    fontWeight: 800,
    fontSize: 13,
    padding: "8px 10px",
    borderRadius: 10,
    background: "rgba(255,255,255,0.10)",
    border: "1px solid rgba(255,255,255,0.18)",
  },

  userChip: { display: "flex", alignItems: "center", gap: 10 },
  avatarCircle: {
    width: 34,
    height: 34,
    borderRadius: 999,
    display: "grid",
    placeItems: "center",
    background: "rgba(255,255,255,0.20)",
    border: "1px solid rgba(255,255,255,0.30)",
    fontWeight: 900,
  },
  userName: { fontWeight: 900, fontSize: 13 },

  // Welcome
  welcomeRow: {
    maxWidth: 1200,
    margin: "16px auto 0",
    padding: "6px 6px",
  },
  welcomeTitle: { margin: 0, fontSize: 28, fontWeight: 900, color: THEME.text },
  welcomeSub: { margin: "6px 0 0", color: THEME.muted, fontWeight: 700 },

  // Search panel
  searchPanel: {
    maxWidth: 1200,
    margin: "14px auto 0",
    display: "grid",
    gridTemplateColumns: "1.2fr 0.8fr",
    gap: 12,
    alignItems: "stretch",
  },
  searchLeft: {
    background: THEME.card,
    border: `1px solid ${THEME.border}`,
    borderRadius: 16,
    boxShadow: THEME.shadow,
    padding: 14,
    backdropFilter: "blur(8px)",
  },
  sectionLabel: { fontSize: 13, fontWeight: 900, color: THEME.muted, marginBottom: 10 },
  filterRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr auto",
    gap: 10,
    alignItems: "end",
  },
  selectBox: { display: "flex", flexDirection: "column", gap: 6 },
  selectLabel: { fontSize: 12, fontWeight: 900, color: THEME.muted },
  select: {
    height: 38,
    borderRadius: 12,
    border: `1px solid ${THEME.border}`,
    padding: "0 10px",
    fontWeight: 800,
    color: THEME.text,
    background: THEME.cardSolid,
    outline: "none",
  },
  searchBtn: {
    height: 40,
    borderRadius: 999,
    border: "none",
    cursor: "pointer",
    padding: "0 18px",
    fontWeight: 900,
    color: "#fff",
    background: `linear-gradient(90deg, ${THEME.navy}, ${THEME.sky})`,
    boxShadow: "0 10px 24px rgba(31, 79, 150, 0.25)",
  },

  mapBox: {
    background: THEME.card,
    border: `1px solid ${THEME.border}`,
    borderRadius: 16,
    boxShadow: THEME.shadow,
    padding: 14,
    backdropFilter: "blur(8px)",
    display: "flex",
    flexDirection: "column",
  },
  mapTitle: { fontSize: 13, fontWeight: 900, color: THEME.muted, marginBottom: 10 },
  mapMock: {
    flex: 1,
    borderRadius: 14,
    border: `1px solid ${THEME.border}`,
    background:
      "linear-gradient(135deg, rgba(90,169,255,0.22), rgba(255,255,255,0.75)), repeating-linear-gradient(0deg, rgba(31,79,150,0.10), rgba(31,79,150,0.10) 1px, transparent 1px, transparent 22px)",
    position: "relative",
    minHeight: 120,
  },
  pin: {
    width: 14,
    height: 14,
    borderRadius: 999,
    background: "#ff3b30",
    position: "absolute",
    left: "30%",
    top: "40%",
    boxShadow: "0 8px 16px rgba(255, 59, 48, 0.25)",
  },

  // Main grid
  grid2: { maxWidth: 1200, margin: "12px auto 0", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },

  card: {
    background: THEME.card,
    border: `1px solid ${THEME.border}`,
    borderRadius: 16,
    boxShadow: THEME.shadow,
    padding: 14,
    backdropFilter: "blur(8px)",
  },
  cardHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 12 },
  cardTitle: { fontSize: 15, fontWeight: 900, color: THEME.text },
  cardLink: { fontSize: 13, fontWeight: 900, color: THEME.navy, textDecoration: "none" },

  // Rooms
  roomRow: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 },
  roomCard: {
    borderRadius: 14,
    overflow: "hidden",
    border: `1px solid ${THEME.border}`,
    background: THEME.cardSolid,
  },
  imgWrap: { position: "relative" },
  img: { width: "100%", height: 120, objectFit: "cover", display: "block" },
  heart: {
    position: "absolute",
    right: 10,
    top: 10,
    width: 28,
    height: 28,
    borderRadius: 999,
    display: "grid",
    placeItems: "center",
    background: "rgba(255,255,255,0.85)",
    border: `1px solid ${THEME.border}`,
    fontWeight: 900,
    color: THEME.navy,
  },
  roomBody: { padding: 10 },
  roomName: { fontWeight: 900, color: THEME.text },
  roomPrice: { marginTop: 4, fontWeight: 900, color: THEME.navy },
  roomMeta: { marginTop: 4, color: THEME.muted, fontWeight: 700, fontSize: 12 },

  tagRow: { marginTop: 8, display: "flex", flexWrap: "wrap", gap: 6 },
  tag: { fontSize: 11, fontWeight: 900, padding: "4px 8px", borderRadius: 999, background: THEME.pill, color: THEME.navy },

  smallBtn: {
    marginTop: 10,
    display: "inline-flex",
    textDecoration: "none",
    fontWeight: 900,
    fontSize: 12,
    padding: "8px 10px",
    borderRadius: 999,
    background: "rgba(31,79,150,0.10)",
    color: THEME.navy,
    border: `1px solid ${THEME.border}`,
  },

  // Food
  foodRow: { display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 },
  foodCard: {
    borderRadius: 14,
    overflow: "hidden",
    border: `1px solid ${THEME.border}`,
    background: THEME.cardSolid,
    display: "grid",
    gridTemplateColumns: "1fr",
  },
  foodImg: { width: "100%", height: 120, objectFit: "cover", display: "block" },
  foodBody: { padding: 10 },
  foodName: { fontWeight: 900, color: THEME.text },
  foodMeta: { marginTop: 6, fontSize: 12, fontWeight: 800, color: THEME.muted, display: "flex", gap: 8, flexWrap: "wrap" },
  pill: {
    fontSize: 11,
    fontWeight: 900,
    padding: "4px 10px",
    borderRadius: 999,
    background: THEME.pill,
    color: THEME.navy,
    border: `1px solid ${THEME.border}`,
  },
  bigBtn: {
    marginTop: 10,
    width: "fit-content",
    display: "inline-flex",
    textDecoration: "none",
    fontWeight: 900,
    fontSize: 13,
    padding: "9px 14px",
    borderRadius: 999,
    background: `linear-gradient(90deg, ${THEME.navy}, ${THEME.sky})`,
    color: "#fff",
    border: "none",
    boxShadow: "0 10px 24px rgba(31, 79, 150, 0.18)",
  },
  outlineBtn: {
    marginTop: 10,
    width: "fit-content",
    display: "inline-flex",
    textDecoration: "none",
    fontWeight: 900,
    fontSize: 13,
    padding: "9px 14px",
    borderRadius: 999,
    background: "rgba(255,255,255,0.85)",
    color: THEME.navy,
    border: `1px solid ${THEME.border}`,
  },

  // Saved
  savedWrap: { display: "grid", gap: 10 },
  savedCard: {
    display: "grid",
    gridTemplateColumns: "110px 1fr auto",
    gap: 10,
    alignItems: "center",
    borderRadius: 14,
    border: `1px solid ${THEME.border}`,
    background: THEME.cardSolid,
    padding: 10,
  },
  savedImg: { width: 110, height: 70, objectFit: "cover", borderRadius: 12 },

  // Tracking
  trackWrap: { display: "grid", gridTemplateColumns: "1fr 0.55fr", gap: 10, alignItems: "center" },
  trackLeft: {},
  trackTitle: { fontWeight: 900, fontSize: 18, color: THEME.text },
  trackSub: { marginTop: 6, color: THEME.muted, fontWeight: 800 },
  timeline: { marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" },
  step: {
    padding: "6px 10px",
    borderRadius: 999,
    border: `1px solid ${THEME.border}`,
    background: "rgba(255,255,255,0.85)",
    fontWeight: 900,
    fontSize: 12,
    color: THEME.muted,
  },
  stepDone: { background: THEME.pill, color: THEME.navy },
  stepActive: { background: `linear-gradient(90deg, ${THEME.navy}, ${THEME.sky})`, color: "#fff", border: "none" },
  lineWrap: { position: "relative", height: 10, marginTop: 10 },
  lineBase: { position: "absolute", left: 0, right: 0, top: 4, height: 3, borderRadius: 999, background: "rgba(15,23,42,0.12)" },
  lineFill: { position: "absolute", left: 0, top: 4, height: 3, width: "60%", borderRadius: 999, background: `linear-gradient(90deg, ${THEME.navy}, ${THEME.sky})` },
  trackArt: { display: "grid", placeItems: "center" },
  scooterCircle: {
    width: 120,
    height: 120,
    borderRadius: 999,
    display: "grid",
    placeItems: "center",
    fontSize: 40,
    background: "rgba(90,169,255,0.18)",
    border: `1px solid ${THEME.border}`,
  },

  // AI section
  aiGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
  },
  aiBox: {
    borderRadius: 16,
    border: `1px solid ${THEME.border}`,
    background: "rgba(255,255,255,0.90)",
    padding: 14,
  },
  aiLabel: { fontSize: 12, fontWeight: 900, color: THEME.muted },
  aiValue: { marginTop: 6, fontSize: 18, fontWeight: 900, color: THEME.text },
  aiHint: { marginTop: 6, fontSize: 13, fontWeight: 800, color: THEME.muted },
  bar: { marginTop: 10, height: 10, borderRadius: 999, background: "rgba(15,23,42,0.10)", overflow: "hidden" },
  barFill: { height: "100%", borderRadius: 999, background: `linear-gradient(90deg, ${THEME.navy}, ${THEME.sky})` },
  list: { marginTop: 10, display: "grid", gap: 6 },
  listItem: { fontSize: 13, fontWeight: 900, color: THEME.text },

  aiActions: { marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" },

  mealGrid: { marginTop: 10, display: "grid", gap: 10 },
  mealCard: {
    borderRadius: 14,
    border: `1px solid ${THEME.border}`,
    background: "rgba(31,79,150,0.05)",
    padding: 12,
  },
  mealTitle: { fontWeight: 900, color: THEME.text },
  mealSub: { marginTop: 4, fontSize: 12, fontWeight: 800, color: THEME.muted },
  chips: { marginTop: 10, display: "flex", flexWrap: "wrap", gap: 8 },
  chip: {
    fontSize: 11,
    fontWeight: 900,
    padding: "5px 10px",
    borderRadius: 999,
    background: "rgba(255,255,255,0.90)",
    border: `1px solid ${THEME.border}`,
    color: THEME.text,
  },

  providerList: { marginTop: 10, display: "grid", gap: 10 },
  providerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 10,
    padding: 10,
    borderRadius: 14,
    border: `1px solid ${THEME.border}`,
    background: "rgba(255,255,255,0.92)",
  },
  providerName: { fontWeight: 900, color: THEME.text },
  providerMeta: { marginTop: 4, fontSize: 12, fontWeight: 800, color: THEME.muted, display: "flex", gap: 8, flexWrap: "wrap" },
  providerRight: { textAlign: "right" },
  providerDist: { fontSize: 12, fontWeight: 900, color: THEME.muted },
  providerFrom: { marginTop: 4, fontSize: 12, fontWeight: 900, color: THEME.navy },

  breakdown: {
    marginTop: 12,
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: 10,
  },
  breakItem: {
    borderRadius: 14,
    border: `1px solid ${THEME.border}`,
    background: "rgba(255,255,255,0.90)",
    padding: 10,
  },
  breakLabel: { fontSize: 12, fontWeight: 900, color: THEME.muted },
  breakVal: { marginTop: 6, fontSize: 13, fontWeight: 900, color: THEME.text },

  aiNote: { marginTop: 10, fontSize: 12, fontWeight: 800, color: THEME.muted },
};

export default StudentDashboardMockBlue;