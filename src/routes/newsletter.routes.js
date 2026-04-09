const { Router } = require("express");
const { subscribeNewsletter } = require("../controllers/newsletter.controller.js");
const { contactLimiter } = require("../middlewares/rateLimit.middleware.js");
const validate = require("../middlewares/validate.middleware.js");
const { newsletterSchema } = require("../validators/contact.validator.js");

const router = Router();

router.post("/subscribe", contactLimiter, validate(newsletterSchema), subscribeNewsletter);

module.exports = router;
