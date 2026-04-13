const asyncHandler = require("../utils/asyncHandler.js");
const { sendSuccess } = require("../utils/ApiResponse.js");
const visaPortalService = require("../services/visaPortal.service.js");

const getAdminDashboardSummary = asyncHandler(async (_req, res) => {
  const data = await visaPortalService.getAdminDashboardSummary();
  return sendSuccess(res, 200, data);
});

const listAdminCountries = asyncHandler(async (req, res) => {
  const data = await visaPortalService.listAdminCountries(req.query);
  return sendSuccess(res, 200, data);
});

const getAdminCountryById = asyncHandler(async (req, res) => {
  const data = await visaPortalService.getAdminCountryById(req.params.id);
  return sendSuccess(res, 200, data);
});

const createAdminCountry = asyncHandler(async (req, res) => {
  const data = await visaPortalService.createAdminCountry(req.body, req.user?._id || null);
  return sendSuccess(res, 201, data);
});

const updateAdminCountry = asyncHandler(async (req, res) => {
  const data = await visaPortalService.updateAdminCountry(req.params.id, req.body, req.user?._id || null);
  return sendSuccess(res, 200, data);
});

const updateAdminCountryStatus = asyncHandler(async (req, res) => {
  const data = await visaPortalService.updateAdminCountryStatus(req.params.id, req.body, req.user?._id || null);
  return sendSuccess(res, 200, data);
});

const deleteAdminCountry = asyncHandler(async (req, res) => {
  const data = await visaPortalService.deleteAdminCountry(req.params.id);
  return sendSuccess(res, 200, data);
});

const listAdminVisaCategories = asyncHandler(async (req, res) => {
  const data = await visaPortalService.listAdminVisaCategories(req.query);
  return sendSuccess(res, 200, data);
});

const getAdminVisaCategoryById = asyncHandler(async (req, res) => {
  const data = await visaPortalService.getAdminVisaCategoryById(req.params.id);
  return sendSuccess(res, 200, data);
});

const createAdminVisaCategory = asyncHandler(async (req, res) => {
  const data = await visaPortalService.createAdminVisaCategory(req.body, req.user?._id || null);
  return sendSuccess(res, 201, data);
});

const updateAdminVisaCategory = asyncHandler(async (req, res) => {
  const data = await visaPortalService.updateAdminVisaCategory(req.params.id, req.body, req.user?._id || null);
  return sendSuccess(res, 200, data);
});

const updateAdminVisaCategoryStatus = asyncHandler(async (req, res) => {
  const data = await visaPortalService.updateAdminVisaCategoryStatus(req.params.id, req.body, req.user?._id || null);
  return sendSuccess(res, 200, data);
});

const deleteAdminVisaCategory = asyncHandler(async (req, res) => {
  const data = await visaPortalService.deleteAdminVisaCategory(req.params.id);
  return sendSuccess(res, 200, data);
});

const listAdminCountryVisaTypes = asyncHandler(async (req, res) => {
  const data = await visaPortalService.listAdminCountryVisaTypes(req.query);
  return sendSuccess(res, 200, data);
});

const getAdminCountryVisaTypeById = asyncHandler(async (req, res) => {
  const data = await visaPortalService.getAdminCountryVisaTypeById(req.params.id);
  return sendSuccess(res, 200, data);
});

const createAdminCountryVisaType = asyncHandler(async (req, res) => {
  const data = await visaPortalService.createAdminCountryVisaType(req.body, req.user?._id || null);
  return sendSuccess(res, 201, data);
});

const updateAdminCountryVisaType = asyncHandler(async (req, res) => {
  const data = await visaPortalService.updateAdminCountryVisaType(req.params.id, req.body, req.user?._id || null);
  return sendSuccess(res, 200, data);
});

const updateAdminCountryVisaTypeStatus = asyncHandler(async (req, res) => {
  const data = await visaPortalService.updateAdminCountryVisaTypeStatus(req.params.id, req.body, req.user?._id || null);
  return sendSuccess(res, 200, data);
});

const deleteAdminCountryVisaType = asyncHandler(async (req, res) => {
  const data = await visaPortalService.deleteAdminCountryVisaType(req.params.id);
  return sendSuccess(res, 200, data);
});

const listAdminApplications = asyncHandler(async (req, res) => {
  const data = await visaPortalService.listAdminApplications(req.query);
  return sendSuccess(res, 200, data);
});

const getAdminApplicationById = asyncHandler(async (req, res) => {
  const data = await visaPortalService.getAdminApplicationById(req.params.id);
  return sendSuccess(res, 200, data);
});

const updateAdminApplicationStatus = asyncHandler(async (req, res) => {
  const data = await visaPortalService.updateAdminApplicationStatus(req.params.id, req.body, req.user?._id || null);
  return sendSuccess(res, 200, data);
});

const updateAdminApplicationNotes = asyncHandler(async (req, res) => {
  const data = await visaPortalService.updateAdminApplicationNotes(req.params.id, req.body);
  return sendSuccess(res, 200, data);
});

const deleteAdminApplication = asyncHandler(async (req, res) => {
  const data = await visaPortalService.archiveAdminApplication(req.params.id);
  return sendSuccess(res, 200, data);
});

const listAdminEnquiries = asyncHandler(async (req, res) => {
  const data = await visaPortalService.listAdminEnquiries(req.query);
  return sendSuccess(res, 200, data);
});

const getAdminEnquiryById = asyncHandler(async (req, res) => {
  const data = await visaPortalService.getAdminEnquiryById(req.params.id);
  return sendSuccess(res, 200, data);
});

const updateAdminEnquiryStatus = asyncHandler(async (req, res) => {
  const data = await visaPortalService.updateAdminEnquiryStatus(req.params.id, req.body);
  return sendSuccess(res, 200, data);
});

const updateAdminEnquiryNotes = asyncHandler(async (req, res) => {
  const data = await visaPortalService.updateAdminEnquiryNotes(req.params.id, req.body);
  return sendSuccess(res, 200, data);
});

const deleteAdminEnquiry = asyncHandler(async (req, res) => {
  const data = await visaPortalService.deleteAdminEnquiry(req.params.id);
  return sendSuccess(res, 200, data);
});

const listAdminTickets = asyncHandler(async (req, res) => {
  const data = await visaPortalService.listAdminTickets(req.query);
  return sendSuccess(res, 200, data);
});

const getAdminTicketById = asyncHandler(async (req, res) => {
  const data = await visaPortalService.getAdminTicketById(req.params.id);
  return sendSuccess(res, 200, data);
});

const updateAdminTicketStatus = asyncHandler(async (req, res) => {
  const data = await visaPortalService.updateAdminTicketStatus(req.params.id, req.body);
  return sendSuccess(res, 200, data);
});

const createAdminTicketReply = asyncHandler(async (req, res) => {
  const data = await visaPortalService.replyToAdminTicket(req.params.id, req.body, req.user?._id || null, req.files || []);
  return sendSuccess(res, 201, data);
});

const listAdminUsers = asyncHandler(async (req, res) => {
  const data = await visaPortalService.listAdminUsers(req.query);
  return sendSuccess(res, 200, data);
});

const getAdminUserById = asyncHandler(async (req, res) => {
  const data = await visaPortalService.getAdminUserById(req.params.id);
  return sendSuccess(res, 200, data);
});

const updateAdminUserStatus = asyncHandler(async (req, res) => {
  const data = await visaPortalService.updateAdminUserStatus(req.params.id, req.body);
  return sendSuccess(res, 200, data);
});

const deleteAdminUser = asyncHandler(async (req, res) => {
  const data = await visaPortalService.deleteAdminUser(req.params.id, req.query);
  return sendSuccess(res, 200, data);
});

module.exports = {
  getAdminDashboardSummary,
  listAdminCountries,
  getAdminCountryById,
  createAdminCountry,
  updateAdminCountry,
  updateAdminCountryStatus,
  deleteAdminCountry,
  listAdminVisaCategories,
  getAdminVisaCategoryById,
  createAdminVisaCategory,
  updateAdminVisaCategory,
  updateAdminVisaCategoryStatus,
  deleteAdminVisaCategory,
  listAdminCountryVisaTypes,
  getAdminCountryVisaTypeById,
  createAdminCountryVisaType,
  updateAdminCountryVisaType,
  updateAdminCountryVisaTypeStatus,
  deleteAdminCountryVisaType,
  listAdminApplications,
  getAdminApplicationById,
  updateAdminApplicationStatus,
  updateAdminApplicationNotes,
  deleteAdminApplication,
  listAdminEnquiries,
  getAdminEnquiryById,
  updateAdminEnquiryStatus,
  updateAdminEnquiryNotes,
  deleteAdminEnquiry,
  listAdminTickets,
  getAdminTicketById,
  updateAdminTicketStatus,
  createAdminTicketReply,
  listAdminUsers,
  getAdminUserById,
  updateAdminUserStatus,
  deleteAdminUser,
};
