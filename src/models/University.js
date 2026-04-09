const mongoose = require("mongoose");

const universitySchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: true,
			unique: true,
			trim: true,
			index: true,
		},
		country: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Country",
			required: true,
			index: true,
		},
		city: {
			type: String,
			default: "",
			index: true,
		},
		description: {
			type: String,
			default: "",
		},
		website: {
			type: String,
			default: "",
		},
		ranking: {
			type: Number,
			default: 0,
		},
		isFeatured: {
			type: Boolean,
			default: false,
			index: true,
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

universitySchema.index({ createdAt: -1 });

const University = mongoose.model("University", universitySchema);

module.exports = University;
