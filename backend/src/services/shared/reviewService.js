const { StatusCodes } = require("http-status-codes");
const Order = require("../../models/Order");
const Restaurant = require("../../models/Restaurant");
const Review = require("../../models/Review");
const ApiError = require("../../utils/apiError");
const { ORDER_STATUSES, ROLES } = require("../../constants/appConstants");
const { requireProfile } = require("./profileService");

async function recalculateRestaurantReviewSummary(restaurantId) {
  const [summary] = await Review.aggregate([
    { $match: { restaurantId } },
    {
      $group: {
        _id: "$restaurantId",
        averageRating: { $avg: "$rating" },
        totalRatings: { $sum: 1 },
      },
    },
  ]);

  const averageRating = summary ? Number(summary.averageRating.toFixed(1)) : 0;
  const totalRatings = summary ? summary.totalRatings : 0;

  await Restaurant.findByIdAndUpdate(restaurantId, {
    averageRating,
    totalRatings,
  });

  return { averageRating, totalRatings };
}

async function createReview(user, payload) {
  if (user.role !== ROLES.STUDENT) {
    throw new ApiError(StatusCodes.FORBIDDEN, "Only students can submit restaurant reviews.");
  }

  const studentProfile = await requireProfile(user);
  const order = await Order.findById(payload.orderId).populate("restaurant");

  if (!order) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Order not found.");
  }

  if (String(order.student) !== String(studentProfile._id)) {
    throw new ApiError(StatusCodes.FORBIDDEN, "You can only review your own order.");
  }

  if (order.status !== ORDER_STATUSES.DELIVERED) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "You can rate a restaurant only after the order is delivered.");
  }

  const existingReview = await Review.findOne({ orderId: order._id });

  if (existingReview) {
    throw new ApiError(StatusCodes.CONFLICT, "You have already reviewed this order.");
  }

  const review = await Review.create({
    orderId: order._id,
    studentId: studentProfile._id,
    restaurantId: order.restaurant._id,
    rating: payload.rating,
    reviewText: payload.reviewText || "",
  });

  const summary = await recalculateRestaurantReviewSummary(order.restaurant._id);
  const populatedReview = await Review.findById(review._id).populate({
    path: "studentId",
    populate: { path: "user", select: "name" },
  });

  return {
    review: populatedReview,
    restaurant: {
      id: order.restaurant._id,
      averageRating: summary.averageRating,
      totalRatings: summary.totalRatings,
    },
  };
}

async function listRestaurantReviews(restaurantId, query = {}) {
  const restaurant = await Restaurant.findById(restaurantId);

  if (!restaurant) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Restaurant not found.");
  }

  const limit = Math.min(Number(query.limit) || 10, 50);

  const reviews = await Review.find({ restaurantId })
    .populate({
      path: "studentId",
      populate: { path: "user", select: "name" },
    })
    .sort({ createdAt: -1 })
    .limit(limit);

  return {
    restaurant: {
      id: restaurant._id,
      name: restaurant.name,
      averageRating: Number(restaurant.averageRating || 0),
      totalRatings: Number(restaurant.totalRatings || 0),
    },
    reviews,
  };
}

module.exports = {
  createReview,
  listRestaurantReviews,
  recalculateRestaurantReviewSummary,
};
