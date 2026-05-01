const { body, param } = require("express-validator");

const updateOwnerProfileValidator = [
  body("businessName").optional().isString().trim(),
  body("hostelName").optional().isString().trim(),
  body("address").optional().isString().trim(),
  body("city").optional().isString().trim(),
];

const roomValidator = [
  body("title").isString().trim().notEmpty(),
  body("description").isString().trim().notEmpty(),
  body("city").isString().trim().notEmpty(),
  body("location.address").isString().trim().notEmpty(),
  body("price.monthlyRent").isNumeric(),
  body("capacity").optional().isInt({ min: 1 }),
  body("roomType").optional().isString().trim(),
];

const roomAvailabilityValidator = [
  body("isAvailable").isBoolean(),
];

const roomIdParamValidator = [
  param("roomId").isMongoId().withMessage("Valid roomId is required."),
];

module.exports = {
  updateOwnerProfileValidator,
  roomValidator,
  roomAvailabilityValidator,
  roomIdParamValidator,
};
