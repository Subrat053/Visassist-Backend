const mongoose = require("mongoose");

const weeklyLogSchema = new mongoose.Schema(
  {
    weekStart: { type: Date, required: true },
    summary: { type: String, required: true, trim: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const countryProcessUpdateSchema = new mongoose.Schema(
  {
    destinationCountry: { type: String, required: true, trim: true, index: true },
    title: { type: String, required: true, trim: true },
    advisory: { type: String, required: true },
    effectiveDate: { type: Date, required: true, index: true },
    version: { type: Number, required: true, min: 1 },
    isActiveVersion: { type: Boolean, default: true, index: true },
    internalNotes: { type: String, default: "" },
    weeklyUpdateLog: { type: [weeklyLogSchema], default: [] },
  },
  { timestamps: true }
);

countryProcessUpdateSchema.index({ destinationCountry: 1, version: -1 }, { unique: true });

const CountryProcessUpdate = mongoose.model("CountryProcessUpdate", countryProcessUpdateSchema);

module.exports = CountryProcessUpdate;
