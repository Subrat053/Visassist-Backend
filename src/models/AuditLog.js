// backend/src/models/AuditLog.js
const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
    },
    action: {
      type: String,
      enum: ["create", "read", "update", "delete", "login", "logout"],
      required: true,
    },
    resource: {
      type: String,
      required: true,
      enum: [
        "User",
        "Consultation",
        "Country",
        "Visa",
        "Job",
        "Course",
        "University",
        "BlogPost",
        "Admin",
        "Payment",
      ],
    },
    resourceId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    changes: {
      type: Map,
      of: new mongoose.Schema({
        from: mongoose.Schema.Types.Mixed,
        to: mongoose.Schema.Types.Mixed,
      }),
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
    status: {
      type: String,
      enum: ["success", "failure"],
      default: "success",
    },
    errorMessage: {
      type: String,
    },
    details: {
      type: String,
    },
  },
  { timestamps: true }
);

// Index for faster queries
auditLogSchema.index({ adminId: 1, createdAt: -1 });
auditLogSchema.index({ resource: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });

module.exports = mongoose.model("AuditLog", auditLogSchema);
