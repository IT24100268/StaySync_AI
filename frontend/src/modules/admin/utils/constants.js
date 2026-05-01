export const ADMIN_STORAGE_KEYS = {
  token: "staysync_admin_token",
  profile: "staysync_admin_profile",
};

export const APPROVAL_TYPES = {
  ROOM: "room",
  RESTAURANT: "restaurant",
  DELIVERY: "delivery",
};

export const APPROVAL_STATUS_OPTIONS = ["all", "Pending", "Approved", "Rejected"];
export const USER_ROLE_FILTERS = ["all", "student", "owner", "restaurant", "delivery", "admin"];
export const REPORT_STATUS_FILTERS = ["all", "Open", "In Review", "Resolved", "Rejected"];
export const ORDER_MONITOR_FILTERS = ["All", "Ongoing", "Failed", "Disputed"];

export const ADMIN_ACTIONS = {
  APPROVE: "approve",
  REJECT: "reject",
  BLOCK: "block",
  UNBLOCK: "unblock",
};
