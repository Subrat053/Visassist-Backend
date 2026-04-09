const mongoose = require("mongoose");

const jobApplicationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true },
    resumeUrl: String,
    resumePublicId: String,
    coverLetter: String,
    experience: Number,
    status: { type: String, default: "applied" },
    appliedDate: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("JobApplication", jobApplicationSchema);