const User = require("../models/User");
const { ROLES } = require("../constants/appConstants");
const { createRoleProfile } = require("../services/shared/profileService");

const DEVELOPMENT_STUDENT = {
  name: "Aarav Sharma",
  email: "student@staysync.ai",
  password: "password123",
  phone: "+1 416-555-0100",
  role: ROLES.STUDENT,
  emailVerified: true,
};

async function ensureStudentUser() {
  const normalizedEmail = DEVELOPMENT_STUDENT.email.toLowerCase();
  let user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    user = await User.create({
      ...DEVELOPMENT_STUDENT,
      email: normalizedEmail,
    });
  }

  await createRoleProfile(user, {
    fullName: DEVELOPMENT_STUDENT.name,
    institutionName: "University of Toronto",
  }).catch(() => null);
}

async function seedDevelopmentUsers() {
  await ensureStudentUser();
  console.log("Development demo users ensured.");
}

module.exports = seedDevelopmentUsers;
