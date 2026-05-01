const ROLES = {
  STUDENT: "student",
  OWNER: "owner",
  RESTAURANT: "restaurant",
  DELIVERY: "delivery",
  ADMIN: "admin",
};

const USER_STATUSES = {
  ACTIVE: "active",
  BLOCKED: "blocked",
  PENDING: "pending",
};

const APPROVAL_STATUSES = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
};

const ROOM_STATUSES = {
  DRAFT: "draft",
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
};

const BOOKING_STATUSES = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
  CANCELLED: "cancelled",
};

const ORDER_STATUSES = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
  PREPARING: "preparing",
  READY_FOR_PICKUP: "ready_for_pickup",
  OUT_FOR_DELIVERY: "out_for_delivery",
  DELIVERED: "delivered",
  CANCELLED: "cancelled",
};

const DELIVERY_STATUSES = {
  OPEN: "open",
  ACCEPTED: "accepted",
  PICKED_UP: "picked_up",
  IN_TRANSIT: "in_transit",
  DELIVERED: "delivered",
};

const DISPUTE_STATUSES = {
  NONE: "none",
  OPEN: "open",
  UNDER_REVIEW: "under_review",
  RESOLVED: "resolved",
};

module.exports = {
  ROLES,
  USER_STATUSES,
  APPROVAL_STATUSES,
  ROOM_STATUSES,
  BOOKING_STATUSES,
  ORDER_STATUSES,
  DELIVERY_STATUSES,
  DISPUTE_STATUSES,
};
