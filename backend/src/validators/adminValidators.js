const { body, param } = require("express-validator");

const moderationDecisionValidator = [
  body("status").isIn(["approved", "rejected"]).withMessage("Status must be approved or rejected."),
  body("remarks").optional().isString().trim(),
];

const blockUserValidator = [
  param("userId").isMongoId().withMessage("Valid userId is required."),
  body("isBlocked").isBoolean().withMessage("isBlocked must be a boolean."),
  body("reason")
    .optional()
    .isString()
    .trim()
    .custom((value, { req }) => {
      if (req.body.isBlocked && !String(value || "").trim()) {
        throw new Error("Reason is required when blocking a user.");
      }
      return true;
    }),
];

module.exports = {
  moderationDecisionValidator,
  blockUserValidator,
};
