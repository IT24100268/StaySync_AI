import apiClient from "../../../services/apiClient";
import { normalizeDeliveryJob, toBackendDeliveryStatus } from "./deliveryTransforms";

function normalizeLiveLocation(payload, fallbackTimestamp = "") {
  if (!payload) {
    return null;
  }

  return {
    id: payload.id || payload._id || "",
    deliveryId: payload.delivery?.id || payload.delivery?._id || payload.delivery || "",
    lat: payload.coordinates?.latitude ?? payload.lat ?? "",
    lng: payload.coordinates?.longitude ?? payload.lng ?? "",
    heading: payload.heading ?? "",
    speed: payload.speed ?? "",
    timestamp: fallbackTimestamp || payload.updatedAt || payload.createdAt || payload.timestamp || new Date().toISOString(),
  };
}

export async function fetchAvailableJobs() {
  const response = await apiClient.get("/delivery/jobs");
  return (response.data.data || []).map(normalizeDeliveryJob);
}

export async function fetchAssignedJobs() {
  const response = await apiClient.get("/delivery/assigned");
  return (response.data.data || []).map(normalizeDeliveryJob);
}

export async function fetchDeliveryEarnings() {
  return {
    todayEarnings: 0,
    weeklyEarnings: 0,
    monthlyEarnings: 0,
    completedDeliveries: 0,
  };
}

export async function acceptDeliveryJob(deliveryId) {
  const response = await apiClient.patch(`/delivery/jobs/${deliveryId}/accept`);
  return normalizeDeliveryJob(response.data.data);
}

export async function updateDeliveryStatus(deliveryId, status) {
  const response = await apiClient.patch(`/delivery/jobs/${deliveryId}/status`, {
    status: toBackendDeliveryStatus(status),
  });
  return normalizeDeliveryJob(response.data.data);
}

export async function updatePartnerAvailability(statusOnline) {
  const response = await apiClient.patch("/delivery/me", {
    isAvailable: statusOnline,
  });

  return {
    statusOnline: response.data.data?.isAvailable ?? statusOnline,
    partner: response.data.data,
  };
}

export async function fetchLiveLocation() {
  return null;
}

export async function shareLiveLocation(payload) {
  const response = await apiClient.post(`/delivery/jobs/${payload.deliveryId}/location`, payload);
  return normalizeLiveLocation(response.data.data, payload.timestamp);
}
