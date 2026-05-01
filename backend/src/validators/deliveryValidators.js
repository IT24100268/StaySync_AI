const { body, param } = require("express-validator");

const updateDeliveryProfileValidator = [
  body("vehicleType").optional().isString().trim(),
  body("licenseNumber").optional().isString().trim(),
  body("serviceAreas").optional().isArray(),
  body("isAvailable").optional().isBoolean(),
];

const deliveryIdValidator = [
  param("deliveryId").isMongoId().withMessage("Valid deliveryId is required."),
];

const updateDeliveryStatusValidator = [
  body("status").isIn(["accepted", "picked_up", "in_transit", "delivered"]),
];

const updateLiveLocationValidator = [
  body("coordinates.latitude").isFloat({ min: -90, max: 90 }),
  body("coordinates.longitude").isFloat({ min: -180, max: 180 }),
  body("heading").optional().isNumeric(),
  body("speed").optional().isNumeric(),
];

module.exports = {
  updateDeliveryProfileValidator,
  deliveryIdValidator,
  updateDeliveryStatusValidator,
  updateLiveLocationValidator,
};
