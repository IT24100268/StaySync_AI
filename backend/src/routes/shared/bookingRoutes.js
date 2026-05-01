const express = require("express");
const auth = require("../../middlewares/auth");
const authorize = require("../../middlewares/authorize");
const validateRequest = require("../../middlewares/validateRequest");
const { ROLES } = require("../../constants/appConstants");
const { createBooking, getMyBookings, updateBooking } = require("../../controllers/shared/bookingController");
const { bookingRequestValidator, bookingDecisionValidator } = require("../../validators/sharedValidators");

const router = express.Router();

router.post("/", auth, authorize(ROLES.STUDENT), validateRequest(bookingRequestValidator), createBooking);
router.get("/my", auth, authorize(ROLES.STUDENT), getMyBookings);
router.patch(
  "/:bookingId/status",
  auth,
  authorize(ROLES.OWNER, ROLES.STUDENT),
  validateRequest(bookingDecisionValidator),
  updateBooking
);

module.exports = router;
