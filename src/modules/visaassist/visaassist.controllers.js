const asyncHandler = require("../../utils/asyncHandler.js");
const { sendSuccess } = require("../../utils/ApiResponse.js");
const services = require("./visaassist.services.js");
const { forgotPassword, resetPassword } = require("../../services/auth.service.js");
const { generateInvoicePdfBuffer } = require("../../utils/invoicePdf.js");

const requestContext = (req) => ({
  ipAddress: req.ip,
  userAgent: req.headers["user-agent"] || "",
});

const staffLogin = asyncHandler(async (req, res) => {
  const data = await services.staffLogin(req.body, requestContext(req));
  return sendSuccess(res, 200, data);
});

const refreshStaffToken = asyncHandler(async (req, res) => {
  const data = await services.refreshStaffToken(req.body.refreshToken, requestContext(req));
  return sendSuccess(res, 200, data);
});

const staffForgotPassword = asyncHandler(async (req, res) => {
  await forgotPassword(req.body.email);
  return sendSuccess(res, 200, {
    message: "If this email is registered, reset instructions were sent.",
  });
});

const staffResetPassword = asyncHandler(async (req, res) => {
  await resetPassword({ token: req.body.token, newPassword: req.body.newPassword });
  return sendSuccess(res, 200, { message: "Password reset successful" });
});

const getMyProfile = asyncHandler(async (req, res) => {
  const data = await services.getMyProfile(req.user._id);
  return sendSuccess(res, 200, data);
});

const updateMyProfile = asyncHandler(async (req, res) => {
  const data = await services.updateMyProfile(req.user._id, req.body);
  return sendSuccess(res, 200, data);
});

const createLead = asyncHandler(async (req, res) => {
  const data = await services.createLead(req.body, req.user?._id || null);
  return sendSuccess(res, 201, data);
});

const listLeads = asyncHandler(async (req, res) => {
  const data = await services.listLeads(req.query);
  return sendSuccess(res, 200, data);
});

const getLeadById = asyncHandler(async (req, res) => {
  const data = await services.getLeadById(req.params.leadId);
  return sendSuccess(res, 200, data);
});

const listStaff = asyncHandler(async (req, res) => {
  const data = await services.listStaff(req.query);
  return sendSuccess(res, 200, data);
});

const assignLead = asyncHandler(async (req, res) => {
  const data = await services.assignLead(req.params.leadId, req.body, req.user._id);
  return sendSuccess(res, 200, data);
});

const addLeadNote = asyncHandler(async (req, res) => {
  const data = await services.addLeadNote(req.params.leadId, req.body, req.user._id);
  return sendSuccess(res, 200, data);
});

const updateLeadStage = asyncHandler(async (req, res) => {
  const data = await services.updateLeadStage(req.params.leadId, req.body, req.user._id);
  return sendSuccess(res, 200, data);
});

const createCountry = asyncHandler(async (req, res) => {
  const data = await services.createCountry(req.body);
  return sendSuccess(res, 201, data);
});

const listCountries = asyncHandler(async (req, res) => {
  const data = await services.listCountries(req.query);
  return sendSuccess(res, 200, data);
});

const createVisaCategory = asyncHandler(async (req, res) => {
  const data = await services.createVisaCategory(req.body);
  return sendSuccess(res, 201, data);
});

const listVisaCategories = asyncHandler(async (req, res) => {
  const data = await services.listVisaCategories(req.query);
  return sendSuccess(res, 200, data);
});

const createServicePackage = asyncHandler(async (req, res) => {
  const data = await services.createServicePackage(req.body);
  return sendSuccess(res, 201, data);
});

const listServicePackages = asyncHandler(async (req, res) => {
  const data = await services.listServicePackages(req.query);
  return sendSuccess(res, 200, data);
});

const updateServiceAvailability = asyncHandler(async (req, res) => {
  const data = await services.updateServiceAvailability(req.params.packageId, req.body.isActive);
  return sendSuccess(res, 200, data);
});

const createChecklistTemplate = asyncHandler(async (req, res) => {
  const data = await services.createChecklistTemplate(req.body, req.user._id);
  return sendSuccess(res, 201, data);
});

const listChecklistTemplates = asyncHandler(async (req, res) => {
  const data = await services.listChecklistTemplates(req.query);
  return sendSuccess(res, 200, data);
});

const generateCaseChecklist = asyncHandler(async (req, res) => {
  const data = await services.generateCaseChecklist(req.params.caseId, req.body, req.user._id);
  return sendSuccess(res, 200, data);
});

const updateCaseChecklistItem = asyncHandler(async (req, res) => {
  const data = await services.updateCaseChecklistItem(
    req.params.caseId,
    req.params.checklistItemId,
    req.body,
    req.user._id
  );
  return sendSuccess(res, 200, data);
});

const createApplicant = asyncHandler(async (req, res) => {
  const data = await services.createApplicant(req.body, req.user._id);
  return sendSuccess(res, 201, data);
});

const listApplicants = asyncHandler(async (req, res) => {
  const data = await services.listApplicants(req.query);
  return sendSuccess(res, 200, data);
});

const getApplicantById = asyncHandler(async (req, res) => {
  const data = await services.getApplicantById(req.params.applicantId);
  return sendSuccess(res, 200, data);
});

const createCase = asyncHandler(async (req, res) => {
  const data = await services.createCase(req.body, req.user._id);
  return sendSuccess(res, 201, data);
});

const listCases = asyncHandler(async (req, res) => {
  const data = await services.listCases(req.query);
  return sendSuccess(res, 200, data);
});

const getCaseById = asyncHandler(async (req, res) => {
  const data = await services.getCaseById(req.params.caseId);
  return sendSuccess(res, 200, data);
});

const updateCaseStatus = asyncHandler(async (req, res) => {
  const data = await services.updateCaseStatus(req.params.caseId, req.body, req.user._id);
  return sendSuccess(res, 200, data);
});

const addCaseNote = asyncHandler(async (req, res) => {
  const data = await services.addCaseNote(req.params.caseId, req.body, req.user._id);
  return sendSuccess(res, 200, data);
});

const assignCaseStaff = asyncHandler(async (req, res) => {
  const data = await services.assignCaseStaff(req.params.caseId, req.body, req.user._id);
  return sendSuccess(res, 200, data);
});

const uploadCaseDocument = asyncHandler(async (req, res) => {
  const data = await services.uploadCaseDocument({ ...req.body, file: req.file }, req.user._id);
  return sendSuccess(res, 201, data);
});

const listCaseDocuments = asyncHandler(async (req, res) => {
  const data = await services.listCaseDocuments(req.query);
  return sendSuccess(res, 200, data);
});

const archiveCaseDocument = asyncHandler(async (req, res) => {
  const data = await services.archiveCaseDocument(req.params.documentId, req.user._id);
  return sendSuccess(res, 200, data);
});

const getCaseDocumentAccessUrl = asyncHandler(async (req, res) => {
  const data = await services.getCaseDocumentAccessUrl(req.params.documentId, req.user, req.query);
  return sendSuccess(res, 200, data);
});

const createAppointment = asyncHandler(async (req, res) => {
  const data = await services.createAppointment(req.body, req.user._id);
  return sendSuccess(res, 201, data);
});

const rescheduleAppointment = asyncHandler(async (req, res) => {
  const data = await services.rescheduleAppointment(req.params.appointmentId, req.body, req.user._id);
  return sendSuccess(res, 200, data);
});

const listUpcomingAppointments = asyncHandler(async (req, res) => {
  const data = await services.listUpcomingAppointments(req.query);
  return sendSuccess(res, 200, data);
});

const createInvoice = asyncHandler(async (req, res) => {
  const data = await services.createInvoice(req.body, req.user._id);
  return sendSuccess(res, 201, data);
});

const listInvoices = asyncHandler(async (req, res) => {
  const data = await services.listInvoices(req.query);
  return sendSuccess(res, 200, data);
});

const recordInvoicePayment = asyncHandler(async (req, res) => {
  const data = await services.recordInvoicePayment(req.params.invoiceId, req.body, req.user._id);
  return sendSuccess(res, 200, data);
});

const downloadInvoice = asyncHandler(async (req, res) => {
  const data = await services.getInvoiceDownloadData(req.params.invoiceId);
  return sendSuccess(res, 200, data);
});

const downloadInvoicePdf = asyncHandler(async (req, res) => {
  const data = await services.getInvoiceDownloadData(req.params.invoiceId);
  const pdfBuffer = await generateInvoicePdfBuffer(data);

  const safeInvoiceNo = String(data.invoice.invoiceNumber || "invoice").replace(/[^a-zA-Z0-9-_]/g, "_");

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${safeInvoiceNo}.pdf"`);

  return res.status(200).send(pdfBuffer);
});

const createCommunicationTemplate = asyncHandler(async (req, res) => {
  const data = await services.createCommunicationTemplate(req.body, req.user._id);
  return sendSuccess(res, 201, data);
});

const listCommunicationTemplates = asyncHandler(async (req, res) => {
  const data = await services.listCommunicationTemplates(req.query);
  return sendSuccess(res, 200, data);
});

const updateCommunicationTemplate = asyncHandler(async (req, res) => {
  const data = await services.updateCommunicationTemplate(req.params.templateId, req.body);
  return sendSuccess(res, 200, data);
});

const createCountryProcessUpdate = asyncHandler(async (req, res) => {
  const data = await services.createCountryProcessUpdate(req.body, req.user._id);
  return sendSuccess(res, 201, data);
});

const listCountryProcessUpdates = asyncHandler(async (req, res) => {
  const data = await services.listCountryProcessUpdates(req.query);
  return sendSuccess(res, 200, data);
});

const getDashboardSummary = asyncHandler(async (_req, res) => {
  const data = await services.getDashboardSummary();
  return sendSuccess(res, 200, data);
});

const recordConsent = asyncHandler(async (req, res) => {
  const data = await services.recordConsent(req.body, requestContext(req), req.user?._id || null);
  return sendSuccess(res, 201, data);
});

const listAuditTrail = asyncHandler(async (req, res) => {
  const data = await services.listAuditTrail(req.query);
  return sendSuccess(res, 200, data);
});

const sendTemplatePreview = asyncHandler(async (req, res) => {
  const renderedPreview = {
    channel: req.body.channel,
    to: req.body.to,
    subject: req.body.subject || "",
    body: req.body.body,
    status: "queued_placeholder",
    note: "Integrate with Nodemailer or WhatsApp provider to send live communication.",
  };

  return sendSuccess(res, 200, renderedPreview);
});

module.exports = {
  staffLogin,
  refreshStaffToken,
  staffForgotPassword,
  staffResetPassword,
  getMyProfile,
  updateMyProfile,
  createLead,
  listLeads,
  getLeadById,
  listStaff,
  assignLead,
  addLeadNote,
  updateLeadStage,
  createCountry,
  listCountries,
  createVisaCategory,
  listVisaCategories,
  createServicePackage,
  listServicePackages,
  updateServiceAvailability,
  createChecklistTemplate,
  listChecklistTemplates,
  generateCaseChecklist,
  updateCaseChecklistItem,
  createApplicant,
  listApplicants,
  getApplicantById,
  createCase,
  listCases,
  getCaseById,
  updateCaseStatus,
  addCaseNote,
  assignCaseStaff,
  uploadCaseDocument,
  listCaseDocuments,
  archiveCaseDocument,
  getCaseDocumentAccessUrl,
  createAppointment,
  rescheduleAppointment,
  listUpcomingAppointments,
  createInvoice,
  listInvoices,
  recordInvoicePayment,
  downloadInvoice,
  downloadInvoicePdf,
  createCommunicationTemplate,
  listCommunicationTemplates,
  updateCommunicationTemplate,
  createCountryProcessUpdate,
  listCountryProcessUpdates,
  getDashboardSummary,
  recordConsent,
  listAuditTrail,
  sendTemplatePreview,
};
