const { StatusCodes } = require("http-status-codes");
const catchAsync = require("../../utils/catchAsync");
const { successResponse } = require("../../utils/apiResponse");
const {
  sendRegistrationOtp,
  verifyRegistrationOtp,
  requestPasswordResetOtp,
  registerUser,
  loginUser,
  resetPasswordWithOtp,
} = require("../../services/auth/authService");

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

const forgotPassword = catchAsync(async (req, res) => {
  const result = await requestPasswordResetOtp(req.body);
  return successResponse(res, {
    statusCode: StatusCodes.OK,
    message: "If an account exists for this email, a reset code has been sent.",
    data: result,
  });
});

const register = catchAsync(async (req, res) => {
  const result = await registerUser(req.params.role || req.body.role, req.body);
  return successResponse(res, {
    statusCode: StatusCodes.CREATED,
    message: "Registration completed successfully.",
    data: result,
  });
});

const login = catchAsync(async (req, res) => {
  const result = await loginUser(req.body);
  return successResponse(res, {
    statusCode: StatusCodes.OK,
    message: "Login successful.",
    data: result,
  });
});

const resetPassword = catchAsync(async (req, res) => {
  const result = await resetPasswordWithOtp(req.body);
  return successResponse(res, {
    statusCode: StatusCodes.OK,
    message: "Password reset successful.",
    data: result,
  });
});

const getMe = catchAsync(async (req, res) => {
  return successResponse(res, {
    statusCode: StatusCodes.OK,
    message: "Authenticated user fetched successfully.",
    data: req.user,
  });
});

module.exports = {
  sendOtp,
  verifyOtp,
  forgotPassword,
  register,
  login,
  resetPassword,
  getMe,
};
