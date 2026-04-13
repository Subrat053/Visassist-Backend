const mongoose = require("mongoose");

const ENQUIRY_STATUSES = ["new", "contacted", "qualified", "converted", "closed", "spam"];
const ENQUIRY_TYPES = [
  "migration_consultation",
  "study_visa_consultation",
  "general_visa_help",
  "callback_request",
  "contact_form",
];

const enquirySchema = new mongoose.Schema(
  {
    enquiryNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    phone: {
      type: String,
      trim: true,
      default: "",
      index: true,
    },
    countryOfInterest: {
      type: String,
      trim: true,
      default: "",
      index: true,
    },
    visaInterestType: {
      type: String,
      trim: true,
      default: "",
      index: true,
    },
    enquiryType: {
      type: String,
      enum: ENQUIRY_TYPES,
      default: "general_visa_help",
      index: true,
    },
    message: {
      type: String,
      trim: true,
      default: "",
    },
    preferredContactMethod: {
      type: String,
      trim: true,
      default: "",
    },
    pageSource: {
      type: String,
      trim: true,
      default: "",
      index: true,
    },
    status: {
      type: String,
      enum: ENQUIRY_STATUSES,
      default: "new",
      index: true,
    },
    adminNotes: {
      type: String,
      trim: true,
      default: "",
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

enquirySchema.index({ createdAt: -1 });
enquirySchema.index({ status: 1, createdAt: -1 });

const Enquiry = mongoose.model("Enquiry", enquirySchema);

module.exports = {
  Enquiry,
  ENQUIRY_STATUSES,
  ENQUIRY_TYPES,
};
