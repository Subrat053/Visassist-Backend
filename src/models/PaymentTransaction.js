const mongoose = require("mongoose");
const { PAYMENT_STATUSES } = require("../utils/visaassist.constants.js");

const paymentTransactionSchema = new mongoose.Schema(
  {
    invoiceId: { type: mongoose.Schema.Types.ObjectId, ref: "Invoice", required: true, index: true },
    caseId: { type: mongoose.Schema.Types.ObjectId, ref: "Case", required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "USD", uppercase: true, trim: true },
    method: { type: String, default: "manual", trim: true },
    transactionReference: { type: String, default: "", trim: true, index: true },
    status: { type: String, enum: PAYMENT_STATUSES, required: true, index: true },
    paidAt: { type: Date, default: Date.now },
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    notes: { type: String, default: "" },
    gatewayResponse: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

paymentTransactionSchema.index({ invoiceId: 1, paidAt: -1 });

const PaymentTransaction = mongoose.model("PaymentTransaction", paymentTransactionSchema);

module.exports = PaymentTransaction;
