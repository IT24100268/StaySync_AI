import apiClient from "../../../services/apiClient";
import { getSecureItem, setSecureItem } from "../../../utils/storage";
import { restaurantApprovals } from "../data/dummyData";
import { APPROVAL_TYPES } from "../utils/constants";

const APPROVAL_STORAGE_KEY = "staysync_admin_approval_registry";

function clone(data) {
  return JSON.parse(JSON.stringify(data));
}

function mapRestaurantApprovalStatus(status) {
  if (status === "approved") return "Approved";
  if (status === "rejected") return "Rejected";
  return "Pending";
}

function mapRestaurantApproval(item) {
  return {
    id: item._id,
    type: APPROVAL_TYPES.RESTAURANT,
    restaurantId: item._id,
    restaurantName: item.name,
    ownerName: item.profile?.user?.email || item.profile?.restaurantName || item.name,
    address: [item.address, item.city].filter(Boolean).join(", "),
    status: mapRestaurantApprovalStatus(item.approvalStatus),
    submittedAt: item.createdAt,
    notes: "Moderated from live backend data.",
    email: item.profile?.user?.email || "",
    phone: item.profile?.phone || item.profile?.user?.phone || "",
    cuisine: Array.isArray(item.cuisines) ? item.cuisines.join(", ") : "",
    openingHours: item.profile?.openingHours || "",
    deliveryAvailable: item.isOpen ? "Yes" : "No",
  };
}

function mapOwnerApprovalStatus(status) {
  if (status === "approved") return "Approved";
  if (status === "rejected") return "Rejected";
  return "Pending";
}

function mapOwnerApproval(item) {
  const ownerName = item.user?.name || item.businessName || item.hostelName || "Room Owner";
  const location = [item.address, item.city].filter(Boolean).join(", ");

  return {
    id: item._id,
    type: APPROVAL_TYPES.ROOM,
    ownerProfileId: item._id,
    ownerId: item.user?._id || item._id,
    ownerName,
    roomTitle: item.hostelName || item.businessName || ownerName,
    location,
    rent: "-",
    status: mapOwnerApprovalStatus(item.approvalStatus),
    submittedAt: item.createdAt,
    notes: "Owner registration pending admin review.",
    email: item.user?.email || "",
    phone: item.user?.phone || "",
    businessName: item.businessName || "",
    hostelName: item.hostelName || "",
    address: item.address || "",
    city: item.city || "",
  };
}

function mapDeliveryApprovalStatus(status) {
  if (status === "approved") return "Approved";
  if (status === "rejected") return "Rejected";
  return "Pending";
}

function mapDeliveryApproval(item) {
  return {
    id: item._id,
    type: APPROVAL_TYPES.DELIVERY,
    partnerId: item.user?._id || item._id,
    profileId: item._id,
    partnerName: item.user?.name || "Delivery Partner",
    vehicleType: item.vehicleType || "",
    phone: item.user?.phone || "",
    email: item.user?.email || "",
    status: mapDeliveryApprovalStatus(item.approvalStatus),
    submittedAt: item.createdAt,
    notes: "Delivery partner registration pending admin review.",
    licenseNumber: item.licenseNumber || "",
    serviceAreas: Array.isArray(item.serviceAreas) ? item.serviceAreas.join(", ") : "",
  };
}

async function loadApprovalRegistry() {
  const storedRegistry = await getSecureItem(APPROVAL_STORAGE_KEY);
  if (!storedRegistry) {
    const seededRegistry = {
      roomApprovals: [],
      restaurantApprovals: clone(restaurantApprovals),
      deliveryApprovals: [],
    };
    await setSecureItem(APPROVAL_STORAGE_KEY, JSON.stringify(seededRegistry));
    return seededRegistry;
  }

  const parsedRegistry = JSON.parse(storedRegistry);
  const sanitizedRegistry = {
    roomApprovals: [],
    restaurantApprovals: Array.isArray(parsedRegistry.restaurantApprovals)
      ? parsedRegistry.restaurantApprovals
      : clone(restaurantApprovals),
    deliveryApprovals: [],
  };

  await setSecureItem(APPROVAL_STORAGE_KEY, JSON.stringify(sanitizedRegistry));
  return sanitizedRegistry;
}

async function saveApprovalRegistry(registry) {
  await setSecureItem(APPROVAL_STORAGE_KEY, JSON.stringify(registry));
}

export async function fetchApprovalRequests() {
  const localRegistry = await loadApprovalRegistry();
  const [ownersResponse, restaurantsResponse, deliveriesResponse] = await Promise.all([
    apiClient.get("/admin/owners"),
    apiClient.get("/admin/restaurants"),
    apiClient.get("/admin/delivery"),
  ]);

  return {
    ...localRegistry,
    roomApprovals: (ownersResponse.data.data || []).map(mapOwnerApproval),
    restaurantApprovals: (restaurantsResponse.data.data || []).map(mapRestaurantApproval),
    deliveryApprovals: (deliveriesResponse.data.data || []).map(mapDeliveryApproval),
  };
}

export async function createApprovalRequest(type, payload) {
  const registry = await loadApprovalRegistry();

  if (type === APPROVAL_TYPES.RESTAURANT) {
    registry.restaurantApprovals = [
      {
        id: `restaurant-approval-${Date.now()}`,
        type,
        status: "Pending",
        submittedAt: new Date().toISOString(),
        notes: "Awaiting admin review.",
        ...payload,
      },
      ...registry.restaurantApprovals,
    ];
  }

  await saveApprovalRegistry(registry);
  return registry;
}

export async function updateApprovalRequestStatus(type, id, status) {
  const registry = await loadApprovalRegistry();

  if (type === APPROVAL_TYPES.ROOM) {
    await apiClient.patch(`/admin/owners/${id}/moderation`, {
      status: status.toLowerCase(),
      remarks: "",
    });
    const response = await apiClient.get("/admin/owners");
    registry.roomApprovals = (response.data.data || []).map(mapOwnerApproval);
  }

  if (type === APPROVAL_TYPES.RESTAURANT) {
    await apiClient.patch(`/admin/restaurants/${id}/moderation`, {
      status: status.toLowerCase(),
      remarks: "",
    });
    const response = await apiClient.get("/admin/restaurants");
    registry.restaurantApprovals = (response.data.data || []).map(mapRestaurantApproval);
  }

  if (type === APPROVAL_TYPES.DELIVERY) {
    await apiClient.patch(`/admin/delivery/${id}/moderation`, {
      status: status.toLowerCase(),
      remarks: "",
    });
    const response = await apiClient.get("/admin/delivery");
    registry.deliveryApprovals = (response.data.data || []).map(mapDeliveryApproval);
  }

  await saveApprovalRegistry(registry);
  return registry;
}
