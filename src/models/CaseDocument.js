const mongoose = require("mongoose");

const caseDocumentSchema = new mongoose.Schema(
  {
    documentType: { type: String, required: true, trim: true, index: true },
    documentName: { type: String, required: true, trim: true },
    fileUrl: { type: String, required: true },
    publicId: { type: String, required: true, index: true },
    fileSize: { type: Number, required: true, min: 1 },
    mimeType: { type: String, required: true },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    applicantId: { type: mongoose.Schema.Types.ObjectId, ref: "Applicant", required: true, index: true },
    caseId: { type: mongoose.Schema.Types.ObjectId, ref: "Case", required: true, index: true },
    checklistItemId: { type: String, default: "", index: true },
    storageProvider: { type: String, enum: ["cloudinary", "s3"], default: "cloudinary" },
    storageAccessType: { type: String, enum: ["authenticated", "public"], default: "authenticated" },
    accessLevel: { type: String, enum: ["internal", "customer_visible"], default: "internal" },
    isArchived: { type: Boolean, default: false, index: true },
    archivedAt: { type: Date },
  },
  { timestamps: true }
);

caseDocumentSchema.index({ caseId: 1, applicantId: 1, createdAt: -1 });

const CaseDocument = mongoose.model("CaseDocument", caseDocumentSchema);

module.exports = CaseDocument;
