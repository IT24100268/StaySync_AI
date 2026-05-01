const { StatusCodes } = require("http-status-codes");
const env = require("../../config/env");
const { getMailer } = require("../../config/mailer");
const { ROLES, USER_STATUSES } = require("../../constants/appConstants");
const User = require("../../models/User");
const EmailOtpVerification = require("../../models/EmailOtpVerification");
const ApiError = require("../../utils/apiError");
const { registrationOtpTemplate, passwordResetOtpTemplate } = require("../../utils/emailTemplates");
const { generateOtpCode, getOtpExpiryDate, hashOtp } = require("../../utils/otp");
const { signToken } = require("../../utils/token");
const { createRoleProfile } = require("../shared/profileService");
const Restaurant = require("../../models/Restaurant");
const RestaurantProfile = require("../../models/RestaurantProfile");
const OwnerProfile = require("../../models/OwnerProfile");
const DeliveryPartnerProfile = require("../../models/DeliveryPartnerProfile");

async function sendRegistrationOtp({ email, name }) {
  const normalizedEmail = email.toLowerCase();
  await EmailOtpVerification.deleteMany({
    email: normalizedEmail,
    purpose: "registration",
    expiresAt: { $lte: new Date() },
  });

  const existingUser = await User.findOne({ email: normalizedEmail });

  if (existingUser) {
    throw new ApiError(StatusCodes.CONFLICT, "An account with this email already exists.");
  }

  const otp = generateOtpCode();
  const otpHash = hashOtp(otp);
  const expiresAt = getOtpExpiryDate();

  await EmailOtpVerification.deleteMany({ email: normalizedEmail, purpose: "registration" });
  await EmailOtpVerification.create({
    email: normalizedEmail,
    purpose: "registration",
    otpHash,
    expiresAt,
  });

  const template = registrationOtpTemplate({
    name,
    otp,
    expiryMinutes: env.otpExpiryMinutes,
  });

  const mailer = getMailer();

  if (mailer) {
    await mailer.sendMail({
      from: env.mail.user || env.mail.from,
      to: normalizedEmail,
      subject: template.subject,
      text: template.text,
      html: template.html,
    });
  } else {
    console.log(`OTP for ${normalizedEmail}: ${otp}`);
  }

  return { email: normalizedEmail, expiresAt };
}

async function verifyRegistrationOtp({ email, otp }) {
  const normalizedEmail = email.toLowerCase();
  await EmailOtpVerification.deleteMany({
    email: normalizedEmail,
    purpose: "registration",
    expiresAt: { $lte: new Date() },
  });

  const verification = await EmailOtpVerification.findOne({
    email: normalizedEmail,
    purpose: "registration",
  }).sort({ createdAt: -1 });

  if (!verification) {
    throw new ApiError(StatusCodes.NOT_FOUND, "No OTP request found for this email.");
  }

  if (verification.expiresAt < new Date()) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "OTP has expired. Please request a new one.");
  }

  if (verification.otpHash !== hashOtp(otp)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "OTP is invalid.");
  }

  verification.verified = true;
  verification.verifiedAt = new Date();
  await verification.save();

  return { email: normalizedEmail, verifiedAt: verification.verifiedAt };
}

async function requestPasswordResetOtp({ email }) {
  const normalizedEmail = email.toLowerCase();
  await EmailOtpVerification.deleteMany({
    email: normalizedEmail,
    purpose: "password-reset",
    expiresAt: { $lte: new Date() },
  });

  const user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    return { email: normalizedEmail, expiresAt: null };
  }

  const otp = generateOtpCode();
  const otpHash = hashOtp(otp);
  const expiresAt = getOtpExpiryDate();

  await EmailOtpVerification.deleteMany({ email: normalizedEmail, purpose: "password-reset" });
  await EmailOtpVerification.create({
    email: normalizedEmail,
    purpose: "password-reset",
    otpHash,
    expiresAt,
  });

  const template = passwordResetOtpTemplate({
    name: user.name,
    otp,
    expiryMinutes: env.otpExpiryMinutes,
  });

  const mailer = getMailer();

  if (mailer) {
    await mailer.sendMail({
      from: env.mail.user || env.mail.from,
      to: normalizedEmail,
      subject: template.subject,
      text: template.text,
      html: template.html,
    });
  } else {
    console.log(`Password reset OTP for ${normalizedEmail}: ${otp}`);
  }

  return { email: normalizedEmail, expiresAt };
}

async function resetPasswordWithOtp({ email, otp, password }) {
  const normalizedEmail = email.toLowerCase();
  await EmailOtpVerification.deleteMany({
    email: normalizedEmail,
    purpose: "password-reset",
    expiresAt: { $lte: new Date() },
  });

  const verification = await EmailOtpVerification.findOne({
    email: normalizedEmail,
    purpose: "password-reset",
  }).sort({ createdAt: -1 });

  if (!verification) {
    throw new ApiError(StatusCodes.NOT_FOUND, "No password reset request found for this email.");
  }

  if (verification.expiresAt < new Date()) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Reset code has expired. Please request a new one.");
  }

  if (verification.otpHash !== hashOtp(otp)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Reset code is invalid.");
  }

  const user = await User.findOne({ email: normalizedEmail }).select("+password");

  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, "No account found for this email.");
  }

  user.password = password;
  await user.save();
  await EmailOtpVerification.deleteMany({ email: normalizedEmail, purpose: "password-reset" });

  return { email: normalizedEmail, resetAt: new Date() };
}

async function registerUser(role, payload) {
  if (!Object.values(ROLES).includes(role)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Unsupported registration role.");
  }

  const normalizedEmail = payload.email.toLowerCase();
  const existingUser = await User.findOne({ email: normalizedEmail });

  if (existingUser) {
    throw new ApiError(StatusCodes.CONFLICT, "An account with this email already exists.");
  }

  const verification = await EmailOtpVerification.findOne({
    email: normalizedEmail,
    purpose: "registration",
    verified: true,
    expiresAt: { $gt: new Date() },
  }).sort({ verifiedAt: -1 });

  if (!verification) {
    throw new ApiError(StatusCodes.FORBIDDEN, "Email verification is required before registration.");
  }

  const user = await User.create({
    name: payload.name,
    email: normalizedEmail,
    password: payload.password,
    phone: payload.phone,
    role,
    emailVerified: true,
    status: role === ROLES.ADMIN ? USER_STATUSES.ACTIVE : USER_STATUSES.ACTIVE,
  });

  await createRoleProfile(user, payload);
  await EmailOtpVerification.deleteMany({ email: normalizedEmail, purpose: "registration" });

  const token = signToken({ sub: user._id.toString(), role: user.role });

  return {
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
    },
  };
}

async function loginUser({ email, password }) {
  const normalizedEmail = email.toLowerCase();
  const user = await User.findOne({ email: normalizedEmail }).select("+password");

  if (!user) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Invalid email or password.");
  }

  const isPasswordValid = await user.comparePassword(password);

  if (!isPasswordValid) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Invalid email or password.");
  }

  if (!user.emailVerified) {
    throw new ApiError(StatusCodes.FORBIDDEN, "Please verify your email first.");
  }

  if (user.status === USER_STATUSES.BLOCKED) {
    const reason = user.blockedReason?.trim();
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      reason ? `Your account has been blocked. Reason: ${reason}` : "Your account has been blocked."
    );
  }

  if (user.role === ROLES.OWNER) {
    const ownerProfile = await OwnerProfile.findOne({ user: user._id });

    if (!ownerProfile || ownerProfile.approvalStatus !== "approved") {
      throw new ApiError(StatusCodes.FORBIDDEN, "Your owner account is pending admin approval.");
    }
  }

  if (user.role === ROLES.RESTAURANT) {
    const restaurantProfile = await RestaurantProfile.findOne({ user: user._id });
    const restaurant = restaurantProfile
      ? await Restaurant.findOne({ profile: restaurantProfile._id })
      : null;

    if (!restaurant || restaurant.approvalStatus !== "approved") {
      throw new ApiError(StatusCodes.FORBIDDEN, "Your restaurant account is pending admin approval.");
    }
  }

  if (user.role === ROLES.DELIVERY) {
    const deliveryProfile = await DeliveryPartnerProfile.findOne({ user: user._id });

    if (!deliveryProfile || deliveryProfile.approvalStatus !== "approved") {
      throw new ApiError(StatusCodes.FORBIDDEN, "Your delivery account is pending admin approval.");
    }
  }

  user.lastLoginAt = new Date();
  await user.save();

  const token = signToken({ sub: user._id.toString(), role: user.role });

  return {
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      status: user.status,
    },
  };
}

module.exports = {
  sendRegistrationOtp,
  verifyRegistrationOtp,
  requestPasswordResetOtp,
  registerUser,
  loginUser,
  resetPasswordWithOtp,
};
