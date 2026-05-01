const { body, param } = require("express-validator");
const { ROLES } = require("../constants/appConstants");

const supportedRoles = Object.values(ROLES);

const sendOtpValidator = [
  body("email").isEmail().withMessage("A valid email is required."),
  body("name").optional().isString().trim().notEmpty(),
];

const verifyOtpValidator = [
  body("email").isEmail().withMessage("A valid email is required."),
  body("otp").matches(/^\d{6}$/).withMessage("OTP must be a valid 6-digit code."),
];

const forgotPasswordValidator = [
  body("email").isEmail().withMessage("A valid email is required."),
];

const resetPasswordValidator = [
  body("email").isEmail().withMessage("A valid email is required."),
  body("otp").matches(/^\d{6}$/).withMessage("OTP must be a valid 6-digit code."),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long."),
];

const registerValidator = [
  param("role").isIn(supportedRoles).withMessage("Unsupported role."),
  body("name").trim().notEmpty().withMessage("Name is required."),
  body("email").isEmail().withMessage("A valid email is required."),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long."),
  body("phone").optional().isString().trim(),
];

const registerBodyValidator = [
  body("role").isIn(supportedRoles).withMessage("Unsupported role."),
  body("name").trim().notEmpty().withMessage("Name is required."),
  body("email").isEmail().withMessage("A valid email is required."),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long."),
  body("phone").optional().isString().trim(),
];

const loginValidator = [
  body("email").isEmail().withMessage("A valid email is required."),
  body("password").notEmpty().withMessage("Password is required."),
];

module.exports = {
  sendOtpValidator,
  verifyOtpValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  registerValidator,
  registerBodyValidator,
  loginValidator,
};
