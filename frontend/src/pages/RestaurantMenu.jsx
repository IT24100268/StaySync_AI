import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import { STUDENT_LAYOUT, STUDENT_THEME as THEME } from "../styles/studentTheme";

const RestaurantMenu = () => {
  const { id } = useParams();
  const [restaurant, setRestaurant] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [cart, setCart] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchRestaurant();
    fetchMenu();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchRestaurant = async () => {
    try {
      const { data } = await api.get(`/restaurants/${id}/`);
      setRestaurant(data);
    } catch (error) {
      console.error("Error fetching restaurant:", error);
    }
  };

  const fetchMenu = async () => {
    try {
      const { data } = await api.get(`/restaurants/${id}/menu/`);
      console.log('Menu items:', data);
      // Handle paginated response
      const items = data.results || data;
      setMenuItems(Array.isArray(items) ? items : []);
    } catch (error) {
      console.error("Error fetching menu:", error);
      setMenuItems([]);
    }
  };

  const addToCart = (item) => {
    const existing = cart.find((i) => i.id === item.id);
    if (existing) {
      setCart(cart.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i)));
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
  };

  const removeFromCart = (itemId) => {
    setCart(cart.filter((i) => i.id !== itemId));
  };

  const updateQuantity = (itemId, quantity) => {
    if (quantity <= 0) removeFromCart(itemId);
    else setCart(cart.map((i) => (i.id === itemId ? { ...i, quantity } : i)));
  };

  const totalPrice = useMemo(() => {
    const t = cart.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
    return t.toFixed(2);
  }, [cart]);

  const handleCheckout = () => {
    navigate("/checkout", { state: { cart, restaurant, totalPrice } });
  };

  if (!restaurant) {
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
      <div style={{ ...STUDENT_LAYOUT.container, maxWidth: 1400 }}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>{restaurant.name}</h1>
            <p style={styles.sub}>Pick meals and build your cart.</p>
          </div>
          <span style={STUDENT_LAYOUT.pill}>{cart.length} items</span>
        </div>

        <div style={styles.layout}>
          {/* Menu */}
          <div style={STUDENT_LAYOUT.card}>
            <div style={STUDENT_LAYOUT.cardHeader}>
              <div style={STUDENT_LAYOUT.cardTitle}>Menu</div>
            </div>

            <div style={styles.grid}>
              {menuItems.length > 0 ? (
                menuItems.map((item) => (
                  <div key={item.id} style={styles.menuCard}>
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name} style={styles.image} />
                    ) : (
                      <div style={styles.imagePlaceholder}>No Image</div>
                    )}

                    <div style={styles.menuBody}>
                      <div style={styles.itemName}>{item.name}</div>
                      <div style={styles.desc}>{item.description}</div>
                      <div style={styles.price}>LKR {Number(item.price).toLocaleString()}</div>

                      <button onClick={() => addToCart(item)} style={{ ...STUDENT_LAYOUT.primaryBtn, width: "100%" }}>
                        Add to Cart
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ padding: 20, color: THEME.muted, fontWeight: 800 }}>No menu items available</div>
              )}
            </div>
          </div>

          {/* Cart */}
          <div style={{ ...STUDENT_LAYOUT.card, position: "sticky", top: 90, height: "fit-content" }}>
            <div style={STUDENT_LAYOUT.cardHeader}>
              <div style={STUDENT_LAYOUT.cardTitle}>Cart</div>
              <span style={STUDENT_LAYOUT.pill}>LKR {Number(totalPrice).toLocaleString()}</span>
            </div>

            {cart.length === 0 ? (
              <div style={{ color: THEME.muted, fontWeight: 800 }}>Cart is empty</div>
            ) : (
              <>
                <div style={styles.cartList}>
                  {cart.map((item) => (
                    <div key={item.id} style={styles.cartItem}>
                      <div style={{ minWidth: 0 }}>
                        <div style={styles.cartName}>{item.name}</div>
                        <div style={styles.cartMeta}>
                          LKR {Number(item.price).toLocaleString()} × {item.quantity}
                        </div>
                      </div>

                      <div style={styles.cartActions}>
                        <button onClick={() => updateQuantity(item.id, item.quantity - 1)} style={styles.qtyBtn}>
                          -
                        </button>
                        <span style={styles.qtyText}>{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, item.quantity + 1)} style={styles.qtyBtn}>
                          +
                        </button>
                        <button onClick={() => removeFromCart(item.id)} style={styles.removeBtn}>
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={styles.totalBox}>
                  <div style={styles.totalRow}>
                    <span style={styles.totalLabel}>Total</span>
                    <span style={styles.totalValue}>LKR {Number(totalPrice).toLocaleString()}</span>
                  </div>

                  <button onClick={handleCheckout} style={{ ...STUDENT_LAYOUT.primaryBtn, width: "100%" }}>
                    Checkout
                  </button>
                </div>
              </>
            )}
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

  layout: { display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12, alignItems: "start" },

  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 12 },
  menuCard: {
    background: THEME.cardSolid,
    border: `1px solid ${THEME.border}`,
    borderRadius: 16,
    overflow: "hidden",
  },
  image: { width: "100%", height: 160, objectFit: "cover", display: "block" },
  imagePlaceholder: {
    height: 160,
    display: "grid",
    placeItems: "center",
    background: "linear-gradient(135deg, rgba(90,169,255,0.18), rgba(255,255,255,0.8))",
    color: THEME.muted,
    fontWeight: 900,
  },
  menuBody: { padding: 12, display: "grid", gap: 8 },
  itemName: { fontWeight: 900, color: THEME.text },
  desc: { color: THEME.muted, fontWeight: 700, fontSize: 12, minHeight: 34 },
  price: { fontWeight: 900, color: THEME.navy },

  cartList: { display: "grid", gap: 10 },
  cartItem: {
    display: "flex",
    justifyContent: "space-between",
    gap: 10,
    padding: 10,
    borderRadius: 14,
    border: `1px solid ${THEME.border}`,
    background: "rgba(255,255,255,0.90)",
  },
  cartName: { fontWeight: 900, color: THEME.text },
  cartMeta: { marginTop: 4, color: THEME.muted, fontWeight: 800, fontSize: 12 },

  cartActions: { display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" },
  qtyBtn: {
    width: 34,
    height: 34,
    borderRadius: 12,
    border: `1px solid ${THEME.border}`,
    background: THEME.pill,
    color: THEME.navy,
    fontWeight: 900,
    cursor: "pointer",
  },
  qtyText: { fontWeight: 900, color: THEME.text, minWidth: 16, textAlign: "center" },
  removeBtn: {
    height: 34,
    padding: "0 10px",
    borderRadius: 12,
    border: `1px solid ${THEME.border}`,
    background: "rgba(239,68,68,0.14)",
    color: "#b91c1c",
    fontWeight: 900,
    cursor: "pointer",
  },

  totalBox: { marginTop: 12, paddingTop: 12, borderTop: `1px solid ${THEME.border}` },
  totalRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  totalLabel: { fontWeight: 900, color: THEME.muted },
  totalValue: { fontWeight: 900, color: THEME.text },
};

export default RestaurantMenu;