const { Router } = require("express");

const validate = require("../middlewares/validate.middleware.js");
const { optionalAuth, requireAuth } = require("../middlewares/auth.middleware.js");
const { createRateLimiter } = require("../middlewares/rateLimit.middleware.js");
const upload = require("../middlewares/upload.middleware.js");
const controllers = require("../modules/visaassist/visaassist.controllers.js");
const validators = require("../modules/visaassist/visaassist.validators.js");
const publicVisaControllers = require("../controllers/publicVisa.controller.js");
const visaPortalValidators = require("../validators/visaPortal.validator.js");

const router = Router();
const publicLimiter = createRateLimiter(15 * 60 * 1000, 120);

const sendValidationError = (res, parseError) => {
	return res.status(422).json({
		success: false,
		error: {
			code: "VALIDATION_ERROR",
			message: "Validation failed",
			details: parseError.flatten(),
		},
	});
};

const isVisaPortalApplicationPayload = (body, files) => {
	if (Array.isArray(files) && files.length > 0) {
		return true;
	}

	return Boolean(
		body?.countrySlug ||
			body?.visaTypeSlug ||
			body?.countryVisaTypeId ||
			body?.applicantDetails ||
			body?.submittedDocs
	);
};

router.get("/countries", publicVisaControllers.listPublicCountries);
router.get("/site-settings", publicVisaControllers.getPublicSiteSettings);
router.get("/countries/:countrySlug", publicVisaControllers.getPublicCountryBySlug);
router.get("/countries/:countrySlug/visa-types", publicVisaControllers.listPublicVisaTypesByCountry);
router.get("/visa-types/:countrySlug/:visaTypeSlug", publicVisaControllers.getPublicVisaTypeBySlugs);
router.get("/application-config/:countrySlug/:visaTypeSlug", publicVisaControllers.getPublicApplicationConfig);
router.get("/visa-search", publicVisaControllers.searchPublicVisaTypes);
router.post(
	"/visa-applications",
	publicLimiter,
		requireAuth,
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
router.post("/applications", publicLimiter, optionalAuth, upload.any(), (req, res, next) => {
	if (isVisaPortalApplicationPayload(req.body, req.files)) {
		if (!req.user?._id) {
			return res.status(401).json({
				success: false,
				error: {
					code: "UNAUTHORIZED",
					message: "Please login or register before submitting a visa application.",
				},
			});
		}

		const parsed = visaPortalValidators.publicApplicationSchema.safeParse(req.body);
		if (!parsed.success) {
			return sendValidationError(res, parsed.error);
		}

		req.body = parsed.data;
		return publicVisaControllers.createPublicVisaApplication(req, res, next);
	}

	const parsed = validators.publicApplicationSchema.safeParse(req.body);
	if (!parsed.success) {
		return sendValidationError(res, parsed.error);
	}

	req.body = parsed.data;
	return controllers.publicApplication(req, res, next);
});
router.get("/country-updates", controllers.publicCountryUpdates);

module.exports = router;
