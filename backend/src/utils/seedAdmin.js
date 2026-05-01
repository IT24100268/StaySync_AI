const connectDatabase = require("../config/db");
const env = require("../config/env");
const User = require("../models/User");
const { ROLES } = require("../constants/appConstants");

async function seedAdmin() {
  await connectDatabase();

  const existingAdmin = await User.findOne({ email: env.adminSeedEmail.toLowerCase() });

  if (existingAdmin) {
    console.log("Admin already exists.");
    process.exit(0);
  }

  await User.create({
    name: "Platform Admin",
    email: env.adminSeedEmail.toLowerCase(),
    password: env.adminSeedPassword,
    role: ROLES.ADMIN,
    emailVerified: true,
  });

  console.log("Admin seeded successfully.");
  process.exit(0);
}

seedAdmin().catch((error) => {
  console.error("Failed to seed admin:", error);
  process.exit(1);
});
