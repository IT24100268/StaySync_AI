import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Register = () => {
  const [formData, setFormData] = useState({
    email: "",
    username: "",
    password: "",
    password2: "",
    first_name: "",
    last_name: "",
    university: "",
    gender_preference: "any",
    budget: "",
    phone_number: "",
  });

  const [error, setError] = useState("");
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const { university, gender_preference, budget, phone_number, ...userData } = formData;

      await register({
        ...userData,
        user_type: "student",
        profile: { university, gender_preference, budget, phone_number },
      });

      navigate("/login");
    } catch (err) {
      console.log("Error details:", err.response?.data);
      setError(err.response?.data?.message || "Registration failed");
    }
  };

  const handleChange = (e) => {
    setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  return (
    <div style={styles.page}>
      {/* Background image */}
      <div style={{ ...styles.bg, backgroundImage: "url('/images/Image4.jpeg')" }} />

      {/* Dark overlay for readability */}
      <div style={styles.overlay} />

      {/* Floating Glass Card */}
      <div className="registerFloat" style={styles.cardWrap}>
        <form onSubmit={handleSubmit} style={styles.card}>
          {/* Brand */}
          <div style={styles.brandRow}>
            <div style={styles.brandIcon}>S</div>
            <div>
              <div style={styles.brandTitle}>StaySync AI</div>
              <div style={styles.brandSub}>Smart Student Living</div>
            </div>
          </div>

          <h2 style={styles.heading}>Register</h2>

          {error && <div style={styles.error}>{error}</div>}

          {/* Grid inputs */}
          <div style={styles.grid2}>
            <input
              name="first_name"
              placeholder="First Name"
              onChange={handleChange}
              required
              style={styles.input}
            />
            <input
              name="last_name"
              placeholder="Last Name"
              onChange={handleChange}
              required
              style={styles.input}
            />
          </div>

          <input
            name="email"
            type="email"
            placeholder="Email"
            onChange={handleChange}
            required
            style={styles.input}
          />

          <input
            name="username"
            placeholder="Username"
            onChange={handleChange}
            required
            style={styles.input}
          />

          <div style={styles.grid2}>
            <input
              name="password"
              type="password"
              placeholder="Password"
              onChange={handleChange}
              required
              style={styles.input}
            />
            <input
              name="password2"
              type="password"
              placeholder="Confirm Password"
              onChange={handleChange}
              required
              style={styles.input}
            />
          </div>

          <input
            name="university"
            placeholder="University"
            onChange={handleChange}
            required
            style={styles.input}
          />

          <div style={styles.grid2}>
            <select name="gender_preference" onChange={handleChange} style={styles.inputSelect}>
              <option value="any">Any</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>

            <input
              name="budget"
              type="number"
              placeholder="Budget"
              onChange={handleChange}
              style={styles.input}
            />
          </div>

          <input
            name="phone_number"
            placeholder="Phone Number"
            onChange={handleChange}
            required
            style={styles.input}
          />

          <button
            type="submit"
            style={styles.button}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0px)")}
            onMouseDown={(e) => (e.currentTarget.style.transform = "translateY(0px) scale(0.99)")}
            onMouseUp={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
          >
            Register
          </button>

          <p style={styles.footerText}>
            Already have an account?{" "}
            <Link to="/login" style={styles.link}>
              Login
            </Link>
          </p>
        </form>
      </div>

      {/* Pro effects: focus glow + floating + moving light */}
      <style>
        {`
          /* placeholder visibility */
          .registerFloat input::placeholder {
            color: rgba(255,255,255,0.75);
            font-weight: 600;
          }

          /* focus glow */
          .registerFloat input:focus,
          .registerFloat select:focus {
            outline: none !important;
            border: 1px solid rgba(147,197,253,0.8) !important;
            box-shadow: 0 0 0 4px rgba(59,130,246,0.25) !important;
          }

          /* hover border */
          .registerFloat input:hover,
          .registerFloat select:hover {
            border-color: rgba(255,255,255,0.5);
          }

          /* floating */
          .registerFloat {
            animation: floaty 5s ease-in-out infinite;
          }
          @keyframes floaty {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-6px); }
            100% { transform: translateY(0px); }
          }

          /* moving glow highlight */
          .registerFloat form {
            position: relative;
            overflow: hidden;
          }
          .registerFloat form::before {
            content: "";
            position: absolute;
            inset: -120px;
            background: radial-gradient(circle at 30% 30%, rgba(96,165,250,0.25), transparent 55%);
            animation: glowMove 6s ease-in-out infinite;
            pointer-events: none;
          }
          @keyframes glowMove {
            0% { transform: translate(-10px,-10px); }
            50% { transform: translate(20px,15px); }
            100% { transform: translate(-10px,-10px); }
          }
        `}
      </style>
    </div>
  );
};

const styles = {
  page: {
    position: "relative",
    minHeight: "100vh",
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
  },

  bg: {
    position: "absolute",
    inset: 0,
    backgroundSize: "cover",
    backgroundPosition: "center",
    transform: "scale(1.03)",
    zIndex: 0,
    filter: "brightness(1.08) saturate(1.05) contrast(1.05)",
  },

  // ✅ clearer readability
  overlay: {
    position: "absolute",
    inset: 0,
    background: "rgba(0,0,0,0.35)",
    zIndex: 1,
  },

  cardWrap: {
    position: "relative",
    width: "100%",
    maxWidth: "560px",
    zIndex: 2,
  },

  // ✅ premium glass
  card: {
    width: "100%",
    padding: "28px",
    borderRadius: "22px",
    background: "rgba(255,255,255,0.14)",
    border: "1px solid rgba(255,255,255,0.30)",
    backdropFilter: "blur(18px)",
    WebkitBackdropFilter: "blur(18px)",
    boxShadow: "0 26px 70px rgba(0,0,0,0.35)",
    color: "#fff",
    position: "relative",
    overflow: "hidden",
  },

  brandRow: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "14px",
  },

  brandIcon: {
    width: "44px",
    height: "44px",
    borderRadius: "999px",
    display: "grid",
    placeItems: "center",
    background: "linear-gradient(90deg,#3b82f6,#60a5fa)",
    fontWeight: 900,
    fontSize: "18px",
    boxShadow: "0 12px 26px rgba(59,130,246,0.35)",
  },

  brandTitle: { fontSize: "18px", fontWeight: 800, lineHeight: 1.1 },
  brandSub: { fontSize: "13px", opacity: 0.85, marginTop: "2px" },

  // ✅ clearer title
  heading: {
    margin: "10px 0 14px",
    fontSize: "32px",
    fontWeight: 900,
    color: "#ffffff",
    textShadow: "0 4px 12px rgba(0,0,0,0.35)",
  },

  error: {
    background: "rgba(220,38,38,0.20)",
    color: "white",
    padding: "10px 12px",
    borderRadius: "12px",
    marginBottom: "12px",
    border: "1px solid rgba(220,38,38,0.35)",
    fontWeight: 700,
  },

  grid2: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
  },

  // ✅ visible input text
  input: {
    width: "100%",
    padding: "14px 14px",
    margin: "6px 0",
    borderRadius: "16px",
    border: "1px solid rgba(255,255,255,0.35)",
    background: "rgba(255,255,255,0.22)",
    color: "#ffffff",
    fontSize: "15px",
    fontWeight: 700,
    outline: "none",
    boxSizing: "border-box",
  },

  inputSelect: {
    width: "100%",
    padding: "14px 14px",
    margin: "6px 0",
    borderRadius: "16px",
    border: "1px solid rgba(255,255,255,0.35)",
    background: "rgba(255,255,255,0.22)",
    color: "#ffffff",
    fontSize: "15px",
    fontWeight: 700,
    outline: "none",
    boxSizing: "border-box",
    appearance: "none",
    WebkitAppearance: "none",
    MozAppearance: "none",
  },

  button: {
    width: "100%",
    padding: "14px",
    marginTop: "14px",
    borderRadius: "16px",
    border: "none",
    cursor: "pointer",
    fontWeight: 900,
    fontSize: "16px",
    color: "#fff",
    background: "linear-gradient(90deg,#3b82f6,#60a5fa)",
    boxShadow: "0 16px 34px rgba(59,130,246,0.35)",
    transition: "transform 0.15s ease, box-shadow 0.15s ease",
  },

  footerText: {
    marginTop: "14px",
    marginBottom: 0,
    fontSize: "14px",
    opacity: 0.95,
    textAlign: "center",
  },

  link: { color: "#93c5fd", fontWeight: 800, textDecoration: "none" },
};

export default Register;