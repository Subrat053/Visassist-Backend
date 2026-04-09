const mongoose = require("mongoose");
const { PAYMENT_STATUSES } = require("../utils/visaassist.constants.js");

const invoiceLineSchema = new mongoose.Schema(
  {
    description: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 1, default: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    taxPercent: { type: Number, default: 0, min: 0 },
    amount: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: { type: String, required: true, unique: true, index: true },
    receiptNumber: { type: String, default: "", index: true },
    caseId: { type: mongoose.Schema.Types.ObjectId, ref: "Case", required: true, index: true },
    applicantId: { type: mongoose.Schema.Types.ObjectId, ref: "Applicant", required: true, index: true },
    leadId: { type: mongoose.Schema.Types.ObjectId, ref: "Lead", index: true },
    packageId: { type: mongoose.Schema.Types.ObjectId, ref: "ServicePackage" },
    lineItems: { type: [invoiceLineSchema], default: [] },
    currency: { type: String, default: "USD", uppercase: true, trim: true },
    subTotal: { type: Number, required: true, min: 0 },
    taxTotal: { type: Number, default: 0, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    paidAmount: { type: Number, default: 0, min: 0 },
    balanceDue: { type: Number, required: true, min: 0 },
    paymentStatus: { type: String, enum: PAYMENT_STATUSES, default: "pending", index: true },
    engagementTerms: { type: String, default: "" },
    issuedAt: { type: Date, default: Date.now },
    dueAt: { type: Date },
    generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

invoiceSchema.index({ caseId: 1, createdAt: -1 });

const Invoice = mongoose.model("Invoice", invoiceSchema);

module.exports = Invoice;
