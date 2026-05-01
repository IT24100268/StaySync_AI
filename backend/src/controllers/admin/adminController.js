const { StatusCodes } = require("http-status-codes");
const catchAsync = require("../../utils/catchAsync");
const { successResponse } = require("../../utils/apiResponse");
const {
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
} = require("../../services/admin/adminService");

const getDashboard = catchAsync(async (req, res) => {
  const summary = await getDashboardSummary();
  return successResponse(res, { statusCode: StatusCodes.OK, message: "Admin dashboard fetched.", data: summary });
});

const moderateRoomListing = catchAsync(async (req, res) => {
  const room = await moderateRoom(req.user, req.params.roomId, req.body.status, req.body.remarks);
  return successResponse(res, { statusCode: StatusCodes.OK, message: "Room listing moderation updated.", data: room });
});

const getOwnersForModeration = catchAsync(async (req, res) => {
  const owners = await listOwnersForModeration(req.query);
  return successResponse(res, {
    statusCode: StatusCodes.OK,
    message: "Owners fetched for moderation.",
    data: owners,
  });
});

const moderateOwnerProfile = catchAsync(async (req, res) => {
  const owner = await moderateOwner(req.user, req.params.ownerProfileId, req.body.status, req.body.remarks);
  return successResponse(res, {
    statusCode: StatusCodes.OK,
    message: "Owner moderation updated.",
    data: owner,
  });
});

const moderateRestaurantProfile = catchAsync(async (req, res) => {
  const restaurant = await moderateRestaurant(req.user, req.params.restaurantId, req.body.status, req.body.remarks);
  return successResponse(res, { statusCode: StatusCodes.OK, message: "Restaurant moderation updated.", data: restaurant });
});

const getRestaurantsForModeration = catchAsync(async (req, res) => {
  const restaurants = await listRestaurantsForModeration(req.query);
  return successResponse(res, {
    statusCode: StatusCodes.OK,
    message: "Restaurants fetched for moderation.",
    data: restaurants,
  });
});

const moderateDeliveryProfile = catchAsync(async (req, res) => {
  const profile = await moderateDeliveryPartner(req.user, req.params.profileId, req.body.status, req.body.remarks);
  return successResponse(res, { statusCode: StatusCodes.OK, message: "Delivery partner moderation updated.", data: profile });
});

const getDeliveryPartnersForModeration = catchAsync(async (req, res) => {
  const deliveries = await listDeliveryPartnersForModeration(req.query);
  return successResponse(res, {
    statusCode: StatusCodes.OK,
    message: "Delivery partners fetched for moderation.",
    data: deliveries,
  });
});

const getUsers = catchAsync(async (req, res) => {
  const result = await listUsers(req.query);
  return successResponse(res, { statusCode: StatusCodes.OK, message: "Users fetched.", data: result.users, meta: result.meta });
});

const toggleUserBlock = catchAsync(async (req, res) => {
  const user = await blockOrUnblockUser(req.user, req.params.userId, req.body.isBlocked, req.body.reason);
  return successResponse(res, { statusCode: StatusCodes.OK, message: "User status updated.", data: user });
});

const getOrders = catchAsync(async (req, res) => {
  const result = await listOrders(req.query);
  return successResponse(res, { statusCode: StatusCodes.OK, message: "Orders fetched.", data: result.orders, meta: result.meta });
});

const getOrderById = catchAsync(async (req, res) => {
  const order = await getOrderDetails(req.params.orderId);
  return successResponse(res, {
    statusCode: StatusCodes.OK,
    message: "Order details fetched.",
    data: order,
  });
});

const getReports = catchAsync(async (req, res) => {
  const result = await listReports(req.query);
  return successResponse(res, {
    statusCode: StatusCodes.OK,
    message: "Reports fetched.",
    data: result.reports,
    meta: result.meta,
  });
});

const getActionLogs = catchAsync(async (req, res) => {
  const result = await listAdminLogs(req.query);
  return successResponse(res, { statusCode: StatusCodes.OK, message: "Admin action logs fetched.", data: result.logs, meta: result.meta });
});

module.exports = {
  getDashboard,
  moderateRoomListing,
  getOwnersForModeration,
  moderateOwnerProfile,
  moderateRestaurantProfile,
  getRestaurantsForModeration,
  moderateDeliveryProfile,
  getDeliveryPartnersForModeration,
  getUsers,
  toggleUserBlock,
  getOrders,
  getOrderById,
  getReports,
  getActionLogs,
};
