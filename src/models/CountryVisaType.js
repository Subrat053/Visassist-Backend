const mongoose = require("mongoose");

const slugify = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

const normalizeText = (value) => String(value || "").trim();

const normalizeStringArray = (input) => {
  if (!Array.isArray(input)) {
    return [];
  }

  return input
    .map((item) => normalizeText(item))
    .filter(Boolean);
};

const serviceHighlightSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true, default: "" },
    description: { type: String, trim: true, default: "" },
    iconKey: { type: String, trim: true, default: "" },
    sortOrder: { type: Number, default: 0 },
  },
  { _id: false }
);

const requiredDocSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, required: true },
    description: { type: String, trim: true, default: "" },
    isMandatory: { type: Boolean, default: true },
    allowedFileTypes: { type: [String], default: [] },
    maxFiles: { type: Number, default: 1 },
    sortOrder: { type: Number, default: 0 },
  },
  { _id: true }
);

const processStepSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true, default: "" },
    description: { type: String, trim: true, default: "" },
    sortOrder: { type: Number, default: 0 },
  },
  { _id: false }
);

const timelineStepSchema = new mongoose.Schema(
  {
    label: { type: String, trim: true, default: "" },
    description: { type: String, trim: true, default: "" },
    sortOrder: { type: Number, default: 0 },
  },
  { _id: false }
);

const faqSchema = new mongoose.Schema(
  {
    question: { type: String, trim: true, required: true },
    answer: { type: String, trim: true, required: true },
    sortOrder: { type: Number, default: 0 },
  },
  { _id: false }
);

const countryVisaTypeSchema = new mongoose.Schema(
  {
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
    countrySlug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    visaTypeSlug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    countryName: {
      type: String,
      trim: true,
      default: "",
    },
    visaTypeName: {
      type: String,
      trim: true,
      default: "",
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    badge: {
      type: String,
      trim: true,
      default: "",
    },
    subtitle: {
      type: String,
      trim: true,
      default: "",
    },
    heroImage: {
      type: String,
      trim: true,
      default: "",
    },
    iconKey: {
      type: String,
      trim: true,
      default: "",
    },
    overview: {
      type: String,
      trim: true,
      default: "",
    },
    serviceHighlights: {
      type: [serviceHighlightSchema],
      default: [],
    },
    eligibility: {
      type: [String],
      default: [],
    },
    requiredDocs: {
      type: [requiredDocSchema],
      default: [],
    },
    process: {
      type: [processStepSchema],
      default: [],
    },
    timeline: {
      type: [timelineStepSchema],
      default: [],
    },
    faqs: {
      type: [faqSchema],
      default: [],
    },
    ctaTitle: {
      type: String,
      trim: true,
      default: "",
    },
    ctaText: {
      type: String,
      trim: true,
      default: "",
    },
    seoTitle: {
      type: String,
      trim: true,
      default: "",
    },
    seoDescription: {
      type: String,
      trim: true,
      default: "",
    },
    metaKeywords: {
      type: [String],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    sortOrder: {
      type: Number,
      default: 0,
      index: true,
    },
    applicationEnabled: {
      type: Boolean,
      default: true,
      index: true,
    },
    consultationEnabled: {
      type: Boolean,
      default: true,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
    collection: "visatypes",
  }
);

countryVisaTypeSchema.pre("validate", function normalizeCountryVisaType() {
  this.countrySlug = slugify(this.countrySlug);
  this.visaTypeSlug = slugify(this.visaTypeSlug);

  if (Array.isArray(this.requiredDocs) && this.requiredDocs.every((item) => typeof item === "string")) {
    this.requiredDocs = this.requiredDocs
      .map((item, index) => ({
        name: normalizeText(item),
        description: "",
        isMandatory: true,
        allowedFileTypes: [],
        maxFiles: 1,
        sortOrder: index,
      }))
      .filter((item) => item.name);
  }

  if (Array.isArray(this.process) && this.process.every((item) => typeof item === "string")) {
    this.process = this.process
      .map((item, index) => ({ title: normalizeText(item), description: "", sortOrder: index }))
      .filter((item) => item.title || item.description);
  }

  if (Array.isArray(this.timeline) && this.timeline.every((item) => typeof item === "string")) {
    this.timeline = this.timeline
      .map((item, index) => ({ label: normalizeText(item), description: "", sortOrder: index }))
      .filter((item) => item.label || item.description);
  }

  this.eligibility = normalizeStringArray(this.eligibility);
  this.metaKeywords = normalizeStringArray(this.metaKeywords).map((item) => item.toLowerCase());

  this.serviceHighlights = (Array.isArray(this.serviceHighlights) ? this.serviceHighlights : [])
    .map((item, index) => ({
      title: normalizeText(item?.title),
      description: normalizeText(item?.description),
      iconKey: normalizeText(item?.iconKey),
      sortOrder: Number(item?.sortOrder) || index,
    }))
    .filter((item) => item.title || item.description);

  this.requiredDocs = (Array.isArray(this.requiredDocs) ? this.requiredDocs : [])
    .map((item, index) => ({
      ...item,
      name: normalizeText(item?.name),
      description: normalizeText(item?.description),
      isMandatory: item?.isMandatory !== false,
      allowedFileTypes: normalizeStringArray(item?.allowedFileTypes).map((fileType) => fileType.toLowerCase()),
      maxFiles: Math.max(1, Number(item?.maxFiles) || 1),
      sortOrder: Number(item?.sortOrder) || index,
    }))
    .filter((item) => item.name);

  this.process = (Array.isArray(this.process) ? this.process : [])
    .map((item, index) => ({
      title: normalizeText(item?.title || item?.label),
      description: normalizeText(item?.description),
      sortOrder: Number(item?.sortOrder) || index,
    }))
    .filter((item) => item.title || item.description);

  this.timeline = (Array.isArray(this.timeline) ? this.timeline : [])
    .map((item, index) => ({
      label: normalizeText(item?.label || item?.title),
      description: normalizeText(item?.description),
      sortOrder: Number(item?.sortOrder) || index,
    }))
    .filter((item) => item.label || item.description);

  this.faqs = (Array.isArray(this.faqs) ? this.faqs : [])
    .map((item, index) => ({
      question: normalizeText(item?.question),
      answer: normalizeText(item?.answer),
      sortOrder: Number(item?.sortOrder) || index,
    }))
    .filter((item) => item.question && item.answer);
});

countryVisaTypeSchema.index({ countryId: 1, visaCategoryId: 1 }, { unique: true });
countryVisaTypeSchema.index({ countrySlug: 1, visaTypeSlug: 1 }, { unique: true });
countryVisaTypeSchema.index({ isActive: 1, sortOrder: 1, updatedAt: -1 });

const CountryVisaType = mongoose.model("CountryVisaType", countryVisaTypeSchema);

module.exports = CountryVisaType;
