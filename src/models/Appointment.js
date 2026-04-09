const mongoose = require("mongoose");
const { APPOINTMENT_BOOKING_STATUSES, APPOINTMENT_TYPES } = require("../utils/visaassist.constants.js");

const rescheduleSchema = new mongoose.Schema(
  {
    fromDate: { type: Date },
    toDate: { type: Date },
    reason: { type: String, default: "" },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    changedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const appointmentSchema = new mongoose.Schema(
  {
    caseId: { type: mongoose.Schema.Types.ObjectId, ref: "Case", required: true, index: true },
    applicantId: { type: mongoose.Schema.Types.ObjectId, ref: "Applicant", required: true, index: true },
    appointmentType: { type: String, enum: APPOINTMENT_TYPES, required: true, index: true },
    appointmentDate: { type: Date, required: true, index: true },
    appointmentTime: { type: String, default: "" },
    center: { type: String, required: true, trim: true },
    reference: { type: String, default: "" },
    bookingStatus: { type: String, enum: APPOINTMENT_BOOKING_STATUSES, default: "pending", index: true },
    remarks: { type: String, default: "" },
    rescheduleHistory: { type: [rescheduleSchema], default: [] },
  },
  { timestamps: true }
);

appointmentSchema.index({ appointmentDate: 1, bookingStatus: 1 });

const Appointment = mongoose.model("Appointment", appointmentSchema);

module.exports = Appointment;
