import apiClient from "../../../services/apiClient";

function normalizeAdminUser(user) {
  return {
    id: user._id || user.id,
    name: user.name || "",
    email: user.email || "",
    role: user.role || "",
    status: user.status === "blocked" ? "Blocked" : user.status || "Active",
    isBlocked: user.status === "blocked",
    blockedReason: user.blockedReason || "",
    createdAt: user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "",
  };
}

export async function fetchAdminUsers() {
  const response = await apiClient.get("/admin/users");
  return (response.data.data || []).map(normalizeAdminUser);
}

export async function updateAdminUserBlockStatus(userId, isBlocked, reason) {
  const response = await apiClient.patch(`/admin/users/${userId}/block`, {
    isBlocked,
    reason,
  });

  return normalizeAdminUser(response.data.data);
}
