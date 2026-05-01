const { StatusCodes } = require("http-status-codes");
const { DISPUTE_STATUSES, ORDER_STATUSES } = require("../../constants/appConstants");
const Delivery = require("../../models/Delivery");
const FoodItem = require("../../models/FoodItem");
const LiveLocation = require("../../models/LiveLocation");
const Order = require("../../models/Order");
const OrderItem = require("../../models/OrderItem");
const Restaurant = require("../../models/Restaurant");
const RestaurantProfile = require("../../models/RestaurantProfile");
const Review = require("../../models/Review");
const { emitToUser } = require("../../socket/socketServer");
const ApiError = require("../../utils/apiError");
const { calculateDeliveryFee } = require("./deliveryFeeService");
const { calculateDistanceKm } = require("./locationService");
const { requireProfile } = require("./profileService");

async function getOrderableRestaurant(restaurantId) {
  const restaurant = await Restaurant.findById(restaurantId);

  if (!restaurant || restaurant.approvalStatus !== "approved") {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Restaurant is not available for ordering.");
  }

  return restaurant;
}

async function estimateDeliveryFee(payload) {
  const restaurant = await getOrderableRestaurant(payload.restaurantId);

  if (
    orderType === "delivery" &&
    (!Number.isFinite(Number(restaurant.latitude)) || !Number.isFinite(Number(restaurant.longitude)))
  ) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "This restaurant has not set its map location yet."
    );
  }

  const distanceKm = calculateDistanceKm(
    { latitude: restaurant.latitude, longitude: restaurant.longitude },
    {
      latitude: payload.deliveryLatitude,
      longitude: payload.deliveryLongitude,
    }
  );

  return calculateDeliveryFee(distanceKm, new Date());
}

async function createOrder(user, payload) {
  const studentProfile = await requireProfile(user);
  const restaurant = await getOrderableRestaurant(payload.restaurantId);
  const orderType = payload.orderType === "takeaway" ? "takeaway" : "delivery";

  const foodItemIds = payload.items.map((item) => item.foodItemId);
  const foodItems = await FoodItem.find({ _id: { $in: foodItemIds }, restaurant: restaurant._id, isAvailable: true });

  if (foodItems.length !== payload.items.length) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "One or more selected food items are unavailable.");
  }

  const foodItemMap = new Map(foodItems.map((item) => [item._id.toString(), item]));
  let totalAmount = 0;

  const lineItems = payload.items.map((item) => {
    const foodItem = foodItemMap.get(item.foodItemId);
    const subtotal = foodItem.price * item.quantity;
    totalAmount += subtotal;

    return {
      foodItem,
      quantity: item.quantity,
      subtotal,
    };
  });

  if (!Number.isFinite(Number(restaurant.latitude)) || !Number.isFinite(Number(restaurant.longitude))) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "This restaurant has not set its map location yet."
    );
  }

  const distanceKm =
    orderType === "delivery"
      ? calculateDistanceKm(
          { latitude: restaurant.latitude, longitude: restaurant.longitude },
          {
            latitude: payload.deliveryLatitude,
            longitude: payload.deliveryLongitude,
          }
        )
      : 0;
  const deliveryFeeBreakdown =
    orderType === "delivery"
      ? calculateDeliveryFee(distanceKm, new Date())
      : {
          distanceKm: 0,
          baseFee: 0,
          perKmRate: 0,
          distanceFee: 0,
          peakFee: 0,
          longDistanceFee: 0,
          isPeakHour: false,
          isLongDistance: false,
          totalFee: 0,
          calculatedAt: new Date(),
        };
  const deliveryFee = orderType === "delivery" ? deliveryFeeBreakdown.totalFee : 0;
  const order = await Order.create({
    student: studentProfile._id,
    restaurant: restaurant._id,
    totalAmount: totalAmount + deliveryFee,
    orderType,
    deliveryFee,
    distanceKm,
    deliveryLocation: {
      latitude: orderType === "delivery" ? payload.deliveryLatitude : restaurant.latitude,
      longitude: orderType === "delivery" ? payload.deliveryLongitude : restaurant.longitude,
      address: orderType === "delivery" ? payload.deliveryAddress : restaurant.address,
    },
    deliveryFeeBreakdown,
    deliveryAddress: orderType === "delivery" ? payload.deliveryAddress : restaurant.address,
    disputeStatus: DISPUTE_STATUSES.NONE,
    notes: payload.notes,
  });

  await OrderItem.insertMany(
    lineItems.map((item) => ({
      order: order._id,
      foodItem: item.foodItem._id,
      name: item.foodItem.name,
      quantity: item.quantity,
      unitPrice: item.foodItem.price,
      subtotal: item.subtotal,
    }))
  );

  if (orderType === "delivery") {
    await Delivery.create({
      order: order._id,
      pickupAddress: restaurant.address,
      dropAddress: payload.deliveryAddress,
    });
  }

  const tracking = await getOrderTracking(order._id, user);
  const restaurantProfile = await RestaurantProfile.findById(restaurant.profile).select("user");

  if (restaurantProfile?.user) {
    emitToUser(restaurantProfile.user, "restaurant:new-order", {
      tracking,
    });
  }

  return tracking;
}

async function listStudentOrders(user) {
  const studentProfile = await requireProfile(user);
  return Order.find({ student: studentProfile._id }).populate("restaurant").sort({ createdAt: -1 });
}

async function markStudentOrderNotificationSeen(orderId, user) {
  const studentProfile = await requireProfile(user);
  const order = await Order.findOne({ _id: orderId, student: studentProfile._id });

  if (!order) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Order not found.");
  }

  order.rejectionSeenByStudent = true;
  order.acceptanceSeenByStudent = true;
  await order.save();

  return order;
}

async function getOrderTracking(orderId, user) {
  const order = await Order.findById(orderId)
    .populate("restaurant")
    .populate({
      path: "student",
      populate: { path: "user", select: "name email phone" },
    });

  if (!order) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Order not found.");
  }

  if (user.role === "student") {
    const studentProfile = await requireProfile(user);

    if (String(order.student._id) !== String(studentProfile._id)) {
      throw new ApiError(StatusCodes.FORBIDDEN, "You cannot access this order.");
    }
  }

  if (user.role === "restaurant") {
    const restaurantProfile = await requireProfile(user);
    const restaurant = await Restaurant.findOne({ profile: restaurantProfile._id });

    if (String(order.restaurant._id) !== String(restaurant._id)) {
      throw new ApiError(StatusCodes.FORBIDDEN, "You cannot access this order.");
    }
  }

  if (user.role === "delivery") {
    const deliveryProfile = await requireProfile(user);
    const deliveryRecord = await Delivery.findOne({ order: order._id, deliveryPartner: deliveryProfile._id });

    if (!deliveryRecord) {
      throw new ApiError(StatusCodes.FORBIDDEN, "You cannot access this order.");
    }
  }

  const orderItems = await OrderItem.find({ order: order._id }).populate("foodItem");
  const delivery = await Delivery.findOne({ order: order._id }).populate({
    path: "deliveryPartner",
    populate: { path: "user", select: "name email phone" },
  });
  const liveLocation = delivery ? await LiveLocation.findOne({ delivery: delivery._id }).sort({ createdAt: -1 }) : null;
  const review = await Review.findOne({ orderId: order._id }).populate({
    path: "studentId",
    populate: { path: "user", select: "name" },
  });

  return {
    order,
    items: orderItems,
    delivery,
    liveLocation,
    review,
  };
}

async function updateOrderLifecycleStatus(orderId, payload) {
  const order = await Order.findById(orderId);

  if (!order) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Order not found.");
  }

  if (payload.status === "failed") {
    order.status = ORDER_STATUSES.CANCELLED;
    order.failedAt = new Date();
    order.completedAt = null;
    order.failureReason = String(payload.failureReason || "").trim();
    order.rejectionReason = order.failureReason;
  } else if (payload.status === "completed") {
    order.status = ORDER_STATUSES.DELIVERED;
    order.completedAt = new Date();
    order.failedAt = null;
    order.failureReason = "";
    order.rejectionReason = "";
  } else {
    if ([ORDER_STATUSES.CANCELLED, ORDER_STATUSES.DELIVERED].includes(order.status)) {
      order.status = ORDER_STATUSES.CONFIRMED;
    }

    order.acceptedAt = order.acceptedAt || new Date();
    order.completedAt = null;
    order.failedAt = null;
    order.failureReason = "";
    order.rejectionReason = "";
  }

  if (payload.disputeStatus) {
    order.disputeStatus = payload.disputeStatus;
  }

  await order.save();
  return order;
}

module.exports = {
  createOrder,
  estimateDeliveryFee,
  listStudentOrders,
  getOrderTracking,
  markStudentOrderNotificationSeen,
  updateOrderLifecycleStatus,
};
