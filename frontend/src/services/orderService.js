import apiClient from "./apiClient";
import { normalizeTrackingOrder } from "./orderTransforms";
import { fetchRestaurants } from "./restaurantService";
import { calculateDeliveryFee } from "../utils/deliveryFee";

function normalizeDeliveryFeeEstimate(payload) {
  const source =
    payload?.deliveryFeeBreakdown ||
    payload?.data?.deliveryFeeBreakdown ||
    payload?.data ||
    payload ||
    {};

  return {
    distanceKm: Number(source.distanceKm || source.distance || 0),
    baseFee: Number(source.baseFee || 0),
    perKmRate: Number(source.perKmRate || 0),
    distanceFee: Number(source.distanceFee || 0),
    peakFee: Number(source.peakFee || 0),
    longDistanceFee: Number(source.longDistanceFee || 0),
    isPeakHour: Boolean(source.isPeakHour),
    isLongDistance: Boolean(source.isLongDistance),
    totalFee: Number(source.totalFee || source.deliveryFee || 0),
    calculatedAt: source.calculatedAt || null,
  };
}

function hasDeliveryFeeEstimate(estimate) {
  return (
    Number(estimate?.totalFee || 0) > 0 ||
    Number(estimate?.distanceKm || 0) > 0 ||
    Boolean(estimate?.calculatedAt)
  );
}

function toRadians(value) {
  return (Number(value) * Math.PI) / 180;
}

function calculateDistanceKm(startLatitude, startLongitude, endLatitude, endLongitude) {
  const earthRadiusKm = 6371;
  const latDelta = toRadians(endLatitude - startLatitude);
  const lngDelta = toRadians(endLongitude - startLongitude);
  const a =
    Math.sin(latDelta / 2) * Math.sin(latDelta / 2) +
    Math.cos(toRadians(startLatitude)) *
      Math.cos(toRadians(endLatitude)) *
      Math.sin(lngDelta / 2) *
      Math.sin(lngDelta / 2);

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function fetchDeliveryFeeEstimate(payload) {
  try {
    const response = await apiClient.post("/orders/delivery-fee", {
      restaurantId: payload.restaurantId,
      deliveryLatitude: payload.deliveryLatitude,
      deliveryLongitude: payload.deliveryLongitude,
    });
    const normalizedEstimate = normalizeDeliveryFeeEstimate(response.data?.data);

    if (hasDeliveryFeeEstimate(normalizedEstimate)) {
      return normalizedEstimate;
    }
  } catch (error) {
    // Fall back to local distance and fee calculation below.
  }

  const restaurants = await fetchRestaurants();
  const restaurant = restaurants.find(
    (entry) => String(entry.id) === String(payload.restaurantId)
  );
  const restaurantLatitude = Number(restaurant?.latitude);
  const restaurantLongitude = Number(restaurant?.longitude);
  const deliveryLatitude = Number(payload.deliveryLatitude);
  const deliveryLongitude = Number(payload.deliveryLongitude);

  if (
    !Number.isFinite(restaurantLatitude) ||
    !Number.isFinite(restaurantLongitude) ||
    !Number.isFinite(deliveryLatitude) ||
    !Number.isFinite(deliveryLongitude)
  ) {
    throw new Error("Unable to calculate delivery distance right now.");
  }

  return calculateDeliveryFee(
    calculateDistanceKm(
      restaurantLatitude,
      restaurantLongitude,
      deliveryLatitude,
      deliveryLongitude
    )
  );
}

export async function createOrder(payload) {
  const response = await apiClient.post("/orders", {
    restaurantId: payload.restaurantId,
    orderType: payload.orderType,
    deliveryAddress: payload.deliveryAddress,
    deliveryLatitude: payload.deliveryLatitude,
    deliveryLongitude: payload.deliveryLongitude,
    notes: payload.deliveryNote || payload.notes || "",
    items: payload.items.map((item) => ({
      foodItemId: item.foodId || item.id,
      quantity: item.qty,
    })),
  });

  return normalizeTrackingOrder(response.data.data);
}

export async function fetchOrderTracking(orderId) {
  const trackingResponse = await apiClient.get(`/orders/${orderId}/tracking`);
  return normalizeTrackingOrder(trackingResponse.data.data);
}

export async function fetchLatestOrder() {
  const response = await apiClient.get("/orders/my");
  const latestOrder = (response.data.data || [])[0];

  if (!latestOrder) {
    throw new Error("No recent order found.");
  }

  return fetchOrderTracking(latestOrder._id || latestOrder.id);
}

export async function fetchStudentOrders() {
  const response = await apiClient.get("/orders/my");
  return (response.data.data || []).map(normalizeTrackingOrder);
}

export async function markOrderNotificationSeen(orderId) {
  const response = await apiClient.patch(`/orders/${orderId}/notification-seen`);
  return normalizeTrackingOrder(response.data.data);
}
