import apiClient from "./apiClient";

export async function submitRestaurantReview(payload) {
  const response = await apiClient.post("/reviews", payload);
  return response.data.data;
}
