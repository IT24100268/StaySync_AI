const mongoose = require("mongoose");
const { DISPUTE_STATUSES } = require("../constants/appConstants");

const disputeSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StudentProfile",
      required: true,
    },
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
    },
    deliveryPartner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DeliveryPartnerProfile",
      default: null,
    },
    issueType: {
      type: String,
      trim: true,
      default: "general",
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1500,
    },
    status: {
      type: String,
      enum: Object.values(DISPUTE_STATUSES),
      default: DISPUTE_STATUSES.OPEN,
    },
    resolutionNotes: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Dispute", disputeSchema);
