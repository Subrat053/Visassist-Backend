const mongoose = require("mongoose");

const slugify = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

const visaCategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true, index: true },
    slug: { type: String, required: true, trim: true, unique: true, index: true },
    description: { type: String, default: "" },
    iconKey: { type: String, trim: true, default: "" },
    sortOrder: { type: Number, default: 0, index: true },
    travelPurpose: { type: String, default: "" },
    isActive: { type: Boolean, default: true, index: true },
    sopNotes: { type: String, default: "" },
    processingGuidance: { type: String, default: "" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

visaCategorySchema.pre("validate", function normalizeVisaCategory() {
  if (!this.slug && this.name) {
    this.slug = slugify(this.name);
  }

  if (this.slug) {
    this.slug = slugify(this.slug);
  }
});

visaCategorySchema.index({ isActive: 1, sortOrder: 1, name: 1 });

const VisaCategory = mongoose.model("VisaCategory", visaCategorySchema);

module.exports = VisaCategory;
