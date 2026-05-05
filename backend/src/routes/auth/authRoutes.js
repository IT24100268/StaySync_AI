const express = require("express");
const authMiddleware = require("../../middlewares/auth");
const otpRoutes = require("../otpRoutes");
const validateRequest = require("../../middlewares/validateRequest");
const {
  login,
  register,
  forgotPassword,
  resetPassword,
  getMe,
} = require("../../controllers/auth/authController");
const {
  forgotPasswordValidator,
  resetPasswordValidator,
  registerValidator,
  registerBodyValidator,
  loginValidator,
} = require("../../validators/authValidators");

const router = express.Router();

router.use("/", otpRoutes);
router.post("/forgot-password", validateRequest(forgotPasswordValidator), forgotPassword);
router.post("/reset-password", validateRequest(resetPasswordValidator), resetPassword);
router.post("/register", validateRequest(registerBodyValidator), register);
router.post("/register/:role", validateRequest(registerValidator), register);
router.post("/login", validateRequest(loginValidator), login);
router.get("/me", authMiddleware, getMe);

module.exports = router;
