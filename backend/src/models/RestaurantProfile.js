const mongoose = require("mongoose");
const { APPROVAL_STATUSES } = require("../constants/appConstants");

const restaurantProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    restaurantName: String,
    cuisineTypes: [String],
    phone: String,
    address: String,
    city: String,
    latitude: Number,
    longitude: Number,
    openingHours: String,
    approvalStatus: {
      type: String,
      enum: Object.values(APPROVAL_STATUSES),
      default: APPROVAL_STATUSES.PENDING,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("RestaurantProfile", restaurantProfileSchema);
