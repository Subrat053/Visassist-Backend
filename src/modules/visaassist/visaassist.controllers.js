const asyncHandler = require("../../utils/asyncHandler.js");
const { sendSuccess } = require("../../utils/ApiResponse.js");
const services = require("./visaassist.services.js");
const { sendAdminFormNotification } = require("../../services/email");
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

  const isPublicLeadCapture = req.originalUrl.includes("/public/leads");
  if (isPublicLeadCapture) {
    try {
      await sendAdminFormNotification({
        formType: "public_lead_capture",
        data: {
          ...req.body,
          fullName: data.fullName,
          email: data.email,
          phone: data.phone,
          destinationCountry: data.destinationCountry,
          visaCategory: data.visaCategory,
          source: data.source,
          priorRefusal: data.priorRefusal,
          notes: data.notes,
          stage: data.stage,
        },
        record: data,
        meta: {
          sourceRoute: "/api/v1/visaassist/public/leads",
          sourcePage: req.headers["x-page-path"] || "",
          replyTo: data.email,
        },
      });
    } catch (mailError) {
      console.error("[FORM_MAIL] Failed to send public lead notification", {
        error: mailError.message,
        recordId: String(data._id),
      });
    }
  }

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

const extractRequestMetadata = (req) => ({
  ipAddress: req.ip,
  userAgent: req.headers["user-agent"] || "",
  referrer: req.headers.referer || "",
  pagePath: req.headers["x-page-path"] || "",
  utmSource: req.headers["x-utm-source"] || "",
  utmMedium: req.headers["x-utm-medium"] || "",
  utmCampaign: req.headers["x-utm-campaign"] || "",
});

const publicEligibilityCheck = asyncHandler(async (req, res) => {
  const data = await services.createPublicEligibility(req.body, extractRequestMetadata(req));
  return sendSuccess(res, 201, data, data.message);
});

const publicContact = asyncHandler(async (req, res) => {
  const data = await services.createPublicContact(req.body, extractRequestMetadata(req));
  return sendSuccess(res, 201, data, data.message);
});

const publicApplication = asyncHandler(async (req, res) => {
  const data = await services.createPublicApplication(req.body, extractRequestMetadata(req), req.user?._id || null);
  return sendSuccess(res, 201, data, data.message);
});

const publicCountryUpdates = asyncHandler(async (req, res) => {
  const data = await services.listPublicCountryUpdates(req.query);
  return sendSuccess(res, 200, data);
});

const updateLead = asyncHandler(async (req, res) => {
  const data = await services.updateLead(req.params.leadId, req.body, req.user._id);
  return sendSuccess(res, 200, data, "Lead updated successfully");
});

const convertLeadToApplicant = asyncHandler(async (req, res) => {
  const data = await services.convertLeadToApplicant(req.params.leadId, req.body, req.user._id);
  return sendSuccess(res, 200, data, "Lead converted to applicant successfully");
});

const convertLeadToCase = asyncHandler(async (req, res) => {
  const data = await services.convertLeadToCase(req.params.leadId, req.body, req.user._id);
  return sendSuccess(res, 200, data, "Lead converted to case successfully");
});

const updateApplicant = asyncHandler(async (req, res) => {
  const data = await services.updateApplicant(req.params.applicantId, req.body);
  return sendSuccess(res, 200, data, "Applicant updated successfully");
});

const uploadApplicantDocument = asyncHandler(async (req, res) => {
  const data = await services.uploadApplicantDocument(req.params.applicantId, { ...req.body, file: req.file }, req.user._id);
  return sendSuccess(res, 201, data, "Applicant document uploaded successfully");
});

const listApplicantCases = asyncHandler(async (req, res) => {
  const data = await services.listApplicantCases(req.params.applicantId, req.query);
  return sendSuccess(res, 200, data);
});

const updateCase = asyncHandler(async (req, res) => {
  const data = await services.updateCase(req.params.caseId, req.body, req.user._id);
  return sendSuccess(res, 200, data, "Case updated successfully");
});

const addCaseTimeline = asyncHandler(async (req, res) => {
  const data = await services.addCaseTimeline(req.params.caseId, req.body, req.user._id);
  return sendSuccess(res, 200, data, "Case timeline updated successfully");
});

const linkCaseChecklist = asyncHandler(async (req, res) => {
  const data = await services.linkCaseChecklist(req.params.caseId, req.body.checklistId);
  return sendSuccess(res, 200, data, "Checklist linked successfully");
});

const linkCaseService = asyncHandler(async (req, res) => {
  const data = await services.linkCaseService(req.params.caseId, req.body.serviceId);
  return sendSuccess(res, 200, data, "Service linked successfully");
});

const createStaff = asyncHandler(async (req, res) => {
  const data = await services.createStaff(req.body, req.user._id);
  return sendSuccess(res, 201, data, "Staff created successfully");
});

const updateStaff = asyncHandler(async (req, res) => {
  const data = await services.updateStaff(req.params.staffId, req.body, req.user._id);
  return sendSuccess(res, 200, data, "Staff updated successfully");
});

const updateStaffStatus = asyncHandler(async (req, res) => {
  const data = await services.updateStaffStatus(req.params.staffId, req.body.isActive, req.user._id);
  return sendSuccess(res, 200, data, "Staff status updated successfully");
});

const getDocumentById = asyncHandler(async (req, res) => {
  const data = await services.getDocumentById(req.params.documentId);
  return sendSuccess(res, 200, data);
});

const reviewDocument = asyncHandler(async (req, res) => {
  const data = await services.reviewDocument(req.params.documentId, req.body, req.user._id);
  return sendSuccess(res, 200, data, "Document review updated successfully");
});

const updateDocument = asyncHandler(async (req, res) => {
  const data = await services.updateDocument(req.params.documentId, req.body);
  return sendSuccess(res, 200, data, "Document updated successfully");
});

const deleteDocument = asyncHandler(async (req, res) => {
  const data = await services.deleteDocument(req.params.documentId, req.user._id);
  return sendSuccess(res, 200, data, "Document deleted successfully");
});

const listAppointments = asyncHandler(async (req, res) => {
  const data = await services.listAppointments(req.query);
  return sendSuccess(res, 200, data);
});

const getAppointmentById = asyncHandler(async (req, res) => {
  const data = await services.getAppointmentById(req.params.appointmentId);
  return sendSuccess(res, 200, data);
});

const updateAppointment = asyncHandler(async (req, res) => {
  const data = await services.updateAppointment(req.params.appointmentId, req.body);
  return sendSuccess(res, 200, data, "Appointment updated successfully");
});

const updateAppointmentStatus = asyncHandler(async (req, res) => {
  const data = await services.updateAppointmentStatus(req.params.appointmentId, req.body.status);
  return sendSuccess(res, 200, data, "Appointment status updated successfully");
});

const deleteAppointment = asyncHandler(async (req, res) => {
  const data = await services.deleteAppointment(req.params.appointmentId);
  return sendSuccess(res, 200, data, "Appointment deleted successfully");
});

const listPayments = asyncHandler(async (req, res) => {
  const data = await services.listPayments(req.query);
  return sendSuccess(res, 200, data);
});

const getPaymentById = asyncHandler(async (req, res) => {
  const data = await services.getPaymentById(req.params.paymentId);
  return sendSuccess(res, 200, data);
});

const createPaymentIntent = asyncHandler(async (req, res) => {
  const data = await services.createPaymentIntent(req.body, req.user._id);
  return sendSuccess(res, 201, data, "Payment intent created successfully");
});

const createManualPayment = asyncHandler(async (req, res) => {
  const data = await services.createManualPayment(req.body, req.user._id);
  return sendSuccess(res, 201, data, "Manual payment created successfully");
});

const stripeWebhook = asyncHandler(async (req, res) => {
  const data = await services.handleStripeWebhook(req.body);
  return sendSuccess(res, 200, data, "Webhook processed");
});

const updatePaymentStatus = asyncHandler(async (req, res) => {
  const data = await services.updatePaymentStatus(req.params.paymentId, req.body.status);
  return sendSuccess(res, 200, data, "Payment status updated successfully");
});

const getPaymentInvoice = asyncHandler(async (req, res) => {
  const data = await services.getPaymentInvoice(req.params.paymentId);
  return sendSuccess(res, 200, data);
});

const createService = asyncHandler(async (req, res) => {
  const data = await services.createService(req.body);
  return sendSuccess(res, 201, data, "Service created successfully");
});

const listServices = asyncHandler(async (req, res) => {
  const data = await services.listServices(req.query);
  return sendSuccess(res, 200, data);
});

const getServiceById = asyncHandler(async (req, res) => {
  const data = await services.getServiceById(req.params.serviceId);
  return sendSuccess(res, 200, data);
});

const updateService = asyncHandler(async (req, res) => {
  const data = await services.updateService(req.params.serviceId, req.body);
  return sendSuccess(res, 200, data, "Service updated successfully");
});

const deleteService = asyncHandler(async (req, res) => {
  const data = await services.deleteService(req.params.serviceId);
  return sendSuccess(res, 200, data, "Service deleted successfully");
});

const createChecklist = asyncHandler(async (req, res) => {
  const data = await services.createChecklist(req.body, req.user._id);
  return sendSuccess(res, 201, data, "Checklist created successfully");
});

const listChecklists = asyncHandler(async (req, res) => {
  const data = await services.listChecklists(req.query);
  return sendSuccess(res, 200, data);
});

const getChecklistById = asyncHandler(async (req, res) => {
  const data = await services.getChecklistById(req.params.checklistId);
  return sendSuccess(res, 200, data);
});

const updateChecklist = asyncHandler(async (req, res) => {
  const data = await services.updateChecklist(req.params.checklistId, req.body);
  return sendSuccess(res, 200, data, "Checklist updated successfully");
});

const deleteChecklist = asyncHandler(async (req, res) => {
  const data = await services.deleteChecklist(req.params.checklistId);
  return sendSuccess(res, 200, data, "Checklist deleted successfully");
});

const createTemplate = asyncHandler(async (req, res) => {
  const data = await services.createTemplate(req.body, req.user._id);
  return sendSuccess(res, 201, data, "Template created successfully");
});

const listTemplates = asyncHandler(async (req, res) => {
  const data = await services.listTemplates(req.query);
  return sendSuccess(res, 200, data);
});

const getTemplateById = asyncHandler(async (req, res) => {
  const data = await services.getTemplateById(req.params.templateId);
  return sendSuccess(res, 200, data);
});

const updateTemplateV2 = asyncHandler(async (req, res) => {
  const data = await services.updateTemplateV2(req.params.templateId, req.body);
  return sendSuccess(res, 200, data, "Template updated successfully");
});

const deleteTemplate = asyncHandler(async (req, res) => {
  const data = await services.deleteTemplate(req.params.templateId);
  return sendSuccess(res, 200, data, "Template deleted successfully");
});

const previewTemplate = asyncHandler(async (req, res) => {
  const data = await services.previewTemplate(req.params.templateId, req.body.variables || {});
  return sendSuccess(res, 200, data);
});

const createCountryUpdate = asyncHandler(async (req, res) => {
  const data = await services.createCountryUpdate(req.body, req.user._id);
  return sendSuccess(res, 201, data, "Country update created successfully");
});

const listCountryUpdates = asyncHandler(async (req, res) => {
  const data = await services.listCountryUpdates(req.query);
  return sendSuccess(res, 200, data);
});

const getCountryUpdateById = asyncHandler(async (req, res) => {
  const data = await services.getCountryUpdateById(req.params.id);
  return sendSuccess(res, 200, data);
});

const updateCountryUpdate = asyncHandler(async (req, res) => {
  const data = await services.updateCountryUpdate(req.params.id, req.body);
  return sendSuccess(res, 200, data, "Country update updated successfully");
});

const deleteCountryUpdate = asyncHandler(async (req, res) => {
  const data = await services.deleteCountryUpdate(req.params.id);
  return sendSuccess(res, 200, data, "Country update deleted successfully");
});

const getRevenueReport = asyncHandler(async (_req, res) => {
  const data = await services.getRevenueReport();
  return sendSuccess(res, 200, data);
});

const getConversionReport = asyncHandler(async (_req, res) => {
  const data = await services.getConversionReport();
  return sendSuccess(res, 200, data);
});

const getStaffPerformanceReport = asyncHandler(async (_req, res) => {
  const data = await services.getStaffPerformanceReport();
  return sendSuccess(res, 200, data);
});

const getApplicationsReport = asyncHandler(async (_req, res) => {
  const data = await services.getApplicationsReport();
  return sendSuccess(res, 200, data);
});

const getExportReport = asyncHandler(async (req, res) => {
  const data = await services.getExportReport(req.query);
  return sendSuccess(res, 200, data);
});

const getSettings = asyncHandler(async (req, res) => {
  const data = await services.listSettings(req.query);
  return sendSuccess(res, 200, data);
});

const patchSettings = asyncHandler(async (req, res) => {
  const data = await services.patchSettings(req.body);
  return sendSuccess(res, 200, data, "Settings updated successfully");
});

const getComplianceLogs = asyncHandler(async (req, res) => {
  const data = await services.listAuditTrail(req.query);
  return sendSuccess(res, 200, data);
});

const getComplianceSummary = asyncHandler(async (_req, res) => {
  const data = await services.getComplianceSummary();
  return sendSuccess(res, 200, data);
});

const getUserProfile = asyncHandler(async (req, res) => {
  const data = await services.getUserProfile(req.user._id);
  return sendSuccess(res, 200, data);
});

const updateUserProfile = asyncHandler(async (req, res) => {
  const data = await services.updateUserProfile(req.user._id, req.body);
  return sendSuccess(res, 200, data, "Profile updated successfully");
});

const listUserApplications = asyncHandler(async (req, res) => {
  const data = await services.listUserApplications(req.user._id, req.query);
  return sendSuccess(res, 200, data);
});

const getUserApplication = asyncHandler(async (req, res) => {
  const data = await services.getUserApplication(req.user._id, req.params.id);
  return sendSuccess(res, 200, data);
});

const listUserDocuments = asyncHandler(async (req, res) => {
  const data = await services.listUserDocuments(req.user._id, req.query);
  return sendSuccess(res, 200, data);
});

const uploadUserDocument = asyncHandler(async (req, res) => {
  const data = await services.uploadUserDocument(req.user._id, { ...req.body, file: req.file });
  return sendSuccess(res, 201, data, "Document uploaded successfully");
});

const listUserPayments = asyncHandler(async (req, res) => {
  const data = await services.listUserPayments(req.user._id, req.query);
  return sendSuccess(res, 200, data);
});

const listUserAppointments = asyncHandler(async (req, res) => {
  const data = await services.listUserAppointments(req.user._id, req.query);
  return sendSuccess(res, 200, data);
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
  publicEligibilityCheck,
  publicContact,
  publicApplication,
  publicCountryUpdates,
  updateLead,
  convertLeadToApplicant,
  convertLeadToCase,
  updateApplicant,
  uploadApplicantDocument,
  listApplicantCases,
  updateCase,
  addCaseTimeline,
  linkCaseChecklist,
  linkCaseService,
  createStaff,
  updateStaff,
  updateStaffStatus,
  getDocumentById,
  reviewDocument,
  updateDocument,
  deleteDocument,
  listAppointments,
  getAppointmentById,
  updateAppointment,
  updateAppointmentStatus,
  deleteAppointment,
  listPayments,
  getPaymentById,
  createPaymentIntent,
  createManualPayment,
  stripeWebhook,
  updatePaymentStatus,
  getPaymentInvoice,
  createService,
  listServices,
  getServiceById,
  updateService,
  deleteService,
  createChecklist,
  listChecklists,
  getChecklistById,
  updateChecklist,
  deleteChecklist,
  createTemplate,
  listTemplates,
  getTemplateById,
  updateTemplateV2,
  deleteTemplate,
  previewTemplate,
  createCountryUpdate,
  listCountryUpdates,
  getCountryUpdateById,
  updateCountryUpdate,
  deleteCountryUpdate,
  getRevenueReport,
  getConversionReport,
  getStaffPerformanceReport,
  getApplicationsReport,
  getExportReport,
  getSettings,
  patchSettings,
  getComplianceLogs,
  getComplianceSummary,
  getUserProfile,
  updateUserProfile,
  listUserApplications,
  getUserApplication,
  listUserDocuments,
  uploadUserDocument,
  listUserPayments,
  listUserAppointments,
};
