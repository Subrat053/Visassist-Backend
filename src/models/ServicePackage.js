const mongoose = require("mongoose");

const complexityPricingSchema = new mongoose.Schema(
  {
    level: { type: String, required: true, trim: true },
    multiplier: { type: Number, default: 1, min: 0.1 },
    fixedAdjustment: { type: Number, default: 0 },
  },
  { _id: false }
);

const countryPricingSchema = new mongoose.Schema(
  {
    countryCode: { type: String, required: true, uppercase: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "USD", uppercase: true, trim: true },
  },
  { _id: false }
);

const servicePackageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, index: true },
    slug: { type: String, required: true, trim: true, unique: true, index: true },
    visaCategory: { type: mongoose.Schema.Types.ObjectId, ref: "VisaCategory", required: true, index: true },
    destinationCountry: { type: String, required: true, trim: true, index: true },
    description: { type: String, default: "" },
    basePrice: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "USD", uppercase: true, trim: true },
    complexityPricing: { type: [complexityPricingSchema], default: [] },
    countryPricing: { type: [countryPricingSchema], default: [] },
    isActive: { type: Boolean, default: true, index: true },
    sopNotes: { type: String, default: "" },
    processingGuidance: { type: String, default: "" },
  },
  { timestamps: true }
);

servicePackageSchema.index({ destinationCountry: 1, visaCategory: 1, isActive: 1 });

const ServicePackage = mongoose.model("ServicePackage", servicePackageSchema);

module.exports = ServicePackage;
