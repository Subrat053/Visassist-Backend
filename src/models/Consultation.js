const mongoose = require("mongoose");

const consultationSchema = new mongoose.Schema(
	{
		user: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			index: true,
		},
		type: {
			type: String,
			enum: ["migrate", "work", "study"],
			required: true,
			index: true,
		},
		fullName: {
			type: String,
			required: true,
			trim: true,
		},
		email: {
			type: String,
			required: true,
			lowercase: true,
			trim: true,
		},
		phone: {
			type: String,
			trim: true,
			default: "",
		},
		countryOfInterest: {
			type: String,
			required: true,
			index: true,
		},
		message: {
			type: String,
			default: "",
		},
		details: {
			type: mongoose.Schema.Types.Mixed,
			default: {},
		},
		status: {
			type: String,
			enum: ["pending", "in-progress", "approved", "rejected"],
			default: "pending",
			index: true,
		},
		assignedAdviser: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
		},
	},
	{
		timestamps: true,
	}
);

consultationSchema.index({ createdAt: -1 });

const Consultation = mongoose.model("Consultation", consultationSchema);

module.exports = Consultation;
