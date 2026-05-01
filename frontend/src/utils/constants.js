export const STORAGE_KEYS = {
  token: "staysync_token",
  user: "staysync_user",
  orders: "staysync_orders_registry",
  bookingRequests: "staysync_booking_requests_registry",
};

export const ROOM_FILTERS = {
  facilities: ["WiFi", "Laundry", "Security", "Parking", "Study Desk", "AC"],
  genderAllowed: ["Male", "Female", "Any"],
};

export const GENDER_PREFERENCE_OPTIONS = ["Male", "Female", "Any"].map((item) => ({
  label: item,
  value: item,
}));

export const CUISINE_TYPE_OPTIONS = ["Indian", "Italian", "Fast Food", "Other"].map((item) => ({
  label: item,
  value: item,
}));

export const ORDER_STATUSES = ["Placed", "Preparing", "Out for Delivery", "Delivered"];
