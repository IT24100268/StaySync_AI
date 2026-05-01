const mongoose = require("mongoose");

const foodItemSchema = new mongoose.Schema(
  {
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: String,
    category: String,
    price: {
      type: Number,
      required: true,
    },
    imageUrl: String,
    isAvailable: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("FoodItem", foodItemSchema);
