const Stripe = require("stripe");

const stripe = process.env.STRIPE_SECRET_KEY
	? new Stripe(process.env.STRIPE_SECRET_KEY)
	: {
			paymentIntents: {
				create: async () => {
					throw new Error("Stripe is not configured. Set STRIPE_SECRET_KEY to enable payment intents.");
				},
			},
			webhooks: {
				constructEvent: () => {
					throw new Error("Stripe is not configured. Set STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET.");
				},
			},
		};

module.exports = stripe;
