// backend/src/models/Admin.js
const mongoose = require("mongoose");
const bcryptjs = require("bcryptjs");

const ADMIN_ROLES = {
  SUPER_ADMIN: "super_admin",
  ADMIN: "admin",
  CONSULTANT_MANAGER: "consultant",
  CONTENT_MANAGER: "content_manager",
  FINANCE_MANAGER: "finance",
  SUPPORT_MANAGER: "support",
};

const adminSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, "Invalid email"],
    },
    phone: {
      type: String,
      required: true,
    },
    password_hash: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
      select: false, // Don't return password by default
    },
    role: {
      type: String,
      enum: Object.values(ADMIN_ROLES),
      default: ADMIN_ROLES.CONSULTANT_MANAGER,
    },
    permissions: [
      {
        type: String,
        enum: [
          // Users
          "users.view",
          "users.create",
          "users.edit",
          "users.delete",
          // Consultations
          "consultations.view",
          "consultations.edit",
          "consultations.assign",
          "consultations.update_status",
          "consultations.delete",
          // Countries & Visas
          "countries.view",
          "countries.create",
          "countries.edit",
          "countries.delete",
          "visas.view",
          "visas.create",
          "visas.edit",
          "visas.delete",
          // Jobs
          "jobs.view",
          "jobs.create",
          "jobs.edit",
          "jobs.delete",
          // Courses
          "courses.view",
          "courses.create",
          "courses.edit",
          "courses.delete",
          "universities.view",
          "universities.create",
          "universities.edit",
          "universities.delete",
          // Blog
          "blog.view",
          "blog.create",
          "blog.edit",
          "blog.delete",
          // Analytics
          "analytics.view",
          "reports.view",
          // Settings
          "settings.view",
          "settings.edit",
          "admins.manage",
          // Audit
          "audit.view",
        ],
      },
    ],
    profilePicture: {
      type: String,
    },
    status: {
      type: String,
      enum: ["active", "inactive", "suspended"],
      default: "active",
    },
    lastLogin: {
      type: Date,
    },
    loginAttempts: {
      type: Number,
      default: 0,
    },
    lockedUntil: {
      type: Date,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Hash password before saving
adminSchema.pre("save", async function (next) {
  if (!this.isModified("password_hash")) {
    return next();
  }

  try {
    const salt = await bcryptjs.genSalt(10);
    this.password_hash = await bcryptjs.hash(this.password_hash, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
adminSchema.methods.comparePassword = async function (password) {
  return await bcryptjs.compare(password, this.password_hash);
};

// Check if account is locked
adminSchema.methods.isAccountLocked = function () {
  return this.lockedUntil && this.lockedUntil > new Date();
};

// Increment login attempts
adminSchema.methods.incLoginAttempts = async function () {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockedUntil && this.lockedUntil < new Date()) {
    return this.updateOne({
      $set: { loginAttempts: 1 },
      $unset: { lockedUntil: 1 },
    });
  }

  // Otherwise increment
  const updates = { $inc: { loginAttempts: 1 } };

  // Lock the account if we've reached max attempts
  const MAX_ATTEMPTS = 5;
  const LOCK_TIME = 30 * 60 * 1000; // 30 minutes

  if (this.loginAttempts + 1 >= MAX_ATTEMPTS && !this.isAccountLocked()) {
    updates.$set = { lockedUntil: new Date(Date.now() + LOCK_TIME) };
  }

  return this.updateOne(updates);
};

// Reset login attempts
adminSchema.methods.resetLoginAttempts = async function () {
  return this.updateOne({
    $set: { loginAttempts: 0 },
    $unset: { lockedUntil: 1 },
  });
};

module.exports = mongoose.model("Admin", adminSchema);
