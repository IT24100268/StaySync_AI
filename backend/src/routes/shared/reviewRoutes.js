const express = require("express");
const auth = require("../../middlewares/auth");
const authorize = require("../../middlewares/authorize");
const validateRequest = require("../../middlewares/validateRequest");
const { ROLES } = require("../../constants/appConstants");
const { submitReview } = require("../../controllers/shared/reviewController");
const { createReviewValidator } = require("../../validators/reviewValidators");

const router = express.Router();

router.post("/", auth, authorize(ROLES.STUDENT), validateRequest(createReviewValidator), submitReview);

module.exports = router;
