const express = require("express");
const auth = require("../../middlewares/auth");
const authorize = require("../../middlewares/authorize");
const validateRequest = require("../../middlewares/validateRequest");
const { ROLES } = require("../../constants/appConstants");
const {
  getRestaurants,
  getRestaurantMenu,
  getReviews,
  getProfile,
  updateProfile,
  getFoodItems,
  createMenuItem,
  updateMenuItem,
  removeMenuItem,
  getOrders,
  updateOrderStatus,
} = require("../../controllers/restaurant/restaurantController");
const {
  updateRestaurantProfileValidator,
  foodItemValidator,
  foodItemIdValidator,
  restaurantIdValidator,
  restaurantOrderStatusValidator,
} = require("../../validators/restaurantValidators");
const { orderIdValidator } = require("../../validators/sharedValidators");

const router = express.Router();

router.get("/", getRestaurants);
router.get("/:restaurantId/menu", getRestaurantMenu);
router.get("/:restaurantId/reviews", validateRequest(restaurantIdValidator), getReviews);

router.use(auth, authorize(ROLES.RESTAURANT));

router.get("/me", getProfile);
router.patch("/me", validateRequest(updateRestaurantProfileValidator), updateProfile);
router.get("/menu", getFoodItems);
router.post("/menu", validateRequest(foodItemValidator), createMenuItem);
router.patch("/menu/:foodItemId", validateRequest([...foodItemIdValidator, ...foodItemValidator]), updateMenuItem);
router.delete("/menu/:foodItemId", validateRequest(foodItemIdValidator), removeMenuItem);
router.get("/orders", getOrders);
router.patch(
  "/orders/:orderId/status",
  validateRequest([...orderIdValidator, ...restaurantOrderStatusValidator]),
  updateOrderStatus
);

module.exports = router;
