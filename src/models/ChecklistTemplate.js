const mongoose = require("mongoose");

const checklistItemSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, trim: true },
    label: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    required: { type: Boolean, default: true },
    documentCategory: { type: String, default: "other" },
    sortOrder: { type: Number, default: 0 },
    acceptedMimeTypes: { type: [String], default: [] },
    maxFileSizeMb: { type: Number, default: 10, min: 1 },
  },
  { _id: false }
);

const versionLogSchema = new mongoose.Schema(
  {
    summary: { type: String, required: true, trim: true },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    changedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const checklistTemplateSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    destinationCountry: { type: String, required: true, trim: true, index: true },
    visaCategory: { type: mongoose.Schema.Types.Mixed, required: true, index: true },
    visaTypeSlug: { type: String, default: "", trim: true, index: true },
    version: { type: Number, required: true, min: 1 },
    isActiveVersion: { type: Boolean, default: true, index: true },
    isActive: { type: Boolean, default: true, index: true },
    items: { type: [checklistItemSchema], default: [] },
    changeLog: { type: [versionLogSchema], default: [] },
    status: { type: String, enum: ["draft", "active", "inactive"], default: "active", index: true },
  },
  { timestamps: true }
);

checklistTemplateSchema.index({ destinationCountry: 1, visaCategory: 1, version: -1 }, { unique: true });

const ChecklistTemplate = mongoose.model("ChecklistTemplate", checklistTemplateSchema);

module.exports = ChecklistTemplate;
