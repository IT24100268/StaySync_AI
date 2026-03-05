import { useAuth } from "../context/AuthContext";
import { STUDENT_LAYOUT, STUDENT_THEME as THEME } from "../styles/studentTheme";

const Profile = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <div style={STUDENT_LAYOUT.page}>
        <div style={STUDENT_LAYOUT.container}>
          <div style={STUDENT_LAYOUT.card}>Loading...</div>
        </div>
      </div>
    );
  }

  const row = (label, value) => (
    <div style={styles.row}>
      <div style={styles.k}>{label}</div>
      <div style={styles.v}>{value || "—"}</div>
    </div>
  );

  return (
    <div style={STUDENT_LAYOUT.page}>
      <div style={{ ...STUDENT_LAYOUT.container, maxWidth: 900 }}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>My Profile</h1>
            <p style={styles.sub}>Your account and preferences.</p>
          </div>
          <span style={STUDENT_LAYOUT.pill}>Student</span>
        </div>

        <div style={STUDENT_LAYOUT.card}>
          <div style={STUDENT_LAYOUT.cardHeader}>
            <div style={STUDENT_LAYOUT.cardTitle}>Profile Info</div>
          </div>

          <div style={styles.grid}>
            {row("Name", `${user.first_name || ""} ${user.last_name || ""}`.trim())}
            {row("Email", user.email)}
            {row("Username", user.username)}
            {row("University", user.profile?.university)}
            {row("Phone", user.profile?.phone_number)}
            {row("Gender Preference", user.profile?.gender_preference)}
            {row("Budget", user.profile?.budget ? `LKR ${Number(user.profile.budget).toLocaleString()}` : "—")}
          </div>
        </div>
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

  grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 },
  row: {
    borderRadius: 14,
    border: `1px solid ${THEME.border}`,
    background: "rgba(255,255,255,0.92)",
    padding: 12,
  },
  k: { fontSize: 12, fontWeight: 900, color: THEME.muted },
  v: { marginTop: 6, fontSize: 13, fontWeight: 900, color: THEME.text },
};

export default Profile;