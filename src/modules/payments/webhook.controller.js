const stripe = require("../../config/stripe");
const Payment = require("../../models/Payment");

exports.handleStripeWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const paymentId = session.metadata?.paymentId;

    await Payment.findByIdAndUpdate(paymentId, {
      status: "paid",
      stripePaymentIntentId: session.payment_intent,
    });
  }

  res.json({ received: true });
};