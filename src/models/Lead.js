const mongoose = require("mongoose");
const { LEAD_STAGES } = require("../utils/visaassist.constants.js");

const leadNoteSchema = new mongoose.Schema(
  {
    note: { type: String, required: true, trim: true, maxlength: 2000 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { _id: false, timestamps: { createdAt: true, updatedAt: false } }
);

const leadActivitySchema = new mongoose.Schema(
  {
    action: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true, maxlength: 1000 },
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { _id: false, timestamps: { createdAt: true, updatedAt: false } }
);

const leadSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true, index: true },
    email: { type: String, required: true, trim: true, lowercase: true, index: true },
    phone: { type: String, required: true, trim: true, index: true },
    countryCode: { type: String, trim: true, default: "+91" },
    nationality: { type: String, required: true, trim: true, index: true },
    destinationCountry: { type: String, required: true, trim: true, index: true },
    visaCategory: { type: String, required: true, trim: true, index: true },
    travelPurpose: { type: String, required: true, trim: true },
    urgency: { type: String, trim: true, default: "normal" },
    priorRefusal: { type: Boolean, default: false },
    notes: { type: String, default: "", maxlength: 3000 },
    source: { type: String, default: "website", index: true },
    stage: { type: String, enum: LEAD_STAGES, default: "new", index: true },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    noteHistory: { type: [leadNoteSchema], default: [] },
    activityHistory: { type: [leadActivitySchema], default: [] },
    convertedApplicantId: { type: mongoose.Schema.Types.ObjectId, ref: "Applicant" },
    convertedCaseId: { type: mongoose.Schema.Types.ObjectId, ref: "Case" },
    isArchived: { type: Boolean, default: false, index: true },
    archivedAt: { type: Date },
  },
  { timestamps: true }
);

leadSchema.index({ stage: 1, assignedTo: 1, createdAt: -1 });
leadSchema.index({ destinationCountry: 1, visaCategory: 1, createdAt: -1 });

const Lead = mongoose.model("Lead", leadSchema);

module.exports = Lead;
