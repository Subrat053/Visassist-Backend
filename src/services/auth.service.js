const crypto = require("crypto");
const User = require("../models/User.js");
const { sendEmail } = require("../utils/sendEmail.js");
const ApiError = require("../utils/ApiError.js");
const { issueAuthTokens, revokeRefreshToken, rotateRefreshToken } = require("./token.service.js");

const buildSafeUser = (user) => ({
  _id: user._id,
  id: user._id,
  firstName: user.firstName,
  lastName: user.lastName,
  fullName: user.fullName || `${user.firstName || ""} ${user.lastName || ""}`.trim(),
  email: user.email,
  role: user.role === "user" ? "customer" : user.role,
  phone: user.phone || "",
  avatarUrl: user.avatarUrl || "",
  isActive: Boolean(user.isActive),
});

const STAFF_ROLES = new Set([
  "super_admin",
  "admin",
  "documentation_executive",
  "support_executive",
  "destination_specialist",
  "adviser",
  "support",
]);

const CUSTOMER_ROLES = new Set(["customer", "user"]);

const normalizeEmail = (value) => String(value || "").trim().toLowerCase();

const signupUser = async (payload, context) => {
  const normalizedEmail = normalizeEmail(payload.email);
  const exists = await User.findOne({ email: normalizedEmail });
  if (exists) {
    if (exists.isDeleted || exists.isActive === false) {
      throw new ApiError(
        409,
        "ACCOUNT_INACTIVE",
        "An account with this email already exists but is inactive. Please contact support."
      );
    }
    throw new ApiError(409, "USER_EXISTS", "Email is already registered");
  }

  const user = await User.create({
    firstName: payload.firstName,
    lastName: payload.lastName,
    email: normalizedEmail,
    phone: payload.phone || "",
    password: payload.password,
    role: "customer",
  });

  const tokens = await issueAuthTokens(user, context);

  return {
    user: buildSafeUser(user),
    ...tokens,
  };
};

const authenticateUser = async (payload) => {
  const normalizedEmail = normalizeEmail(payload.email);
  const user = await User.findOne({ email: normalizedEmail }).select("+password");

  if (!user) {
    throw new ApiError(401, "INVALID_CREDENTIALS", "Invalid email or password");
  }

  if (user.isDeleted) {
    throw new ApiError(403, "ACCOUNT_DELETED", "This account has been deleted. Please contact support.");
  }

  if (user.isActive === false) {
    throw new ApiError(403, "ACCOUNT_INACTIVE", "This account is inactive. Please contact support.");
  }

  const isValid = await user.comparePassword(payload.password);
  if (!isValid) {
    throw new ApiError(401, "INVALID_CREDENTIALS", "Invalid email or password");
  }

  return user;
};

const loginStaffUser = async (payload, context) => {
  const user = await authenticateUser(payload);

  if (!STAFF_ROLES.has(user.role)) {
    throw new ApiError(403, "INVALID_ROLE", "This login is only available for staff users");
  }

  user.lastLoginAt = new Date();
  await user.save();

  const tokens = await issueAuthTokens(user, context);

  return {
    user: buildSafeUser(user),
    ...tokens,
  };
};

const loginCustomerUser = async (payload, context) => {
  const user = await authenticateUser(payload);

  if (!CUSTOMER_ROLES.has(user.role)) {
    throw new ApiError(403, "INVALID_ROLE", "This login is only available for customer users");
  }

  user.lastLoginAt = new Date();
  await user.save();

  const tokens = await issueAuthTokens(user, context);

  return {
    user: buildSafeUser(user),
    ...tokens,
  };
};

const getMe = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, "USER_NOT_FOUND", "User not found");
  }

  return buildSafeUser(user);
};

const logoutUser = async (refreshToken) => {
  if (!refreshToken) {
    return;
  }
  await revokeRefreshToken(refreshToken);
};

const refreshUserToken = async (refreshToken, context) => {
  const rotated = await rotateRefreshToken(refreshToken, context);
  if (!rotated) {
    throw new ApiError(401, "INVALID_REFRESH_TOKEN", "Refresh token is invalid or expired");
  }

  return {
    user: buildSafeUser(rotated.user),
    token: rotated.token,
    refreshToken: rotated.refreshToken,
  };
};

const forgotPassword = async (email) => {
  const user = await User.findOne({ email: normalizeEmail(email), isDeleted: { $ne: true } });
  if (!user) {
    return;
  }

  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

  user.passwordResetTokenHash = tokenHash;
  user.passwordResetExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
  await user.save();

  const frontendUrl = process.env.FRONTEND_URL || process.env.CLIENT_URL || "http://localhost:5173";
  const resetUrl = `${frontendUrl}/reset-password?token=${rawToken}`;
  await sendEmail({
    to: user.email,
    subject: "Reset your Y-Axis password",
    text: `Reset your password using this link: ${resetUrl}`,
    html: `<p>Reset your password using this link: <a href="${resetUrl}">${resetUrl}</a></p>`,
  });
};

const resetPassword = async ({ token, newPassword }) => {
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const user = await User.findOne({
    passwordResetTokenHash: tokenHash,
    passwordResetExpiresAt: { $gt: new Date() },
  }).select("+password");

  if (!user) {
    throw new ApiError(400, "INVALID_RESET_TOKEN", "Reset token is invalid or expired");
  }

  user.password = newPassword;
  user.passwordResetTokenHash = "";
  user.passwordResetExpiresAt = null;
  await user.save();
};

module.exports = {
  signupUser,
  loginStaffUser,
  loginCustomerUser,
  logoutUser,
  refreshUserToken,
  forgotPassword,
  resetPassword,
  getMe,
};
