const mongoose = require("mongoose");

const roomImageSchema = new mongoose.Schema(
  {
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
    },
    imageUrl: {
      type: String,
      required: true,
    },
    caption: String,
    isPrimary: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("RoomImage", roomImageSchema);
