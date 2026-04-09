const { Router } = require("express");
const { assessEligibility } = require("../controllers/assessment.controller.js");
const { optionalAuth } = require("../middlewares/auth.middleware.js");
const validate = require("../middlewares/validate.middleware.js");
const { eligibilitySchema } = require("../validators/assessment.validator.js");

const router = Router();

router.post("/eligibility", optionalAuth, validate(eligibilitySchema), assessEligibility);

module.exports = router;
