const mongoose = require("mongoose");
const { DISPUTE_STATUSES, ORDER_STATUSES } = require("../constants/appConstants");

const orderSchema = new mongoose.Schema(
  {
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
    totalAmount: {
      type: Number,
      required: true,
    },
    orderType: {
      type: String,
      enum: ["delivery", "takeaway"],
      default: "delivery",
    },
    deliveryFee: {
      type: Number,
      default: 0,
    },
    distanceKm: {
      type: Number,
      default: 0,
    },
    deliveryLocation: {
      latitude: {
        type: Number,
        default: 0,
      },
      longitude: {
        type: Number,
        default: 0,
      },
      address: {
        type: String,
        default: "",
      },
    },
    deliveryFeeBreakdown: {
      distanceKm: {
        type: Number,
        default: 0,
      },
      baseFee: {
        type: Number,
        default: 0,
      },
      perKmRate: {
        type: Number,
        default: 0,
      },
      distanceFee: {
        type: Number,
        default: 0,
      },
      peakFee: {
        type: Number,
        default: 0,
      },
      longDistanceFee: {
        type: Number,
        default: 0,
      },
      isPeakHour: {
        type: Boolean,
        default: false,
      },
      isLongDistance: {
        type: Boolean,
        default: false,
      },
      totalFee: {
        type: Number,
        default: 0,
      },
      calculatedAt: {
        type: Date,
        default: null,
      },
    },
    deliveryAddress: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(ORDER_STATUSES),
      default: ORDER_STATUSES.PENDING,
    },
    paymentStatus: {
      type: String,
      default: "pending",
    },
    acceptedAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    failedAt: {
      type: Date,
      default: null,
    },
    disputeStatus: {
      type: String,
      enum: Object.values(DISPUTE_STATUSES),
      default: DISPUTE_STATUSES.NONE,
    },
    failureReason: {
      type: String,
      trim: true,
      default: "",
    },
    rejectionReason: {
      type: String,
      trim: true,
      default: "",
    },
    rejectionSeenByStudent: {
      type: Boolean,
      default: false,
    },
    acceptanceSeenByStudent: {
      type: Boolean,
      default: true,
    },
    notes: String,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Order", orderSchema);
