const mongoose = require("mongoose");
const { BOOKING_STATUSES } = require("../constants/appConstants");

const bookingRequestSchema = new mongoose.Schema(
  {
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StudentProfile",
      required: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "OwnerProfile",
      required: true,
    },
    moveInDate: {
      type: Date,
      required: true,
    },
    message: String,
    paymentStatus: String,
    paymentMethod: String,
    advanceAmount: Number,
    transactionId: String,
    paidAt: Date,
    status: {
      type: String,
      enum: Object.values(BOOKING_STATUSES),
      default: BOOKING_STATUSES.PENDING,
    },
    ownerNotes: String,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("BookingRequest", bookingRequestSchema);
