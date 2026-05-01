const { StatusCodes } = require("http-status-codes");
const catchAsync = require("../../utils/catchAsync");
const { successResponse } = require("../../utils/apiResponse");
const {
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
} = require("../../services/restaurant/restaurantService");

const getRestaurants = catchAsync(async (req, res) => {
  const restaurants = await listPublicRestaurants(req.query);
  return successResponse(res, { statusCode: StatusCodes.OK, message: "Restaurants fetched.", data: restaurants });
});

const getRestaurantMenu = catchAsync(async (req, res) => {
  const result = await getPublicRestaurantMenu(req.params.restaurantId);
  return successResponse(res, { statusCode: StatusCodes.OK, message: "Restaurant menu fetched.", data: result });
});

const getReviews = catchAsync(async (req, res) => {
  const result = await getRestaurantReviews(req.params.restaurantId, req.query);
  return successResponse(res, { statusCode: StatusCodes.OK, message: "Restaurant reviews fetched.", data: result });
});

const getProfile = catchAsync(async (req, res) => {
  const result = await getRestaurantProfile(req.user);
  return successResponse(res, { statusCode: StatusCodes.OK, message: "Restaurant profile fetched.", data: result });
});

const updateProfile = catchAsync(async (req, res) => {
  const result = await updateRestaurantProfile(req.user, req.body);
  return successResponse(res, { statusCode: StatusCodes.OK, message: "Restaurant profile updated.", data: result });
});

const getFoodItems = catchAsync(async (req, res) => {
  const items = await listFoodItems(req.user);
  return successResponse(res, { statusCode: StatusCodes.OK, message: "Food items fetched.", data: items });
});

const createMenuItem = catchAsync(async (req, res) => {
  const item = await createFoodItem(req.user, req.body);
  return successResponse(res, { statusCode: StatusCodes.CREATED, message: "Food item created.", data: item });
});

const updateMenuItem = catchAsync(async (req, res) => {
  const item = await updateFoodItem(req.user, req.params.foodItemId, req.body);
  return successResponse(res, { statusCode: StatusCodes.OK, message: "Food item updated.", data: item });
});

const removeMenuItem = catchAsync(async (req, res) => {
  await deleteFoodItem(req.user, req.params.foodItemId);
  return successResponse(res, { statusCode: StatusCodes.OK, message: "Food item deleted." });
});

const getOrders = catchAsync(async (req, res) => {
  const orders = await listRestaurantOrders(req.user);
  return successResponse(res, { statusCode: StatusCodes.OK, message: "Restaurant orders fetched.", data: orders });
});

const updateOrderStatus = catchAsync(async (req, res) => {
  const order = await updateRestaurantOrderStatus(req.user, req.params.orderId, req.body);
  return successResponse(res, { statusCode: StatusCodes.OK, message: "Order status updated.", data: order });
});

module.exports = {
  getRestaurants,
  getRestaurantMenu,
  getReviews,
  getProfile,
  updateProfile,
  getFoodItems,
  createMenuItem,
  updateMenuItem,
  removeMenuItem,
  getOrders,
  updateOrderStatus,
};
