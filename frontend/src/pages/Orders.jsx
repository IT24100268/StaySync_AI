import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { STUDENT_LAYOUT, STUDENT_THEME as THEME } from "../styles/studentTheme";

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const { data } = await api.get("/orders/");
      setOrders(data.results || data);
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  };

  const statusPill = (status) => {
    const s = String(status || "").toLowerCase();
    const map = {
      delivered: { bg: "rgba(34,197,94,0.14)", text: "#15803d", label: "DELIVERED" },
      on_the_way: { bg: "rgba(59,130,246,0.14)", text: "#1d4ed8", label: "ON THE WAY" },
      preparing: { bg: "rgba(245,158,11,0.16)", text: "#b45309", label: "PREPARING" },
    };
    const v = map[s] || { bg: "rgba(100,116,139,0.14)", text: "#334155", label: s.toUpperCase() || "UNKNOWN" };

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
            <h1 style={styles.title}>My Orders</h1>
            <p style={styles.sub}>Your food orders and live tracking.</p>
          </div>
          <span style={STUDENT_LAYOUT.pill}>{orders.length} orders</span>
        </div>

        {orders.length === 0 ? (
          <div style={STUDENT_LAYOUT.card}>No orders yet.</div>
        ) : (
          <div style={styles.list}>
            {orders.map((order) => (
              <div key={order.id} style={STUDENT_LAYOUT.card}>
                <div style={styles.rowTop}>
                  <div style={styles.orderTitle}>Order #{order.id}</div>
                  {statusPill(order.status)}
                </div>

                <div style={styles.grid}>
                  <div style={styles.kv}>
                    <div style={styles.k}>Restaurant</div>
                    <div style={styles.v}>{order.restaurant.name}</div>
                  </div>
                  <div style={styles.kv}>
                    <div style={styles.k}>Total</div>
                    <div style={styles.v}>LKR {Number(order.total_price).toLocaleString()}</div>
                  </div>
                  <div style={styles.kv}>
                    <div style={styles.k}>Items</div>
                    <div style={styles.v}>{order.items.length}</div>
                  </div>
                  <div style={styles.kv}>
                    <div style={styles.k}>Ordered</div>
                    <div style={styles.v}>{new Date(order.created_at).toLocaleString()}</div>
                  </div>
                </div>

                {order.status === "on_the_way" && (
                  <div style={{ marginTop: 12 }}>
                    <button
                      onClick={() => navigate(`/tracking/${order.id}`)}
                      style={STUDENT_LAYOUT.primaryBtn}
                    >
                      Track Order
                    </button>
                  </div>
                )}
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
  orderTitle: { fontWeight: 900, color: THEME.text, fontSize: 16 },

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

export default Orders;