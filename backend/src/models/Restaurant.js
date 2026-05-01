const mongoose = require("mongoose");
const { APPROVAL_STATUSES } = require("../constants/appConstants");

const restaurantSchema = new mongoose.Schema(
  {
    profile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RestaurantProfile",
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: String,
    address: String,
    city: String,
    latitude: Number,
    longitude: Number,
    cuisines: [String],
    isOpen: {
      type: Boolean,
      default: true,
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalRatings: {
      type: Number,
      default: 0,
      min: 0,
    },
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

module.exports = mongoose.model("Restaurant", restaurantSchema);
