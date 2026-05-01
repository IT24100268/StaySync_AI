const { StatusCodes } = require("http-status-codes");
const catchAsync = require("../../utils/catchAsync");
const { successResponse } = require("../../utils/apiResponse");
const {
  getOwnerProfile,
  updateOwnerProfile,
  createRoom,
  updateRoom,
  deleteRoom,
  updateRoomAvailability,
  listOwnerRooms,
  listOwnerBookingRequests,
} = require("../../services/owner/ownerService");

const getProfile = catchAsync(async (req, res) => {
  const profile = await getOwnerProfile(req.user);
  return successResponse(res, { statusCode: StatusCodes.OK, message: "Owner profile fetched.", data: profile });
});

const updateProfile = catchAsync(async (req, res) => {
  const profile = await updateOwnerProfile(req.user, req.body);
  return successResponse(res, { statusCode: StatusCodes.OK, message: "Owner profile updated.", data: profile });
});

const createRoomListing = catchAsync(async (req, res) => {
  const room = await createRoom(req.user, req.body);
  return successResponse(res, { statusCode: StatusCodes.CREATED, message: "Room listing created.", data: room });
});

const updateRoomListing = catchAsync(async (req, res) => {
  const room = await updateRoom(req.user, req.params.roomId, req.body);
  return successResponse(res, { statusCode: StatusCodes.OK, message: "Room listing updated.", data: room });
});

const removeRoomListing = catchAsync(async (req, res) => {
  await deleteRoom(req.user, req.params.roomId);
  return successResponse(res, { statusCode: StatusCodes.OK, message: "Room listing deleted." });
});

const setRoomAvailability = catchAsync(async (req, res) => {
  const room = await updateRoomAvailability(req.user, req.params.roomId, req.body.isAvailable);
  return successResponse(res, { statusCode: StatusCodes.OK, message: "Room availability updated.", data: room });
});

const getOwnRooms = catchAsync(async (req, res) => {
  const rooms = await listOwnerRooms(req.user);
  return successResponse(res, { statusCode: StatusCodes.OK, message: "Owner room listings fetched.", data: rooms });
});

const getBookingRequests = catchAsync(async (req, res) => {
  const bookings = await listOwnerBookingRequests(req.user);
  return successResponse(res, { statusCode: StatusCodes.OK, message: "Booking requests fetched.", data: bookings });
});

module.exports = {
  getProfile,
  updateProfile,
  createRoomListing,
  updateRoomListing,
  removeRoomListing,
  setRoomAvailability,
  getOwnRooms,
  getBookingRequests,
};
