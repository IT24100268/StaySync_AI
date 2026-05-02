import apiClient from "./apiClient";

export async function updateProfile(payload) {
  const response = await apiClient.patch("/students/me", {
    phone: payload.phone,
  });

  void response;
  return payload;
}
