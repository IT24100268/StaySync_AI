const crypto = require("crypto");
const env = require("../config/env");

function generateOtpCode() {
  const min = 10 ** (env.otpLength - 1);
  const max = 10 ** env.otpLength - 1;
  return String(Math.floor(Math.random() * (max - min + 1)) + min);
}

function hashOtp(code) {
  return crypto.createHash("sha256").update(code).digest("hex");
}

function getOtpExpiryDate() {
  const expiry = new Date();
  expiry.setMinutes(expiry.getMinutes() + env.otpExpiryMinutes);
  return expiry;
}

module.exports = {
  generateOtpCode,
  hashOtp,
  getOtpExpiryDate,
};
