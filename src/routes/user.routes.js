const { Router } = require("express");
const visaassistControllers = require("../modules/visaassist/visaassist.controllers.js");
const userVisaControllers = require("../controllers/userVisa.controller.js");
const { requireAuth } = require("../middlewares/auth.middleware.js");
const upload = require("../middlewares/upload.middleware.js");
const validate = require("../middlewares/validate.middleware.js");
const visaPortalValidators = require("../validators/visaPortal.validator.js");

const router = Router();

router.get("/profile", requireAuth, userVisaControllers.getUserProfile);
router.put("/profile", requireAuth, userVisaControllers.updateUserProfile);
router.patch("/profile", requireAuth, userVisaControllers.updateUserProfile);

router.get("/applications", requireAuth, userVisaControllers.listUserApplications);
router.get("/applications/:id", requireAuth, userVisaControllers.getUserApplicationById);
router.post(
	"/applications",
	requireAuth,
	upload.any(),
	validate(visaPortalValidators.publicApplicationSchema),
	userVisaControllers.createUserApplication
);

router.get("/tickets", requireAuth, userVisaControllers.listUserTickets);
router.post(
	"/tickets",
	requireAuth,
	upload.any(),
	validate(visaPortalValidators.ticketCreateSchema),
	userVisaControllers.createUserTicket
);
router.get("/tickets/:id", requireAuth, userVisaControllers.getUserTicketById);
router.post(
	"/tickets/:id/replies",
	requireAuth,
	upload.any(),
	validate(visaPortalValidators.ticketReplySchema),
	userVisaControllers.createUserTicketReply
);
router.get("/dashboard-summary", requireAuth, userVisaControllers.getUserDashboardSummary);

router.get("/documents", requireAuth, visaassistControllers.listUserDocuments);
router.post("/documents", requireAuth, upload.single("file"), visaassistControllers.uploadUserDocument);
router.get("/payments", requireAuth, visaassistControllers.listUserPayments);
router.get("/appointments", requireAuth, visaassistControllers.listUserAppointments);

module.exports = router;
