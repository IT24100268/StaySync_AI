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
  const order = payload?.orderSummary || payload?.order || {};
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

  return {
    id: delivery.id || delivery._id || payload.id || payload._id,
    orderId: delivery.orderId || order.id || order._id || payload.orderId || payload.order?._id,
    restaurantName: delivery.restaurantName || order.restaurantName || "",
    restaurantPhone: delivery.restaurantPhone || "",
    pickupAddress: delivery.pickupAddress || order.pickupAddress || "",
    customerName: delivery.customerName || order.customerName || "Student",
    customerPhone: delivery.customerPhone || order.customerPhone || "",
    deliveryAddress: delivery.deliveryAddress || order.deliveryAddress || "",
    orderSummary: delivery.orderSummary || `${items.length} item${items.length === 1 ? "" : "s"}`,
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
    distance: payload.distance || 0,
    pickupLat: String(pickupLatitude || ""),
    pickupLng: String(pickupLongitude || ""),
    deliveryLat: String(dropLatitude || ""),
    deliveryLng: String(dropLongitude || ""),
  };
}
