export const demoPartner = {
  id: "partner-1",
  name: "Rahul Nair",
  email: "delivery@staysync.ai",
  phone: "+1 416-555-0400",
  vehicleType: "Bike",
  licenseId: "DL-ON-55221",
  rating: 4.8,
  statusOnline: true,
  role: "delivery",
};

export const availableJobs = [
  {
    id: "delivery-1",
    orderId: "order-101",
    restaurantName: "Campus Spice Kitchen",
    restaurantPhone: "+1 416-555-0300",
    pickupAddress: "80 Bloor St W, Toronto",
    customerName: "Aarav Sharma",
    customerPhone: "+1 416-555-0205",
    deliveryAddress: "Residence Hall A, Room 204",
    distance: 2.4,
    estimatedEarnings: 8.5,
    orderSummary: "1 bag, 2 food boxes",
    status: "Available",
    createdAt: "2026-03-21T10:30:00.000Z",
    items: [
      { id: "item-1", name: "Paneer Tikka Bowl", qty: 2, subtotal: 640 },
    ],
    pickupLat: "43.6692",
    pickupLng: "-79.3896",
    deliveryLat: "43.6644",
    deliveryLng: "-79.3987",
  },
  {
    id: "delivery-2",
    orderId: "order-102",
    restaurantName: "Green Bowl Kitchen",
    restaurantPhone: "+1 416-555-0310",
    pickupAddress: "155 College St, Toronto",
    customerName: "Ritika Verma",
    customerPhone: "+1 416-555-0208",
    deliveryAddress: "Hostel Block C, Floor 3",
    distance: 3.1,
    estimatedEarnings: 10.0,
    orderSummary: "1 coffee, 1 meal box",
    status: "Available",
    createdAt: "2026-03-21T11:15:00.000Z",
    items: [
      { id: "item-2", name: "Cold Coffee", qty: 1, subtotal: 140 },
      { id: "item-3", name: "Rice Bowl", qty: 1, subtotal: 320 },
    ],
    pickupLat: "43.6581",
    pickupLng: "-79.3924",
    deliveryLat: "43.6613",
    deliveryLng: "-79.4015",
  },
];

export const deliveryHistory = [
  {
    id: "delivery-100",
    orderId: "order-099",
    restaurantName: "Campus Bites",
    restaurantPhone: "+1 416-555-0320",
    pickupAddress: "250 St George St, Toronto",
    customerName: "Neha Kapoor",
    customerPhone: "+1 416-555-0211",
    deliveryAddress: "Student Hub, Room 12",
    distance: 1.8,
    estimatedEarnings: 7.2,
    orderSummary: "1 wrap combo",
    status: "Delivered",
    createdAt: "2026-03-20T18:20:00.000Z",
    items: [{ id: "item-4", name: "Chicken Wrap", qty: 1, subtotal: 260 }],
    pickupLat: "43.6666",
    pickupLng: "-79.3993",
    deliveryLat: "43.6650",
    deliveryLng: "-79.4020",
  },
];

export const liveLocation = {
  deliveryId: "delivery-1",
  partnerId: "partner-1",
  lat: 43.6671,
  lng: -79.3922,
  timestamp: "2026-03-21T12:00:00.000Z",
};

export const earnings = {
  todayEarnings: 24.5,
  weeklyEarnings: 164.0,
  monthlyEarnings: 680.0,
  completedDeliveries: 48,
};
