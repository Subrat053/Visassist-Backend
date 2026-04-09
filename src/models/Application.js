const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
      index: true,
    },
    coverLetter: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["pending", "in-progress", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    notes: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

applicationSchema.index({ createdAt: -1 });
applicationSchema.index({ user: 1, createdAt: -1 });

const Application = mongoose.model("Application", applicationSchema);

module.exports = Application;
