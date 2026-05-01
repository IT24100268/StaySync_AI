const mongoose = require("mongoose");

const emailOtpVerificationSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    purpose: {
      type: String,
      default: "registration",
    },
    otpHash: {
      type: String,
      required: true,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    verifiedAt: Date,
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

emailOtpVerificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("EmailOtpVerification", emailOtpVerificationSchema);
