const mongoose = require("mongoose");

const assessmentSchema = new mongoose.Schema(
	{
		user: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			index: true,
		},
		type: {
			type: String,
			enum: ["eligibility"],
			default: "eligibility",
		},
		input: {
			type: mongoose.Schema.Types.Mixed,
			required: true,
		},
		score: {
			type: Number,
			required: true,
			min: 0,
			max: 100,
		},
		recommendation: {
			type: String,
			required: true,
		},
		breakdown: {
			type: mongoose.Schema.Types.Mixed,
			default: {},
		},
	},
	{
		timestamps: true,
	}
);

assessmentSchema.index({ createdAt: -1 });

const Assessment = mongoose.model("Assessment", assessmentSchema);

module.exports = Assessment;
