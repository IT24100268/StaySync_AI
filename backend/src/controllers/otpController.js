const { StatusCodes } = require("http-status-codes");
const catchAsync = require("../utils/catchAsync");
const { successResponse } = require("../utils/apiResponse");
const { sendRegistrationOtp, verifyRegistrationOtp } = require("../services/auth/authService");

const sendOtp = catchAsync(async (req, res) => {
  const result = await sendRegistrationOtp(req.body);
  return successResponse(res, {
    statusCode: StatusCodes.OK,
    message: "OTP sent successfully.",
    data: result,
  });
});

const verifyOtp = catchAsync(async (req, res) => {
  const result = await verifyRegistrationOtp(req.body);
  return successResponse(res, {
    statusCode: StatusCodes.OK,
    message: "Email verified successfully.",
    data: result,
  });
});

module.exports = {
  sendOtp,
  verifyOtp,
};
