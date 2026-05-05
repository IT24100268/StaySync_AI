const express = require("express");
const validateRequest = require("../middlewares/validateRequest");
const { sendOtp, verifyOtp } = require("../controllers/otpController");
const { sendOtpValidator, verifyOtpValidator } = require("../validators/authValidators");

const router = express.Router();

router.post("/send-otp", validateRequest(sendOtpValidator), sendOtp);
router.post("/verify-otp", validateRequest(verifyOtpValidator), verifyOtp);

module.exports = router;
