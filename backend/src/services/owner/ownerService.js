const { StatusCodes } = require("http-status-codes");
const BookingRequest = require("../../models/BookingRequest");
const Room = require("../../models/Room");
const ApiError = require("../../utils/apiError");
const pick = require("../../utils/pick");
const { requireProfile } = require("../shared/profileService");

async function getOwnerProfile(user) {
  return requireProfile(user);
}

async function updateOwnerProfile(user, payload) {
  const profile = await requireProfile(user);

  Object.assign(
    profile,
    pick(payload, [
      "businessName",
      "hostelName",
      "address",
      "city",
      "verificationDocumentUrl",
    ])
  );
  await profile.save();

  return profile.populate("user", "-password");
}

async function createRoom(user, payload) {
  const ownerProfile = await requireProfile(user);

  return Room.create({
    owner: ownerProfile._id,
    ...payload,
    approvalStatus: "approved",
  });
}

async function updateRoom(user, roomId, payload) {
  const ownerProfile = await requireProfile(user);
  const room = await Room.findOne({ _id: roomId, owner: ownerProfile._id });

  if (!room) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Room listing not found.");
  }

  Object.assign(
    room,
    pick(payload, [
      "title",
      "description",
      "city",
      "location",
      "price",
      "roomType",
      "amenities",
      "genderAllowed",
      "rules",
      "images",
      "capacity",
      "isAvailable",
    ])
  );
  room.approvalStatus = "approved";
  await room.save();
  return room;
}

async function deleteRoom(user, roomId) {
  const ownerProfile = await requireProfile(user);
  const room = await Room.findOneAndDelete({ _id: roomId, owner: ownerProfile._id });

  if (!room) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Room listing not found.");
  }
}

async function updateRoomAvailability(user, roomId, isAvailable) {
  const ownerProfile = await requireProfile(user);
  const room = await Room.findOne({ _id: roomId, owner: ownerProfile._id });

  if (!room) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Room listing not found.");
  }

  room.isAvailable = isAvailable;
  await room.save();
  return room;
}

async function listOwnerRooms(user) {
  const ownerProfile = await requireProfile(user);
  return Room.find({ owner: ownerProfile._id }).sort({ createdAt: -1 });
}

async function listOwnerBookingRequests(user) {
  const ownerProfile = await requireProfile(user);
  return BookingRequest.find({ owner: ownerProfile._id })
    .populate("room")
    .populate({
      path: "student",
      populate: { path: "user", select: "name email phone" },
    })
    .sort({ createdAt: -1 });
}

module.exports = {
  getOwnerProfile,
  updateOwnerProfile,
  createRoom,
  updateRoom,
  deleteRoom,
  updateRoomAvailability,
  listOwnerRooms,
  listOwnerBookingRequests,
};
