const { Router } = require("express");

const validate = require("../middlewares/validate.middleware.js");
const { optionalAuth } = require("../middlewares/auth.middleware.js");
const { createRateLimiter } = require("../middlewares/rateLimit.middleware.js");
const controllers = require("../modules/visaassist/visaassist.controllers.js");
const validators = require("../modules/visaassist/visaassist.validators.js");

const router = Router();
const publicLimiter = createRateLimiter(15 * 60 * 1000, 120);

router.post("/eligibility-check", publicLimiter, validate(validators.publicEligibilitySchema), controllers.publicEligibilityCheck);
router.post("/contact", publicLimiter, validate(validators.publicContactSchema), controllers.publicContact);
router.post("/applications", publicLimiter, optionalAuth, validate(validators.publicApplicationSchema), controllers.publicApplication);
router.get("/country-updates", controllers.publicCountryUpdates);

module.exports = router;
