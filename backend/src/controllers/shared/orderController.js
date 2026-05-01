const { StatusCodes } = require("http-status-codes");
const catchAsync = require("../../utils/catchAsync");
const { successResponse } = require("../../utils/apiResponse");
const {
  createOrder,
  estimateDeliveryFee,
  listStudentOrders,
  getOrderTracking,
  markStudentOrderNotificationSeen,
  updateOrderLifecycleStatus,
} = require("../../services/shared/orderService");

const getDeliveryFeeQuote = catchAsync(async (req, res) => {
  const result = await estimateDeliveryFee(req.body);
  return successResponse(res, {
    statusCode: StatusCodes.OK,
    message: "Delivery fee estimated successfully.",
    data: result,
  });
});

const createNewOrder = catchAsync(async (req, res) => {
  const result = await createOrder(req.user, req.body);
  return successResponse(res, { statusCode: StatusCodes.CREATED, message: "Order created successfully.", data: result });
});

const getMyOrders = catchAsync(async (req, res) => {
  const orders = await listStudentOrders(req.user);
  return successResponse(res, { statusCode: StatusCodes.OK, message: "Student orders fetched.", data: orders });
});

const trackOrder = catchAsync(async (req, res) => {
  const tracking = await getOrderTracking(req.params.orderId, req.user);
  return successResponse(res, { statusCode: StatusCodes.OK, message: "Order tracking fetched.", data: tracking });
});

const markNotificationSeen = catchAsync(async (req, res) => {
  const order = await markStudentOrderNotificationSeen(req.params.orderId, req.user);
  return successResponse(res, { statusCode: StatusCodes.OK, message: "Order notification marked as seen.", data: order });
});

const updateStatus = catchAsync(async (req, res) => {
  const order = await updateOrderLifecycleStatus(req.params.orderId, req.body);
  return successResponse(res, {
    statusCode: StatusCodes.OK,
    message: "Order lifecycle status updated.",
    data: order,
  });
});

module.exports = {
  getDeliveryFeeQuote,
  createNewOrder,
  getMyOrders,
  trackOrder,
  markNotificationSeen,
  updateStatus,
};
