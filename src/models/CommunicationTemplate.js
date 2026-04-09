const mongoose = require("mongoose");
const { TEMPLATE_CHANNELS } = require("../utils/visaassist.constants.js");

const communicationTemplateSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, trim: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    channel: { type: String, enum: TEMPLATE_CHANNELS, required: true, index: true },
    subject: { type: String, default: "" },
    body: { type: String, required: true },
    variables: { type: [String], default: [] },
    tags: { type: [String], default: [] },
    isActive: { type: Boolean, default: true, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

communicationTemplateSchema.index({ channel: 1, isActive: 1 });

const CommunicationTemplate = mongoose.model("CommunicationTemplate", communicationTemplateSchema);

module.exports = CommunicationTemplate;
