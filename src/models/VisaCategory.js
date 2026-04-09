const mongoose = require("mongoose");

const visaCategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true, index: true },
    slug: { type: String, required: true, trim: true, unique: true, index: true },
    description: { type: String, default: "" },
    travelPurpose: { type: String, default: "" },
    isActive: { type: Boolean, default: true, index: true },
    sopNotes: { type: String, default: "" },
    processingGuidance: { type: String, default: "" },
  },
  { timestamps: true }
);

visaCategorySchema.index({ isActive: 1, name: 1 });

const VisaCategory = mongoose.model("VisaCategory", visaCategorySchema);

module.exports = VisaCategory;
