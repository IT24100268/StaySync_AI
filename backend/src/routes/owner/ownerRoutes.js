const express = require("express");
const auth = require("../../middlewares/auth");
const authorize = require("../../middlewares/authorize");
const validateRequest = require("../../middlewares/validateRequest");
const { ROLES } = require("../../constants/appConstants");
const {
  getProfile,
  updateProfile,
  createRoomListing,
  updateRoomListing,
  removeRoomListing,
  setRoomAvailability,
  getOwnRooms,
  getBookingRequests,
} = require("../../controllers/owner/ownerController");
const {
  updateOwnerProfileValidator,
  roomValidator,
  roomAvailabilityValidator,
  roomIdParamValidator,
} = require("../../validators/ownerValidators");

const router = express.Router();

router.use(auth, authorize(ROLES.OWNER));

router.get("/me", getProfile);
router.patch("/me", validateRequest(updateOwnerProfileValidator), updateProfile);
router.get("/rooms", getOwnRooms);
router.post("/rooms", validateRequest(roomValidator), createRoomListing);
router.patch("/rooms/:roomId", validateRequest([...roomIdParamValidator, ...roomValidator]), updateRoomListing);
router.delete("/rooms/:roomId", validateRequest(roomIdParamValidator), removeRoomListing);
router.patch(
  "/rooms/:roomId/availability",
  validateRequest([...roomIdParamValidator, ...roomAvailabilityValidator]),
  setRoomAvailability
);
router.get("/bookings", getBookingRequests);

module.exports = router;
