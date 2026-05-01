const { StatusCodes } = require("http-status-codes");
const catchAsync = require("../../utils/catchAsync");
const { successResponse } = require("../../utils/apiResponse");
const ApiError = require("../../utils/apiError");
const { browseRooms, getRoomById, deactivateRoomById } = require("../../services/shared/roomService");

const getRooms = catchAsync(async (req, res) => {
  const result = await browseRooms(req.query);
  return successResponse(res, { statusCode: StatusCodes.OK, message: "Rooms fetched.", data: result.rooms, meta: result.meta });
});

const getRoomDetails = catchAsync(async (req, res) => {
  const room = await getRoomById(req.params.roomId);

  if (!room) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Room not found.");
  }

  return successResponse(res, { statusCode: StatusCodes.OK, message: "Room details fetched.", data: room });
});

const deactivateRoom = catchAsync(async (req, res) => {
  const room = await deactivateRoomById(req.params.roomId);
  return successResponse(res, {
    statusCode: StatusCodes.OK,
    message: "Room listing deactivated successfully.",
    data: room,
  });
});

module.exports = {
  getRooms,
  getRoomDetails,
  deactivateRoom,
};
