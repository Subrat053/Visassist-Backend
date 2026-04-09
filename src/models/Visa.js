const mongoose = require("mongoose");

const visaSchema = new mongoose.Schema(
	{
		country: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Country",
			required: true,
			index: true,
		},
		name: {
			type: String,
			required: true,
			trim: true,
			index: true,
		},
		visaType: {
			type: String,
			enum: ["tourist", "work", "study", "permanent", "business"],
			required: true,
			index: true,
		},
		processingTimeDays: {
			type: Number,
			default: 0,
		},
		fee: {
			type: Number,
			default: 0,
		},
		currency: {
			type: String,
			default: "USD",
		},
		requirements: {
			type: [String],
			default: [],
		},
		isActive: {
			type: Boolean,
			default: true,
			index: true,
		},
	},
	{
		timestamps: true,
	}
);

visaSchema.index({ country: 1, visaType: 1 });

const Visa = mongoose.model("Visa", visaSchema);

module.exports = Visa;
