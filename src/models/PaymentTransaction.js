const mongoose = require("mongoose");
const { PAYMENT_STATUSES } = require("../utils/visaassist.constants.js");

const paymentTransactionSchema = new mongoose.Schema(
  {
    invoiceId: { type: mongoose.Schema.Types.ObjectId, ref: "Invoice", required: true, index: true },
    caseId: { type: mongoose.Schema.Types.ObjectId, ref: "Case", required: true, index: true },
    applicantId: { type: mongoose.Schema.Types.ObjectId, ref: "Applicant", index: true },
    leadId: { type: mongoose.Schema.Types.ObjectId, ref: "Lead", index: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "USD", uppercase: true, trim: true },
    paymentType: { type: String, default: "service_fee", trim: true },
    provider: { type: String, default: "manual", trim: true },
    providerPaymentId: { type: String, default: "", trim: true },
    method: { type: String, default: "manual", trim: true },
    transactionReference: { type: String, default: "", trim: true, index: true },
    status: { type: String, enum: PAYMENT_STATUSES, required: true, index: true },
    invoiceNumber: { type: String, default: "", trim: true, index: true },
    receiptUrl: { type: String, default: "" },
    paidAt: { type: Date, default: Date.now },
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    notes: { type: String, default: "" },
    gatewayResponse: { type: mongoose.Schema.Types.Mixed, default: {} },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

paymentTransactionSchema.index({ invoiceId: 1, paidAt: -1 });

const PaymentTransaction = mongoose.model("PaymentTransaction", paymentTransactionSchema);

module.exports = PaymentTransaction;
