const mongoose = require("mongoose");

const TICKET_CATEGORIES = [
  "document_issue",
  "status_query",
  "payment_issue",
  "profile_issue",
  "application_update_request",
  "general_support",
];

const TICKET_STATUSES = ["open", "in_progress", "resolved", "closed"];
const TICKET_PRIORITIES = ["low", "medium", "high"];

const attachmentSchema = new mongoose.Schema(
  {
    fileUrl: { type: String, trim: true, default: "" },
    publicId: { type: String, trim: true, default: "" },
    originalName: { type: String, trim: true, default: "" },
    mimeType: { type: String, trim: true, default: "" },
    size: { type: Number, default: 0 },
  },
  { _id: false }
);

const replySchema = new mongoose.Schema(
  {
    senderType: {
      type: String,
      enum: ["user", "admin"],
      required: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    message: {
      type: String,
      trim: true,
      required: true,
    },
    attachments: {
      type: [attachmentSchema],
      default: [],
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const supportTicketSchema = new mongoose.Schema(
  {
    ticketNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    applicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "VisaApplication",
      default: null,
      index: true,
    },
    category: {
      type: String,
      enum: TICKET_CATEGORIES,
      default: "general_support",
      index: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    attachments: {
      type: [attachmentSchema],
      default: [],
    },
    status: {
      type: String,
      enum: TICKET_STATUSES,
      default: "open",
      index: true,
    },
    priority: {
      type: String,
      enum: TICKET_PRIORITIES,
      default: "medium",
      index: true,
    },
    replies: {
      type: [replySchema],
      default: [],
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

supportTicketSchema.index({ createdAt: -1 });
supportTicketSchema.index({ userId: 1, createdAt: -1 });
supportTicketSchema.index({ status: 1, priority: 1, updatedAt: -1 });

const SupportTicket = mongoose.model("SupportTicket", supportTicketSchema);

module.exports = {
  SupportTicket,
  TICKET_CATEGORIES,
  TICKET_STATUSES,
  TICKET_PRIORITIES,
};
