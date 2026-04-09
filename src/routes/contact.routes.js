const { Router } = require("express");
const { createContactMessage } = require("../controllers/contact.controller.js");
const { contactLimiter } = require("../middlewares/rateLimit.middleware.js");
const validate = require("../middlewares/validate.middleware.js");
const { contactSchema } = require("../validators/contact.validator.js");

const router = Router();

router.post("/", contactLimiter, validate(contactSchema), createContactMessage);

module.exports = router;
