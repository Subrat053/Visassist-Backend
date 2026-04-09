const { Router } = require("express");

const validate = require("../../middlewares/validate.middleware.js");
const upload = require("../../middlewares/upload.middleware.js");
const { requireAuth } = require("../../middlewares/auth.middleware.js");
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
router.get("/docs/openapi.json", (_req, res) => res.status(200).json(openApiSpec));

router.use(requireAuth, staffOnly);

router.get("/users/me", controllers.getMyProfile);
router.patch("/users/me", validate(validators.updateProfileSchema), controllers.updateMyProfile);
router.get("/staff", controllers.listStaff);

router.get("/leads", controllers.listLeads);
router.get("/leads/:leadId", controllers.getLeadById);
router.patch("/leads/:leadId/assign", validate(validators.assignLeadSchema), controllers.assignLead);
router.post("/leads/:leadId/notes", validate(validators.leadNoteSchema), controllers.addLeadNote);
router.patch("/leads/:leadId/stage", validate(validators.leadStageSchema), controllers.updateLeadStage);

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

router.post("/cases", validate(validators.createCaseSchema), controllers.createCase);
router.get("/cases", controllers.listCases);
router.get("/cases/:caseId", controllers.getCaseById);
router.patch("/cases/:caseId/status", validate(validators.updateCaseStatusSchema), controllers.updateCaseStatus);
router.post("/cases/:caseId/notes", validate(validators.caseNoteSchema), controllers.addCaseNote);
router.patch("/cases/:caseId/assign", validate(validators.assignCaseSchema), controllers.assignCaseStaff);

router.post(
  "/documents/upload",
  upload.single("file"),
  controllers.uploadCaseDocument
);
router.get("/documents", controllers.listCaseDocuments);
router.patch("/documents/:documentId/archive", controllers.archiveCaseDocument);
router.get("/documents/:documentId/access-url", controllers.getCaseDocumentAccessUrl);

router.post("/appointments", validate(validators.createAppointmentSchema), controllers.createAppointment);
router.patch(
  "/appointments/:appointmentId/reschedule",
  validate(validators.rescheduleAppointmentSchema),
  controllers.rescheduleAppointment
);
router.get("/appointments/upcoming", controllers.listUpcomingAppointments);

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

router.post(
  "/country-updates",
  validate(validators.createCountryProcessUpdateSchema),
  controllers.createCountryProcessUpdate
);
router.get("/country-updates", controllers.listCountryProcessUpdates);

router.get("/reports/dashboard", controllers.getDashboardSummary);

router.post("/compliance/consents", validate(validators.recordConsentSchema), controllers.recordConsent);
router.get("/compliance/audit-trails", controllers.listAuditTrail);

module.exports = router;
