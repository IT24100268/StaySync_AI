import apiClient from "../../../services/apiClient";

export function normalizeDeliveryPartnerProfile(payload) {
  const profile = payload || {};
  const user = profile.user || {};

  return {
    id: user._id || user.id || profile._id,
    name: user.name || profile.name || "",
    email: user.email || profile.email || "",
    phone: user.phone || profile.phone || "",
    vehicleType: profile.vehicleType || "",
    licenseId: profile.licenseNumber || profile.licenseId || "",
    statusOnline: typeof profile.isAvailable === "boolean" ? profile.isAvailable : true,
    rating: profile.rating || 5,
    role: user.role || profile.role || "delivery",
  };
}

export async function fetchDeliveryPartnerProfile() {
  const response = await apiClient.get("/delivery/me");
  return normalizeDeliveryPartnerProfile(response.data.data);
}

export async function fetchDeliveryPartnerProfileWithToken(token) {
  const response = await apiClient.get("/delivery/me", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return normalizeDeliveryPartnerProfile(response.data.data);
}

export async function updateDeliveryPartnerProfile(payload) {
  const response = await apiClient.patch("/delivery/me", {
    vehicleType: payload.vehicleType,
    licenseNumber: payload.licenseId,
    isAvailable: payload.statusOnline,
  });

  return normalizeDeliveryPartnerProfile(response.data.data);
}
