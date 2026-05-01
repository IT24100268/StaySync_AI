const FavouriteRoom = require("../../models/FavouriteRoom");
const Room = require("../../models/Room");
const pick = require("../../utils/pick");
const { requireProfile } = require("../shared/profileService");

async function getStudentProfile(user) {
  return requireProfile(user);
}

async function updateStudentProfile(user, payload) {
  const profile = await requireProfile(user);

  Object.assign(
    profile,
    pick(payload, ["fullName", "institutionName", "course", "yearOfStudy", "bio", "emergencyContact", "preferences"])
  );

  await profile.save();
  return profile.populate("user", "-password");
}

async function listFavouriteRooms(user) {
  const profile = await requireProfile(user);
  return FavouriteRoom.find({ student: profile._id }).populate({
    path: "room",
    match: { approvalStatus: "approved" },
    populate: {
      path: "owner",
      populate: {
        path: "user",
        select: "name email phone",
      },
    },
  });
}

async function addFavouriteRoom(user, roomId) {
  const profile = await requireProfile(user);
  await Room.findById(roomId).orFail();
  await FavouriteRoom.findOneAndUpdate(
    { student: profile._id, room: roomId },
    { student: profile._id, room: roomId },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return listFavouriteRooms(user);
}

async function removeFavouriteRoom(user, roomId) {
  const profile = await requireProfile(user);
  await FavouriteRoom.findOneAndDelete({ student: profile._id, room: roomId });
  return listFavouriteRooms(user);
}

module.exports = {
  getStudentProfile,
  updateStudentProfile,
  listFavouriteRooms,
  addFavouriteRoom,
  removeFavouriteRoom,
};
