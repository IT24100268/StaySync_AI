import React, { useEffect, useState } from "react";
import { Alert, Pressable, Platform, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { useFocusEffect } from "@react-navigation/native";
import ScreenContainer from "../../components/common/ScreenContainer";
import EmptyState from "../../components/common/EmptyState";
import StatusTimeline from "../../components/orders/StatusTimeline";
import LoadingOverlay from "../../components/common/LoadingOverlay";
import AppButton from "../../components/common/AppButton";
import { MapView, Marker, Polyline } from "../../components/maps/MapPrimitives";
import { fetchLatestOrder, fetchOrderTracking } from "../../services/orderService";
import { appTheme } from "../../theme";
import { formatCurrency } from "../../utils/format";

const GOOGLE_MAPS_API_KEY =
  Constants.expoConfig?.android?.config?.googleMaps?.apiKey ||
  Constants.expoConfig?.ios?.config?.googleMapsApiKey ||
  "";

function decodePolyline(encoded) {
  const coordinates = [];
  let index = 0;
  let latitude = 0;
  let longitude = 0;

  while (index < encoded.length) {
    let result = 0;
    let shift = 0;
    let byte = null;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    latitude += result & 1 ? ~(result >> 1) : result >> 1;
    result = 0;
    shift = 0;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    longitude += result & 1 ? ~(result >> 1) : result >> 1;

    coordinates.push({
      latitude: latitude / 1e5,
      longitude: longitude / 1e5,
    });
  }

  return coordinates;
}

function getTimelineStatus(orderStatus, isTakeaway) {
  if (isTakeaway) {
    switch (orderStatus) {
      case "Pending":
        return "Placed";
      case "Accepted":
        return "Preparing";
      case "Preparing":
        return "Preparing";
      case "Ready":
        return "Ready";
      case "Delivered":
        return "Delivered";
      case "Rejected":
        return "Placed";
      default:
        return "Placed";
    }
  }

  switch (orderStatus) {
    case "Pending":
      return "Placed";
    case "Accepted":
      return "Preparing";
    case "Preparing":
      return "Preparing";
    case "Ready":
      return "Out for Delivery";
    case "Out for Delivery":
      return "Out for Delivery";
    case "Delivered":
      return "Delivered";
    case "Rejected":
      return "Placed";
    default:
      return "Placed";
  }
}

export default function OrderTrackingScreen({ route, navigation }) {
  const [order, setOrder] = useState(route.params?.order || null);
  const [loading, setLoading] = useState(!route.params?.order);
  const [loadError, setLoadError] = useState("");
  const [routeCoordinates, setRouteCoordinates] = useState([]);

  useEffect(() => {
    if (!route.params?.successMessage) {
      return;
    }

    Alert.alert("Thank You", route.params.successMessage, [
      {
        text: "OK",
        onPress: () => navigation.setParams({ successMessage: undefined }),
      },
    ]);
  }, [navigation, route.params?.successMessage]);

  useEffect(() => {
    if (route.params?.orderId || !route.params?.order) {
      loadOrder();
    }
  }, [route.params?.orderId, route.params?.refreshAt]);

  useFocusEffect(
    React.useCallback(() => {
      if (route.params?.orderId || order?.id) {
        loadOrder(route.params?.orderId || order?.id, false);
      }
    }, [order?.id, route.params?.orderId])
  );

  async function loadOrder(explicitOrderId, withLoader = true) {
    try {
      if (withLoader) {
        setLoading(true);
      }

      const response = explicitOrderId
        ? await fetchOrderTracking(explicitOrderId)
        : await fetchLatestOrder();
      setLoadError("");
      setOrder(response);
    } catch (error) {
      setOrder(null);
      setLoadError(error.message || "No recent order found.");
    } finally {
      if (withLoader) {
        setLoading(false);
      }
    }
  }

  const restaurantLat = Number(order?.restaurantLatitude || 0);
  const restaurantLng = Number(order?.restaurantLongitude || 0);
  const customerLat = Number(order?.deliveryLocation?.latitude || 0);
  const customerLng = Number(order?.deliveryLocation?.longitude || 0);
  const partnerLat = Number(order?.liveLocation?.lat || 0);
  const partnerLng = Number(order?.liveLocation?.lng || 0);
  const hasRestaurantCoords = Number.isFinite(restaurantLat) && Number.isFinite(restaurantLng) && (restaurantLat !== 0 || restaurantLng !== 0);
  const hasCustomerCoords = Number.isFinite(customerLat) && Number.isFinite(customerLng) && (customerLat !== 0 || customerLng !== 0);
  const hasPartnerCoords = Number.isFinite(partnerLat) && Number.isFinite(partnerLng) && (partnerLat !== 0 || partnerLng !== 0);
  const routeOriginLat = hasPartnerCoords ? partnerLat : restaurantLat;
  const routeOriginLng = hasPartnerCoords ? partnerLng : restaurantLng;
  const hasRouteOriginCoords =
    Number.isFinite(routeOriginLat) &&
    Number.isFinite(routeOriginLng) &&
    (routeOriginLat !== 0 || routeOriginLng !== 0);
  const baseLat = hasPartnerCoords ? partnerLat : hasCustomerCoords ? customerLat : restaurantLat;
  const baseLng = hasPartnerCoords ? partnerLng : hasCustomerCoords ? customerLng : restaurantLng;
  const mapRegion =
    Number.isFinite(baseLat) && Number.isFinite(baseLng) && (baseLat !== 0 || baseLng !== 0)
      ? {
          latitude: baseLat,
          longitude: baseLng,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        }
      : null;
  const isTakeaway = order?.orderType === "takeaway";
  const timelineStatuses = isTakeaway
    ? ["Placed", "Preparing", "Ready", "Delivered"]
    : ["Placed", "Preparing", "Out for Delivery", "Delivered"];
  const timelineCurrentStatus = getTimelineStatus(order?.status, isTakeaway);
  const showLiveTracking =
    order ? !isTakeaway && !["Delivered", "Rejected"].includes(order.status) : false;

  useEffect(() => {
    if (!showLiveTracking || !(route.params?.orderId || order?.id)) {
      return undefined;
    }

    const trackingOrderId = route.params?.orderId || order?.id;
    const intervalId = setInterval(() => {
      loadOrder(trackingOrderId, false);
    }, 10000);

    return () => clearInterval(intervalId);
  }, [order?.id, route.params?.orderId, showLiveTracking]);

  useEffect(() => {
    let isMounted = true;

    async function loadRoutePath() {
      if (!showLiveTracking || !hasRouteOriginCoords || !hasCustomerCoords || !GOOGLE_MAPS_API_KEY) {
        setRouteCoordinates(
          hasRouteOriginCoords && hasCustomerCoords
            ? [
                { latitude: routeOriginLat, longitude: routeOriginLng },
                { latitude: customerLat, longitude: customerLng },
              ]
            : []
        );
        return;
      }

      try {
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/directions/json?origin=${routeOriginLat},${routeOriginLng}&destination=${customerLat},${customerLng}&mode=driving&key=${GOOGLE_MAPS_API_KEY}`
        );
        const payload = await response.json();
        const encodedPoints = payload?.routes?.[0]?.overview_polyline?.points || "";
        const decodedCoordinates = encodedPoints ? decodePolyline(encodedPoints) : [];

        if (isMounted) {
          setRouteCoordinates(
            decodedCoordinates.length > 0
              ? decodedCoordinates
              : [
                  { latitude: routeOriginLat, longitude: routeOriginLng },
                  { latitude: customerLat, longitude: customerLng },
                ]
          );
        }
      } catch (error) {
        if (isMounted) {
          setRouteCoordinates([
            { latitude: routeOriginLat, longitude: routeOriginLng },
            { latitude: customerLat, longitude: customerLng },
          ]);
        }
      }
    }

    loadRoutePath();

    return () => {
      isMounted = false;
    };
  }, [
    customerLat,
    customerLng,
    hasCustomerCoords,
    hasRouteOriginCoords,
    routeOriginLat,
    routeOriginLng,
    showLiveTracking,
  ]);

  if (loading) {
    return <LoadingOverlay />;
  }

  if (!order) {
    return (
      <ScreenContainer>
        <EmptyState
          title="No orders yet"
          description={loadError || "Your recent food orders will appear here."}
          icon="receipt-outline"
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <View style={styles.hero}>
        <Text style={styles.orderId}>Order #{order.id}</Text>
        <Text style={styles.status}>{order.status}</Text>
        <Text style={styles.restaurant}>{order.restaurantName}</Text>
        <Text style={styles.meta}>
          {isTakeaway ? "Pickup address" : "Delivery address"}: {isTakeaway ? order.pickupAddress : order.deliveryAddress}
        </Text>
        <Text style={styles.meta}>Order type: {isTakeaway ? "Take Away" : "Delivery"}</Text>
        <Text style={styles.meta}>Order time: {new Date(order.createdAt).toLocaleString()}</Text>
        <Text style={styles.meta}>Payment: {order.paymentMethod}</Text>
        {!isTakeaway && order.distanceKm ? <Text style={styles.meta}>Distance: {order.distanceKm.toFixed(1)} km</Text> : null}
        <Text style={styles.meta}>Items total: {formatCurrency(order.itemsTotal || 0)}</Text>
        <Text style={styles.meta}>
          {isTakeaway ? "Pickup fee" : "Delivery fee"}: {formatCurrency(order.deliveryFee || 0)}
        </Text>
        {!isTakeaway && order.deliveryFeeBreakdown ? (
          <Text style={styles.meta}>
            Delivery breakdown: base {formatCurrency(order.deliveryFeeBreakdown.baseFee)} + distance{" "}
            {formatCurrency(order.deliveryFeeBreakdown.distanceFee)}
            {order.deliveryFeeBreakdown.peakFee
              ? ` + peak ${formatCurrency(order.deliveryFeeBreakdown.peakFee)}`
              : ""}
            {order.deliveryFeeBreakdown.longDistanceFee
              ? ` + long-distance ${formatCurrency(order.deliveryFeeBreakdown.longDistanceFee)}`
              : ""}
          </Text>
        ) : null}
        <Text style={styles.total}>Total: {formatCurrency(order.total)}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.heading}>Ordered Items</Text>
        {order.items.map((item) => (
          <View key={item.id} style={styles.row}>
            <View style={styles.itemCopy}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.meta}>Quantity: {item.qty}</Text>
            </View>
            <Text style={styles.itemPrice}>{formatCurrency(item.subtotal)}</Text>
          </View>
        ))}
      </View>

      <StatusTimeline currentStatus={timelineCurrentStatus} statuses={timelineStatuses} />

      {isTakeaway ? (
        <View style={styles.card}>
          <Text style={styles.heading}>Pickup Details</Text>
          <Text style={styles.meta}>Collect your order directly from the restaurant.</Text>
          <Text style={styles.meta}>Pickup location: {order.pickupAddress || order.restaurantName}</Text>
          <Text style={styles.meta}>Status updates will appear here as your food is prepared.</Text>
        </View>
      ) : null}

      {showLiveTracking ? (
        <View style={styles.card}>
          <Text style={styles.heading}>Live Delivery Tracking</Text>
          {mapRegion && MapView && Marker ? (
            <>
              <MapView style={styles.map} region={mapRegion}>
                {routeCoordinates.length >= 2 && Polyline ? (
                  <Polyline
                    coordinates={routeCoordinates}
                    strokeColor="#1E7A57"
                    strokeWidth={4}
                  />
                ) : null}
                {hasRestaurantCoords ? (
                  <Marker
                    coordinate={{ latitude: restaurantLat, longitude: restaurantLng }}
                    title="Pickup Restaurant"
                    description={order.restaurantName}
                    pinColor="#2563EB"
                  />
                ) : null}
                {hasCustomerCoords ? (
                  <Marker
                    coordinate={{ latitude: customerLat, longitude: customerLng }}
                    title="Delivery Address"
                    description={order.deliveryAddress}
                    pinColor="#D97706"
                  />
                ) : null}
                {hasPartnerCoords ? (
                  <Marker
                    coordinate={{ latitude: partnerLat, longitude: partnerLng }}
                    title="Delivery Partner"
                    description={order.deliveryPartner || "Partner location"}
                    pinColor="#1E7A57"
                  />
                ) : null}
              </MapView>
              <Text style={styles.meta}>
                Delivery partner location: {hasPartnerCoords ? "Live" : "Not shared yet"}
              </Text>
              <Text style={styles.meta}>
                Route to drop address: {routeCoordinates.length >= 2 ? "Pickup to destination" : "Not available"}
              </Text>
              <Text style={styles.meta}>
                Last update: {order.liveLocation?.timestamp ? new Date(order.liveLocation.timestamp).toLocaleString() : "Not available"}
              </Text>
            </>
          ) : (
            <Text style={styles.meta}>Live map is not available for this order yet.</Text>
          )}
        </View>
      ) : null}

      {order.status === "Rejected" && order.rejectionReason ? (
        <View style={styles.card}>
          <Text style={styles.heading}>Rejection Reason</Text>
          <Text style={styles.meta}>{order.rejectionReason}</Text>
        </View>
      ) : null}

      {order.review ? (
        <View style={styles.card}>
          <Text style={styles.heading}>Your Review</Text>
          <View style={styles.reviewStars}>
            {[1, 2, 3, 4, 5].map((value) => (
              <Ionicons
                key={value}
                name={order.review.rating >= value ? "star" : "star-outline"}
                size={18}
                color="#F4B740"
              />
            ))}
          </View>
          {order.review.reviewText ? <Text style={styles.meta}>{order.review.reviewText}</Text> : null}
        </View>
      ) : null}

      {order.status === "Delivered" && !order.review ? (
        <AppButton
          title="Rate Restaurant"
          onPress={() =>
            navigation.navigate("RateRestaurant", {
              orderId: order.id,
              restaurantName: order.restaurantName,
            })
          }
        />
      ) : null}
      <AppButton
        title="Report Issue"
        variant="secondary"
        onPress={() =>
          navigation.navigate("ComplaintForm", {
            mode: "food",
            title: "Report a food or delivery issue",
            subtitle: "Share what went wrong with this order so it can be reviewed quickly.",
            targetId: order.id,
            initialType: "Food / Delivery Issue",
            availableTypes: ["Food / Delivery Issue"],
          })
        }
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: appTheme.colors.surface,
    borderRadius: appTheme.radius.lg,
    padding: appTheme.spacing.lg,
    gap: appTheme.spacing.sm,
    ...appTheme.shadow,
  },
  orderId: {
    color: appTheme.colors.textMuted,
    fontSize: 13,
  },
  status: {
    color: appTheme.colors.text,
    fontSize: 24,
    fontWeight: "800",
  },
  restaurant: {
    color: appTheme.colors.text,
    fontSize: 18,
    fontWeight: "700",
  },
  meta: {
    color: appTheme.colors.textMuted,
  },
  total: {
    color: appTheme.colors.primary,
    fontWeight: "800",
    fontSize: 18,
  },
  card: {
    backgroundColor: appTheme.colors.surface,
    borderRadius: appTheme.radius.lg,
    padding: appTheme.spacing.lg,
    gap: appTheme.spacing.sm,
    ...appTheme.shadow,
  },
  heading: {
    color: appTheme.colors.text,
    fontSize: 18,
    fontWeight: "800",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: appTheme.spacing.md,
    alignItems: "center",
  },
  itemCopy: {
    flex: 1,
    gap: 4,
  },
  itemName: {
    color: appTheme.colors.text,
    fontWeight: "700",
  },
  itemPrice: {
    color: appTheme.colors.text,
    fontWeight: "700",
  },
  reviewStars: {
    flexDirection: "row",
    gap: 6,
  },
  map: {
    width: "100%",
    height: 220,
    borderRadius: appTheme.radius.md,
  },
});
