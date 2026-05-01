const mongoose = require("mongoose");
const { DELIVERY_STATUSES } = require("../constants/appConstants");

const deliverySchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      unique: true,
    },
    deliveryPartner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DeliveryPartnerProfile",
      default: null,
    },
    pickupAddress: String,
    dropAddress: String,
    status: {
      type: String,
      enum: Object.values(DELIVERY_STATUSES),
      default: DELIVERY_STATUSES.OPEN,
    },
    acceptedAt: Date,
    deliveredAt: Date,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Delivery", deliverySchema);
