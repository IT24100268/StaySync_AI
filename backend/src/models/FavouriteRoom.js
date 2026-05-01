const mongoose = require("mongoose");

const favouriteRoomSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StudentProfile",
      required: true,
    },
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

favouriteRoomSchema.index({ student: 1, room: 1 }, { unique: true });

module.exports = mongoose.model("FavouriteRoom", favouriteRoomSchema);
