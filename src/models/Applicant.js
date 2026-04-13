const mongoose = require("mongoose");

const dependentSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    relation: { type: String, required: true, trim: true },
    dateOfBirth: { type: Date },
    passportNumber: { type: String, default: "" },
  },
  { _id: false }
);

const applicantSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    leadId: { type: mongoose.Schema.Types.ObjectId, ref: "Lead", index: true },
    fullName: { type: String, required: true, trim: true, index: true },
    email: { type: String, required: true, trim: true, lowercase: true, index: true },
    phone: { type: String, required: true, trim: true, index: true },
    countryCode: { type: String, trim: true, default: "+91" },
    nationality: { type: String, required: true, trim: true },
    dateOfBirth: { type: Date },
    gender: { type: String, default: "" },
    maritalStatus: { type: String, default: "" },
    passport: {
      passportNumber: { type: String, default: "" },
      issueCountry: { type: String, default: "" },
      issueDate: { type: Date },
      expiryDate: { type: Date },
    },
    basicProfile: {
      dateOfBirth: { type: Date },
      maritalStatus: { type: String, default: "" },
      currentAddress: { type: String, default: "" },
      occupation: { type: String, default: "" },
      education: { type: String, default: "" },
      annualIncome: { type: Number, default: 0 },
    },
    address: {
      country: { type: String, default: "" },
      state: { type: String, default: "" },
      city: { type: String, default: "" },
      postalCode: { type: String, default: "" },
      line1: { type: String, default: "" },
      line2: { type: String, default: "" },
    },
    travelProfile: {
      previousTravelCountries: { type: [String], default: [] },
      previousVisaHistory: { type: [String], default: [] },
      priorRefusal: { type: Boolean, default: false },
      refusalDetails: { type: String, default: "" },
    },
    familyInfo: {
      spouseName: { type: String, default: "" },
      childrenCount: { type: Number, default: 0, min: 0 },
    },
    dependents: { type: [dependentSchema], default: [] },
    consentAccepted: { type: Boolean, default: false, index: true },
    consentAcceptedAt: { type: Date },
    disclaimerAccepted: { type: Boolean, default: false, index: true },
    disclaimerAcceptedAt: { type: Date },
    refundPolicyAccepted: { type: Boolean, default: false, index: true },
    refundPolicyAcceptedAt: { type: Date },
    profileStatus: {
      type: String,
      enum: ["draft", "submitted", "under_review", "approved", "rejected"],
      default: "submitted",
      index: true,
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

applicantSchema.index({ leadId: 1, createdAt: -1 });

const Applicant = mongoose.model("Applicant", applicantSchema);

module.exports = Applicant;
