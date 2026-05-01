const mongoose = require("mongoose");
const { APPROVAL_STATUSES } = require("../constants/appConstants");

const ownerProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    businessName: String,
    hostelName: String,
    address: String,
    city: String,
    verificationDocumentUrl: String,
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

module.exports = mongoose.model("OwnerProfile", ownerProfileSchema);
