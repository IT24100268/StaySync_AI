import apiClient from "../../../services/apiClient";

export function normalizeRestaurantProfileResponse(payload) {
  const profile = payload?.profile || {};
  const restaurant = payload?.restaurant || {};
  const cuisines = restaurant.cuisines || profile.cuisineTypes || [];

  return {
    id: restaurant._id || restaurant.id,
    name: restaurant.name || profile.restaurantName,
    restaurantName: restaurant.name || profile.restaurantName,
    email: profile.user?.email,
    phone: profile.phone || profile.user?.phone,
    address: restaurant.address || profile.address,
    city: restaurant.city || profile.city,
    latitude:
      restaurant.latitude == null && profile.latitude == null
        ? null
        : Number(restaurant.latitude ?? profile.latitude),
    longitude:
      restaurant.longitude == null && profile.longitude == null
        ? null
        : Number(restaurant.longitude ?? profile.longitude),
    cuisines,
    cuisineType: cuisines[0] || "",
    openingHours: profile.openingHours || "",
    averageRating: Number(restaurant.averageRating || 0),
    totalRatings: Number(restaurant.totalRatings || 0),
    isOpen: typeof restaurant.isOpen === "boolean" ? restaurant.isOpen : true,
    deliveryAvailable: typeof restaurant.isOpen === "boolean" ? restaurant.isOpen : true,
    role: profile.user?.role || "restaurant",
    profile,
    restaurant,
  };
}

export async function fetchRestaurantProfile() {
  const response = await apiClient.get("/restaurants/me");
  return normalizeRestaurantProfileResponse(response.data.data);
}

export async function fetchRestaurantProfileWithToken(token) {
  const response = await apiClient.get("/restaurants/me", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return normalizeRestaurantProfileResponse(response.data.data);
}

export async function updateRestaurantProfile(payload) {
  const response = await apiClient.patch("/restaurants/me", {
    restaurantName: payload.name || payload.restaurantName,
    phone: payload.phone,
    address: payload.address,
    city: payload.city,
    latitude: payload.latitude,
    longitude: payload.longitude,
    openingHours: payload.openingHours,
    cuisineTypes: payload.cuisineType ? [payload.cuisineType] : payload.cuisines,
  });
  return normalizeRestaurantProfileResponse(response.data.data);
}
