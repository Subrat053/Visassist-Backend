const mongoose = require("mongoose");
const dotenv = require("dotenv");
const User = require("../models/User.js");

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI;

const seedAdmin = async () => {
  try {
    if (!MONGO_URI) {
      throw new Error("MONGODB_URI is required");
    }

    await mongoose.connect(MONGO_URI);

    const adminEmail = String(process.env.ADMIN_EMAIL || "admin@y-axis.com").toLowerCase();
    const adminPassword = process.env.ADMIN_PASSWORD || "Admin@1234";
    const adminFirstName = process.env.ADMIN_FIRSTNAME || "Admin";
    const adminLastName = process.env.ADMIN_LASTNAME || "User";

    let adminUser = await User.findOne({ email: adminEmail }).select("+password");

    if (!adminUser) {
      adminUser = new User({
        firstName: adminFirstName,
        lastName: adminLastName,
        email: adminEmail,
        password: adminPassword,
        role: "admin",
        isActive: true,
        isEmailVerified: true,
      });

      await adminUser.save();
      console.log("Admin user created successfully.");
    } else {
      adminUser.firstName = adminFirstName;
      adminUser.lastName = adminLastName;
      adminUser.role = "admin";
      adminUser.isActive = true;
      adminUser.isDeleted = false;
      adminUser.isEmailVerified = true;
      adminUser.password = adminPassword;
      await adminUser.save();
      console.log("Admin user updated successfully (password reset). ");
    }

    console.log(`Admin login email: ${adminEmail}`);
    console.log("Admin password has been set from ADMIN_PASSWORD env or default.");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding admin user:", error);
    process.exit(1);
  }
};

seedAdmin();
