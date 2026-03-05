import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../services/api";
import { STUDENT_LAYOUT, STUDENT_THEME as THEME } from "../styles/studentTheme";

const Tracking = () => {
  const { orderId } = useParams();
  const [tracking, setTracking] = useState(null);
  const [order, setOrder] = useState(null);

  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const wsRef = useRef(null);

  useEffect(() => {
    fetchOrderAndTracking();
    connectWebSocket();
    return () => {
      if (wsRef.current) wsRef.current.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  useEffect(() => {
    if (tracking && window.google) initMap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tracking]);

  const fetchOrderAndTracking = async () => {
    try {
      const [orderRes, trackingRes] = await Promise.all([
        api.get(`/orders/${orderId}/`),
        api.get(`/tracking/${orderId}/`),
      ]);
      setOrder(orderRes.data);
      setTracking(trackingRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const connectWebSocket = () => {
    const WS_URL = import.meta.env.VITE_WS_URL || "ws://localhost:8000";
    const ws = new WebSocket(`${WS_URL}/ws/tracking/${orderId}/`);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setTracking((prev) => ({ ...prev, ...data }));
      updateMarker(data);
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    wsRef.current = ws;
  };

  const initMap = () => {
    if (!mapRef.current && tracking) {
      const map = new window.google.maps.Map(document.getElementById("map"), {
        center: { lat: parseFloat(tracking.current_latitude), lng: parseFloat(tracking.current_longitude) },
        zoom: 15,
      });

      const marker = new window.google.maps.Marker({
        position: { lat: parseFloat(tracking.current_latitude), lng: parseFloat(tracking.current_longitude) },
        map,
        title: "Rider Location",
        icon: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
      });

      mapRef.current = map;
      markerRef.current = marker;
    }
  };

  const updateMarker = (data) => {
    if (markerRef.current && data.current_latitude && data.current_longitude) {
      const newPos = { lat: parseFloat(data.current_latitude), lng: parseFloat(data.current_longitude) };
      markerRef.current.setPosition(newPos);
      mapRef.current.panTo(newPos);
    }
  };

  if (!tracking || !order) {
    return (
      <div style={STUDENT_LAYOUT.page}>
        <div style={STUDENT_LAYOUT.container}>
          <div style={STUDENT_LAYOUT.card}>Loading...</div>
        </div>
      </div>
    );
  }

  const timelineDot = (active) => ({
    width: 14,
    height: 14,
    borderRadius: 999,
    background: active ? `linear-gradient(90deg, ${THEME.navy}, ${THEME.sky})` : "rgba(15,23,42,0.14)",
    border: `1px solid ${THEME.border}`,
  });

  const isPreparing = order.status === "preparing" || order.status === "on_the_way" || order.status === "delivered";
  const isOTW = order.status === "on_the_way" || order.status === "delivered";
  const isDelivered = order.status === "delivered";

  return (
    <div style={STUDENT_LAYOUT.page}>
      <div style={{ ...STUDENT_LAYOUT.container, maxWidth: 1400 }}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Track Your Order</h1>
            <p style={styles.sub}>Live rider location + order progress.</p>
          </div>
          <span style={STUDENT_LAYOUT.pill}>Order #{order.id}</span>
        </div>

        <div style={styles.layout}>
          <div style={{ display: "grid", gap: 12 }}>
            <div style={STUDENT_LAYOUT.card}>
              <div style={STUDENT_LAYOUT.cardHeader}>
                <div style={STUDENT_LAYOUT.cardTitle}>Order Info</div>
              </div>
              <div style={styles.kvGrid}>
                <div style={styles.kv}><div style={styles.k}>Restaurant</div><div style={styles.v}>{order.restaurant.name}</div></div>
                <div style={styles.kv}><div style={styles.k}>Total</div><div style={styles.v}>LKR {Number(order.total_price).toLocaleString()}</div></div>
                <div style={styles.kv}><div style={styles.k}>Status</div><div style={styles.v}>{order.status.replace("_", " ").toUpperCase()}</div></div>
              </div>
            </div>

            <div style={STUDENT_LAYOUT.card}>
              <div style={STUDENT_LAYOUT.cardHeader}>
                <div style={STUDENT_LAYOUT.cardTitle}>Rider Information</div>
                <span style={STUDENT_LAYOUT.pill}>ETA {tracking.eta_minutes} mins</span>
              </div>
              <div style={styles.kvGrid}>
                <div style={styles.kv}><div style={styles.k}>Name</div><div style={styles.v}>{tracking.rider_name}</div></div>
                <div style={styles.kv}><div style={styles.k}>Phone</div><div style={styles.v}>{tracking.rider_phone}</div></div>
              </div>
            </div>

            <div style={STUDENT_LAYOUT.card}>
              <div style={STUDENT_LAYOUT.cardHeader}>
                <div style={STUDENT_LAYOUT.cardTitle}>Order Timeline</div>
              </div>

              <div style={styles.timeline}>
                <div style={styles.tRow}><div style={timelineDot(true)} /><div style={styles.tText}>Order Placed</div></div>
                <div style={styles.tRow}><div style={timelineDot(isPreparing)} /><div style={styles.tText}>Preparing</div></div>
                <div style={styles.tRow}><div style={timelineDot(isOTW)} /><div style={styles.tText}>On The Way</div></div>
                <div style={styles.tRow}><div style={timelineDot(isDelivered)} /><div style={styles.tText}>Delivered</div></div>
              </div>
            </div>
          </div>

          <div id="map" style={styles.map}></div>
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

  layout: { display: "grid", gridTemplateColumns: "1fr 2fr", gap: 12, marginTop: 8, alignItems: "start" },

  map: {
    height: 620,
    borderRadius: 16,
    border: `1px solid ${THEME.border}`,
    boxShadow: THEME.shadow,
    overflow: "hidden",
    background: "rgba(255,255,255,0.85)",
  },

  kvGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 },
  kv: {
    borderRadius: 14,
    border: `1px solid ${THEME.border}`,
    background: "rgba(255,255,255,0.92)",
    padding: 10,
  },
  k: { fontSize: 12, fontWeight: 900, color: THEME.muted },
  v: { marginTop: 6, fontSize: 13, fontWeight: 900, color: THEME.text },

  timeline: { display: "grid", gap: 10 },
  tRow: { display: "flex", alignItems: "center", gap: 10 },
  tText: { fontWeight: 900, color: THEME.text },
};

export default Tracking;