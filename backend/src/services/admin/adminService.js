const User = require("../../models/User");
const Room = require("../../models/Room");
const Restaurant = require("../../models/Restaurant");
const RestaurantProfile = require("../../models/RestaurantProfile");
const OwnerProfile = require("../../models/OwnerProfile");
const DeliveryPartnerProfile = require("../../models/DeliveryPartnerProfile");
const Order = require("../../models/Order");
const OrderItem = require("../../models/OrderItem");
const Delivery = require("../../models/Delivery");
const Dispute = require("../../models/Dispute");
const AdminActionLog = require("../../models/AdminActionLog");
const { Report } = require("../../models/Report");
const { buildMeta, buildPagination } = require("../../utils/pagination");
const ApiError = require("../../utils/apiError");
const { StatusCodes } = require("http-status-codes");

async function createAdminLog(adminUser, action, entityType, entityId, remarks, metadata = {}) {
  await AdminActionLog.create({
    admin: adminUser._id,
    action,
    entityType,
    entityId,
    remarks,
    metadata,
  });
}

async function getDashboardSummary() {
  const [users, rooms, restaurants, deliveries, orders] = await Promise.all([
    User.countDocuments(),
    Room.countDocuments(),
    Restaurant.countDocuments(),
    DeliveryPartnerProfile.countDocuments(),
    Order.countDocuments(),
  ]);

  return { users, rooms, restaurants, deliveries, orders };
}

async function moderateRoom(adminUser, roomId, status, remarks) {
  const room = await Room.findByIdAndUpdate(roomId, { approvalStatus: status }, { new: true });
  await createAdminLog(adminUser, "moderate_room", "Room", room._id, remarks, { status });
  return room;
}

async function moderateOwner(adminUser, ownerProfileId, status, remarks) {
  const ownerProfile = await OwnerProfile.findByIdAndUpdate(
    ownerProfileId,
    { approvalStatus: status },
    { new: true }
  ).populate("user", "name email phone role status");

  await createAdminLog(adminUser, "moderate_owner", "OwnerProfile", ownerProfile._id, remarks, { status });
  return ownerProfile;
}

async function listOwnersForModeration(query = {}) {
  const filter = {};

  if (query.status) {
    filter.approvalStatus = query.status;
  }

  return OwnerProfile.find(filter)
    .populate("user", "name email phone role status")
    .sort({ createdAt: -1 });
}

async function moderateRestaurant(adminUser, restaurantId, status, remarks) {
  const restaurant = await Restaurant.findByIdAndUpdate(restaurantId, { approvalStatus: status }, { new: true });
  await RestaurantProfile.findByIdAndUpdate(restaurant.profile, { approvalStatus: status });
  await createAdminLog(adminUser, "moderate_restaurant", "Restaurant", restaurant._id, remarks, { status });
  return restaurant;
}

async function listRestaurantsForModeration(query = {}) {
  const filter = {};

  if (query.status) {
    filter.approvalStatus = query.status;
  }

  return Restaurant.find(filter)
    .populate({
      path: "profile",
      populate: { path: "user", select: "name email phone role status" },
    })
    .sort({ createdAt: -1 });
}

async function moderateDeliveryPartner(adminUser, profileId, status, remarks) {
  const profile = await DeliveryPartnerProfile.findByIdAndUpdate(
    profileId,
    { approvalStatus: status },
    { new: true }
  ).populate("user", "name email phone role status");
  await createAdminLog(adminUser, "moderate_delivery_partner", "DeliveryPartnerProfile", profile._id, remarks, { status });
  return profile;
}

async function listDeliveryPartnersForModeration(query = {}) {
  const filter = {};

  if (query.status) {
    filter.approvalStatus = query.status;
  }

  const profiles = await DeliveryPartnerProfile.find(filter)
    .populate("user", "name email phone role status")
    .sort({ createdAt: -1 });

  return profiles.filter((profile) => profile.user?.name || profile.user?.email);
}

async function listUsers(query) {
  const { page, limit, skip } = buildPagination(query);
  const filter = {};

  if (query.role) {
    filter.role = query.role;
  }

  if (query.status) {
    filter.status = query.status;
  }

  if (query.search) {
    filter.$or = [
      { name: new RegExp(query.search, "i") },
      { email: new RegExp(query.search, "i") },
    ];
  }

  const [users, total] = await Promise.all([
    User.find(filter).select("-password").sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);

  return {
    users,
    meta: buildMeta({ total, page, limit }),
  };
}

async function blockOrUnblockUser(adminUser, userId, isBlocked, reason) {
  const normalizedReason = typeof reason === "string" ? reason.trim() : "";

  if (isBlocked && !normalizedReason) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "A block reason is required.");
  }

  const user = await User.findByIdAndUpdate(
    userId,
    {
      status: isBlocked ? "blocked" : "active",
      blockedReason: isBlocked ? normalizedReason : "",
    },
    { new: true }
  ).select("-password");

  await createAdminLog(
    adminUser,
    isBlocked ? "block_user" : "unblock_user",
    "User",
    user._id,
    normalizedReason,
    { isBlocked }
  );
  return user;
}

function mapLifecycleStatus(order) {
  if (order.status === "cancelled") {
    return "failed";
  }

  if (order.status === "delivered") {
    return "completed";
  }

  return "ongoing";
}

function toTitleCase(value) {
  return String(value || "")
    .split("_")
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function serializeTimeline(order, delivery, dispute) {
  const timeline = [
    {
      key: "placed",
      label: "Placed",
      completed: true,
      date: order.createdAt,
      description: "Student placed the order.",
    },
    {
      key: "accepted",
      label: "Accepted",
      completed: Boolean(order.acceptedAt),
      date: order.acceptedAt,
      description: order.acceptedAt
        ? "Restaurant accepted the order."
        : "Waiting for restaurant acceptance.",
    },
    {
      key: "delivery_assigned",
      label: "Delivery Assigned",
      completed: Boolean(delivery?.deliveryPartner),
      date: delivery?.acceptedAt || null,
      description: delivery?.deliveryPartner
        ? "A delivery partner was assigned to the order."
        : "Waiting for delivery assignment.",
    },
    {
      key: "delivered",
      label: "Delivered",
      completed: mapLifecycleStatus(order) === "completed",
      date: order.completedAt,
      description:
        mapLifecycleStatus(order) === "completed"
          ? "Order completed successfully."
          : "Order has not been delivered yet.",
    },
  ];

  if (mapLifecycleStatus(order) === "failed") {
    timeline.push({
      key: "failed",
      label: "Failed",
      completed: true,
      date: order.failedAt || order.updatedAt,
      description: order.failureReason || order.rejectionReason || "Order moved to failed state.",
    });
  }

  if (dispute) {
    timeline.push({
      key: "dispute",
      label: "Dispute",
      completed: true,
      date: dispute.createdAt,
      description: `Dispute is ${toTitleCase(dispute.status)}.`,
    });
  }

  return timeline;
}

function serializeAdminOrder(order, delivery = null, dispute = null) {
  const lifecycleStatus = mapLifecycleStatus(order);
  const disputeStatus = dispute?.status || order.disputeStatus || "none";

  return {
    id: order._id,
    orderId: order._id.toString(),
    studentId: order.student?._id || "",
    restaurantId: order.restaurant?._id || "",
    deliveryPartnerId: delivery?.deliveryPartner?._id || "",
    status: lifecycleStatus,
    statusLabel: toTitleCase(lifecycleStatus),
    operationalStatus: order.status,
    operationalStatusLabel: toTitleCase(order.status),
    disputeStatus,
    disputeStatusLabel: toTitleCase(disputeStatus),
    studentName: order.student?.user?.name || "Student",
    restaurantName: order.restaurant?.name || "Restaurant",
    deliveryPartnerName: delivery?.deliveryPartner?.user?.name || "Not Assigned",
    createdAt: order.createdAt,
    createdDateLabel: order.createdAt ? new Date(order.createdAt).toLocaleString() : "",
    totalAmount: order.totalAmount || 0,
    deliveryFee: order.deliveryFee || 0,
    deliveryAddress: order.deliveryAddress || "",
    failureReason: order.failureReason || order.rejectionReason || "",
    timeline: serializeTimeline(order, delivery, dispute),
    dispute: dispute
      ? {
          id: dispute._id,
          issueType: dispute.issueType,
          description: dispute.description,
          status: dispute.status,
          statusLabel: toTitleCase(dispute.status),
          resolutionNotes: dispute.resolutionNotes || "",
          createdAt: dispute.createdAt,
        }
      : null,
  };
}

async function listOrders(query) {
  const { page, limit, skip } = buildPagination(query);
  const filter = {};

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate({
        path: "student",
        populate: { path: "user", select: "name email phone" },
      })
      .populate("restaurant")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Order.countDocuments(filter),
  ]);

  const orderIds = orders.map((order) => order._id);
  const [deliveries, disputes] = await Promise.all([
    Delivery.find({ order: { $in: orderIds } }).populate({
      path: "deliveryPartner",
      populate: { path: "user", select: "name email phone" },
    }),
    Dispute.find({ order: { $in: orderIds } }).sort({ createdAt: -1 }),
  ]);

  const deliveryMap = new Map(deliveries.map((delivery) => [String(delivery.order), delivery]));
  const disputeMap = new Map();
  disputes.forEach((dispute) => {
    const key = String(dispute.order);
    if (!disputeMap.has(key)) {
      disputeMap.set(key, dispute);
    }
  });

  let normalizedOrders = orders.map((order) =>
    serializeAdminOrder(order, deliveryMap.get(String(order._id)) || null, disputeMap.get(String(order._id)) || null)
  );

  if (query.status) {
    normalizedOrders = normalizedOrders.filter((order) => order.status === String(query.status).toLowerCase());
  }

  if (query.disputeStatus) {
    normalizedOrders = normalizedOrders.filter(
      (order) => order.disputeStatus === String(query.disputeStatus).toLowerCase()
    );
  }

  return {
    orders: normalizedOrders,
    meta: buildMeta({ total, page, limit }),
  };
}

async function getOrderDetails(orderId) {
  const order = await Order.findById(orderId)
    .populate({
      path: "student",
      populate: { path: "user", select: "name email phone" },
    })
    .populate("restaurant");

  if (!order) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Order not found.");
  }

  const [items, delivery, dispute] = await Promise.all([
    OrderItem.find({ order: order._id }).sort({ createdAt: 1 }),
    Delivery.findOne({ order: order._id }).populate({
      path: "deliveryPartner",
      populate: { path: "user", select: "name email phone" },
    }),
    Dispute.findOne({ order: order._id })
      .sort({ createdAt: -1 })
      .populate({
        path: "student",
        populate: { path: "user", select: "name email phone" },
      })
      .populate("restaurant")
      .populate({
        path: "deliveryPartner",
        populate: { path: "user", select: "name email phone" },
      }),
  ]);

  const normalized = serializeAdminOrder(order, delivery, dispute);

  return {
    ...normalized,
    notes: order.notes || "",
    items: items.map((item) => ({
      id: item._id,
      name: item.name,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      subtotal: item.subtotal,
    })),
    delivery: delivery
      ? {
          id: delivery._id,
          status: delivery.status,
          statusLabel: toTitleCase(delivery.status),
          pickupAddress: delivery.pickupAddress || "",
          dropAddress: delivery.dropAddress || "",
          acceptedAt: delivery.acceptedAt,
          deliveredAt: delivery.deliveredAt,
          partner: delivery.deliveryPartner
            ? {
                id: delivery.deliveryPartner._id,
                name: delivery.deliveryPartner.user?.name || "Delivery Partner",
                email: delivery.deliveryPartner.user?.email || "",
                phone: delivery.deliveryPartner.user?.phone || "",
              }
            : null,
        }
      : null,
    student: {
      id: order.student?._id || "",
      name: order.student?.user?.name || "Student",
      email: order.student?.user?.email || "",
      phone: order.student?.user?.phone || "",
    },
    restaurant: {
      id: order.restaurant?._id || "",
      name: order.restaurant?.name || "Restaurant",
      address: order.restaurant?.address || "",
      city: order.restaurant?.city || "",
    },
  };
}

async function listReports(query = {}) {
  const { page, limit, skip } = buildPagination(query);
  const filter = {};

  if (query.status) {
    const statusMap = {
      Open: "open",
      "In Review": "in_review",
      Resolved: "resolved",
    };

    filter.status = statusMap[query.status] || query.status;
  }

  if (query.type) {
    filter.type = query.type;
  }

  const [reports, total] = await Promise.all([
    Report.find(filter)
      .populate("user", "name email role")
      .populate({
        path: "student",
        populate: { path: "user", select: "name email role" },
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Report.countDocuments(filter),
  ]);

  return {
    reports,
    meta: buildMeta({ total, page, limit }),
  };
}

async function listAdminLogs(query) {
  const { page, limit, skip } = buildPagination(query);
  const [logs, total] = await Promise.all([
    AdminActionLog.find()
      .populate("admin", "name email role")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    AdminActionLog.countDocuments(),
  ]);

  return {
    logs,
    meta: buildMeta({ total, page, limit }),
  };
}

module.exports = {
  getDashboardSummary,
  moderateRoom,
  moderateOwner,
  listOwnersForModeration,
  moderateRestaurant,
  listRestaurantsForModeration,
  moderateDeliveryPartner,
  listDeliveryPartnersForModeration,
  listUsers,
  blockOrUnblockUser,
  listOrders,
  getOrderDetails,
  listReports,
  listAdminLogs,
};
