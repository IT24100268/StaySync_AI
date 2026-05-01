import apiClient from "./apiClient";
import { normalizeRoom } from "./roomTransforms";

export async function fetchRooms() {
  const response = await apiClient.get("/rooms", {
    params: {
      availableOnly: true,
      limit: 100,
    },
  });

  return (response.data.data || []).map(normalizeRoom);
}

export async function fetchRoomById(roomId) {
  const response = await apiClient.get(`/rooms/${roomId}`);
  return normalizeRoom(response.data.data);
}
