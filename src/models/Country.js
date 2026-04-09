const mongoose = require("mongoose");

const countrySchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: true,
			unique: true,
			trim: true,
			index: true,
		},
		slug: {
			type: String,
			required: true,
			unique: true,
			index: true,
		},
		code: {
			type: String,
			required: true,
			uppercase: true,
			trim: true,
			index: true,
		},
		region: {
			type: String,
			default: "",
			index: true,
		},
		description: {
			type: String,
			default: "",
		},
		imageUrl: {
			type: String,
			default: "",
		},
		isFeatured: {
			type: Boolean,
			default: false,
			index: true,
		},
		ranking: {
			type: Number,
			default: 0,
		},
	},
	{
		timestamps: true,
	}
);

countrySchema.index({ createdAt: -1 });

const Country = mongoose.model("Country", countrySchema);

module.exports = Country;
