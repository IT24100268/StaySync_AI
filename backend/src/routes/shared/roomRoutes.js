const express = require("express");
const auth = require("../../middlewares/auth");
const authorize = require("../../middlewares/authorize");
const validateRequest = require("../../middlewares/validateRequest");
const { ROLES } = require("../../constants/appConstants");
const { getRooms, getRoomDetails, deactivateRoom } = require("../../controllers/shared/roomController");
const { roomIdValidator } = require("../../validators/sharedValidators");

const router = express.Router();

router.get("/", getRooms);
router.put("/:roomId/deactivate", auth, authorize(ROLES.ADMIN), validateRequest(roomIdValidator), deactivateRoom);
router.get("/:roomId", validateRequest(roomIdValidator), getRoomDetails);

module.exports = router;
