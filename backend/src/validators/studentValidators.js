const { body, param } = require("express-validator");

const updateProfileValidator = [
  body("phone").optional().isString().trim(),
  body("fullName").optional().isString().trim(),
  body("institutionName").optional().isString().trim(),
  body("course").optional().isString().trim(),
  body("bio").optional().isString().trim(),
  body("preferences.budgetMin").optional().isNumeric(),
  body("preferences.budgetMax").optional().isNumeric(),
];

const favouriteRoomValidator = [
  body("roomId").isMongoId().withMessage("Valid roomId is required."),
];

const removeFavouriteValidator = [
  param("roomId").isMongoId().withMessage("Valid roomId is required."),
];

module.exports = {
  updateProfileValidator,
  favouriteRoomValidator,
  removeFavouriteValidator,
};
