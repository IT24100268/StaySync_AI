import { useEffect, useMemo, useRef, useState } from "react";
import { Compass, MapPin, Store } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { STUDENT_LAYOUT, STUDENT_THEME as THEME } from "../styles/studentTheme";
import { hasGoogleMapsApiKey, isGoogleMapsReady, loadGoogleMaps } from "../utils/googleMapsLoader";

const DEFAULT_CENTER = { lat: 9.6848, lng: 80.022 };

const parseCoordinate = (value) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
};

const hasValidCoordinatePair = (latitude, longitude) => {
  if (latitude === null || longitude === null) return false;
  if (Math.abs(latitude) < 0.000001 && Math.abs(longitude) < 0.000001) return false;
  return latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180;
};

const calculateDistanceKm = (lat1, lng1, lat2, lng2) => {
  const toRadians = (degrees) => (degrees * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
};

const formatLkr = (value) => `LKR ${Number(value || 0).toLocaleString("en-LK")}`;

const Checkout = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { cart, restaurant, totalPrice } = location.state || {};

  const [orderType, setOrderType] = useState("delivery");
  const [deliveryLat, setDeliveryLat] = useState(null);
  const [deliveryLng, setDeliveryLng] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [quote, setQuote] = useState(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState("");
  const [mapsReady, setMapsReady] = useState(false);
  const [mapError, setMapError] = useState("");

  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const restaurantMarkerRef = useRef(null);
  const deliveryMarkerRef = useRef(null);
  const osrmPolylineRef = useRef(null);
  const routeRequestRef = useRef(0);

  const googleMapsApiKey = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "").trim();

  const savedStudentLocation = useMemo(() => {
    const latitude = parseCoordinate(user?.profile?.latitude);
    const longitude = parseCoordinate(user?.profile?.longitude);
    if (!hasValidCoordinatePair(latitude, longitude)) {
      return null;
    }
    return { lat: latitude, lng: longitude };
  }, [user?.profile?.latitude, user?.profile?.longitude]);

  const restaurantLocation = useMemo(() => {
    const latitude = parseCoordinate(restaurant?.latitude);
    const longitude = parseCoordinate(restaurant?.longitude);
    if (!hasValidCoordinatePair(latitude, longitude)) {
      return null;
    }
    return { lat: latitude, lng: longitude };
  }, [restaurant?.latitude, restaurant?.longitude]);

  useEffect(() => {
    if (deliveryLat != null && deliveryLng != null) return;
    if (!savedStudentLocation) return;
    setDeliveryLat(savedStudentLocation.lat);
    setDeliveryLng(savedStudentLocation.lng);
  }, [savedStudentLocation, deliveryLat, deliveryLng]);

  const deliveryCharge = orderType === "delivery" ? Number(quote?.delivery_charge || 0) : 0;
  const finalTotal = Number(totalPrice || 0) + deliveryCharge;

  const fetchQuote = async () => {
    if (!restaurant?.id || deliveryLat == null || deliveryLng == null) {
      return null;
    }

    setQuoteLoading(true);
    setQuoteError("");
    try {
      const { data } = await api.post("/orders/estimate/", {
        restaurant_id: restaurant.id,
        order_type: orderType,
        food_price: Number(totalPrice || 0),
        delivery_latitude: deliveryLat,
        delivery_longitude: deliveryLng,
      });
      const nextQuote = data?.quote || null;
      setQuote(nextQuote);
      return nextQuote;
    } catch (error) {
      console.error("Estimate error:", error.response?.data || error);
      const message = error.response?.data?.error || "Unable to calculate AI delivery estimate right now.";
      setQuoteError(message);
      return null;
    } finally {
      setQuoteLoading(false);
    }
  };

  useEffect(() => {
    if (orderType !== "delivery") {
      setQuote(null);
      setQuoteError("");
      return;
    }
    if (deliveryLat == null || deliveryLng == null) {
      setQuote(null);
      return;
    }
    fetchQuote();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderType, deliveryLat, deliveryLng, totalPrice, restaurant?.id]);

  useEffect(() => {
    if (orderType !== "delivery") return;
    if (!hasGoogleMapsApiKey(googleMapsApiKey)) {
      setMapError("Map preview unavailable. Configure VITE_GOOGLE_MAPS_API_KEY in frontend .env.");
      return;
    }

    let cancelled = false;
    loadGoogleMaps(googleMapsApiKey)
      .then(() => {
        if (cancelled) return;
        if (!isGoogleMapsReady()) {
          setMapError("Google Maps loaded but constructors are unavailable.");
          return;
        }
        setMapsReady(true);
        setMapError("");
      })
      .catch((error) => {
        if (cancelled) return;
        setMapError(error.message || "Unable to load map.");
      });

    return () => {
      cancelled = true;
    };
  }, [orderType, googleMapsApiKey]);

  useEffect(() => {
    if (orderType !== "delivery") return;
    if (!mapsReady || !mapContainerRef.current || !isGoogleMapsReady()) return;

    const maps = window.google.maps;
    const center =
      (hasValidCoordinatePair(deliveryLat, deliveryLng) && { lat: Number(deliveryLat), lng: Number(deliveryLng) }) ||
      restaurantLocation ||
      savedStudentLocation ||
      DEFAULT_CENTER;

    const needsNewMap = !mapRef.current || mapRef.current.getDiv?.() !== mapContainerRef.current;
    if (needsNewMap) {
      if (osrmPolylineRef.current) {
        osrmPolylineRef.current.setMap(null);
      }
      osrmPolylineRef.current = null;
      restaurantMarkerRef.current = null;
      deliveryMarkerRef.current = null;

      mapRef.current = new maps.Map(mapContainerRef.current, {
        center,
        zoom: 14,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
      });
    }

    if (restaurantLocation) {
      if (!restaurantMarkerRef.current) {
        restaurantMarkerRef.current = new maps.Marker({
          position: restaurantLocation,
          map: mapRef.current,
          title: "Restaurant",
        });
      } else {
        restaurantMarkerRef.current.setPosition(restaurantLocation);
      }
    }

    if (hasValidCoordinatePair(deliveryLat, deliveryLng)) {
      const selected = { lat: Number(deliveryLat), lng: Number(deliveryLng) };
      if (!deliveryMarkerRef.current) {
        deliveryMarkerRef.current = new maps.Marker({
          position: selected,
          map: mapRef.current,
          title: "Delivery point",
          draggable: true,
          icon: {
            path: maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: "#ef4444",
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWeight: 2,
          },
        });
      } else {
        deliveryMarkerRef.current.setPosition(selected);
      }
    }

    maps.event.clearListeners(mapRef.current, "click");
    maps.event.addListener(mapRef.current, "click", (event) => {
      if (!event?.latLng) return;
      const nextLat = Number(event.latLng.lat().toFixed(6));
      const nextLng = Number(event.latLng.lng().toFixed(6));
      setDeliveryLat(nextLat);
      setDeliveryLng(nextLng);
    });

    if (deliveryMarkerRef.current) {
      maps.event.clearListeners(deliveryMarkerRef.current, "dragend");
      maps.event.addListener(deliveryMarkerRef.current, "dragend", (event) => {
        if (!event?.latLng) return;
        const nextLat = Number(event.latLng.lat().toFixed(6));
        const nextLng = Number(event.latLng.lng().toFixed(6));
        setDeliveryLat(nextLat);
        setDeliveryLng(nextLng);
      });
    }
  }, [mapsReady, orderType, deliveryLat, deliveryLng, restaurantLocation, savedStudentLocation]);

  useEffect(() => {
    if (orderType !== "delivery") return;
    if (!mapsReady || !mapRef.current || !isGoogleMapsReady()) {
      return;
    }

    const maps = window.google.maps;
    const clearRoutePolyline = () => {
      if (osrmPolylineRef.current) {
        osrmPolylineRef.current.setMap(null);
        osrmPolylineRef.current = null;
      }
    };

    const drawDirectFallbackLine = () => {
      clearRoutePolyline();
      osrmPolylineRef.current = new maps.Polyline({
        path: [origin, destination],
        geodesic: true,
        strokeColor: "#1f4f96",
        strokeOpacity: 0.88,
        strokeWeight: 5,
        map: mapRef.current,
      });
      const bounds = new maps.LatLngBounds();
      bounds.extend(origin);
      bounds.extend(destination);
      mapRef.current.fitBounds(bounds, 72);
    };

    const origin = restaurantLocation;
    const destination =
      hasValidCoordinatePair(deliveryLat, deliveryLng) ? { lat: Number(deliveryLat), lng: Number(deliveryLng) } : null;

    if (!origin || !destination) {
      clearRoutePolyline();
      return;
    }

    const requestId = routeRequestRef.current + 1;
    routeRequestRef.current = requestId;

    const drawOsrmRoute = async () => {
      try {
        const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`;
        const response = await fetch(osrmUrl);
        if (!response.ok) {
          throw new Error(`OSRM HTTP ${response.status}`);
        }

        const payload = await response.json();
        const coordinates = payload?.routes?.[0]?.geometry?.coordinates;
        if (requestId !== routeRequestRef.current) return;
        if (!Array.isArray(coordinates) || coordinates.length < 2) {
          throw new Error("OSRM route coordinates missing");
        }

        const path = coordinates
          .map((pair) => ({ lat: Number(pair?.[1]), lng: Number(pair?.[0]) }))
          .filter((point) => hasValidCoordinatePair(point.lat, point.lng));
        if (path.length < 2) {
          throw new Error("OSRM path invalid");
        }

        clearRoutePolyline();
        osrmPolylineRef.current = new maps.Polyline({
          path,
          geodesic: true,
          strokeColor: "#1f4f96",
          strokeOpacity: 0.95,
          strokeWeight: 6,
          map: mapRef.current,
        });

        const bounds = new maps.LatLngBounds();
        path.forEach((point) => bounds.extend(point));
        mapRef.current.fitBounds(bounds, 72);
        setMapError("");
      } catch (error) {
        if (requestId !== routeRequestRef.current) return;
        drawDirectFallbackLine();
        setMapError("Detailed live route unavailable right now. Showing direct path.");
      }
    };

    void drawOsrmRoute();
  }, [mapsReady, orderType, restaurantLocation, deliveryLat, deliveryLng]);

  useEffect(() => {
    return () => {
      if (osrmPolylineRef.current) {
        osrmPolylineRef.current.setMap(null);
      }
      if (mapRef.current && window.google?.maps?.event) {
        window.google.maps.event.clearInstanceListeners(mapRef.current);
      }
      if (deliveryMarkerRef.current && window.google?.maps?.event) {
        window.google.maps.event.clearInstanceListeners(deliveryMarkerRef.current);
      }
      osrmPolylineRef.current = null;
      mapRef.current = null;
      restaurantMarkerRef.current = null;
      deliveryMarkerRef.current = null;
    };
  }, []);

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      alert("Your browser does not support geolocation.");
      return;
    }

    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextLat = parseCoordinate(position.coords.latitude);
        const nextLng = parseCoordinate(position.coords.longitude);
        if (!hasValidCoordinatePair(nextLat, nextLng)) {
          setLocationLoading(false);
          alert("Detected location is invalid. Please try again.");
          return;
        }

        const restaurantLat = parseCoordinate(restaurant?.latitude);
        const restaurantLng = parseCoordinate(restaurant?.longitude);
        if (hasValidCoordinatePair(restaurantLat, restaurantLng)) {
          const distanceFromRestaurant = calculateDistanceKm(nextLat, nextLng, restaurantLat, restaurantLng);
          if (distanceFromRestaurant > 200) {
            const useAnyway = window.confirm(
              `Detected location is ${distanceFromRestaurant.toFixed(
                1
              )} km away from this restaurant. This looks incorrect. Press OK to use it anyway or Cancel to keep your saved pinned location.`
            );
            if (!useAnyway) {
              if (savedStudentLocation) {
                setDeliveryLat(savedStudentLocation.lat);
                setDeliveryLng(savedStudentLocation.lng);
              }
              setLocationLoading(false);
              return;
            }
          }
        }

        setDeliveryLat(nextLat);
        setDeliveryLng(nextLng);
        setLocationLoading(false);
        if (mapRef.current) {
          mapRef.current.panTo({ lat: nextLat, lng: nextLng });
          mapRef.current.setZoom(16);
        }
      },
      (error) => {
        console.error("Location error:", error);
        setLocationLoading(false);
        alert("Unable to get your location. Please allow browser location permission.");
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
    );
  };

  const handleOrder = async () => {
    if (orderType === "delivery" && (deliveryLat == null || deliveryLng == null)) {
      alert("Please set your current location for delivery.");
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

    let quoteData = quote;
    if (orderType === "delivery" && deliveryLat != null && deliveryLng != null && !quoteData) {
      quoteData = await fetchQuote();
    }

    const chargeForOrder = orderType === "delivery" ? Number(quoteData?.delivery_charge || 0) : 0;
    const finalTotalForOrder = Number(totalPrice) + chargeForOrder;
    if (!window.confirm(`Confirm ${orderType} order for LKR ${finalTotalForOrder}?`)) return;

    try {
      const derivedDeliveryAddress =
        orderType === "delivery" && hasValidCoordinatePair(deliveryLat, deliveryLng)
          ? `Pinned delivery location (${Number(deliveryLat).toFixed(6)}, ${Number(deliveryLng).toFixed(6)})`
          : "Takeaway order";

      const orderData = {
        restaurant_id: restaurant.id,
        delivery_address: derivedDeliveryAddress,
        delivery_latitude: deliveryLat,
        delivery_longitude: deliveryLng,
        payment_method: "cod",
        order_type: orderType,
        food_price: totalPrice,
        delivery_charge: chargeForOrder,
        total_price: finalTotalForOrder,
        items: cart.map((item) => ({
          menu_item_id: item.id,
          quantity: item.quantity,
          price: item.price,
        })),
      };
      const { data } = await api.post("/orders/create/", orderData);
      const feeText = Number(data?.delivery_charge || 0).toLocaleString();
      alert(`Order placed successfully! Delivery charge: LKR ${feeText}`);
      navigate("/orders");
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
      <div style={{ ...STUDENT_LAYOUT.container, maxWidth: 980 }}>
        <section style={styles.heroCard}>
          <div>
            <h1 style={styles.heroTitle}>Premium Order Summary</h1>
            <p style={styles.heroSub}>
              <Store size={14} /> {restaurant?.name ? `From ${restaurant.name}` : "Confirm your order"}
            </p>
          </div>
          <div style={styles.heroTotal}>
            <span style={styles.heroTotalLabel}>Pay Now</span>
            <strong>{formatLkr(finalTotal)}</strong>
          </div>
        </section>

        <section style={styles.mainCard}>
          <div style={styles.sectionTitle}>Order Summary</div>
          <div style={styles.items}>
            {cart.map((item) => (
              <div key={item.id} style={styles.item}>
                <div style={{ minWidth: 0 }}>
                  <div style={styles.itemName}>
                    {item.name} x {item.quantity}
                  </div>
                  <div style={styles.itemMeta}>{formatLkr(item.price)} each</div>
                </div>
                <div style={styles.itemTotal}>{formatLkr(Number(item.price) * item.quantity)}</div>
              </div>
            ))}
          </div>

          <div style={styles.totalRow}>
            <span>Food Total</span>
            <strong>{formatLkr(totalPrice)}</strong>
          </div>
          {orderType === "delivery" ? (
            <div style={styles.totalRow}>
              <span>Delivery Charge</span>
              <strong>{formatLkr(deliveryCharge)}</strong>
            </div>
          ) : null}
          <div style={{ ...styles.totalRow, ...styles.grandRow }}>
            <span>Grand Total</span>
            <strong>{formatLkr(finalTotal)}</strong>
          </div>

          <div style={styles.formBlock}>
            <div style={styles.fieldTitle}>Order Type</div>
            <div style={styles.segmentWrap}>
              <button
                type="button"
                onClick={() => setOrderType("delivery")}
                style={{
                  ...styles.segmentButton,
                  ...(orderType === "delivery" ? styles.segmentButtonActive : styles.segmentButtonInactive),
                }}
              >
                Delivery
              </button>
              <button
                type="button"
                onClick={() => setOrderType("takeaway")}
                style={{
                  ...styles.segmentButton,
                  ...(orderType === "takeaway" ? styles.segmentButtonActive : styles.segmentButtonInactive),
                }}
              >
                Takeaway
              </button>
            </div>

            {orderType === "delivery" ? (
              <>
                <div style={styles.locationActionRow}>
                  <button type="button" onClick={handleUseMyLocation} style={styles.locationButton}>
                    <Compass size={15} /> {locationLoading ? "Getting Location..." : "Use My Location"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (mapRef.current) {
                        mapRef.current.setOptions({ draggableCursor: "crosshair" });
                      }
                    }}
                    style={styles.manualPinButton}
                  >
                    Manual Pin on Map
                  </button>
                </div>

                {quoteLoading ? <div style={styles.softInfo}>Calculating AI delivery estimate...</div> : null}
                {quoteError ? <div style={styles.errorInfo}>{quoteError}</div> : null}

                <div style={styles.aiCard}>
                  <div style={styles.aiCardHead}>AI Delivery Estimate</div>
                  <div style={styles.metricGrid}>
                    <div style={styles.metricTile}>
                      <span style={styles.metricLabel}>Distance</span>
                      <strong style={styles.metricValue}>{Number(quote?.distance_km || 0).toFixed(2)} km</strong>
                    </div>
                    <div style={styles.metricTile}>
                      <span style={styles.metricLabel}>Fee</span>
                      <strong style={styles.metricValue}>{formatLkr(quote?.delivery_charge || 0)}</strong>
                    </div>
                  </div>

                  <div style={styles.mapCard}>
                    <div style={styles.mapHead}>
                      <div style={styles.mapTitle}>
                        <MapPin size={14} /> Live Shortest Route
                      </div>
                    </div>
                    <div ref={mapContainerRef} style={styles.mapCanvas} />
                    {mapError ? <div style={styles.errorInfo}>{mapError}</div> : null}
                  </div>
                </div>
              </>
            ) : null}

            {orderType === "delivery" ? (
              <div style={styles.payRow}>
                <span style={styles.pill}>Cash on Delivery</span>
              </div>
            ) : null}

            <button onClick={handleOrder} style={styles.placeOrderButton}>
              Place Order
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

const styles = {
  heroCard: {
    borderRadius: 24,
    border: "1px solid rgba(15, 23, 42, 0.12)",
    background:
      "linear-gradient(135deg, rgba(255,255,255,0.97), rgba(235,244,255,0.94))," +
      "radial-gradient(circle at 12% 12%, rgba(31, 79, 150, 0.12), transparent 58%)",
    boxShadow: "0 24px 56px rgba(18, 43, 86, 0.16)",
    padding: "18px 20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 18,
  },
  heroEyebrow: {
    margin: 0,
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    color: THEME.navy,
    fontWeight: 900,
    fontSize: 12,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
  },
  heroTitle: { margin: "6px 0 4px", color: "#0f2444", fontSize: 30, lineHeight: 1.05, fontWeight: 900 },
  heroSub: { margin: 0, color: "#3c5b8f", fontWeight: 800, display: "inline-flex", alignItems: "center", gap: 6 },
  heroTotal: {
    minWidth: 160,
    borderRadius: 16,
    padding: "12px 14px",
    background: "linear-gradient(120deg, #1f4f96, #4b8ef6)",
    color: "#fff",
    display: "grid",
    gap: 2,
    boxShadow: "0 14px 28px rgba(31, 79, 150, 0.36)",
    textAlign: "right",
  },
  heroTotalLabel: { fontSize: 11, fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase", opacity: 0.9 },
  mainCard: {
    marginTop: 14,
    borderRadius: 24,
    border: "1px solid rgba(15, 23, 42, 0.12)",
    background: "rgba(255,255,255,0.96)",
    boxShadow: "0 20px 48px rgba(19, 44, 88, 0.14)",
    padding: "18px 18px 16px",
    display: "grid",
    gap: 10,
  },
  sectionTitle: { color: "#11274b", fontSize: 18, fontWeight: 900, letterSpacing: "0.01em" },
  items: { display: "grid", gap: 10 },
  item: {
    display: "flex",
    justifyContent: "space-between",
    gap: 10,
    padding: "12px 12px",
    borderRadius: 14,
    border: "1px solid rgba(16, 38, 71, 0.11)",
    background: "rgba(245, 249, 255, 0.8)",
  },
  itemName: { fontWeight: 900, color: "#11274b", fontSize: 14 },
  itemMeta: { marginTop: 4, fontWeight: 700, color: "#5a7298", fontSize: 12 },
  itemTotal: { fontWeight: 900, color: THEME.navy, whiteSpace: "nowrap", fontSize: 14 },
  totalRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderTop: "1px solid rgba(16, 38, 71, 0.12)",
    paddingTop: 10,
    color: "#2f4e79",
    fontWeight: 800,
  },
  grandRow: { borderTop: "2px solid #2f67bf", color: "#143262", fontSize: 16 },
  formBlock: { marginTop: 6, display: "grid", gap: 10 },
  fieldTitle: { color: "#11274b", fontSize: 14, fontWeight: 900 },
  segmentWrap: { display: "grid", gap: 10, gridTemplateColumns: "1fr 1fr" },
  segmentButton: {
    height: 44,
    borderRadius: 14,
    border: "1.5px solid transparent",
    fontWeight: 900,
    fontSize: 14,
    cursor: "pointer",
  },
  segmentButtonActive: {
    color: "#fff",
    background: "linear-gradient(120deg, #1f4f96, #4b8ef6)",
    boxShadow: "0 12px 24px rgba(31, 79, 150, 0.28)",
  },
  segmentButtonInactive: {
    color: "#1f4f96",
    background: "#fff",
    borderColor: "rgba(31, 79, 150, 0.42)",
  },
  locationActionRow: {
    display: "grid",
    gap: 10,
    gridTemplateColumns: "1fr 1fr",
  },
  locationButton: {
    height: 42,
    borderRadius: 14,
    border: "none",
    background: "linear-gradient(120deg, #1f4f96, #4b8ef6)",
    color: "#fff",
    fontWeight: 900,
    fontSize: 14,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    cursor: "pointer",
    boxShadow: "0 12px 24px rgba(31, 79, 150, 0.28)",
  },
  manualPinButton: {
    height: 42,
    borderRadius: 14,
    border: "1px solid rgba(31, 79, 150, 0.35)",
    background: "rgba(255,255,255,0.92)",
    color: "#1f4f96",
    fontWeight: 900,
    fontSize: 14,
    cursor: "pointer",
  },
  locationMeta: { color: "#506c95", fontWeight: 700, fontSize: 12 },
  aiCard: {
    border: "1px solid rgba(16, 38, 71, 0.12)",
    borderRadius: 18,
    padding: 12,
    background:
      "linear-gradient(155deg, rgba(247, 251, 255, 0.95), rgba(236, 246, 255, 0.92))," +
      "radial-gradient(circle at 88% 8%, rgba(75, 142, 246, 0.18), transparent 46%)",
    display: "grid",
    gap: 10,
  },
  aiCardHead: { color: "#0f2e5f", fontWeight: 900, fontSize: 15 },
  metricGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 },
  metricTile: {
    borderRadius: 12,
    border: "1px solid rgba(15, 23, 42, 0.1)",
    padding: "10px 10px",
    background: "rgba(255,255,255,0.85)",
    display: "grid",
    gap: 2,
  },
  metricLabel: { fontSize: 11, color: "#5f769c", fontWeight: 800, letterSpacing: "0.04em", textTransform: "uppercase" },
  metricValue: { fontSize: 18, color: "#133668", lineHeight: 1.05, fontWeight: 900 },
  mapCard: {
    border: "1px solid rgba(15, 23, 42, 0.1)",
    borderRadius: 14,
    background: "rgba(255,255,255,0.86)",
    padding: 10,
    display: "grid",
    gap: 8,
  },
  mapHead: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 },
  mapTitle: { color: "#173a6d", fontWeight: 900, fontSize: 13, display: "inline-flex", alignItems: "center", gap: 6 },
  mapBadge: {
    fontSize: 11,
    fontWeight: 800,
    color: "#1f4f96",
    background: "rgba(31, 79, 150, 0.12)",
    padding: "4px 8px",
    borderRadius: 999,
  },
  mapCanvas: {
    width: "100%",
    height: 320,
    borderRadius: 12,
    overflow: "hidden",
    border: "1px solid rgba(15, 23, 42, 0.14)",
    background: "linear-gradient(130deg, rgba(235, 244, 255, 0.96), rgba(220, 234, 255, 0.9))",
  },
  payRow: { display: "flex", justifyContent: "flex-start" },
  pill: {
    fontSize: 11,
    color: "#1f4f96",
    fontWeight: 900,
    background: "rgba(31, 79, 150, 0.12)",
    border: "1px solid rgba(31, 79, 150, 0.25)",
    borderRadius: 999,
    padding: "6px 10px",
    letterSpacing: "0.04em",
    textTransform: "uppercase",
  },
  placeOrderButton: {
    height: 46,
    borderRadius: 14,
    border: "none",
    background: "linear-gradient(120deg, #1f4f96, #4b8ef6)",
    color: "#fff",
    fontWeight: 900,
    fontSize: 15,
    cursor: "pointer",
    boxShadow: "0 14px 28px rgba(31, 79, 150, 0.3)",
  },
  softInfo: {
    borderRadius: 12,
    border: "1px solid rgba(15, 23, 42, 0.12)",
    background: "rgba(250, 252, 255, 0.96)",
    color: "#49658d",
    padding: "9px 10px",
    fontSize: 12,
    fontWeight: 700,
  },
  errorInfo: {
    borderRadius: 12,
    border: "1px solid rgba(185, 28, 28, 0.26)",
    background: "rgba(254, 242, 242, 0.95)",
    color: "#8b1f1f",
    padding: "9px 10px",
    fontSize: 12,
    fontWeight: 700,
  },
};

export default Checkout;
