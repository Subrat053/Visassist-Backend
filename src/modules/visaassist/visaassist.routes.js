const { Router } = require("express");

const validate = require("../../middlewares/validate.middleware.js");
const upload = require("../../middlewares/upload.middleware.js");
const { optionalAuth, requireAuth } = require("../../middlewares/auth.middleware.js");
const { requireRoles } = require("../../middlewares/role.middleware.js");
const { authLimiter, createRateLimiter } = require("../../middlewares/rateLimit.middleware.js");

const controllers = require("./visaassist.controllers.js");
const validators = require("./visaassist.validators.js");
const { ROLES } = require("../../utils/visaassist.constants.js");
const openApiSpec = require("../../config/openapi.visaassist.js");

const router = Router();
const staffOnly = requireRoles(...ROLES);

const crmLimiter = createRateLimiter(15 * 60 * 1000, 120);

router.post("/auth/staff-login", authLimiter, validate(validators.staffLoginSchema), controllers.staffLogin);
router.post(
  "/auth/refresh-token",
  authLimiter,
  validate(validators.refreshTokenSchema),
  controllers.refreshStaffToken
);
router.post(
  "/auth/forgot-password",
  authLimiter,
  validate(validators.staffForgotPasswordSchema),
  controllers.staffForgotPassword
);
router.post(
  "/auth/reset-password",
  authLimiter,
  validate(validators.staffResetPasswordSchema),
  controllers.staffResetPassword
);

router.post("/public/leads", crmLimiter, validate(validators.createLeadSchema), controllers.createLead);
router.post("/public/eligibility-check", crmLimiter, validate(validators.publicEligibilitySchema), controllers.publicEligibilityCheck);
router.post("/public/contact", crmLimiter, validate(validators.publicContactSchema), controllers.publicContact);
router.post(
  "/public/applications",
  crmLimiter,
  optionalAuth,
  validate(validators.publicApplicationSchema),
  controllers.publicApplication
);
router.get("/public/country-updates", controllers.publicCountryUpdates);
router.post("/payments/webhook/stripe", controllers.stripeWebhook);
router.get("/docs/openapi.json", (_req, res) => res.status(200).json(openApiSpec));

router.use("/user", requireAuth);
router.get("/user/profile", controllers.getUserProfile);
router.patch("/user/profile", controllers.updateUserProfile);
router.get("/user/applications", controllers.listUserApplications);
router.get("/user/applications/:id", controllers.getUserApplication);
router.get("/user/documents", controllers.listUserDocuments);
router.post("/user/documents", upload.single("file"), controllers.uploadUserDocument);
router.get("/user/payments", controllers.listUserPayments);
router.get("/user/appointments", controllers.listUserAppointments);

router.use(requireAuth, staffOnly);

router.get("/users/me", controllers.getMyProfile);
router.patch("/users/me", validate(validators.updateProfileSchema), controllers.updateMyProfile);
router.get("/staff", controllers.listStaff);

router.get("/leads", controllers.listLeads);
router.get("/leads/:leadId", controllers.getLeadById);
router.post("/leads", validate(validators.createLeadSchema), controllers.createLead);
router.patch("/leads/:leadId", validate(validators.updateLeadSchema), controllers.updateLead);
router.patch("/leads/:leadId/assign", validate(validators.assignLeadSchema), controllers.assignLead);
router.post("/leads/:leadId/notes", validate(validators.leadNoteSchema), controllers.addLeadNote);
router.patch("/leads/:leadId/stage", validate(validators.leadStageSchema), controllers.updateLeadStage);
router.post(
  "/leads/:leadId/convert-to-applicant",
  validate(validators.convertLeadToApplicantSchema),
  controllers.convertLeadToApplicant
);
router.post(
  "/leads/:leadId/convert-to-case",
  validate(validators.convertLeadToCaseSchema),
  controllers.convertLeadToCase
);

router.post("/catalog/countries", validate(validators.createCountrySchema), controllers.createCountry);
router.get("/catalog/countries", controllers.listCountries);
router.post("/catalog/visa-categories", validate(validators.createVisaCategorySchema), controllers.createVisaCategory);
router.get("/catalog/visa-categories", controllers.listVisaCategories);
router.post("/catalog/service-packages", validate(validators.createServicePackageSchema), controllers.createServicePackage);
router.get("/catalog/service-packages", controllers.listServicePackages);
router.patch(
  "/catalog/service-packages/:packageId/availability",
  validate(validators.packageAvailabilitySchema),
  controllers.updateServiceAvailability
);

router.post("/checklists/templates", validate(validators.createChecklistTemplateSchema), controllers.createChecklistTemplate);
router.get("/checklists/templates", controllers.listChecklistTemplates);
router.post("/cases/:caseId/checklists/generate", validate(validators.generateChecklistSchema), controllers.generateCaseChecklist);
router.patch(
  "/cases/:caseId/checklists/items/:checklistItemId",
  validate(validators.updateChecklistItemSchema),
  controllers.updateCaseChecklistItem
);

router.post("/applicants", validate(validators.createApplicantSchema), controllers.createApplicant);
router.get("/applicants", controllers.listApplicants);
router.get("/applicants/:applicantId", controllers.getApplicantById);
router.patch("/applicants/:applicantId", validate(validators.updateApplicantSchema), controllers.updateApplicant);
router.post(
  "/applicants/:applicantId/documents",
  upload.single("file"),
  controllers.uploadApplicantDocument
);
router.get("/applicants/:applicantId/cases", controllers.listApplicantCases);

router.post("/cases", validate(validators.createCaseSchema), controllers.createCase);
router.get("/cases", controllers.listCases);
router.get("/cases/:caseId", controllers.getCaseById);
router.patch("/cases/:caseId", validate(validators.updateCaseSchema), controllers.updateCase);
router.patch("/cases/:caseId/status", validate(validators.updateCaseStatusSchema), controllers.updateCaseStatus);
router.post("/cases/:caseId/notes", validate(validators.caseNoteSchema), controllers.addCaseNote);
router.patch("/cases/:caseId/assign", validate(validators.assignCaseSchema), controllers.assignCaseStaff);
router.post("/cases/:caseId/timeline", validate(validators.caseTimelineSchema), controllers.addCaseTimeline);
router.post(
  "/cases/:caseId/link-checklist",
  validate(validators.linkChecklistSchema),
  controllers.linkCaseChecklist
);
router.post("/cases/:caseId/link-service", validate(validators.linkServiceSchema), controllers.linkCaseService);

router.post("/staff", validate(validators.createStaffSchema), controllers.createStaff);
router.patch("/staff/:staffId", validate(validators.updateStaffSchema), controllers.updateStaff);
router.patch("/staff/:staffId/status", validate(validators.updateStaffStatusSchema), controllers.updateStaffStatus);

router.post("/documents/upload", upload.single("file"), controllers.uploadCaseDocument);
router.get("/documents", controllers.listCaseDocuments);
router.get("/documents/:documentId", controllers.getDocumentById);
router.patch("/documents/:documentId/review", validate(validators.reviewDocumentSchema), controllers.reviewDocument);
router.patch("/documents/:documentId", validate(validators.updateDocumentSchema), controllers.updateDocument);
router.delete("/documents/:documentId", controllers.deleteDocument);
router.patch("/documents/:documentId/archive", controllers.archiveCaseDocument);
router.get("/documents/:documentId/access-url", controllers.getCaseDocumentAccessUrl);

router.get("/appointments", controllers.listAppointments);
router.get("/appointments/:appointmentId", controllers.getAppointmentById);
router.post("/appointments", validate(validators.createAppointmentSchema), controllers.createAppointment);
router.patch("/appointments/:appointmentId", validate(validators.updateAppointmentSchema), controllers.updateAppointment);
router.patch(
  "/appointments/:appointmentId/status",
  validate(validators.updateAppointmentStatusSchema),
  controllers.updateAppointmentStatus
);
router.delete("/appointments/:appointmentId", controllers.deleteAppointment);
router.patch(
  "/appointments/:appointmentId/reschedule",
  validate(validators.rescheduleAppointmentSchema),
  controllers.rescheduleAppointment
);
router.get("/appointments/upcoming", controllers.listUpcomingAppointments);

router.get("/payments", controllers.listPayments);
router.get("/payments/:paymentId", controllers.getPaymentById);
router.post("/payments/create-intent", validate(validators.createPaymentIntentSchema), controllers.createPaymentIntent);
router.post("/payments/manual", validate(validators.createManualPaymentSchema), controllers.createManualPayment);
router.patch("/payments/:paymentId/status", validate(validators.updatePaymentStatusSchema), controllers.updatePaymentStatus);
router.get("/payments/:paymentId/invoice", controllers.getPaymentInvoice);

router.post("/billing/invoices", validate(validators.createInvoiceSchema), controllers.createInvoice);
router.get("/billing/invoices", controllers.listInvoices);
router.post(
  "/billing/invoices/:invoiceId/payments",
  validate(validators.recordPaymentSchema),
  controllers.recordInvoicePayment
);
router.get("/billing/invoices/:invoiceId/download", controllers.downloadInvoice);
router.get("/billing/invoices/:invoiceId/download/pdf", controllers.downloadInvoicePdf);

router.post(
  "/communications/templates",
  validate(validators.createTemplateSchema),
  controllers.createCommunicationTemplate
);
router.get("/communications/templates", controllers.listCommunicationTemplates);
router.patch(
  "/communications/templates/:templateId",
  validate(validators.updateTemplateSchema),
  controllers.updateCommunicationTemplate
);
router.post("/communications/send-preview", controllers.sendTemplatePreview);

router.get("/services", controllers.listServices);
router.get("/services/:serviceId", controllers.getServiceById);
router.post("/services", validate(validators.serviceSchema), controllers.createService);
router.patch("/services/:serviceId", validate(validators.updateServiceSchema), controllers.updateService);
router.delete("/services/:serviceId", controllers.deleteService);

router.get("/checklists", controllers.listChecklists);
router.get("/checklists/:checklistId", controllers.getChecklistById);
router.post("/checklists", validate(validators.checklistSchema), controllers.createChecklist);
router.patch("/checklists/:checklistId", validate(validators.updateChecklistSchema), controllers.updateChecklist);
router.delete("/checklists/:checklistId", controllers.deleteChecklist);

router.get("/templates", controllers.listTemplates);
router.get("/templates/:templateId", controllers.getTemplateById);
router.post("/templates", validate(validators.templateSchema), controllers.createTemplate);
router.patch("/templates/:templateId", validate(validators.updateTemplateV2Schema), controllers.updateTemplateV2);
router.delete("/templates/:templateId", controllers.deleteTemplate);
router.post("/templates/:templateId/preview", validate(validators.templatePreviewSchema), controllers.previewTemplate);

router.post(
  "/country-updates",
  validate(validators.createCountryProcessUpdateSchema),
  controllers.createCountryProcessUpdate
);
router.get("/country-updates", controllers.listCountryProcessUpdates);
router.get("/country-updates/:id", controllers.getCountryUpdateById);
router.patch("/country-updates/:id", validate(validators.updateCountryUpdateSchema), controllers.updateCountryUpdate);
router.delete("/country-updates/:id", controllers.deleteCountryUpdate);

router.get("/reports/dashboard", controllers.getDashboardSummary);
router.get("/reports/revenue", controllers.getRevenueReport);
router.get("/reports/conversion", controllers.getConversionReport);
router.get("/reports/staff-performance", controllers.getStaffPerformanceReport);
router.get("/reports/applications", controllers.getApplicationsReport);
router.get("/reports/export", controllers.getExportReport);

router.get("/settings", controllers.getSettings);
router.patch("/settings", validate(validators.settingPatchSchema), controllers.patchSettings);

router.post("/compliance/consents", validate(validators.recordConsentSchema), controllers.recordConsent);
router.get("/compliance/audit-trails", controllers.listAuditTrail);
router.get("/compliance/logs", controllers.getComplianceLogs);
router.get("/compliance/summary", controllers.getComplianceSummary);

module.exports = router;
