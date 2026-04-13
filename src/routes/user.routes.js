const { Router } = require("express");
const visaassistControllers = require("../modules/visaassist/visaassist.controllers.js");
const { requireAuth } = require("../middlewares/auth.middleware.js");
const upload = require("../middlewares/upload.middleware.js");

const router = Router();

router.get("/profile", requireAuth, visaassistControllers.getUserProfile);
router.put("/profile", requireAuth, visaassistControllers.updateUserProfile);
router.patch("/profile", requireAuth, visaassistControllers.updateUserProfile);
router.get("/applications", requireAuth, visaassistControllers.listUserApplications);
router.get("/applications/:id", requireAuth, visaassistControllers.getUserApplication);
router.get("/documents", requireAuth, visaassistControllers.listUserDocuments);
router.post("/documents", requireAuth, upload.single("file"), visaassistControllers.uploadUserDocument);
router.get("/payments", requireAuth, visaassistControllers.listUserPayments);
router.get("/appointments", requireAuth, visaassistControllers.listUserAppointments);

module.exports = router;
