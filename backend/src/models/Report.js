const mongoose = require("mongoose");
const { ROLES } = require("../constants/appConstants");

const REPORT_STATUSES = {
  OPEN: "open",
  IN_REVIEW: "in_review",
  RESOLVED: "resolved",
  REJECTED: "rejected",
};

const REPORT_TARGET_TYPES = {
  ROOM: "room",
  RESTAURANT: "restaurant",
  DELIVERY: "delivery",
  USER: "user",
  OTHER: "other",
};

const REPORT_TYPES = [
  "Room Issue",
  "Fake Listing",
  "Price Issue",
  "Food / Delivery Issue",
  "Other",
];

const reportSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StudentProfile",
      required: true,
    },
    userRole: {
      type: String,
      enum: [ROLES.STUDENT],
      default: ROLES.STUDENT,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    type: {
      type: String,
      enum: REPORT_TYPES,
      required: true,
    },
    targetId: {
      type: String,
      trim: true,
      default: "",
    },
    targetType: {
      type: String,
      enum: Object.values(REPORT_TARGET_TYPES),
      default: REPORT_TARGET_TYPES.OTHER,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1500,
    },
    status: {
      type: String,
      enum: Object.values(REPORT_STATUSES),
      default: REPORT_STATUSES.OPEN,
    },
    actionTaken: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = {
  Report: mongoose.model("Report", reportSchema),
  REPORT_STATUSES,
  REPORT_TYPES,
  REPORT_TARGET_TYPES,
};
