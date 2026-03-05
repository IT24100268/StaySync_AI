import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import { STUDENT_LAYOUT, STUDENT_THEME as THEME } from "../styles/studentTheme";

const RoomDetail = () => {
  const { id } = useParams();
  const [room, setRoom] = useState(null);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchRoom();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchRoom = async () => {
    try {
      const { data } = await api.get(`/rooms/${id}/`);
      setRoom(data);
    } catch (error) {
      console.error("Error fetching room:", error);
    }
  };

  const handleBooking = async () => {
    try {
      await api.post("/bookings/create/", { room_id: id, message });
      alert("Booking request sent!");
      navigate("/bookings");
    } catch (error) {
      alert("Error creating booking");
    }
  };

  if (!room) {
    return (
      <div style={STUDENT_LAYOUT.page}>
        <div style={STUDENT_LAYOUT.container}>
          <div style={STUDENT_LAYOUT.card}>Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={STUDENT_LAYOUT.page}>
      <div style={{ ...STUDENT_LAYOUT.container, maxWidth: 1000 }}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>{room.title}</h1>
            <div style={styles.meta}>
              📍 {room.distance_from_university} km • Gender: {room.gender_allowed}
            </div>
          </div>
          <div style={styles.price}>LKR {Number(room.price).toLocaleString()} / month</div>
        </div>

        <div style={styles.grid}>
          <div style={STUDENT_LAYOUT.card}>
            <div style={styles.images}>
              {room.images?.length ? (
                room.images.map((img) => (
                  <img key={img.id} src={img.image} alt={room.title} style={styles.image} />
                ))
              ) : (
                <div style={styles.noImage}>No images</div>
              )}
            </div>

            <div style={styles.info}>
              <div style={styles.infoRow}>
                <span style={styles.label}>Description</span>
                <span style={styles.value}>{room.description || "—"}</span>
              </div>
              <div style={styles.infoRow}>
                <span style={styles.label}>Facilities</span>
                <span style={styles.value}>{room.facilities?.join(", ") || "—"}</span>
              </div>
              <div style={styles.infoRow}>
                <span style={styles.label}>Rules</span>
                <span style={styles.value}>{room.rules || "—"}</span>
              </div>
              <div style={styles.infoRow}>
                <span style={styles.label}>Contact</span>
                <span style={styles.value}>{room.owner_contact || "—"}</span>
              </div>
            </div>
          </div>

          <div style={STUDENT_LAYOUT.card}>
            <div style={{ fontSize: 15, fontWeight: 900, color: THEME.text }}>
              Request Booking
            </div>
            <div style={{ marginTop: 6, color: THEME.muted, fontWeight: 800, fontSize: 13 }}>
              Add a short message to the owner (optional).
            </div>

            <textarea
              placeholder="Hi, I’m interested in this room. Can I visit and confirm availability?"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              style={STUDENT_LAYOUT.textarea}
            />

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
              <button onClick={handleBooking} style={STUDENT_LAYOUT.primaryBtn}>
                Send Booking Request
              </button>
              <button onClick={() => navigate(-1)} style={STUDENT_LAYOUT.outlineBtn}>
                Back
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: 12,
    marginBottom: 12,
  },
  title: { margin: 0, fontSize: 26, fontWeight: 900, color: THEME.text },
  meta: { marginTop: 6, color: THEME.muted, fontWeight: 800 },
  price: { fontWeight: 900, color: THEME.navy, fontSize: 18 },

  grid: {
    display: "grid",
    gridTemplateColumns: "1.6fr 1fr",
    gap: 12,
    alignItems: "start",
  },

  images: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 10,
    marginBottom: 12,
  },
  image: { width: "100%", height: 180, objectFit: "cover", borderRadius: 14 },
  noImage: {
    height: 180,
    borderRadius: 14,
    border: `1px solid ${THEME.border}`,
    background: "rgba(31,79,150,0.06)",
    display: "grid",
    placeItems: "center",
    color: THEME.muted,
    fontWeight: 900,
  },

  info: { display: "grid", gap: 10 },
  infoRow: {
    display: "grid",
    gridTemplateColumns: "160px 1fr",
    gap: 10,
    padding: 10,
    borderRadius: 14,
    border: `1px solid ${THEME.border}`,
    background: "rgba(255,255,255,0.92)",
  },
  label: { fontWeight: 900, color: THEME.muted, fontSize: 12 },
  value: { fontWeight: 800, color: THEME.text, fontSize: 13, lineHeight: 1.6 },
};

export default RoomDetail;