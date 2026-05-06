function formatStatus(status) {
  switch (status) {
    case "pending":
      return "Pending";
    case "confirmed":
      return "Accepted";
    case "preparing":
      return "Preparing";
    case "ready_for_pickup":
      return "Ready";
    case "out_for_delivery":
      return "Out for Delivery";
    case "delivered":
      return "Delivered";
    case "cancelled":
      return "Rejected";
    default:
      return status || "Pending";
  }
}

export function toBackendOrderStatus(status) {
  switch (status) {
    case "Accepted":
      return "confirmed";
    case "Preparing":
      return "preparing";
    case "Ready":
      return "ready_for_pickup";
    case "Out for Delivery":
      return "out_for_delivery";
    case "Delivered":
      return "delivered";
    case "Rejected":
      return "cancelled";
    default:
      return "pending";
  }
}

export function normalizeTrackingOrder(payload) {
  const order = payload.order || payload;
  const items = (payload.items || order.items || []).map((item) => ({
    id: item._id || item.id,
    foodId: item.foodItem?._id || item.foodItem || item.foodId,
    name: item.name,
    qty: item.quantity || item.qty || 1,
    subtotal: item.subtotal,
    price: item.unitPrice || item.price || 0,
  }));
  const deliveryFee = Number(order.deliveryFee || 0);
  const total = Number(order.totalAmount || order.total || 0);
  const derivedItemsTotal = items.reduce((sum, item) => sum + Number(item.subtotal || 0), 0);
  const deliveryFeeBreakdown = order.deliveryFeeBreakdown || payload.deliveryFeeBreakdown || {};
  const normalizedDeliveryFeeBreakdown = {
    distanceKm: Number(deliveryFeeBreakdown.distanceKm || 0),
    baseFee: Number(deliveryFeeBreakdown.baseFee || 0),
    perKmRate: Number(deliveryFeeBreakdown.perKmRate || 0),
    distanceFee: Number(deliveryFeeBreakdown.distanceFee || 0),
    peakFee: Number(deliveryFeeBreakdown.peakFee || 0),
    longDistanceFee: Number(deliveryFeeBreakdown.longDistanceFee || 0),
    isPeakHour: Boolean(deliveryFeeBreakdown.isPeakHour),
    isLongDistance: Boolean(deliveryFeeBreakdown.isLongDistance),
    totalFee: Number(deliveryFeeBreakdown.totalFee || deliveryFee || 0),
    calculatedAt: deliveryFeeBreakdown.calculatedAt || null,
  };
  const hasMeaningfulDeliveryFeeBreakdown =
    normalizedDeliveryFeeBreakdown.baseFee > 0 ||
    normalizedDeliveryFeeBreakdown.distanceFee > 0 ||
    normalizedDeliveryFeeBreakdown.peakFee > 0 ||
    normalizedDeliveryFeeBreakdown.longDistanceFee > 0 ||
    Boolean(normalizedDeliveryFeeBreakdown.calculatedAt);

  return {
    id: order._id || order.id,
    orderType: order.orderType || "delivery",
    restaurantId: order.restaurant?._id || order.restaurant || "",
    restaurantName: order.restaurant?.name || order.restaurantName || "",
    restaurantLatitude: Number(order.restaurant?.latitude || payload.restaurant?.latitude || 0),
    restaurantLongitude: Number(order.restaurant?.longitude || payload.restaurant?.longitude || 0),
    restaurantAverageRating: Number(order.restaurant?.averageRating || payload.restaurant?.averageRating || 0),
    restaurantTotalRatings: Number(order.restaurant?.totalRatings || payload.restaurant?.totalRatings || 0),
    pickupAddress: order.restaurant?.address || order.pickupAddress || "",
    customerName: order.student?.user?.name || order.customerName || "Student",
    customerPhone: order.student?.user?.phone || order.customerPhone || "",
    deliveryAddress: order.deliveryAddress || "",
    deliveryLocation: {
      latitude: Number(order.deliveryLocation?.latitude || 0),
      longitude: Number(order.deliveryLocation?.longitude || 0),
      address: order.deliveryLocation?.address || order.deliveryAddress || "",
    },
    items,
    distanceKm: Number(order.distanceKm || normalizedDeliveryFeeBreakdown.distanceKm || 0),
    itemsTotal: derivedItemsTotal > 0 ? derivedItemsTotal : Math.max(total - deliveryFee, 0),
    deliveryFee,
    deliveryFeeBreakdown: hasMeaningfulDeliveryFeeBreakdown
      ? normalizedDeliveryFeeBreakdown
      : null,
    total,
    paymentMethod: order.paymentMethod || "Cash on Delivery",
    status: formatStatus(order.status),
    createdAt: order.createdAt,
    updatedAt: order.updatedAt || order.createdAt,
    rejectionReason: order.rejectionReason || "",
    rejectionSeenByStudent: Boolean(order.rejectionSeenByStudent),
    acceptanceSeenByStudent: order.acceptanceSeenByStudent !== false,
    studentStatusUpdateSeen: order.studentStatusUpdateSeen !== false,
    eta: order.eta || "25 mins",
    deliveryPartner:
      payload.delivery?.deliveryPartner?.user?.name ||
      order.deliveryPartner ||
      "Assigned",
    liveLocation: payload.liveLocation
      ? {
          lat: Number(payload.liveLocation.coordinates?.latitude || 0),
          lng: Number(payload.liveLocation.coordinates?.longitude || 0),
          timestamp: payload.liveLocation.updatedAt || payload.liveLocation.createdAt || "",
        }
      : null,
    review: payload.review
      ? {
          id: payload.review._id || payload.review.id,
          rating: Number(payload.review.rating || 0),
          reviewText: payload.review.reviewText || "",
          createdAt: payload.review.createdAt,
          studentName: payload.review.studentId?.user?.name || "",
        }
      : null,
  };
}
