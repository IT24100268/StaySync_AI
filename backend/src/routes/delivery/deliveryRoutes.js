const express = require("express");
const auth = require("../../middlewares/auth");
const authorize = require("../../middlewares/authorize");
const validateRequest = require("../../middlewares/validateRequest");
const { ROLES } = require("../../constants/appConstants");
const {
  getProfile,
  updateProfile,
  getAvailableJobs,
  getAssignedJobs,
  acceptJob,
  updateJobStatus,
  updateLocation,
} = require("../../controllers/delivery/deliveryController");
const {
  updateDeliveryProfileValidator,
  deliveryIdValidator,
  updateDeliveryStatusValidator,
  updateLiveLocationValidator,
} = require("../../validators/deliveryValidators");

const router = express.Router();

router.use(auth, authorize(ROLES.DELIVERY));

router.get("/me", getProfile);
router.patch("/me", validateRequest(updateDeliveryProfileValidator), updateProfile);
router.get("/jobs", getAvailableJobs);
router.get("/assigned", getAssignedJobs);
router.patch("/jobs/:deliveryId/accept", validateRequest(deliveryIdValidator), acceptJob);
router.patch(
  "/jobs/:deliveryId/status",
  validateRequest([...deliveryIdValidator, ...updateDeliveryStatusValidator]),
  updateJobStatus
);
router.post(
  "/jobs/:deliveryId/location",
  validateRequest([...deliveryIdValidator, ...updateLiveLocationValidator]),
  updateLocation
);

module.exports = router;
