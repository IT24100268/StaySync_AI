function registrationOtpTemplate({ name, otp, expiryMinutes }) {
  const displayName = name || "there";

  return {
    subject: "Verify your StaySync AI account",
    text: `Hello ${displayName}, your StaySync AI verification code is ${otp}. It expires in ${expiryMinutes} minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937;">
        <h2>StaySync AI Email Verification</h2>
        <p>Hello ${displayName},</p>
        <p>Your verification code is:</p>
        <div style="font-size: 28px; font-weight: bold; letter-spacing: 6px; margin: 24px 0;">${otp}</div>
        <p>This code will expire in ${expiryMinutes} minutes.</p>
        <p>If you did not request this code, you can ignore this email.</p>
      </div>
    `,
  };
}

function passwordResetOtpTemplate({ name, otp, expiryMinutes }) {
  const displayName = name || "there";

  return {
    subject: "Reset your StaySync AI password",
    text: `Hello ${displayName}, your StaySync AI password reset code is ${otp}. It expires in ${expiryMinutes} minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937;">
        <h2>StaySync AI Password Reset</h2>
        <p>Hello ${displayName},</p>
        <p>Your password reset code is:</p>
        <div style="font-size: 28px; font-weight: bold; letter-spacing: 6px; margin: 24px 0;">${otp}</div>
        <p>This code will expire in ${expiryMinutes} minutes.</p>
        <p>If you did not request a password reset, you can ignore this email.</p>
      </div>
    `,
  };
}

module.exports = {
  registrationOtpTemplate,
  passwordResetOtpTemplate,
};
