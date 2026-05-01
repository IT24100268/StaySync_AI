const { body } = require("express-validator");

const createReviewValidator = [
  body("orderId").isMongoId().withMessage("Valid orderId is required."),
  body("rating").isInt({ min: 1, max: 5 }).withMessage("Rating must be between 1 and 5."),
  body("reviewText").optional().isString().trim().isLength({ max: 500 }).withMessage("Review must be 500 characters or fewer."),
];

module.exports = {
  createReviewValidator,
};
