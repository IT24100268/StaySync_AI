const mongoose = require("mongoose");

const liveLocationSchema = new mongoose.Schema(
  {
    delivery: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Delivery",
      required: true,
    },
    coordinates: {
      latitude: {
        type: Number,
        required: true,
      },
      longitude: {
        type: Number,
        required: true,
      },
    },
    heading: Number,
    speed: Number,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("LiveLocation", liveLocationSchema);
