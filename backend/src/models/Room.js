const mongoose = require("mongoose");
const { ROOM_STATUSES } = require("../constants/appConstants");

const roomSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "OwnerProfile",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    city: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      address: {
        type: String,
        required: true,
      },
      area: String,
      coordinates: {
        latitude: Number,
        longitude: Number,
      },
    },
    price: {
      monthlyRent: {
        type: Number,
        required: true,
      },
      securityDeposit: Number,
    },
    roomType: {
      type: String,
      default: "shared",
    },
    amenities: [String],
    genderAllowed: {
      type: String,
      default: "Any",
    },
    rules: [String],
    images: [String],
    capacity: {
      type: Number,
      default: 1,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    approvalStatus: {
      type: String,
      enum: Object.values(ROOM_STATUSES),
      default: ROOM_STATUSES.PENDING,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Room", roomSchema);
