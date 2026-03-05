import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { STUDENT_LAYOUT, STUDENT_THEME as THEME } from "../styles/studentTheme";

const Rooms = () => {
  const [rooms, setRooms] = useState([]);
  const [filters, setFilters] = useState({
    min_price: "",
    max_price: "",
    gender_allowed: "",
    max_distance: "",
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchRooms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchRooms = async () => {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      const { data } = await api.get(`/rooms/?${params}`);
      setRooms(data.results || data);
    } catch (error) {
      console.error("Error fetching rooms:", error);
    }
  };

  const handleFilterChange = (e) => {
    setFilters((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchRooms();
  };

  const toggleFavorite = async (roomId) => {
    try {
      await api.post("/rooms/favorite/", { room_id: roomId });
      fetchRooms();
    } catch (error) {
      console.error("Error toggling favorite:", error);
    }
  };

  return (
    <div style={STUDENT_LAYOUT.page}>
      <div style={STUDENT_LAYOUT.container}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Available Rooms</h1>
            <p style={styles.sub}>Filter by budget, gender and distance.</p>
          </div>
          <span style={STUDENT_LAYOUT.pill}>{rooms.length} results</span>
        </div>

        <div style={STUDENT_LAYOUT.card}>
          <div style={styles.filterHeader}>
            <div style={styles.filterTitle}>Filters</div>
          </div>

          <form onSubmit={handleSearch} style={styles.filters}>
            <input
              name="min_price"
              placeholder="Min Price"
              onChange={handleFilterChange}
              style={STUDENT_LAYOUT.input}
            />
            <input
              name="max_price"
              placeholder="Max Price"
              onChange={handleFilterChange}
              style={STUDENT_LAYOUT.input}
            />
            <select
              name="gender_allowed"
              onChange={handleFilterChange}
              style={STUDENT_LAYOUT.input}
              defaultValue=""
            >
              <option value="">All Genders</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="any">Any</option>
            </select>
            <input
              name="max_distance"
              placeholder="Max Distance (km)"
              onChange={handleFilterChange}
              style={STUDENT_LAYOUT.input}
            />
            <button type="submit" style={STUDENT_LAYOUT.primaryBtn}>
              Search
            </button>
          </form>
        </div>

        <div style={styles.grid}>
          {rooms.map((room) => (
            <div key={room.id} style={styles.card}>
              <div style={styles.imgWrap}>
                {room.images?.[0] ? (
                  <img
                    src={room.images[0].image}
                    alt={room.title}
                    style={styles.image}
                  />
                ) : (
                  <div style={styles.imagePlaceholder}>No Image</div>
                )}

                <button
                  type="button"
                  onClick={() => toggleFavorite(room.id)}
                  style={styles.fav}
                  title="Favorite"
                >
                  {room.is_favorited ? "❤️" : "🤍"}
                </button>
              </div>

              <div style={styles.body}>
                <div style={styles.roomName}>{room.title}</div>
                <div style={styles.price}>LKR {Number(room.price).toLocaleString()} / month</div>
                <div style={styles.meta}>
                  📍 {room.distance_from_university} km • Gender: {room.gender_allowed}
                </div>

                <div style={styles.actions}>
                  <button
                    onClick={() => navigate(`/rooms/${room.id}`)}
                    style={STUDENT_LAYOUT.primaryBtn}
                  >
                    View Details
                  </button>
                  <button
                    onClick={() => toggleFavorite(room.id)}
                    style={STUDENT_LAYOUT.outlineBtn}
                  >
                    {room.is_favorited ? "Saved" : "Save"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {rooms.length === 0 && (
          <div style={{ ...STUDENT_LAYOUT.card, marginTop: 12, textAlign: "center" }}>
            <div style={{ fontWeight: 900, color: THEME.text }}>No rooms found</div>
            <div style={{ marginTop: 6, color: THEME.muted, fontWeight: 800 }}>
              Try changing filters and search again.
            </div>
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

  filterHeader: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  filterTitle: { fontSize: 13, fontWeight: 900, color: THEME.muted },

  filters: {
    marginTop: 10,
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr) auto",
    gap: 10,
    alignItems: "end",
  },

  grid: {
    marginTop: 12,
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
  imgWrap: { position: "relative" },
  image: { width: "100%", height: 190, objectFit: "cover", display: "block" },
  imagePlaceholder: {
    height: 190,
    display: "grid",
    placeItems: "center",
    background: "linear-gradient(135deg, rgba(90,169,255,0.18), rgba(255,255,255,0.8))",
    color: THEME.muted,
    fontWeight: 900,
  },
  fav: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 36,
    height: 36,
    borderRadius: 999,
    display: "grid",
    placeItems: "center",
    background: "rgba(255,255,255,0.9)",
    border: `1px solid ${THEME.border}`,
    cursor: "pointer",
    fontSize: 16,
  },
  body: { padding: 12 },
  roomName: { fontWeight: 900, color: THEME.text, fontSize: 15 },
  price: { marginTop: 6, fontWeight: 900, color: THEME.navy },
  meta: { marginTop: 6, color: THEME.muted, fontWeight: 800, fontSize: 12 },
  actions: { marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" },
};

export default Rooms;