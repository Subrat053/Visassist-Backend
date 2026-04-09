const express = require("express");
const router = express.Router();
const controller = require("./payment.controller");
const webhookController = require("./webhook.controller");
const { protect } = require("../../middlewares/auth.middleware");

router.post("/create-checkout-session", protect, controller.createCheckoutSession);
router.post("/webhook", webhookController.handleStripeWebhook);

module.exports = router;