export const demoUser = {
  id: "user-1",
  name: "Aarav Sharma",
  email: "student@staysync.ai",
  role: "student",
  university: "University of Toronto",
  genderPreference: "Male",
  budgetRange: "18000-30000",
};

export const rooms = [
  {
    id: "room-1",
    ownerId: "owner-1",
    title: "Bright Studio Near Campus",
    location: "Downtown Annex",
    price: 24000,
    facilities: ["WiFi", "Laundry", "Study Desk", "Security"],
    genderAllowed: "Any",
    distance: 1.2,
    images: [
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1200&q=80",
    ],
    rules: ["No smoking", "Quiet hours after 10 PM", "Student ID required"],
    ownerContact: "+1 416-555-0101",
  },
  {
    id: "room-2",
    ownerId: "owner-1",
    title: "Shared Hostel with Study Lounge",
    location: "College Street",
    price: 18000,
    facilities: ["WiFi", "Parking", "Laundry", "Security"],
    genderAllowed: "Female",
    distance: 2.1,
    images: [
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80",
    ],
    rules: ["Visitors before 8 PM only", "No pets"],
    ownerContact: "+1 416-555-0102",
  },
  {
    id: "room-3",
    ownerId: "owner-1",
    title: "Premium Ensuite Student Room",
    location: "Harbord Village",
    price: 30000,
    facilities: ["WiFi", "AC", "Security", "Study Desk"],
    genderAllowed: "Male",
    distance: 0.8,
    images: [
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80",
    ],
    rules: ["No parties", "Monthly deep cleaning mandatory"],
    ownerContact: "+1 416-555-0103",
  },
];

export const restaurants = [
  {
    id: "rest-1",
    name: "Campus Bites",
    location: "St. George Street",
    rating: 4.6,
    deliveryAvailable: true,
  },
  {
    id: "rest-2",
    name: "Green Bowl Kitchen",
    location: "Bloor Street",
    rating: 4.4,
    deliveryAvailable: true,
  },
];

export const foodItems = [
  {
    id: "food-1",
    restaurantId: "rest-1",
    name: "Chicken Rice Bowl",
    price: 280,
    availability: true,
    image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "food-2",
    restaurantId: "rest-1",
    name: "Paneer Wrap",
    price: 220,
    availability: true,
    image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "food-3",
    restaurantId: "rest-2",
    name: "Avocado Salad",
    price: 260,
    availability: true,
    image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1200&q=80",
  },
];

export const orders = [
  {
    id: "order-1",
    items: [
      { id: "cart-1", foodId: "food-1", qty: 1, subtotal: 280 },
      { id: "cart-2", foodId: "food-2", qty: 2, subtotal: 440 },
    ],
    total: 720,
    status: "Out for Delivery",
    eta: "22 mins",
    deliveryPartner: "Nikhil",
  },
];
