const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 1,
    },
    currency: {
      type: String,
      default: "usd",
      lowercase: true,
    },
    purpose: {
      type: String,
      enum: ["consultation", "application", "service"],
      default: "consultation",
    },
    status: {
      type: String,
      enum: ["created", "processing", "succeeded", "failed", "cancelled"],
      default: "created",
      index: true,
    },
    stripePaymentIntentId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    clientSecret: {
      type: String,
      required: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

paymentSchema.index({ createdAt: -1 });

const Payment = mongoose.model("Payment", paymentSchema);

module.exports = Payment;
