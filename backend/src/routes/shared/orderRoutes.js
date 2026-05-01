const express = require("express");
const auth = require("../../middlewares/auth");
const authorize = require("../../middlewares/authorize");
const validateRequest = require("../../middlewares/validateRequest");
const { ROLES } = require("../../constants/appConstants");
const {
  getDeliveryFeeQuote,
  createNewOrder,
  getMyOrders,
  trackOrder,
  markNotificationSeen,
  updateStatus,
} = require("../../controllers/shared/orderController");
const {
  createOrderValidator,
  deliveryFeeEstimateValidator,
  orderIdValidator,
  orderLifecycleUpdateValidator,
} = require("../../validators/sharedValidators");

const router = express.Router();

router.post(
  "/delivery-fee",
  auth,
  authorize(ROLES.STUDENT),
  validateRequest(deliveryFeeEstimateValidator),
  getDeliveryFeeQuote
);
router.post("/", auth, authorize(ROLES.STUDENT), validateRequest(createOrderValidator), createNewOrder);
router.get("/my", auth, authorize(ROLES.STUDENT), getMyOrders);
router.patch("/:orderId/notification-seen", auth, authorize(ROLES.STUDENT), validateRequest(orderIdValidator), markNotificationSeen);
router.get("/:orderId/tracking", auth, validateRequest(orderIdValidator), trackOrder);
router.put("/:orderId/update-status", auth, authorize(ROLES.ADMIN), validateRequest(orderLifecycleUpdateValidator), updateStatus);

module.exports = router;
