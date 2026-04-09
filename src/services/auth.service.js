const crypto = require("crypto");
const User = require("../models/User.js");
const { sendEmail } = require("../utils/sendEmail.js");
const ApiError = require("../utils/ApiError.js");
const { issueAuthTokens, revokeRefreshToken, rotateRefreshToken } = require("./token.service.js");

const buildSafeUser = (user) => ({
  id: user._id,
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email,
  role: user.role,
});

const signupUser = async (payload, context) => {
  const exists = await User.findOne({ email: payload.email.toLowerCase() });
  if (exists) {
    throw new ApiError(409, "USER_EXISTS", "Email is already registered");
  }

  const user = await User.create({
    firstName: payload.firstName,
    lastName: payload.lastName,
    email: payload.email.toLowerCase(),
    phone: payload.phone || "",
    password: payload.password,
    role: "user",
  });

  const tokens = await issueAuthTokens(user, context);

  return {
    user: buildSafeUser(user),
    ...tokens,
  };
};

const loginUser = async (payload, context) => {
  const user = await User.findOne({ email: payload.email.toLowerCase(), isActive: true }).select("+password");

  if (!user) {
    throw new ApiError(401, "INVALID_CREDENTIALS", "Invalid email or password");
  }

  const isValid = await user.comparePassword(payload.password);
  if (!isValid) {
    throw new ApiError(401, "INVALID_CREDENTIALS", "Invalid email or password");
  }

  user.lastLoginAt = new Date();
  await user.save();

  const tokens = await issueAuthTokens(user, context);

  return {
    user: buildSafeUser(user),
    ...tokens,
  };
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
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    return;
  }

  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

  user.passwordResetTokenHash = tokenHash;
  user.passwordResetExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
  await user.save();

  const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/reset-password?token=${rawToken}`;
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

module.exports = { signupUser, loginUser, logoutUser, refreshUserToken, forgotPassword, resetPassword };
