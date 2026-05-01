const { body, param } = require("express-validator");

const updateRestaurantProfileValidator = [
  body("restaurantName").optional().isString().trim(),
  body("cuisineTypes").optional().isArray(),
  body("phone").optional().isString().trim(),
  body("address").optional().isString().trim(),
  body("city").optional().isString().trim(),
  body("openingHours").optional().isString().trim(),
  body("latitude").optional().isFloat({ min: -90, max: 90 }),
  body("longitude").optional().isFloat({ min: -180, max: 180 }),
];

const foodItemValidator = [
  body("name").isString().trim().notEmpty(),
  body("price").isNumeric(),
  body("category").optional().isString().trim(),
  body("description").optional().isString().trim(),
];

const foodItemIdValidator = [
  param("foodItemId").isMongoId().withMessage("Valid foodItemId is required."),
];

const restaurantIdValidator = [
  param("restaurantId").isMongoId().withMessage("Valid restaurantId is required."),
];

const restaurantOrderStatusValidator = [
  body("status").isIn(["pending", "confirmed", "preparing", "ready_for_pickup", "out_for_delivery", "delivered", "cancelled"]),
  body("rejectionReason")
    .optional()
    .isString()
    .trim()
    .isLength({ min: 3, max: 300 })
    .withMessage("Rejection reason must be between 3 and 300 characters."),
  body("rejectionReason").custom((value, { req }) => {
    if (req.body.status === "cancelled" && !String(value || "").trim()) {
      throw new Error("Rejection reason is required when rejecting an order.");
    }

    return true;
  }),
];

module.exports = {
  updateRestaurantProfileValidator,
  foodItemValidator,
  foodItemIdValidator,
  restaurantIdValidator,
  restaurantOrderStatusValidator,
};
