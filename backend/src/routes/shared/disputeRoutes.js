const express = require("express");
const auth = require("../../middlewares/auth");
const authorize = require("../../middlewares/authorize");
const validateRequest = require("../../middlewares/validateRequest");
const { ROLES } = require("../../constants/appConstants");
const { createNewDispute } = require("../../controllers/shared/disputeController");
const { createDisputeValidator } = require("../../validators/sharedValidators");

const router = express.Router();

router.post(
  "/create",
  auth,
  authorize(ROLES.STUDENT),
  validateRequest(createDisputeValidator),
  createNewDispute
);

module.exports = router;
