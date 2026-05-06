function formatDeliveryStatus(status) {
  switch (status) {
    case "open":
      return "Available";
    case "accepted":
      return "Accepted";
    case "picked_up":
      return "Picked Up";
    case "in_transit":
      return "On The Way";
    case "delivered":
      return "Delivered";
    default:
      return status || "Available";
  }
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

export function toBackendDeliveryStatus(status) {
  switch (status) {
    case "Accepted":
      return "accepted";
    case "Picked Up":
      return "picked_up";
    case "On The Way":
      return "in_transit";
    case "Delivered":
      return "delivered";
    default:
      return "accepted";
  }
}

export function normalizeDeliveryJob(payload) {
  const delivery = payload?.deliverySummary || payload || {};
  const order =
    payload?.orderSummary && typeof payload.orderSummary === "object"
      ? payload.orderSummary
      : payload?.order || {};
  const restaurant = order.restaurant || payload?.restaurant || {};
  const items = delivery.items || order.items || [];
  const pickupLatitude =
    delivery.pickupLat ||
    payload.pickupLat ||
    order.pickupLat ||
    order.pickupLocation?.latitude ||
    order.restaurant?.location?.latitude ||
    order.restaurant?.location?.coordinates?.latitude ||
    "";
  const pickupLongitude =
    delivery.pickupLng ||
    payload.pickupLng ||
    order.pickupLng ||
    order.pickupLocation?.longitude ||
    order.restaurant?.location?.longitude ||
    order.restaurant?.location?.coordinates?.longitude ||
    "";
  const dropLatitude =
    delivery.deliveryLat ||
    payload.deliveryLat ||
    order.deliveryLat ||
    order.deliveryLocation?.latitude ||
    order.deliveryLatitude ||
    "";
  const dropLongitude =
    delivery.deliveryLng ||
    payload.deliveryLng ||
    order.deliveryLng ||
    order.deliveryLocation?.longitude ||
    order.deliveryLongitude ||
    "";
  const normalizedPickupLatitude = Number(pickupLatitude);
  const normalizedPickupLongitude = Number(pickupLongitude);
  const normalizedDropLatitude = Number(dropLatitude);
  const normalizedDropLongitude = Number(dropLongitude);
  const deliveryFeeBreakdown =
    order.deliveryFeeBreakdown || payload.deliveryFeeBreakdown || {};
  const totalItems = items.reduce(
    (sum, item) => sum + Number(item.qty || item.quantity || 1),
    0
  );
  const fallbackOrderSummary =
    typeof delivery.orderSummary === "string" && delivery.orderSummary.trim()
      ? delivery.orderSummary.trim()
      : `${totalItems} item${totalItems === 1 ? "" : "s"}`;
  const routeDistanceKm = Number(
    delivery.distanceKm ||
      payload.distanceKm ||
      order.distanceKm ||
      deliveryFeeBreakdown.distanceKm ||
      0
  );
  const derivedDistance =
    Number.isFinite(normalizedPickupLatitude) &&
    Number.isFinite(normalizedPickupLongitude) &&
    Number.isFinite(normalizedDropLatitude) &&
    Number.isFinite(normalizedDropLongitude)
      ? Math.round(
          calculateDistanceKm(
            normalizedPickupLatitude,
            normalizedPickupLongitude,
            normalizedDropLatitude,
            normalizedDropLongitude
          ) * 10
        ) / 10
      : 0;

  return {
    id: delivery.id || delivery._id || payload.id || payload._id,
    orderId: delivery.orderId || order.id || order._id || payload.orderId || payload.order?._id,
    restaurantName:
      delivery.restaurantName || order.restaurantName || restaurant.name || "",
    restaurantPhone:
      delivery.restaurantPhone || order.restaurantPhone || restaurant.phone || "",
    pickupAddress:
      delivery.pickupAddress ||
      order.pickupAddress ||
      restaurant.address ||
      order.pickupLocation?.address ||
      "",
    customerName: delivery.customerName || order.customerName || "Student",
    customerPhone:
      delivery.customerPhone ||
      payload.customerPhone ||
      order.customerPhone ||
      order.student?.user?.phone ||
      "",
    deliveryAddress: delivery.deliveryAddress || order.deliveryAddress || "",
    orderSummary:
      totalItems > 0
        ? `${totalItems} item${totalItems === 1 ? "" : "s"}`
        : fallbackOrderSummary,
    status: formatDeliveryStatus(delivery.status || payload.status),
    createdAt: delivery.createdAt || order.createdAt || payload.createdAt,
    acceptedAt: delivery.acceptedAt || null,
    deliveredAt: delivery.deliveredAt || null,
    items: items.map((item) => ({
      id: item.id || item._id,
      name: item.name,
      qty: item.qty || item.quantity || 1,
      subtotal: Number(item.subtotal || 0),
    })),
    estimatedEarnings: Number(delivery.estimatedEarnings || order.deliveryFee || 0),
    totalAmount: Number(delivery.totalAmount || order.totalAmount || 0),
    distance: Number(
      routeDistanceKm ||
        payload.distance ||
        delivery.distance ||
        derivedDistance ||
        0
    ),
    pickupLat: String(pickupLatitude || ""),
    pickupLng: String(pickupLongitude || ""),
    deliveryLat: String(dropLatitude || ""),
    deliveryLng: String(dropLongitude || ""),
  };
}
