import apiClient from "./apiClient";

function normalizeRestaurant(restaurant, fallbackIndex) {
  return {
    id: restaurant._id || restaurant.id,
    name: restaurant.name,
    location: [restaurant.address, restaurant.city].filter(Boolean).join(", ") || "Campus area",
    latitude: restaurant.latitude == null ? null : Number(restaurant.latitude),
    longitude: restaurant.longitude == null ? null : Number(restaurant.longitude),
    rating: Number(restaurant.averageRating || restaurant.rating || 0),
    totalRatings: Number(restaurant.totalRatings || 0),
    deliveryAvailable: typeof restaurant.isOpen === "boolean" ? restaurant.isOpen : true,
  };
}

function createRestaurantIdentityKey(restaurant) {
  return `${String(restaurant.name || "").trim().toLowerCase()}::${String(
    restaurant.location || ""
  )
    .trim()
    .toLowerCase()}`;
}

export async function fetchRestaurants() {
  const response = await apiClient.get("/restaurants");

  return (response.data.data || [])
    .map((restaurant, index) => normalizeRestaurant(restaurant, index))
    .filter(
      (restaurant, index, all) =>
        index ===
        all.findIndex(
          (item) => createRestaurantIdentityKey(item) === createRestaurantIdentityKey(restaurant)
        )
    )
    .sort((left, right) => left.name.localeCompare(right.name));
}

export async function fetchFoodMenu(restaurantId) {
  const response = await apiClient.get(`/restaurants/${restaurantId}/menu`);

  return (response.data.data.foodItems || []).map((item) => ({
    id: item._id,
    restaurantId: item.restaurant,
    name: item.name,
    price: item.price,
    image: item.imageUrl,
    description: item.description,
    category: item.category,
    availability: item.isAvailable ? "in_stock" : "out_of_stock",
  }));
}

function normalizeReview(review) {
  return {
    id: review._id || review.id,
    rating: Number(review.rating || 0),
    reviewText: review.reviewText || "",
    createdAt: review.createdAt,
    studentName: review.studentId?.user?.name || "Student",
  };
}

export async function fetchRestaurantReviews(restaurantId, limit = 10) {
  const response = await apiClient.get(`/restaurants/${restaurantId}/reviews`, {
    params: { limit },
  });

  return {
    restaurant: normalizeRestaurant(response.data.data.restaurant, 0),
    reviews: (response.data.data.reviews || []).map(normalizeReview),
  };
}
