const { Router } = require("express");
const validate = require("../middlewares/validate.middleware.js");
const {
  createBlogPost,
  createJob,
  deleteBlogPost,
  deleteJob,
  getAdminStats,
  listBlogPostsAdmin,
  listConsultations,
  listJobsAdmin,
  listUsers,
  deleteUser,
  updateBlogPost,
  updateConsultationStatus,
  updateJob,
  updateUser,
} = require("../controllers/admin.controller.js");
const adminVisaControllers = require("../controllers/adminVisa.controller.js");
const { requireAuth } = require("../middlewares/auth.middleware.js");
const { requireRoles } = require("../middlewares/role.middleware.js");
const upload = require("../middlewares/upload.middleware.js");
const visaPortalValidators = require("../validators/visaPortal.validator.js");

const router = Router();

router.use(requireAuth, requireRoles("admin", "super_admin"));

router.get("/stats", getAdminStats);
router.get("/dashboard-summary", adminVisaControllers.getAdminDashboardSummary);

router.get("/users", adminVisaControllers.listAdminUsers);
router.get("/users/:id", adminVisaControllers.getAdminUserById);
router.patch("/users/:userId", validate(visaPortalValidators.userStatusSchema), adminVisaControllers.updateAdminUserStatus);
router.patch("/users/:id/status", validate(visaPortalValidators.userStatusSchema), adminVisaControllers.updateAdminUserStatus);
router.delete("/users/:userId", adminVisaControllers.deleteAdminUser);

router.get("/consultations", listConsultations);
router.patch("/consultations/:consultationId/status", updateConsultationStatus);

router.get("/countries", adminVisaControllers.listAdminCountries);
router.post("/countries", validate(visaPortalValidators.countryCreateSchema), adminVisaControllers.createAdminCountry);
router.get("/countries/:id", adminVisaControllers.getAdminCountryById);
router.put("/countries/:id", validate(visaPortalValidators.countryUpdateSchema), adminVisaControllers.updateAdminCountry);
router.patch(
  "/countries/:id/status",
  validate(visaPortalValidators.countryVisaTypeStatusSchema),
  adminVisaControllers.updateAdminCountryStatus
);
router.delete("/countries/:id", adminVisaControllers.deleteAdminCountry);

router.get("/visa-categories", adminVisaControllers.listAdminVisaCategories);
router.post(
  "/visa-categories",
  validate(visaPortalValidators.visaCategoryCreateSchema),
  adminVisaControllers.createAdminVisaCategory
);
router.get("/visa-categories/:id", adminVisaControllers.getAdminVisaCategoryById);
router.put(
  "/visa-categories/:id",
  validate(visaPortalValidators.visaCategoryUpdateSchema),
  adminVisaControllers.updateAdminVisaCategory
);
router.patch(
  "/visa-categories/:id/status",
  validate(visaPortalValidators.countryVisaTypeStatusSchema),
  adminVisaControllers.updateAdminVisaCategoryStatus
);
router.delete("/visa-categories/:id", adminVisaControllers.deleteAdminVisaCategory);

router.post(
  "/country-visa-types",
  validate(visaPortalValidators.countryVisaTypeCreateSchema),
  adminVisaControllers.createAdminCountryVisaType
);
router.get("/country-visa-types", adminVisaControllers.listAdminCountryVisaTypes);
router.get("/country-visa-types/:id", adminVisaControllers.getAdminCountryVisaTypeById);
router.put(
  "/country-visa-types/:id",
  validate(visaPortalValidators.countryVisaTypeUpdateSchema),
  adminVisaControllers.updateAdminCountryVisaType
);
router.patch(
  "/country-visa-types/:id/status",
  validate(visaPortalValidators.countryVisaTypeStatusSchema),
  adminVisaControllers.updateAdminCountryVisaTypeStatus
);
router.delete("/country-visa-types/:id", adminVisaControllers.deleteAdminCountryVisaType);

router.post(
  "/visa-types",
  validate(visaPortalValidators.countryVisaTypeCreateSchema),
  adminVisaControllers.createAdminCountryVisaType
);
router.get("/visa-types", adminVisaControllers.listAdminCountryVisaTypes);
router.get("/visa-types/:id", adminVisaControllers.getAdminCountryVisaTypeById);
router.put(
  "/visa-types/:id",
  validate(visaPortalValidators.countryVisaTypeUpdateSchema),
  adminVisaControllers.updateAdminCountryVisaType
);
router.patch(
  "/visa-types/:id/toggle-status",
  validate(visaPortalValidators.countryVisaTypeStatusSchema),
  adminVisaControllers.updateAdminCountryVisaTypeStatus
);
router.delete("/visa-types/:id", adminVisaControllers.deleteAdminCountryVisaType);

router.get("/applications", adminVisaControllers.listAdminApplications);
router.get("/applications/:id", adminVisaControllers.getAdminApplicationById);
router.patch(
  "/applications/:id/status",
  validate(visaPortalValidators.applicationStatusSchema),
  adminVisaControllers.updateAdminApplicationStatus
);
router.put(
  "/applications/:id/notes",
  validate(visaPortalValidators.applicationNotesSchema),
  adminVisaControllers.updateAdminApplicationNotes
);
router.delete("/applications/:id", adminVisaControllers.deleteAdminApplication);

router.get("/enquiries", adminVisaControllers.listAdminEnquiries);
router.get("/enquiries/:id", adminVisaControllers.getAdminEnquiryById);
router.patch(
  "/enquiries/:id/status",
  validate(visaPortalValidators.enquiryStatusSchema),
  adminVisaControllers.updateAdminEnquiryStatus
);
router.put(
  "/enquiries/:id/notes",
  validate(visaPortalValidators.enquiryNotesSchema),
  adminVisaControllers.updateAdminEnquiryNotes
);
router.delete("/enquiries/:id", adminVisaControllers.deleteAdminEnquiry);

router.get("/tickets", adminVisaControllers.listAdminTickets);
router.get("/tickets/:id", adminVisaControllers.getAdminTicketById);
router.patch(
  "/tickets/:id/status",
  validate(visaPortalValidators.ticketStatusSchema),
  adminVisaControllers.updateAdminTicketStatus
);
router.post(
  "/tickets/:id/replies",
  upload.any(),
  validate(visaPortalValidators.ticketReplySchema),
  adminVisaControllers.createAdminTicketReply
);

router.get("/jobs", listJobsAdmin);
router.post("/jobs", createJob);
router.put("/jobs/:jobId", updateJob);
router.delete("/jobs/:jobId", deleteJob);

router.get("/blog-posts", listBlogPostsAdmin);
router.post("/blog-posts", createBlogPost);
router.put("/blog-posts/:postId", updateBlogPost);
router.delete("/blog-posts/:postId", deleteBlogPost);

module.exports = router;
