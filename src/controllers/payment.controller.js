const Payment = require("../models/Payment.js");
const { constructStripeEvent, createStripePaymentIntent } = require("../services/payment.service.js");
const asyncHandler = require("../utils/asyncHandler.js");
const ApiError = require("../utils/ApiError.js");
const { sendSuccess } = require("../utils/ApiResponse.js");

const initiatePayment = asyncHandler(async (req, res) => {
  const paymentIntent = await createStripePaymentIntent({
    amount: req.body.amount,
    currency: req.body.currency,
    metadata: {
      userId: req.user._id.toString(),
      purpose: req.body.purpose,
      ...(req.body.metadata || {}),
    },
  });

  const payment = await Payment.create({
    user: req.user._id,
    amount: req.body.amount,
    currency: req.body.currency,
    purpose: req.body.purpose,
    status: "created",
    stripePaymentIntentId: paymentIntent.id,
    clientSecret: paymentIntent.client_secret,
    metadata: req.body.metadata || {},
  });

  return sendSuccess(res, 201, {
    paymentId: payment._id,
    clientSecret: paymentIntent.client_secret,
    status: payment.status,
  });
});

const updatePaymentStatusFromEvent = async (event) => {
  const paymentIntentId = event.data.object.id;

  let status;
  if (event.type === "payment_intent.processing") {
    status = "processing";
  } else if (event.type === "payment_intent.succeeded") {
    status = "succeeded";
  } else if (event.type === "payment_intent.payment_failed") {
    status = "failed";
  } else if (event.type === "payment_intent.canceled") {
    status = "cancelled";
  }

  if (!status) {
    return;
  }

  await Payment.findOneAndUpdate(
    { stripePaymentIntentId: paymentIntentId },
    {
      $set: {
        status,
        metadata: {
          ...event.data.object.metadata,
          lastEvent: event.type,
        },
      },
    }
  );
};

const stripeWebhook = asyncHandler(async (req, res) => {
  const signature = req.headers["stripe-signature"];

  if (!signature) {
    throw new ApiError(400, "MISSING_SIGNATURE", "Missing Stripe signature");
  }

  const rawBody = req.rawBody;
  if (!rawBody) {
    throw new ApiError(400, "MISSING_RAW_BODY", "Webhook raw body is required");
  }

  const event = constructStripeEvent(rawBody, signature);

  switch (event.type) {
    case "payment_intent.processing":
    case "payment_intent.succeeded":
    case "payment_intent.payment_failed":
    case "payment_intent.canceled":
      await updatePaymentStatusFromEvent(event);
      break;
    default:
      break;
  }

  return sendSuccess(res, 200, { received: true });
});

module.exports = { initiatePayment, stripeWebhook };
