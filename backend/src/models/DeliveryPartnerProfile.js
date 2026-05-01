const mongoose = require("mongoose");
const { APPROVAL_STATUSES } = require("../constants/appConstants");

const deliveryPartnerProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    vehicleType: String,
    licenseNumber: String,
    serviceAreas: [String],
    isAvailable: {
      type: Boolean,
      default: true,
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

module.exports = mongoose.model("DeliveryPartnerProfile", deliveryPartnerProfileSchema);
