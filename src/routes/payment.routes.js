const { Router } = require("express");
const { initiatePayment, stripeWebhook } = require("../controllers/payment.controller.js");
const { requireAuth } = require("../middlewares/auth.middleware.js");
const { paymentLimiter } = require("../middlewares/rateLimit.middleware.js");
const validate = require("../middlewares/validate.middleware.js");
const { initiatePaymentSchema } = require("../validators/payment.validator.js");

const router = Router();

router.post("/initiate", paymentLimiter, requireAuth, validate(initiatePaymentSchema), initiatePayment);
router.post("/webhook", paymentLimiter, stripeWebhook);

module.exports = router;
