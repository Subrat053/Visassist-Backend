const User = require("../models/User.js");
const asyncHandler = require("../utils/asyncHandler.js");
const { sendSuccess } = require("../utils/ApiResponse.js");
const visaPortalService = require("../services/visaPortal.service.js");

const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("firstName lastName fullName email phone role country profile avatarUrl isActive");
  return sendSuccess(res, 200, user);
});

const updateUserProfile = asyncHandler(async (req, res) => {
  const updates = {};

  const allowed = ["firstName", "lastName", "phone", "country", "avatarUrl", "profile"];
  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(req.body, key)) {
      updates[key] = req.body[key];
    }
  }

  const user = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true,
  }).select("firstName lastName fullName email phone role country profile avatarUrl isActive");

  return sendSuccess(res, 200, user);
});

const listUserApplications = asyncHandler(async (req, res) => {
  const data = await visaPortalService.listUserApplications(req.user._id, req.query);
  return sendSuccess(res, 200, data);
});

const getUserApplicationById = asyncHandler(async (req, res) => {
  const data = await visaPortalService.getUserApplicationById(req.user._id, req.params.id);
  return sendSuccess(res, 200, data);
});

const createUserApplication = asyncHandler(async (req, res) => {
  const data = await visaPortalService.createUserApplication(req.user._id, req.body, req.files || []);
  return sendSuccess(res, 201, data);
});

const listUserTickets = asyncHandler(async (req, res) => {
  const data = await visaPortalService.listUserTickets(req.user._id, req.query);
  return sendSuccess(res, 200, data);
});

const createUserTicket = asyncHandler(async (req, res) => {
  const data = await visaPortalService.createUserTicket(req.user._id, req.body, req.files || []);
  return sendSuccess(res, 201, data);
});

const getUserTicketById = asyncHandler(async (req, res) => {
  const data = await visaPortalService.getUserTicketById(req.user._id, req.params.id);
  return sendSuccess(res, 200, data);
});

const createUserTicketReply = asyncHandler(async (req, res) => {
  const data = await visaPortalService.replyToUserTicket(req.user._id, req.params.id, req.body, req.files || []);
  return sendSuccess(res, 201, data);
});

const getUserDashboardSummary = asyncHandler(async (req, res) => {
  const data = await visaPortalService.getUserDashboardSummary(req.user._id);
  return sendSuccess(res, 200, data);
});

module.exports = {
  getUserProfile,
  updateUserProfile,
  listUserApplications,
  getUserApplicationById,
  createUserApplication,
  listUserTickets,
  createUserTicket,
  getUserTicketById,
  createUserTicketReply,
  getUserDashboardSummary,
};
