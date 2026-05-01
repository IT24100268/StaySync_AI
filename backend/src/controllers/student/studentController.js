const { StatusCodes } = require("http-status-codes");
const catchAsync = require("../../utils/catchAsync");
const { successResponse } = require("../../utils/apiResponse");
const {
  getStudentProfile,
  updateStudentProfile,
  listFavouriteRooms,
  addFavouriteRoom,
  removeFavouriteRoom,
} = require("../../services/student/studentService");

const getProfile = catchAsync(async (req, res) => {
  const profile = await getStudentProfile(req.user);
  return successResponse(res, { statusCode: StatusCodes.OK, message: "Student profile fetched.", data: profile });
});

const updateProfile = catchAsync(async (req, res) => {
  const profile = await updateStudentProfile(req.user, req.body);
  return successResponse(res, { statusCode: StatusCodes.OK, message: "Student profile updated.", data: profile });
});

const getFavourites = catchAsync(async (req, res) => {
  const favourites = await listFavouriteRooms(req.user);
  return successResponse(res, { statusCode: StatusCodes.OK, message: "Favourite rooms fetched.", data: favourites });
});

const addFavourite = catchAsync(async (req, res) => {
  const favourites = await addFavouriteRoom(req.user, req.body.roomId);
  return successResponse(res, { statusCode: StatusCodes.CREATED, message: "Room added to favourites.", data: favourites });
});

const removeFavourite = catchAsync(async (req, res) => {
  const favourites = await removeFavouriteRoom(req.user, req.params.roomId);
  return successResponse(res, { statusCode: StatusCodes.OK, message: "Room removed from favourites.", data: favourites });
});

module.exports = {
  getProfile,
  updateProfile,
  getFavourites,
  addFavourite,
  removeFavourite,
};
