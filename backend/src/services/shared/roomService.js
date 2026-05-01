const Room = require("../../models/Room");
const ApiError = require("../../utils/apiError");
const { StatusCodes } = require("http-status-codes");
const { buildMeta, buildPagination } = require("../../utils/pagination");

async function browseRooms(query) {
  const { page, limit, skip } = buildPagination(query);
  const filter = {
    approvalStatus: "approved",
  };

  if (query.city) {
    filter.city = new RegExp(query.city, "i");
  }

  if (query.search) {
    filter.$or = [
      { title: new RegExp(query.search, "i") },
      { description: new RegExp(query.search, "i") },
      { "location.address": new RegExp(query.search, "i") },
    ];
  }

  if (query.availableOnly === "true") {
    filter.isAvailable = true;
  }

  if (query.minRent || query.maxRent) {
    filter["price.monthlyRent"] = {};

    if (query.minRent) {
      filter["price.monthlyRent"].$gte = Number(query.minRent);
    }

    if (query.maxRent) {
      filter["price.monthlyRent"].$lte = Number(query.maxRent);
    }
  }

  const [rooms, total] = await Promise.all([
    Room.find(filter)
      .populate({
        path: "owner",
        populate: { path: "user", select: "name phone email" },
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Room.countDocuments(filter),
  ]);

  return {
    rooms,
    meta: buildMeta({ total, page, limit }),
  };
}

async function getRoomById(roomId) {
  return Room.findById(roomId).populate({
    path: "owner",
    populate: { path: "user", select: "name email phone" },
  });
}

async function deactivateRoomById(roomId) {
  const room = await Room.findByIdAndUpdate(
    roomId,
    { isAvailable: false },
    { new: true }
  ).populate({
    path: "owner",
    populate: { path: "user", select: "name email phone" },
  });

  if (!room) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Room not found.");
  }

  return room;
}

module.exports = {
  browseRooms,
  getRoomById,
  deactivateRoomById,
};
