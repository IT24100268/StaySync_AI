export const demoRestaurant = {
  id: "restaurant-1",
  name: "Campus Spice Kitchen",
  email: "restaurant@staysync.ai",
  phone: "+1 416-555-0300",
  address: "80 Bloor St W, Toronto",
  cuisineType: "Indian",
  openingHours: "09:00 AM - 11:00 PM",
  deliveryAvailable: true,
  role: "restaurant",
};

export const menuItems = [
  {
    id: "food-1",
    restaurantId: "restaurant-1",
    name: "Paneer Tikka Bowl",
    description: "High-protein rice bowl with grilled paneer and fresh vegetables.",
    category: "Rice Bowl",
    price: 320,
    image:
      "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80",
    availability: "in_stock",
    createdAt: "2026-03-14T12:00:00.000Z",
    updatedAt: "2026-03-18T12:00:00.000Z",
  },
  {
    id: "food-2",
    restaurantId: "restaurant-1",
    name: "Chicken Wrap",
    description: "Spiced grilled chicken wrap with mint mayo.",
    category: "Wraps",
    price: 260,
    image:
      "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=1200&q=80",
    availability: "out_of_stock",
    createdAt: "2026-03-13T10:00:00.000Z",
    updatedAt: "2026-03-17T14:00:00.000Z",
  },
  {
    id: "food-3",
    restaurantId: "restaurant-1",
    name: "Cold Coffee",
    description: "Fresh cold coffee for study evenings.",
    category: "Beverages",
    price: 140,
    image:
      "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=1200&q=80",
    availability: "in_stock",
    createdAt: "2026-03-12T09:00:00.000Z",
    updatedAt: "2026-03-19T11:00:00.000Z",
  },
];

export const orders = [
  {
    id: "order-101",
    studentId: "student-1",
    restaurantId: "restaurant-1",
    customerName: "Aarav Sharma",
    customerPhone: "+1 416-555-0205",
    deliveryAddress: "Residence Hall A, Room 204",
    items: [
      {
        id: "order-item-1",
        foodId: "food-1",
        name: "Paneer Tikka Bowl",
        qty: 2,
        price: 320,
        subtotal: 640,
      },
    ],
    total: 640,
    paymentMethod: "Cash on Delivery",
    status: "Pending",
    createdAt: "2026-03-20T16:45:00.000Z",
  },
  {
    id: "order-102",
    studentId: "student-2",
    restaurantId: "restaurant-1",
    customerName: "Ritika Verma",
    customerPhone: "+1 416-555-0208",
    deliveryAddress: "Hostel Block C, Floor 3",
    items: [
      {
        id: "order-item-2",
        foodId: "food-3",
        name: "Cold Coffee",
        qty: 1,
        price: 140,
        subtotal: 140,
      },
      {
        id: "order-item-3",
        foodId: "food-1",
        name: "Paneer Tikka Bowl",
        qty: 1,
        price: 320,
        subtotal: 320,
      },
    ],
    total: 460,
    paymentMethod: "Cash on Delivery",
    status: "Preparing",
    createdAt: "2026-03-20T15:20:00.000Z",
  },
];
