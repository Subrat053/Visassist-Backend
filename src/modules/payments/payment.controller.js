const stripe = require("../../config/stripe");
const Payment = require("../../models/Payment");
const asyncHandler = require("../../utils/asyncHandler");

exports.createCheckoutSession = asyncHandler(async (req, res) => {
  const { serviceType, amount, currency = "usd", description } = req.body;

  const payment = await Payment.create({
    userId: req.user._id,
    serviceType,
    amount,
    currency,
    description,
    status: "pending",
  });

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    customer_email: req.user.email,
    line_items: [
      {
        price_data: {
          currency,
          product_data: {
            name: description || serviceType,
          },
          unit_amount: Math.round(amount * 100),
        },
        quantity: 1,
      },
    ],
    success_url: `${process.env.CLIENT_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.CLIENT_URL}/payment-cancel`,
    metadata: {
      paymentId: String(payment._id),
      userId: String(req.user._id),
    },
  });

  payment.stripeSessionId = session.id;
  await payment.save();

  res.status(201).json({
    success: true,
    data: {
      paymentId: payment._id,
      sessionId: session.id,
      url: session.url,
      amount: payment.amount,
      currency: payment.currency,
    },
  });
});

