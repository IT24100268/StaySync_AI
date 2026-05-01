import apiClient from "../../../services/apiClient";

function normalizeMenuItem(item) {
  return {
    id: item._id || item.id,
    restaurantId: item.restaurant || item.restaurantId,
    name: item.name,
    description: item.description || "",
    category: item.category || "",
    price: item.price,
    image: item.imageUrl || item.image || "",
    availability: item.isAvailable === false ? "out_of_stock" : "in_stock",
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

export async function fetchMenuItems() {
  const response = await apiClient.get("/restaurants/menu");
  return (response.data.data || []).map(normalizeMenuItem);
}

export async function createMenuItem(payload) {
  const response = await apiClient.post("/restaurants/menu", {
    name: payload.name,
    description: payload.description,
    category: payload.category,
    price: Number(payload.price),
    imageUrl: payload.image,
    isAvailable: payload.availability === "in_stock",
  });

  return normalizeMenuItem(response.data.data);
}

export async function updateMenuItem(payload) {
  const response = await apiClient.patch(`/restaurants/menu/${payload.id}`, {
    name: payload.name,
    description: payload.description,
    category: payload.category,
    price: Number(payload.price),
    imageUrl: payload.image,
    isAvailable: payload.availability === "in_stock",
  });

  return normalizeMenuItem(response.data.data);
}

export async function deleteMenuItem(foodId) {
  await apiClient.delete(`/restaurants/menu/${foodId}`);
  return { success: true, foodId };
}
