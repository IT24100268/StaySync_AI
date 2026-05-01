const { StatusCodes } = require("http-status-codes");
const { ORDER_STATUSES } = require("../../constants/appConstants");
const FoodItem = require("../../models/FoodItem");
const Order = require("../../models/Order");
const OrderItem = require("../../models/OrderItem");
const Restaurant = require("../../models/Restaurant");
const Review = require("../../models/Review");
const StudentProfile = require("../../models/StudentProfile");
const ApiError = require("../../utils/apiError");
const pick = require("../../utils/pick");
const { requireProfile } = require("../shared/profileService");
const { emitToUser } = require("../../socket/socketServer");

async function getRestaurantProfile(user) {
  const profile = await requireProfile(user);
  const restaurant = await Restaurant.findOne({ profile: profile._id });
  return { profile: await profile.populate("user", "-password"), restaurant };
}

async function listPublicRestaurants(query = {}) {
  const filter = {
    approvalStatus: "approved",
  };

  if (query.city) {
    filter.city = new RegExp(query.city, "i");
  }

  if (query.search) {
    filter.$or = [{ name: new RegExp(query.search, "i") }, { description: new RegExp(query.search, "i") }];
  }

  return Restaurant.find(filter).sort({ createdAt: -1 });
}

async function getPublicRestaurantMenu(restaurantId) {
  const restaurant = await Restaurant.findOne({ _id: restaurantId, approvalStatus: "approved" });

  if (!restaurant) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Restaurant not found.");
  }

  const foodItems = await FoodItem.find({ restaurant: restaurant._id, isAvailable: true }).sort({ createdAt: -1 });
  return { restaurant, foodItems };
}

async function getRestaurantReviews(restaurantId, query = {}) {
  const restaurant = await Restaurant.findOne({ _id: restaurantId, approvalStatus: "approved" });

  if (!restaurant) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Restaurant not found.");
  }

  const limit = Math.min(Number(query.limit) || 10, 50);
  const reviews = await Review.find({ restaurantId: restaurant._id })
    .populate({
      path: "studentId",
      populate: { path: "user", select: "name" },
    })
    .sort({ createdAt: -1 })
    .limit(limit);

  return {
    restaurant,
    reviews,
  };
}

async function updateRestaurantProfile(user, payload) {
  const profile = await requireProfile(user);

  Object.assign(
    profile,
    pick(payload, [
      "restaurantName",
      "cuisineTypes",
      "phone",
      "address",
      "city",
      "openingHours",
      "latitude",
      "longitude",
    ])
  );
  await profile.save();

  const restaurant = await Restaurant.findOne({ profile: profile._id });

  if (restaurant) {
    restaurant.name = profile.restaurantName || restaurant.name;
    restaurant.address = profile.address || restaurant.address;
    restaurant.city = profile.city || restaurant.city;
    restaurant.cuisines = profile.cuisineTypes || restaurant.cuisines;
    restaurant.latitude = profile.latitude;
    restaurant.longitude = profile.longitude;
    await restaurant.save();
  }

  return { profile: await profile.populate("user", "-password"), restaurant };
}

async function listFoodItems(user) {
  const profile = await requireProfile(user);
  const restaurant = await Restaurant.findOne({ profile: profile._id });
  return FoodItem.find({ restaurant: restaurant._id }).sort({ createdAt: -1 });
}

async function createFoodItem(user, payload) {
  const profile = await requireProfile(user);
  const restaurant = await Restaurant.findOne({ profile: profile._id });

  return FoodItem.create({
    restaurant: restaurant._id,
    ...payload,
  });
}

async function updateFoodItem(user, foodItemId, payload) {
  const profile = await requireProfile(user);
  const restaurant = await Restaurant.findOne({ profile: profile._id });
  const foodItem = await FoodItem.findOne({ _id: foodItemId, restaurant: restaurant._id });

  if (!foodItem) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Food item not found.");
  }

  Object.assign(foodItem, pick(payload, ["name", "description", "category", "price", "imageUrl", "isAvailable"]));
  await foodItem.save();
  return foodItem;
}

async function deleteFoodItem(user, foodItemId) {
  const profile = await requireProfile(user);
  const restaurant = await Restaurant.findOne({ profile: profile._id });
  const foodItem = await FoodItem.findOneAndDelete({ _id: foodItemId, restaurant: restaurant._id });

  if (!foodItem) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Food item not found.");
  }
}

async function listRestaurantOrders(user) {
  const profile = await requireProfile(user);
  const restaurant = await Restaurant.findOne({ profile: profile._id });

  const orders = await Order.find({ restaurant: restaurant._id })
    .populate({
      path: "student",
      populate: { path: "user", select: "name email phone" },
    })
    .sort({ createdAt: -1 });

  const ordersWithItems = await Promise.all(
    orders.map(async (order) => {
      const items = await OrderItem.find({ order: order._id }).sort({ createdAt: 1 });
      return {
        ...order.toObject(),
        items,
      };
    })
  );

  return ordersWithItems;
}

async function updateRestaurantOrderStatus(user, orderId, payload) {
  const profile = await requireProfile(user);
  const restaurant = await Restaurant.findOne({ profile: profile._id });
  const order = await Order.findOne({ _id: orderId, restaurant: restaurant._id });

  if (!order) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Order not found.");
  }

  order.status = payload.status;

  if (payload.status === "cancelled") {
    order.rejectionReason = String(payload.rejectionReason || "").trim();
    order.failureReason = order.rejectionReason;
    order.failedAt = new Date();
    order.rejectionSeenByStudent = false;
    order.acceptanceSeenByStudent = true;
  } else if (payload.status === "confirmed") {
    order.acceptedAt = order.acceptedAt || new Date();
    order.completedAt = null;
    order.failedAt = null;
    order.rejectionReason = "";
    order.failureReason = "";
    order.rejectionSeenByStudent = true;
    order.acceptanceSeenByStudent = false;
  } else {
    if (
      [
        ORDER_STATUSES.PREPARING,
        ORDER_STATUSES.READY_FOR_PICKUP,
        ORDER_STATUSES.OUT_FOR_DELIVERY,
      ].includes(payload.status)
    ) {
      order.acceptedAt = order.acceptedAt || new Date();
    }

    order.rejectionReason = "";
    order.failureReason = "";
    if (payload.status !== ORDER_STATUSES.DELIVERED) {
      order.failedAt = null;
    }
    order.rejectionSeenByStudent = true;
    order.acceptanceSeenByStudent = true;
  }

  await order.save();

  if (payload.status === "cancelled" || payload.status === "confirmed") {
    const studentProfile = await StudentProfile.findById(order.student).select("user");

    if (studentProfile?.user) {
      const items = await OrderItem.find({ order: order._id }).sort({ createdAt: 1 });

      emitToUser(studentProfile.user, payload.status === "confirmed" ? "student:order-accepted" : "student:order-rejected", {
        tracking: {
          order: {
            ...order.toObject(),
            restaurant,
          },
          items,
        },
      });
    }
  }

  return order;
}

module.exports = {
  getRestaurantProfile,
  listPublicRestaurants,
  getPublicRestaurantMenu,
  getRestaurantReviews,
  updateRestaurantProfile,
  listFoodItems,
  createFoodItem,
  updateFoodItem,
  deleteFoodItem,
  listRestaurantOrders,
  updateRestaurantOrderStatus,
};
