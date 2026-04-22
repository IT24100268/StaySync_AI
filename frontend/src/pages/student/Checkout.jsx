import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../../services/api";
import { STUDENT_LAYOUT, STUDENT_THEME as THEME } from "../../styles/studentTheme";

const GOOGLE_MAP_SCRIPT_ID = "google-maps-checkout";
const JAFFNA_CENTER = { lat: 9.6615, lng: 80.0255 };

function loadGoogleMaps(apiKey) {
  if (window.google?.maps?.Map) return Promise.resolve();
  if (document.getElementById(GOOGLE_MAP_SCRIPT_ID)) {
    return new Promise((resolve) => {
      const interval = setInterval(() => {
        if (window.google?.maps?.Map) { clearInterval(interval); resolve(); }
      }, 150);
    });
  }
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.id = GOOGLE_MAP_SCRIPT_ID;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=directions`;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google Maps"));
    document.head.appendChild(script);
  });
}

const Checkout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { cart, restaurant, totalPrice } = location.state || {};

  const [orderType, setOrderType] = useState("delivery");
  const [address, setAddress] = useState("");
  const [coords, setCoords] = useState(null);          // { lat, lng }
  const [locMethod, setLocMethod] = useState("map");   // "map" | "gps"
  const [gpsLoading, setGpsLoading] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState("");
  const [quote, setQuote] = useState(null);            // AI quote from backend
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState("");

  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const geocoderRef = useRef(null);
  const directionsRendererRef = useRef(null);
  const directionsServiceRef = useRef(null);
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  // Load Google Maps
  useEffect(() => {
    loadGoogleMaps(apiKey)
      .then(() => { setMapReady(true); setMapError(""); })
      .catch((e) => setMapError(e.message));
  }, [apiKey]);

  // Init map once ready
  useEffect(() => {
    if (!mapReady || !mapContainerRef.current || mapRef.current) return;

    const map = new window.google.maps.Map(mapContainerRef.current, {
      center: JAFFNA_CENTER,
      zoom: 13,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    });

    const marker = new window.google.maps.Marker({
      map,
      position: JAFFNA_CENTER,
      draggable: true,
    });

    geocoderRef.current = new window.google.maps.Geocoder();
    directionsServiceRef.current = new window.google.maps.DirectionsService();
    directionsRendererRef.current = new window.google.maps.DirectionsRenderer({
      suppressMarkers: false,
      polylineOptions: { strokeColor: "#1f4f96", strokeWeight: 5, strokeOpacity: 0.8 },
    });
    directionsRendererRef.current.setMap(map);
    mapRef.current = map;
    markerRef.current = marker;

    const onPick = (latLng) => {
      const lat = latLng.lat();
      const lng = latLng.lng();
      marker.setPosition({ lat, lng });
      setCoords({ lat, lng });
      reverseGeocode(lat, lng);
      drawRoute(lat, lng);
    };

    map.addListener("click", (e) => onPick(e.latLng));
    marker.addListener("dragend", (e) => onPick(e.latLng));
  }, [mapReady]);

  const reverseGeocode = (lat, lng) => {
    if (!geocoderRef.current) return;
    geocoderRef.current.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === "OK" && results[0]) {
        setAddress(results[0].formatted_address);
      } else {
        setAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
      }
    });
  };

  const drawRoute = (destLat, destLng) => {
    if (!directionsServiceRef.current || !directionsRendererRef.current || !restaurant) return;
    const origin = { lat: parseFloat(restaurant.latitude), lng: parseFloat(restaurant.longitude) };
    const destination = { lat: destLat, lng: destLng };
    // hide plain marker while route is shown
    if (markerRef.current) markerRef.current.setMap(null);
    directionsServiceRef.current.route(
      {
        origin,
        destination,
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === "OK") {
          directionsRendererRef.current.setDirections(result);
        } else {
          // fallback: just show marker if directions fail
          if (markerRef.current) {
            markerRef.current.setPosition(destination);
            markerRef.current.setMap(mapRef.current);
          }
        }
      }
    );
  };

  const panMapTo = (lat, lng) => {
    if (!mapRef.current || !markerRef.current) return;
    mapRef.current.panTo({ lat, lng });
    mapRef.current.setZoom(14);
    markerRef.current.setPosition({ lat, lng });
    drawRoute(lat, lng);
  };

  // Use GPS
  const handleGPS = () => {
    if (!navigator.geolocation) { setError("Geolocation not supported."); return; }
    setGpsLoading(true);
    setError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setCoords({ lat, lng });
        reverseGeocode(lat, lng);
        panMapTo(lat, lng);
        setGpsLoading(false);
      },
      (err) => {
        setError("Location access denied. Please allow location or pin on map.");
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 12000 }
    );
  };

  // Fetch AI quote whenever coords change
  useEffect(() => {
    if (!coords || orderType !== "delivery" || !restaurant?.id) return;
    setQuoteLoading(true);
    setQuote(null);
    api.post("/orders/estimate/", {
      restaurant_id: restaurant.id,
      order_type: "delivery",
      delivery_latitude: coords.lat,
      delivery_longitude: coords.lng,
      food_price: totalPrice,
      preparation_time: 0,
    })
      .then(({ data }) => { setQuote(data.quote); setQuoteLoading(false); })
      .catch(() => { setQuoteLoading(false); });
  }, [coords, orderType]);

  const deliveryCharge = orderType === "delivery"
    ? (quote ? Number(quote.delivery_charge) : null)
    : 0;

  const finalTotal = orderType === "delivery"
    ? (quote ? Number(totalPrice) + Number(quote.delivery_charge) : null)
    : Number(totalPrice);

  const handleOrder = async () => {
    setError("");
    if (!cart?.length) { setError("Your cart is empty."); return; }
    if (orderType === "delivery" && !coords) { setError("Please pick your delivery location on the map or use GPS."); return; }
    if (orderType === "delivery" && !quote) { setError("Waiting for delivery fee calculation. Please wait."); return; }
    if (!window.confirm(`Confirm ${orderType} order for LKR ${finalTotal?.toLocaleString()}?`)) return;

    setPlacing(true);
    try {
      await api.post("/orders/create/", {
        restaurant_id: restaurant.id,
        delivery_address: orderType === "delivery" ? address : "N/A",
        delivery_latitude: orderType === "delivery" ? coords.lat : undefined,
        delivery_longitude: orderType === "delivery" ? coords.lng : undefined,
        payment_method: "cod",
        order_type: orderType,
        food_price: totalPrice,
        items: cart.map((item) => ({
          menu_item_id: item.id,
          quantity: item.quantity,
          price: item.price,
        })),
      });
      navigate("/orders");
    } catch (e) {
      const msg = e.response?.data?.error || e.response?.data?.detail || "Failed to place order.";
      setError(msg);
    } finally {
      setPlacing(false);
    }
  };

  if (!cart) {
    return (
      <div style={STUDENT_LAYOUT.page}>
        <div style={STUDENT_LAYOUT.container}>
          <div style={STUDENT_LAYOUT.card}>No items in cart.</div>
        </div>
      </div>
    );
  }

  return (
    <div style={STUDENT_LAYOUT.page}>
      <div style={{ ...STUDENT_LAYOUT.container, maxWidth: 900 }}>

        {/* Header */}
        <div style={s.header}>
          <div>
            <h1 style={s.title}>Checkout</h1>
            <p style={s.sub}>{restaurant?.name ? `From ${restaurant.name}` : "Order Summary"}</p>
          </div>
          {finalTotal !== null && (
            <span style={STUDENT_LAYOUT.pill}>LKR {finalTotal.toLocaleString()}</span>
          )}
        </div>

        <div style={STUDENT_LAYOUT.card}>

          {/* Order Summary */}
          <div style={STUDENT_LAYOUT.cardHeader}>
            <div style={STUDENT_LAYOUT.cardTitle}>Order Summary</div>
          </div>
          <div style={s.items}>
            {cart.map((item) => (
              <div key={item.id} style={s.item}>
                <div>
                  <div style={s.itemName}>{item.name} × {item.quantity}</div>
                  <div style={s.itemMeta}>LKR {Number(item.price).toLocaleString()} each</div>
                </div>
                <div style={s.itemTotal}>LKR {(Number(item.price) * item.quantity).toLocaleString()}</div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div style={s.row}>
            <span style={s.rowLabel}>Food Total</span>
            <span style={s.rowVal}>LKR {Number(totalPrice).toLocaleString()}</span>
          </div>
          {orderType === "delivery" && (
            <div style={s.row}>
              <span style={s.rowLabel}>Delivery Charge (AI)</span>
              <span style={s.rowVal}>
                {quoteLoading ? "Calculating…" : quote ? `LKR ${Number(quote.delivery_charge).toLocaleString()}` : "—"}
              </span>
            </div>
          )}
          {orderType === "delivery" && quote && (
            <div style={s.row}>
              <span style={s.rowLabel}>Est. Delivery Time</span>
              <span style={s.rowVal}>{Math.round(quote.total_eta_min)} min</span>
            </div>
          )}
          {orderType === "delivery" && quote && (
            <div style={s.row}>
              <span style={s.rowLabel}>Distance</span>
              <span style={s.rowVal}>{Number(quote.distance_km).toFixed(2)} km</span>
            </div>
          )}
          <div style={{ ...s.row, borderTop: `2px solid ${THEME.navy}`, paddingTop: 12, marginTop: 4 }}>
            <span style={{ ...s.rowLabel, fontSize: 16, fontWeight: 900, color: THEME.text }}>Grand Total</span>
            <span style={{ ...s.rowVal, fontSize: 18, color: THEME.navy }}>
              {finalTotal !== null ? `LKR ${finalTotal.toLocaleString()}` : "—"}
            </span>
          </div>

          {/* Order Type */}
          <div style={s.section}>
            <div style={s.sectionLabel}>Order Type</div>
            <div style={{ display: "flex", gap: 10 }}>
              {["delivery", "takeaway"].map((t) => (
                <button
                  key={t}
                  onClick={() => { setOrderType(t); setQuote(null); }}
                  style={{
                    ...STUDENT_LAYOUT.primaryBtn, flex: 1,
                    background: orderType === t ? THEME.navy : "white",
                    color: orderType === t ? "white" : THEME.navy,
                    border: `2px solid ${THEME.navy}`,
                  }}
                >
                  {t === "delivery" ? "Delivery" : "Takeaway"}
                </button>
              ))}
            </div>
          </div>

          {/* Delivery Location */}
          {orderType === "delivery" && (
            <div style={s.section}>
              <div style={s.sectionLabel}>Delivery Location</div>

              {/* Method toggle */}
              <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                {["map", "gps"].map((m) => (
                  <button
                    key={m}
                    onClick={() => setLocMethod(m)}
                    style={{
                      ...STUDENT_LAYOUT.outlineBtn,
                      background: locMethod === m ? THEME.navy : "white",
                      color: locMethod === m ? "white" : THEME.navy,
                      border: `1.5px solid ${THEME.navy}`,
                      fontSize: 13,
                    }}
                  >
                    {m === "map" ? "📍 Pin on Map" : "📡 Use GPS"}
                  </button>
                ))}
              </div>

              {/* GPS panel */}
              {locMethod === "gps" && (
                <div style={s.gpsBox}>
                  <p style={{ margin: "0 0 10px", fontWeight: 700, color: THEME.text }}>
                    Click the button to detect your current location automatically.
                  </p>
                  <button
                    onClick={handleGPS}
                    disabled={gpsLoading}
                    style={{ ...STUDENT_LAYOUT.primaryBtn, opacity: gpsLoading ? 0.6 : 1 }}
                  >
                    {gpsLoading ? "Detecting…" : "📡 Detect My Location"}
                  </button>
                  {coords && (
                    <p style={{ margin: "10px 0 0", fontSize: 12, color: THEME.muted, fontWeight: 700 }}>
                      ✓ GPS: {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
                    </p>
                  )}
                </div>
              )}

              {/* Map panel — always mounted so map initialises, hidden when GPS tab active */}
              <div style={{ display: locMethod === "map" ? "block" : "none" }}>
                <p style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 700, color: THEME.muted }}>
                  Click on the map or drag the marker to set your delivery location.
                </p>
                <div style={s.mapWrap}>
                  {mapError ? (
                    <div style={s.mapError}>{mapError}</div>
                  ) : (
                    <div ref={mapContainerRef} style={{ width: "100%", height: "100%" }} />
                  )}
                </div>
              </div>

              {/* Address display */}
              {address && (
                <div style={s.addressBox}>
                  <span style={{ fontWeight: 800, color: THEME.navy }}>📍 </span>
                  <span style={{ fontWeight: 700, color: THEME.text }}>{address}</span>
                </div>
              )}

              {/* AI quote info box */}
              {quoteLoading && (
                <div style={s.infoBox}>⏳ Calculating AI delivery fee based on your location…</div>
              )}
              {quote && !quoteLoading && (
                <div style={{ ...s.infoBox, background: "#eef6ff", borderColor: THEME.navy }}>
                  🤖 <strong>AI Delivery Fee: LKR {Number(quote.delivery_charge).toLocaleString()}</strong>
                  &nbsp;·&nbsp; ~{Math.round(quote.total_eta_min)} min
                  &nbsp;·&nbsp; {Number(quote.distance_km).toFixed(2)} km
                  &nbsp;·&nbsp; <span style={{ color: THEME.muted }}>{quote.time_period}</span>
                </div>
              )}
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={s.errorBox}>{error}</div>
          )}

          {/* Payment & Place Order */}
          <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
            <div style={{ display: "flex", justifyContent: "flex-start" }}>
              <span style={STUDENT_LAYOUT.pill}>💵 Cash on Delivery</span>
            </div>
            <button
              onClick={handleOrder}
              disabled={placing || (orderType === "delivery" && quoteLoading)}
              style={{
                ...STUDENT_LAYOUT.primaryBtn, width: "100%",
                opacity: placing || (orderType === "delivery" && quoteLoading) ? 0.6 : 1,
              }}
            >
              {placing ? "Placing Order…" : `Place Order${finalTotal !== null ? ` · LKR ${finalTotal.toLocaleString()}` : ""}`}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

const s = {
  header: { display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12, margin: "6px 0 12px" },
  title: { margin: 0, fontSize: 26, fontWeight: 900, color: THEME.text },
  sub: { margin: "6px 0 0", color: THEME.muted, fontWeight: 800 },
  items: { display: "grid", gap: 10 },
  item: {
    display: "flex", justifyContent: "space-between", gap: 10,
    padding: 10, borderRadius: 14,
    border: `1px solid ${THEME.border}`, background: "rgba(255,255,255,0.92)",
  },
  itemName: { fontWeight: 900, color: THEME.text },
  itemMeta: { marginTop: 4, fontWeight: 800, color: THEME.muted, fontSize: 12 },
  itemTotal: { fontWeight: 900, color: THEME.navy, whiteSpace: "nowrap" },
  row: {
    marginTop: 10, paddingTop: 10,
    borderTop: `1px solid ${THEME.border}`,
    display: "flex", justifyContent: "space-between", alignItems: "center",
  },
  rowLabel: { fontWeight: 900, color: THEME.muted },
  rowVal: { fontWeight: 900, color: THEME.text },
  section: { marginTop: 18 },
  sectionLabel: { fontWeight: 900, color: THEME.text, marginBottom: 10 },
  gpsBox: {
    padding: 14, borderRadius: 12,
    border: `1px solid ${THEME.border}`,
    background: "rgba(255,255,255,0.9)",
    marginBottom: 10,
  },
  mapWrap: {
    width: "100%", height: 300, borderRadius: 14,
    overflow: "hidden", border: `1px solid ${THEME.border}`,
    marginBottom: 10,
  },
  mapError: {
    width: "100%", height: "100%",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontWeight: 700, color: "#b91c1c", padding: 20, textAlign: "center",
  },
  addressBox: {
    padding: "10px 14px", borderRadius: 10,
    background: "#f0f6ff", border: `1px solid ${THEME.border}`,
    fontSize: 13, marginBottom: 8,
  },
  infoBox: {
    padding: "10px 14px", borderRadius: 10,
    background: "#f8f8f8", border: `1px solid ${THEME.border}`,
    fontSize: 13, fontWeight: 700, color: THEME.text,
  },
  errorBox: {
    marginTop: 10, padding: "10px 14px", borderRadius: 10,
    background: "#fff0f0", border: "1px solid #fca5a5",
    fontSize: 13, fontWeight: 700, color: "#b91c1c",
  },
};

export default Checkout;
