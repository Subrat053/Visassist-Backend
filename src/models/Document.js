const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema(
  {
    application: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Application",
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    documentType: {
      type: String,
      enum: ["passport", "resume", "education", "experience", "language", "other"],
      default: "other",
      index: true,
    },
    originalName: {
      type: String,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      required: true,
    },
    fileUrl: {
      type: String,
      required: true,
    },
    publicId: {
      type: String,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["pending", "verified", "rejected"],
      default: "pending",
      index: true,
    },
    remarks: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

documentSchema.index({ createdAt: -1 });

const Document = mongoose.model("Document", documentSchema);

module.exports = Document;
