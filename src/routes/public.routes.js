const { Router } = require("express");

const validate = require("../middlewares/validate.middleware.js");
const { optionalAuth } = require("../middlewares/auth.middleware.js");
const { createRateLimiter } = require("../middlewares/rateLimit.middleware.js");
const upload = require("../middlewares/upload.middleware.js");
const controllers = require("../modules/visaassist/visaassist.controllers.js");
const validators = require("../modules/visaassist/visaassist.validators.js");
const publicVisaControllers = require("../controllers/publicVisa.controller.js");
const visaPortalValidators = require("../validators/visaPortal.validator.js");

const router = Router();
const publicLimiter = createRateLimiter(15 * 60 * 1000, 120);

router.get("/countries", publicVisaControllers.listPublicCountries);
router.get("/countries/:countrySlug", publicVisaControllers.getPublicCountryBySlug);
router.get("/countries/:countrySlug/visa-types", publicVisaControllers.listPublicVisaTypesByCountry);
router.get("/visa-types/:countrySlug/:visaTypeSlug", publicVisaControllers.getPublicVisaTypeBySlugs);
router.get("/application-config/:countrySlug/:visaTypeSlug", publicVisaControllers.getPublicApplicationConfig);
router.get("/visa-search", publicVisaControllers.searchPublicVisaTypes);
router.post(
	"/visa-applications",
	publicLimiter,
	optionalAuth,
	upload.any(),
	validate(visaPortalValidators.publicApplicationSchema),
	publicVisaControllers.createPublicVisaApplication
);
router.post(
	"/enquiries",
	publicLimiter,
	optionalAuth,
	validate(visaPortalValidators.publicEnquirySchema),
	publicVisaControllers.createPublicEnquiry
);

router.post("/eligibility-check", publicLimiter, validate(validators.publicEligibilitySchema), controllers.publicEligibilityCheck);
router.post("/contact", publicLimiter, validate(validators.publicContactSchema), controllers.publicContact);
router.post("/applications", publicLimiter, optionalAuth, validate(validators.publicApplicationSchema), controllers.publicApplication);
router.get("/country-updates", controllers.publicCountryUpdates);

module.exports = router;
