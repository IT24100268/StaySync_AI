export function createEmptyFoodForm(restaurantId = "restaurant-1") {
  return {
    id: "",
    restaurantId,
    name: "",
    description: "",
    category: "",
    price: "",
    image: "",
    availability: "in_stock",
  };
}
