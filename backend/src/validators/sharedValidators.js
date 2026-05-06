const { body, param } = require("express-validator");

const roomIdValidator = [
  param("roomId").isMongoId().withMessage("Valid roomId is required."),
];

const bookingRequestValidator = [
  body("roomId").isMongoId().withMessage("Valid roomId is required."),
  body("moveInDate").isISO8601().withMessage("moveInDate must be a valid date."),
  body("message").optional().isString().trim(),
];

const bookingDecisionValidator = [
  param("bookingId").isMongoId().withMessage("Valid bookingId is required."),
  body("status").isIn(["approved", "rejected", "cancelled"]),
  body("ownerNotes").optional().isString().trim(),
];

const bookingNotificationSeenValidator = [
  param("bookingId").isMongoId().withMessage("Valid bookingId is required."),
];

const createOrderValidator = [
  body("restaurantId").isMongoId().withMessage("Valid restaurantId is required."),
  body("items").isArray({ min: 1 }).withMessage("Order items are required."),
  body("items.*.foodItemId").isMongoId().withMessage("Each item must include a valid foodItemId."),
  body("items.*.quantity").isInt({ min: 1 }).withMessage("Each item quantity must be at least 1."),
  body("orderType").optional().isIn(["delivery", "takeaway"]),
  body("deliveryAddress").custom((value, { req }) => {
    if ((req.body.orderType || "delivery") === "takeaway") {
      return true;
    }

    if (typeof value === "string" && value.trim()) {
      return true;
    }

    throw new Error("Delivery address is required.");
  }),
  body("deliveryLatitude").custom((value, { req }) => {
    if ((req.body.orderType || "delivery") === "takeaway") {
      return true;
    }

    if (Number.isFinite(Number(value)) && Number(value) >= -90 && Number(value) <= 90) {
      return true;
    }

    throw new Error("Delivery latitude is required.");
  }),
  body("deliveryLongitude").custom((value, { req }) => {
    if ((req.body.orderType || "delivery") === "takeaway") {
      return true;
    }

    if (Number.isFinite(Number(value)) && Number(value) >= -180 && Number(value) <= 180) {
      return true;
    }

    throw new Error("Delivery longitude is required.");
  }),
];

const deliveryFeeEstimateValidator = [
  body("restaurantId").isMongoId().withMessage("Valid restaurantId is required."),
  body("deliveryLatitude")
    .isFloat({ min: -90, max: 90 })
    .withMessage("Delivery latitude is required."),
  body("deliveryLongitude")
    .isFloat({ min: -180, max: 180 })
    .withMessage("Delivery longitude is required."),
];

const orderIdValidator = [
  param("orderId").isMongoId().withMessage("Valid orderId is required."),
];

const orderLifecycleUpdateValidator = [
  param("orderId").isMongoId().withMessage("Valid orderId is required."),
  body("status")
    .isIn(["ongoing", "failed", "completed"])
    .withMessage("status must be ongoing, failed, or completed."),
  body("failureReason").optional().isString().trim().isLength({ max: 500 }),
  body("disputeStatus")
    .optional()
    .isIn(["none", "open", "under_review", "resolved"])
    .withMessage("disputeStatus must be none, open, under_review, or resolved."),
];

const createDisputeValidator = [
  body("orderId").isMongoId().withMessage("Valid orderId is required."),
  body("issueType").optional().isString().trim().isLength({ max: 100 }),
  body("description")
    .isString()
    .trim()
    .isLength({ min: 10, max: 1500 })
    .withMessage("Description must be between 10 and 1500 characters."),
  body("markOrderFailed").optional().isBoolean().withMessage("markOrderFailed must be a boolean."),
];

const reportCreationValidator = [
  body("userId").isMongoId().withMessage("Valid userId is required."),
  body("userRole").equals("student").withMessage("userRole must be student."),
  body("type")
    .isIn(["Room Issue", "Fake Listing", "Price Issue", "Food / Delivery Issue", "Other"])
    .withMessage("A valid report type is required."),
  body("targetId").optional({ nullable: true }).isString().trim(),
  body("targetType").optional().isIn(["room", "restaurant", "delivery", "user", "other"]),
  body("description")
    .isString()
    .trim()
    .isLength({ min: 10, max: 1500 })
    .withMessage("Description must be between 10 and 1500 characters."),
  body("status").optional().equals("open").withMessage("status must be open."),
];

const reportStudentValidator = [
  param("studentId").isMongoId().withMessage("Valid studentId is required."),
];

const reportIdValidator = [
  param("reportId").isMongoId().withMessage("Valid reportId is required."),
];

const reportLogsValidator = [
  param("targetId").isString().trim().notEmpty().withMessage("Valid targetId is required."),
];

const reportUpdateValidator = [
  param("reportId").isMongoId().withMessage("Valid reportId is required."),
  body("status")
    .isIn(["open", "in_review", "resolved", "rejected"])
    .withMessage("Valid report status is required."),
  body("actionTaken")
    .optional()
    .isString()
    .trim()
    .isLength({ max: 500 })
    .withMessage("actionTaken must be 500 characters or fewer."),
];

module.exports = {
  roomIdValidator,
  bookingRequestValidator,
  bookingDecisionValidator,
  bookingNotificationSeenValidator,
  createOrderValidator,
  deliveryFeeEstimateValidator,
  orderIdValidator,
  orderLifecycleUpdateValidator,
  createDisputeValidator,
  reportCreationValidator,
  reportStudentValidator,
  reportIdValidator,
  reportLogsValidator,
  reportUpdateValidator,
};
