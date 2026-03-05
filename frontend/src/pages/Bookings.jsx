import { useEffect, useState } from "react";
import api from "../services/api";
import { STUDENT_LAYOUT, STUDENT_THEME as THEME } from "../styles/studentTheme";

const Bookings = () => {
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const { data } = await api.get("/bookings/");
      setBookings(data.results || data);
    } catch (error) {
      console.error("Error fetching bookings:", error);
    }
  };

  const statusBadge = (status) => {
    const s = String(status || "").toLowerCase();
    const map = {
      approved: { bg: "rgba(34,197,94,0.14)", text: "#15803d", label: "APPROVED" },
      rejected: { bg: "rgba(239,68,68,0.14)", text: "#b91c1c", label: "REJECTED" },
      pending: { bg: "rgba(245,158,11,0.16)", text: "#b45309", label: "PENDING" },
    };
    const v = map[s] || map.pending;

    return (
      <span
        style={{
          padding: "6px 10px",
          borderRadius: 999,
          background: v.bg,
          color: v.text,
          fontWeight: 900,
          fontSize: 12,
          border: `1px solid ${THEME.border}`,
        }}
      >
        {v.label}
      </span>
    );
  };

  return (
    <div style={STUDENT_LAYOUT.page}>
      <div style={{ ...STUDENT_LAYOUT.container, maxWidth: 1000 }}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>My Bookings</h1>
            <p style={styles.sub}>Your booking requests and status updates.</p>
          </div>
          <span style={STUDENT_LAYOUT.pill}>{bookings.length} requests</span>
        </div>

        {bookings.length === 0 ? (
          <div style={STUDENT_LAYOUT.card}>No bookings yet.</div>
        ) : (
          <div style={styles.list}>
            {bookings.map((booking) => (
              <div key={booking.id} style={STUDENT_LAYOUT.card}>
                <div style={styles.rowTop}>
                  <div style={styles.roomTitle}>{booking.room.title}</div>
                  {statusBadge(booking.status)}
                </div>

                <div style={styles.grid}>
                  <div style={styles.kv}>
                    <div style={styles.k}>Price</div>
                    <div style={styles.v}>LKR {Number(booking.room.price).toLocaleString()} / month</div>
                  </div>
                  <div style={styles.kv}>
                    <div style={styles.k}>Requested</div>
                    <div style={styles.v}>{new Date(booking.created_at).toLocaleDateString()}</div>
                  </div>
                  <div style={{ ...styles.kv, gridColumn: "1 / -1" }}>
                    <div style={styles.k}>Message</div>
                    <div style={styles.v}>{booking.message || "No message"}</div>
                  </div>
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

  list: { display: "flex", flexDirection: "column", gap: 12 },

  rowTop: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 },
  roomTitle: { fontWeight: 900, color: THEME.text, fontSize: 16 },

  grid: { marginTop: 10, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 },
  kv: {
    borderRadius: 14,
    border: `1px solid ${THEME.border}`,
    background: "rgba(255,255,255,0.90)",
    padding: 10,
  },
  k: { fontSize: 12, fontWeight: 900, color: THEME.muted },
  v: { marginTop: 6, fontSize: 13, fontWeight: 900, color: THEME.text },
};

export default Bookings;