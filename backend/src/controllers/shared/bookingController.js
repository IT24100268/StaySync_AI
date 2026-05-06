const { StatusCodes } = require("http-status-codes");
const catchAsync = require("../../utils/catchAsync");
const { successResponse } = require("../../utils/apiResponse");
const {
  createBookingRequest,
  listStudentBookings,
  updateBookingStatus,
  markBookingDecisionSeen,
} = require("../../services/shared/bookingService");

const createBooking = catchAsync(async (req, res) => {
  const booking = await createBookingRequest(req.user, req.body);
  return successResponse(res, { statusCode: StatusCodes.CREATED, message: "Booking request created.", data: booking });
});

const getMyBookings = catchAsync(async (req, res) => {
  const bookings = await listStudentBookings(req.user);
  return successResponse(res, { statusCode: StatusCodes.OK, message: "Student bookings fetched.", data: bookings });
});

const updateBooking = catchAsync(async (req, res) => {
  const booking = await updateBookingStatus(req.user, req.params.bookingId, req.body.status, req.body.ownerNotes);
  return successResponse(res, { statusCode: StatusCodes.OK, message: "Booking request updated.", data: booking });
});

const markBookingNotificationSeen = catchAsync(async (req, res) => {
  const booking = await markBookingDecisionSeen(req.user, req.params.bookingId);
  return successResponse(res, {
    statusCode: StatusCodes.OK,
    message: "Booking notification marked as seen.",
    data: booking,
  });
});

module.exports = {
  createBooking,
  getMyBookings,
  updateBooking,
  markBookingNotificationSeen,
};
