import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { STUDENT_LAYOUT, STUDENT_THEME as THEME } from "../../styles/studentTheme";
import "./Favorites.css";

const UNIVERSITY_LAT = 9.684058615838461;
const UNIVERSITY_LNG = 80.02305072385631;

const getRoomDistance = (room) => {
  const lat = Number(room.latitude);
  const lng = Number(room.longitude);
  if (Number.isFinite(lat) && Number.isFinite(lng) && (Math.abs(lat) > 0.001 || Math.abs(lng) > 0.001)) {
    const R = 6371;
    const dLat = ((lat - UNIVERSITY_LAT) * Math.PI) / 180;
    const dLng = ((lng - UNIVERSITY_LNG) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((UNIVERSITY_LAT * Math.PI) / 180) *
        Math.cos((lat * Math.PI) / 180) *
        Math.sin(dLng / 2) ** 2;
    return (R * 2 * Math.asin(Math.sqrt(a))).toFixed(1);
  }
  const fromUniversity = Number(room.distance_from_university);
  if (Number.isFinite(fromUniversity) && fromUniversity > 0) {
    return fromUniversity.toFixed(1);
  }
  return null;
};

const Favorites = () => {
  const [favorites, setFavorites] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    try {
      const { data } = await api.get("/rooms/favorites/");
      setFavorites(data.results || data);
    } catch (error) {
      console.error("Error fetching favorites:", error);
    }
  };

  return (
    <div style={STUDENT_LAYOUT.page}>
      <div style={STUDENT_LAYOUT.container}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>My Favorite Rooms</h1>
            <p style={styles.sub}>Saved rooms you can revisit anytime.</p>
          </div>
          <span style={STUDENT_LAYOUT.pill}>{favorites.length} saved</span>
        </div>

        {favorites.length === 0 ? (
          <div style={STUDENT_LAYOUT.card}>
            <div style={{ fontWeight: 900, color: THEME.text }}>No favorites yet</div>
            <div style={{ marginTop: 6, color: THEME.muted, fontWeight: 800 }}>
              Start exploring rooms and tap ❤️ to save.
            </div>
          </div>
        ) : (
          <div style={styles.grid}>
            {favorites.map((fav) => (
              <div key={fav.id} style={styles.card}>
                {fav.room.images?.[0] ? (
                  <img
                    src={fav.room.images[0].image}
                    alt={fav.room.title}
                    style={styles.image}
                  />
                ) : (
                  <div style={styles.imagePlaceholder}>No Image</div>
                )}

                <div style={styles.body}>
                  <div style={styles.name}>{fav.room.title}</div>
                  <div style={styles.price}>
                    LKR {Number(fav.room.price).toLocaleString()} / month
                  </div>
                  <div style={styles.meta}>
                    {(() => {
                      const dist = getRoomDistance(fav.room);
                      return dist ? `📍 ${dist} km from university` : null;
                    })()}
                  </div>

                  <button
                    onClick={() => navigate(`/rooms/${fav.room.id}`)}
                    style={{ ...STUDENT_LAYOUT.primaryBtn, width: "100%" }}
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
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
  },
  card: {
    background: THEME.cardSolid,
    border: `1px solid ${THEME.border}`,
    borderRadius: 16,
    overflow: "hidden",
    boxShadow: THEME.shadow,
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
  body: { padding: 12 },
  name: { fontWeight: 900, color: THEME.text },
  price: { marginTop: 6, fontWeight: 900, color: THEME.navy },
  meta: { marginTop: 6, color: THEME.muted, fontWeight: 800, fontSize: 12 },
};

export default Favorites;