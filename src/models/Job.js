const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    company: {
      type: String,
      required: true,
      trim: true,
    },
    country: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Country",
      required: true,
      index: true,
    },
    location: {
      type: String,
      default: "",
    },
    employmentType: {
      type: String,
      enum: ["full-time", "part-time", "contract", "internship"],
      default: "full-time",
      index: true,
    },
    experienceLevel: {
      type: String,
      enum: ["entry", "mid", "senior"],
      default: "entry",
      index: true,
    },
    salaryMin: {
      type: Number,
      default: 0,
    },
    salaryMax: {
      type: Number,
      default: 0,
    },
    currency: {
      type: String,
      default: "USD",
    },
    description: {
      type: String,
      required: true,
    },
    requirements: {
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
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

jobSchema.index({ title: "text", company: "text", description: "text" });
jobSchema.index({ createdAt: -1 });

const Job = mongoose.model("Job", jobSchema);

module.exports = Job;
