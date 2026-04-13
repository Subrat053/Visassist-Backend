const mongoose = require("mongoose");

const VISA_APPLICATION_STATUSES = [
  "draft",
  "submitted",
  "under_review",
  "documents_requested",
  "documents_received",
  "in_process",
  "approved",
  "rejected",
  "on_hold",
  "completed",
  "cancelled",
];

const statusHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: VISA_APPLICATION_STATUSES,
      required: true,
    },
    note: {
      type: String,
      trim: true,
      default: "",
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const submittedDocSchema = new mongoose.Schema(
  {
    requiredDocId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    docName: {
      type: String,
      trim: true,
      default: "",
    },
    fileUrl: {
      type: String,
      trim: true,
      required: true,
    },
    publicId: {
      type: String,
      trim: true,
      default: "",
    },
    originalName: {
      type: String,
      trim: true,
      default: "",
    },
    mimeType: {
      type: String,
      trim: true,
      default: "",
    },
    size: {
      type: Number,
      default: 0,
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
    verificationStatus: {
      type: String,
      enum: ["pending", "verified", "rejected"],
      default: "pending",
    },
    adminRemark: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { _id: true }
);

const applicantDetailsSchema = new mongoose.Schema(
  {
    firstName: { type: String, trim: true, default: "" },
    lastName: { type: String, trim: true, default: "" },
    dob: { type: Date, default: null },
    gender: { type: String, trim: true, default: "" },
    email: { type: String, trim: true, lowercase: true, default: "" },
    phone: { type: String, trim: true, default: "" },
    nationality: { type: String, trim: true, default: "" },
    passportNumber: { type: String, trim: true, default: "" },
    maritalStatus: { type: String, trim: true, default: "" },
    address: { type: String, trim: true, default: "" },
    travelDate: { type: Date, default: null },
    educationDetails: { type: mongoose.Schema.Types.Mixed, default: {} },
    employmentDetails: { type: mongoose.Schema.Types.Mixed, default: {} },
    dependentDetails: { type: mongoose.Schema.Types.Mixed, default: {} },
    customFields: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { _id: false }
);

const visaApplicationSchema = new mongoose.Schema(
  {
    applicationNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    countryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Country",
      required: true,
      index: true,
    },
    visaCategoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "VisaCategory",
      required: true,
      index: true,
    },
    countryVisaTypeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CountryVisaType",
      required: true,
      index: true,
    },
    countrySlug: {
      type: String,
      trim: true,
      lowercase: true,
      required: true,
      index: true,
    },
    visaTypeSlug: {
      type: String,
      trim: true,
      lowercase: true,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: VISA_APPLICATION_STATUSES,
      default: "submitted",
      index: true,
    },
    statusHistory: {
      type: [statusHistorySchema],
      default: [],
    },
    adminNotes: {
      type: String,
      trim: true,
      default: "",
    },
    applicantDetails: {
      type: applicantDetailsSchema,
      default: () => ({}),
    },
    submittedDocs: {
      type: [submittedDocSchema],
      default: [],
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "waived", "not_required"],
      default: "not_required",
      index: true,
    },
    source: {
      type: String,
      enum: ["website", "dashboard", "admin-created"],
      default: "website",
      index: true,
    },
    isArchived: {
      type: Boolean,
      default: false,
      index: true,
    },
    appliedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

visaApplicationSchema.index({ createdAt: -1 });
visaApplicationSchema.index({ userId: 1, appliedAt: -1 });
visaApplicationSchema.index({ countryId: 1, visaCategoryId: 1, status: 1 });

const VisaApplication = mongoose.model("VisaApplication", visaApplicationSchema);

module.exports = {
  VisaApplication,
  VISA_APPLICATION_STATUSES,
};
