const dotenv = require("dotenv");

dotenv.config();

const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT) || 5000,
  appName: process.env.APP_NAME || "StaySync AI API",
  apiPrefix: process.env.API_PREFIX || "/api",
  clientUrl: process.env.CLIENT_URL || "*",
  mongoUri: process.env.MONGODB_URI || "",
  jwtSecret: process.env.JWT_SECRET || "change-me",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  otpExpiryMinutes: Number(process.env.OTP_EXPIRY_MINUTES) || 5,
  otpLength: 6,
  allowOtpFallback: String(process.env.ALLOW_OTP_FALLBACK || "false") === "true",
  mail: {
    host: process.env.MAIL_HOST || "smtp.gmail.com",
    port: Number(process.env.MAIL_PORT) || 465,
    secure: String(process.env.MAIL_SECURE || "false") === "true",
    user: process.env.EMAIL_USER || process.env.MAIL_USER || "",
    pass: process.env.EMAIL_PASS || process.env.MAIL_PASS || "",
    from:
      process.env.MAIL_FROM ||
      (process.env.EMAIL_USER ? `StaySync AI <${process.env.EMAIL_USER}>` : "StaySync AI <no-reply@staysync.ai>"),
  },
  adminSeedEmail: process.env.ADMIN_SEED_EMAIL || "admin@staysync.ai",
  adminSeedPassword: process.env.ADMIN_SEED_PASSWORD || "Admin@12345",
};

module.exports = env;
