const { StatusCodes } = require("http-status-codes");
const catchAsync = require("../../utils/catchAsync");
const { successResponse } = require("../../utils/apiResponse");
const {
  getDeliveryProfile,
  updateDeliveryProfile,
  listAvailableDeliveries,
  acceptDelivery,
  updateDeliveryStatus,
  updateLiveLocation,
  listAssignedDeliveries,
} = require("../../services/delivery/deliveryService");

const getProfile = catchAsync(async (req, res) => {
  const profile = await getDeliveryProfile(req.user);
  return successResponse(res, { statusCode: StatusCodes.OK, message: "Delivery profile fetched.", data: profile });
});

const updateProfile = catchAsync(async (req, res) => {
  const profile = await updateDeliveryProfile(req.user, req.body);
  return successResponse(res, { statusCode: StatusCodes.OK, message: "Delivery profile updated.", data: profile });
});

const getAvailableJobs = catchAsync(async (req, res) => {
  const deliveries = await listAvailableDeliveries();
  return successResponse(res, { statusCode: StatusCodes.OK, message: "Available delivery jobs fetched.", data: deliveries });
});

const getAssignedJobs = catchAsync(async (req, res) => {
  const deliveries = await listAssignedDeliveries(req.user);
  return successResponse(res, { statusCode: StatusCodes.OK, message: "Assigned deliveries fetched.", data: deliveries });
});

const acceptJob = catchAsync(async (req, res) => {
  const delivery = await acceptDelivery(req.user, req.params.deliveryId);
  return successResponse(res, { statusCode: StatusCodes.OK, message: "Delivery accepted.", data: delivery });
});

const updateJobStatus = catchAsync(async (req, res) => {
  const delivery = await updateDeliveryStatus(req.user, req.params.deliveryId, req.body.status);
  return successResponse(res, { statusCode: StatusCodes.OK, message: "Delivery status updated.", data: delivery });
});

const updateLocation = catchAsync(async (req, res) => {
  const location = await updateLiveLocation(req.user, req.params.deliveryId, req.body);
  return successResponse(res, { statusCode: StatusCodes.CREATED, message: "Live location updated.", data: location });
});

module.exports = {
  getProfile,
  updateProfile,
  getAvailableJobs,
  getAssignedJobs,
  acceptJob,
  updateJobStatus,
  updateLocation,
};
