import apiClient from "../../../services/apiClient";
import {
  normalizeTrackingOrder,
  toBackendOrderStatus,
} from "../../../services/orderTransforms";

export async function fetchRestaurantOrders() {
  const response = await apiClient.get("/restaurants/orders");
  return (response.data.data || []).map(normalizeTrackingOrder);
}

export async function updateRestaurantOrderStatus(orderId, status, options = {}) {
  const payload = {
    status: toBackendOrderStatus(status),
  };

  if (options.rejectionReason) {
    payload.rejectionReason = options.rejectionReason;
  }

  await apiClient.patch(`/restaurants/orders/${orderId}/status`, payload);
  const trackingResponse = await apiClient.get(`/orders/${orderId}/tracking`);
  return normalizeTrackingOrder(trackingResponse.data.data);
}
