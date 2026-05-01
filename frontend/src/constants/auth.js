export const ROLES = {
  STUDENT: "student",
  OWNER: "owner",
  RESTAURANT: "restaurant",
  DELIVERY: "delivery",
  ADMIN: "admin",
};

export const ROLE_LABELS = {
  [ROLES.STUDENT]: "Student",
  [ROLES.OWNER]: "Hostel/Room Owner",
  [ROLES.RESTAURANT]: "Restaurant",
  [ROLES.DELIVERY]: "Delivery Partner",
  [ROLES.ADMIN]: "Admin",
};

export const ROLE_REGISTER_ROUTE = {
  [ROLES.STUDENT]: "StudentRegister",
  [ROLES.OWNER]: "OwnerRegister",
  [ROLES.RESTAURANT]: "RestaurantRegister",
  [ROLES.DELIVERY]: "DeliveryPartnerRegister",
  [ROLES.ADMIN]: "AdminRegister",
};

export const STORAGE_KEYS = {
  authToken: "staysync_auth_token_v2",
  authUser: "staysync_auth_user_v2",
};
