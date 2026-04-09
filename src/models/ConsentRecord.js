const mongoose = require("mongoose");

const consentRecordSchema = new mongoose.Schema(
  {
    applicantId: { type: mongoose.Schema.Types.ObjectId, ref: "Applicant", required: true, index: true },
    caseId: { type: mongoose.Schema.Types.ObjectId, ref: "Case", required: true, index: true },
    consentType: {
      type: String,
      enum: ["consent", "disclaimer", "refund_policy", "reschedule_policy", "privacy_policy"],
      required: true,
      index: true,
    },
    accepted: { type: Boolean, required: true },
    acceptedAt: { type: Date, default: Date.now },
    acceptedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    source: { type: String, enum: ["web", "admin"], default: "web" },
    ipAddress: { type: String, default: "" },
    userAgent: { type: String, default: "" },
    textVersion: { type: String, default: "v1" },
  },
  { timestamps: true }
);

consentRecordSchema.index({ applicantId: 1, caseId: 1, consentType: 1, createdAt: -1 });

const ConsentRecord = mongoose.model("ConsentRecord", consentRecordSchema);

module.exports = ConsentRecord;
