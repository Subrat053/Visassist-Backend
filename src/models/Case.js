const mongoose = require("mongoose");
const {
  CASE_STATUSES,
  CHECKLIST_ITEM_STATUSES,
  PRIORITIES,
} = require("../utils/visaassist.constants.js");

const noteSchema = new mongoose.Schema(
  {
    message: { type: String, required: true, trim: true, maxlength: 3000 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const timelineSchema = new mongoose.Schema(
  {
    status: { type: String, enum: CASE_STATUSES, required: true },
    note: { type: String, default: "" },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    changedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const caseChecklistItemSchema = new mongoose.Schema(
  {
    checklistItemId: { type: String, required: true, trim: true },
    label: { type: String, required: true, trim: true },
    required: { type: Boolean, default: true },
    status: { type: String, enum: CHECKLIST_ITEM_STATUSES, default: "pending", index: true },
    remarks: { type: String, default: "" },
    documentId: { type: mongoose.Schema.Types.ObjectId, ref: "CaseDocument" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const caseSchema = new mongoose.Schema(
  {
    caseId: { type: String, required: true, unique: true, index: true },
    applicantId: { type: mongoose.Schema.Types.ObjectId, ref: "Applicant", required: true, index: true },
    leadId: { type: mongoose.Schema.Types.ObjectId, ref: "Lead", index: true },
    additionalApplicantIds: { type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Applicant" }], default: [] },
    destinationCountry: { type: String, required: true, trim: true, index: true },
    visaCategory: { type: String, required: true, trim: true, index: true },
    packageId: { type: mongoose.Schema.Types.ObjectId, ref: "ServicePackage" },
    assignedStaff: { type: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], default: [], index: true },
    priority: { type: String, enum: PRIORITIES, default: "medium", index: true },
    caseStatus: { type: String, enum: CASE_STATUSES, default: "inquiry_received", index: true },
    appointmentInfo: {
      nextAppointmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Appointment" },
      hasPendingAppointment: { type: Boolean, default: false },
    },
    submissionInfo: {
      submittedAt: { type: Date },
      referenceNumber: { type: String, default: "" },
      portal: { type: String, default: "" },
    },
    refusalInfo: {
      refusedAt: { type: Date },
      reason: { type: String, default: "" },
      reapplicationEligible: { type: Boolean, default: false },
    },
    checklistItems: { type: [caseChecklistItemSchema], default: [] },
    timeline: { type: [timelineSchema], default: [] },
    internalNotes: { type: [noteSchema], default: [] },
    customerNotes: { type: [noteSchema], default: [] },
    isArchived: { type: Boolean, default: false, index: true },
    archivedAt: { type: Date },
  },
  { timestamps: true }
);

caseSchema.index({ caseStatus: 1, assignedStaff: 1, createdAt: -1 });
caseSchema.index({ destinationCountry: 1, visaCategory: 1, createdAt: -1 });

const Case = mongoose.model("Case", caseSchema);

module.exports = Case;
