const mongoose = require("mongoose");

const studentProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    fullName: String,
    institutionName: String,
    course: String,
    yearOfStudy: String,
    bio: String,
    emergencyContact: String,
    preferences: {
      budgetMin: Number,
      budgetMax: Number,
      preferredCity: String,
      roomType: String,
      amenities: [String],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("StudentProfile", studentProfileSchema);
