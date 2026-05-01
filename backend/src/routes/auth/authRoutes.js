const express = require("express");
const authMiddleware = require("../../middlewares/auth");
const validateRequest = require("../../middlewares/validateRequest");
const {
  login,
  register,
  sendOtp,
  verifyOtp,
  forgotPassword,
  resetPassword,
  getMe,
} = require("../../controllers/auth/authController");
const {
  sendOtpValidator,
  verifyOtpValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  registerValidator,
  registerBodyValidator,
  loginValidator,
} = require("../../validators/authValidators");

const router = express.Router();

router.post("/send-otp", validateRequest(sendOtpValidator), sendOtp);
router.post("/verify-otp", validateRequest(verifyOtpValidator), verifyOtp);
router.post("/forgot-password", validateRequest(forgotPasswordValidator), forgotPassword);
router.post("/reset-password", validateRequest(resetPasswordValidator), resetPassword);
router.post("/register", validateRequest(registerBodyValidator), register);
router.post("/register/:role", validateRequest(registerValidator), register);
router.post("/login", validateRequest(loginValidator), login);
router.get("/me", authMiddleware, getMe);

module.exports = router;
