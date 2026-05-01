import apiClient from "../../../services/apiClient";
import { buildRoomPayload, normalizeRoom } from "../../../services/roomTransforms";

export async function fetchOwnerListings() {
  const response = await apiClient.get("/owners/rooms");
  return (response.data.data || []).map(normalizeRoom);
}

export async function createOwnerListing(payload) {
  const response = await apiClient.post("/owners/rooms", buildRoomPayload(payload));
  return normalizeRoom(response.data.data);
}

export async function updateOwnerListing(payload) {
  const response = await apiClient.patch(`/owners/rooms/${payload.id}`, buildRoomPayload(payload));
  return normalizeRoom(response.data.data);
}

export async function deleteOwnerListing(listingId) {
  await apiClient.delete(`/owners/rooms/${listingId}`);
  return { success: true, listingId };
}

export async function updateOwnerListingAvailability(listingId, isAvailable) {
  const response = await apiClient.patch(`/owners/rooms/${listingId}/availability`, {
    isAvailable,
  });
  return normalizeRoom(response.data.data);
}
