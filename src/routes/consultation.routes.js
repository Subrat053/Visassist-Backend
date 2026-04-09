const { Router } = require("express");
const { createMigrateConsultation, createStudyConsultation, createWorkConsultation, } = require("../controllers/consultation.controller.js");
const { optionalAuth } = require("../middlewares/auth.middleware.js");
const { consultationLimiter } = require("../middlewares/rateLimit.middleware.js");
const validate = require("../middlewares/validate.middleware.js");
const { migrateConsultationSchema, studyConsultationSchema, workConsultationSchema, } = require("../validators/consultation.validator.js");

const router = Router();

router.post("/migrate", consultationLimiter, optionalAuth, validate(migrateConsultationSchema), createMigrateConsultation);
router.post("/work", consultationLimiter, optionalAuth, validate(workConsultationSchema), createWorkConsultation);
router.post("/study", consultationLimiter, optionalAuth, validate(studyConsultationSchema), createStudyConsultation);

module.exports = router;
