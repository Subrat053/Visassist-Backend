const stripe = require("../config/stripe.js");

const createStripePaymentIntent = async ({ amount, currency = "usd", metadata = {} }) => {
  return stripe.paymentIntents.create({
    amount,
    currency,
    metadata,
    automatic_payment_methods: {
      enabled: true,
    },
  });
};

const constructStripeEvent = (rawBody, signature) => {
  return stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET);
};

module.exports = { createStripePaymentIntent, constructStripeEvent };
