const express = require("express");
const auth = require("../../middlewares/auth");
const authorize = require("../../middlewares/authorize");
const validateRequest = require("../../middlewares/validateRequest");
const { ROLES } = require("../../constants/appConstants");
const {
  getDashboard,
  moderateRoomListing,
  getOwnersForModeration,
  moderateOwnerProfile,
  moderateRestaurantProfile,
  getRestaurantsForModeration,
  moderateDeliveryProfile,
  getDeliveryPartnersForModeration,
  getUsers,
  toggleUserBlock,
  getOrders,
  getOrderById,
  getReports,
  getActionLogs,
} = require("../../controllers/admin/adminController");
const { moderationDecisionValidator, blockUserValidator } = require("../../validators/adminValidators");
const { orderIdValidator } = require("../../validators/sharedValidators");

const router = express.Router();

router.use(auth, authorize(ROLES.ADMIN));

router.get("/dashboard", getDashboard);
router.get("/owners", getOwnersForModeration);
router.get("/restaurants", getRestaurantsForModeration);
router.get("/delivery", getDeliveryPartnersForModeration);
router.patch("/rooms/:roomId/moderation", validateRequest(moderationDecisionValidator), moderateRoomListing);
router.patch(
  "/owners/:ownerProfileId/moderation",
  validateRequest(moderationDecisionValidator),
  moderateOwnerProfile
);
router.patch(
  "/restaurants/:restaurantId/moderation",
  validateRequest(moderationDecisionValidator),
  moderateRestaurantProfile
);
router.patch(
  "/delivery/:profileId/moderation",
  validateRequest(moderationDecisionValidator),
  moderateDeliveryProfile
);
router.get("/users", getUsers);
router.patch("/users/:userId/block", validateRequest(blockUserValidator), toggleUserBlock);
router.get("/orders", getOrders);
router.get("/orders/:orderId", validateRequest(orderIdValidator), getOrderById);
router.get("/reports", getReports);
router.get("/action-logs", getActionLogs);

module.exports = router;
