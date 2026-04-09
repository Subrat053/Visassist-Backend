const mongoose = require("mongoose");
const { AUDIT_ACTIONS } = require("../utils/visaassist.constants.js");

const auditTrailSchema = new mongoose.Schema(
  {
    actionType: { type: String, enum: AUDIT_ACTIONS, required: true, index: true },
    entityType: { type: String, required: true, trim: true, index: true },
    entityId: { type: String, required: true, trim: true, index: true },
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    caseId: { type: mongoose.Schema.Types.ObjectId, ref: "Case", index: true },
    leadId: { type: mongoose.Schema.Types.ObjectId, ref: "Lead", index: true },
    message: { type: String, required: true, trim: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    sensitivity: { type: String, enum: ["normal", "sensitive"], default: "normal" },
  },
  { timestamps: true }
);

auditTrailSchema.index({ createdAt: -1 });

const AuditTrail = mongoose.model("AuditTrail", auditTrailSchema);

module.exports = AuditTrail;
