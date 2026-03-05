import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { STUDENT_LAYOUT, STUDENT_THEME as THEME } from "../styles/studentTheme";

const Restaurants = () => {
  const [restaurants, setRestaurants] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const fetchRestaurants = async () => {
    try {
      const { data } = await api.get("/restaurants/");
      setRestaurants(data.results || data);
    } catch (error) {
      console.error("Error fetching restaurants:", error);
    }
  };

  return (
    <div style={STUDENT_LAYOUT.page}>
      <div style={STUDENT_LAYOUT.container}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Restaurants Near You</h1>
            <p style={styles.sub}>Choose a provider and view menu items.</p>
          </div>
          <span style={STUDENT_LAYOUT.pill}>{restaurants.length} places</span>
        </div>

        <div style={styles.grid}>
          {restaurants.map((r) => (
            <div
              key={r.id}
              style={styles.card}
              onClick={() => navigate(`/restaurants/${r.id}`)}
              role="button"
              tabIndex={0}
            >
              {r.image ? (
                <img src={r.image} alt={r.name} style={styles.image} />
              ) : (
                <div style={styles.imagePlaceholder}>No Image</div>
              )}
              <div style={styles.body}>
                <div style={styles.name}>{r.name}</div>
                <button style={{ ...STUDENT_LAYOUT.primaryBtn, width: "100%" }}>
                  View Menu
                </button>
              </div>
            </div>
          ))}
        </div>

        {restaurants.length === 0 && (
          <div style={{ ...STUDENT_LAYOUT.card, marginTop: 12 }}>No restaurants found.</div>
        )}
      </div>
    </div>
  );
};

const styles = {
  header: {
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 12,
    margin: "6px 0 12px",
  },
  title: { margin: 0, fontSize: 26, fontWeight: 900, color: THEME.text },
  sub: { margin: "6px 0 0", color: THEME.muted, fontWeight: 800 },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: 12,
    marginTop: 12,
  },
  card: {
    background: THEME.cardSolid,
    border: `1px solid ${THEME.border}`,
    borderRadius: 16,
    overflow: "hidden",
    boxShadow: THEME.shadow,
    cursor: "pointer",
  },
  image: { width: "100%", height: 190, objectFit: "cover", display: "block" },
  imagePlaceholder: {
    height: 190,
    display: "grid",
    placeItems: "center",
    background: "linear-gradient(135deg, rgba(90,169,255,0.18), rgba(255,255,255,0.8))",
    color: THEME.muted,
    fontWeight: 900,
  },
  body: { padding: 12, display: "grid", gap: 10 },
  name: { fontWeight: 900, color: THEME.text, fontSize: 15 },
};

export default Restaurants;