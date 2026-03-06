import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../services/api";
import { STUDENT_LAYOUT, STUDENT_THEME as THEME } from "../styles/studentTheme";

const Checkout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { cart, restaurant, totalPrice } = location.state || {};
  const [address, setAddress] = useState("");
  const [orderType, setOrderType] = useState("delivery");

  const deliveryCharge = orderType === "delivery" ? 200 : 0;
  const finalTotal = Number(totalPrice) + deliveryCharge;

  const handleOrder = async () => {
    if (!address || address.trim().length < 10) {
      alert("Please enter a complete delivery address (at least 10 characters)");
      return;
    }
    if (!cart || cart.length === 0) {
      alert("Your cart is empty");
      return;
    }
    if (!totalPrice || Number(totalPrice) <= 0) {
      alert("Invalid order total");
      return;
    }
    if (!window.confirm(`Confirm ${orderType} order for LKR ${finalTotal}?`)) return;

    try {
      const orderData = {
        restaurant_id: restaurant.id,
        delivery_address: address,
        payment_method: "cod",
        order_type: orderType,
        food_price: totalPrice,
        delivery_charge: deliveryCharge,
        total_price: finalTotal,
        items: cart.map((item) => ({
          menu_item_id: item.id,
          quantity: item.quantity,
          price: item.price,
        })),
      };
      console.log("Sending order:", orderData);
      const { data } = await api.post("/orders/create/", orderData);
      alert("Order placed successfully! Waiting for restaurant confirmation.");
      navigate(`/orders`);
    } catch (error) {
      console.error("Order error:", error.response?.data || error);
      alert(`Error: ${JSON.stringify(error.response?.data || "Failed to place order")}`);
    }
  };

  if (!cart) {
    return (
      <div style={STUDENT_LAYOUT.page}>
        <div style={STUDENT_LAYOUT.container}>
          <div style={STUDENT_LAYOUT.card}>No items in cart</div>
        </div>
      </div>
    );
  }

  return (
    <div style={STUDENT_LAYOUT.page}>
      <div style={{ ...STUDENT_LAYOUT.container, maxWidth: 900 }}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Checkout</h1>
            <p style={styles.sub}>{restaurant?.name ? `From ${restaurant.name}` : "Order Summary"}</p>
          </div>
          <span style={STUDENT_LAYOUT.pill}>LKR {finalTotal.toLocaleString()}</span>
        </div>

        <div style={STUDENT_LAYOUT.card}>
          <div style={STUDENT_LAYOUT.cardHeader}>
            <div style={STUDENT_LAYOUT.cardTitle}>Order Summary</div>
          </div>

          <div style={styles.items}>
            {cart.map((item) => (
              <div key={item.id} style={styles.item}>
                <div style={{ minWidth: 0 }}>
                  <div style={styles.itemName}>
                    {item.name} × {item.quantity}
                  </div>
                  <div style={styles.itemMeta}>LKR {Number(item.price).toLocaleString()} each</div>
                </div>
                <div style={styles.itemTotal}>
                  LKR {(Number(item.price) * item.quantity).toLocaleString()}
                </div>
              </div>
            ))}
          </div>

          <div style={styles.total}>
            <div style={styles.totalLabel}>Food Total</div>
            <div style={styles.totalValue}>LKR {Number(totalPrice).toLocaleString()}</div>
          </div>
          
          {orderType === "delivery" && (
            <div style={styles.total}>
              <div style={styles.totalLabel}>Delivery Charge</div>
              <div style={styles.totalValue}>LKR {deliveryCharge}</div>
            </div>
          )}
          
          <div style={{...styles.total, borderTop: `2px solid ${THEME.navy}`, paddingTop: 12}}>
            <div style={{...styles.totalLabel, fontSize: 16, fontWeight: 900}}>Grand Total</div>
            <div style={{...styles.totalValue, fontSize: 18, color: THEME.navy}}>LKR {finalTotal.toLocaleString()}</div>
          </div>

          <div style={styles.form}>
            <div style={{ fontWeight: 900, color: THEME.text }}>Order Type</div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setOrderType("delivery")}
                style={{
                  ...STUDENT_LAYOUT.primaryBtn,
                  flex: 1,
                  background: orderType === "delivery" ? THEME.navy : "white",
                  color: orderType === "delivery" ? "white" : THEME.navy,
                  border: `2px solid ${THEME.navy}`,
                }}
              >
                Delivery (+LKR 200)
              </button>
              <button
                onClick={() => setOrderType("takeaway")}
                style={{
                  ...STUDENT_LAYOUT.primaryBtn,
                  flex: 1,
                  background: orderType === "takeaway" ? THEME.navy : "white",
                  color: orderType === "takeaway" ? "white" : THEME.navy,
                  border: `2px solid ${THEME.navy}`,
                }}
              >
                Takeaway
              </button>
            </div>
            
            <div style={{ fontWeight: 900, color: THEME.text, marginTop: 10 }}>Delivery Details</div>
            <textarea
              placeholder="Enter your delivery address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              style={STUDENT_LAYOUT.textarea}
              required
            />
            <div style={styles.pay}>
              <span style={STUDENT_LAYOUT.pill}>Cash on Delivery</span>
            </div>

            <button onClick={handleOrder} style={{ ...STUDENT_LAYOUT.primaryBtn, width: "100%" }}>
              Place Order
            </button>
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

  items: { display: "grid", gap: 10 },
  item: {
    display: "flex",
    justifyContent: "space-between",
    gap: 10,
    padding: 10,
    borderRadius: 14,
    border: `1px solid ${THEME.border}`,
    background: "rgba(255,255,255,0.92)",
  },
  itemName: { fontWeight: 900, color: THEME.text },
  itemMeta: { marginTop: 4, fontWeight: 800, color: THEME.muted, fontSize: 12 },
  itemTotal: { fontWeight: 900, color: THEME.navy, whiteSpace: "nowrap" },

  total: {
    marginTop: 12,
    paddingTop: 12,
    borderTop: `1px solid ${THEME.border}`,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: { fontWeight: 900, color: THEME.muted },
  totalValue: { fontWeight: 900, color: THEME.text },

  form: { marginTop: 14, display: "grid", gap: 10 },
  pay: { display: "flex", justifyContent: "flex-start" },
};

export default Checkout;