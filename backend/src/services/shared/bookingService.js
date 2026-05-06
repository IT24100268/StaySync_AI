const { StatusCodes } = require("http-status-codes");
const BookingRequest = require("../../models/BookingRequest");
const Room = require("../../models/Room");
const ApiError = require("../../utils/apiError");
const { requireProfile } = require("./profileService");
const { emitToUser } = require("../../socket/socketServer");

async function createBookingRequest(user, payload) {
  const studentProfile = await requireProfile(user);
  const room = await Room.findById(payload.roomId);

  if (!room || room.approvalStatus !== "approved" || !room.isAvailable) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "This room is not available for booking.");
  }

  const existingRequest = await BookingRequest.findOne({
    room: room._id,
    student: studentProfile._id,
    status: "pending",
  });

  if (existingRequest) {
    throw new ApiError(StatusCodes.CONFLICT, "You already have a pending request for this room.");
  }

  return BookingRequest.create({
    room: room._id,
    student: studentProfile._id,
    owner: room.owner,
    moveInDate: payload.moveInDate,
    message: payload.message,
    paymentStatus: payload.paymentStatus,
    paymentMethod: payload.paymentMethod,
    advanceAmount: payload.advanceAmount,
    transactionId: payload.transactionId,
    paidAt: payload.paidAt,
  });
}

async function listStudentBookings(user) {
  const studentProfile = await requireProfile(user);

  return BookingRequest.find({ student: studentProfile._id })
    .populate("room")
    .populate({
      path: "owner",
      populate: { path: "user", select: "name email phone" },
    })
    .sort({ createdAt: -1 });
}

async function updateBookingStatus(user, bookingId, status, ownerNotes) {
  const booking = await BookingRequest.findById(bookingId).populate("room");

  if (!booking) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Booking request not found.");
  }

  if (user.role === "owner") {
    const ownerProfile = await requireProfile(user);

    if (String(booking.owner) !== String(ownerProfile._id)) {
      throw new ApiError(StatusCodes.FORBIDDEN, "You cannot modify this booking request.");
    }

    if (!["approved", "rejected"].includes(status)) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Owners can only approve or reject booking requests.");
    }
  }

  if (user.role === "student") {
    const studentProfile = await requireProfile(user);

    if (String(booking.student) !== String(studentProfile._id)) {
      throw new ApiError(StatusCodes.FORBIDDEN, "You cannot modify this booking request.");
    }

    if (status !== "cancelled") {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Students can only cancel their booking requests.");
    }
  }

  booking.status = status;
  booking.ownerNotes = ownerNotes || booking.ownerNotes;
  if (user.role === "owner" && ["approved", "rejected"].includes(status)) {
    booking.decisionSeenByStudent = false;
  }
  await booking.save();
  await booking.populate("room");
  await booking.populate({
    path: "owner",
    populate: { path: "user", select: "name email phone" },
  });
  await booking.populate({
    path: "student",
    populate: { path: "user", select: "name email phone" },
  });

  if (user.role === "owner" && booking.student?.user) {
    emitToUser(booking.student.user, "student:booking-status-updated", {
      booking: {
        _id: booking._id,
        status: booking.status,
        ownerNotes: booking.ownerNotes || "",
        decisionSeenByStudent: booking.decisionSeenByStudent,
        createdAt: booking.createdAt,
        updatedAt: booking.updatedAt,
        room: {
          _id: booking.room?._id,
          title: booking.room?.title || "Room",
        },
        owner: {
          _id: booking.owner?._id,
          user: {
            name: booking.owner?.user?.name || "Room Owner",
          },
        },
      },
    });
  }

  return booking;
}

async function markBookingDecisionSeen(user, bookingId) {
  const studentProfile = await requireProfile(user);
  const booking = await BookingRequest.findOne({
    _id: bookingId,
    student: studentProfile._id,
  });

  if (!booking) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Booking request not found.");
  }

  booking.decisionSeenByStudent = true;
  await booking.save();
  return booking;
}

module.exports = {
  createBookingRequest,
  listStudentBookings,
  updateBookingStatus,
  markBookingDecisionSeen,
};
