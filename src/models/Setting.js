const mongoose = require("mongoose");

const settingSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, trim: true, unique: true, index: true },
    value: { type: mongoose.Schema.Types.Mixed, default: null },
    group: { type: String, trim: true, default: "general", index: true },
  },
  { timestamps: true }
);

settingSchema.index({ group: 1, key: 1 });

const Setting = mongoose.model("Setting", settingSchema);

module.exports = Setting;
