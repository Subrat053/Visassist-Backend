const mongoose = require("mongoose");

const contactMessageSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    phone: {
      type: String,
      default: "",
    },
    subject: {
      type: String,
      default: "",
    },
    message: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["new", "in-progress", "resolved"],
      default: "new",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

contactMessageSchema.index({ createdAt: -1 });

const ContactMessage = mongoose.model("ContactMessage", contactMessageSchema);

module.exports = ContactMessage;
