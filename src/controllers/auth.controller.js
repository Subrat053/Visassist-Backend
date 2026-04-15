const asyncHandler = require("../utils/asyncHandler.js");
const { sendSuccess } = require("../utils/ApiResponse.js");
const {
  forgotPassword,
  getMe,
  loginCustomerUser,
  loginStaffUser,
  logoutUser,
  refreshUserToken,
  resetPassword,
  signupUser,
} = require("../services/auth.service.js");

const requestContext = (req) => ({
  ipAddress: req.ip,
  userAgent: req.headers["user-agent"] || "",
});

const signup = asyncHandler(async (req, res) => {
  const data = await signupUser(req.body, requestContext(req));
  return sendSuccess(res, 201, data);
});

const login = asyncHandler(async (req, res) => {
  const data = await loginStaffUser(req.body, requestContext(req));
  return sendSuccess(res, 200, data);
});

const customerLogin = asyncHandler(async (req, res) => {
  const data = await loginCustomerUser(req.body, requestContext(req));
  return sendSuccess(res, 200, data);
});

const logout = asyncHandler(async (req, res) => {
  const refreshToken = req.body.refreshToken || req.cookies?.refreshToken;
  await logoutUser(refreshToken);
  return sendSuccess(res, 200, { message: "Logged out" });
});

const refreshToken = asyncHandler(async (req, res) => {
  const data = await refreshUserToken(req.body.refreshToken, requestContext(req));
  return sendSuccess(res, 200, data);
});

const me = asyncHandler(async (req, res) => {
  const data = await getMe(req.user._id);
  return sendSuccess(res, 200, data);
});

const forgotPasswordController = asyncHandler(async (req, res) => {
  await forgotPassword(req.body.email);
  return sendSuccess(res, 200, { message: "If this email is registered, reset instructions were sent." });
});

const resetPasswordController = asyncHandler(async (req, res) => {
  await resetPassword({ token: req.body.token, newPassword: req.body.newPassword });
  return sendSuccess(res, 200, { message: "Password reset successful" });
});

module.exports = {
  signup,
  login,
  customerLogin,
  logout,
  refreshToken,
  me,
  forgotPasswordController,
  resetPasswordController,
};
