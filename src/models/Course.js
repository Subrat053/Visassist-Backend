const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: true,
			trim: true,
			index: true,
		},
		slug: {
			type: String,
			required: true,
			unique: true,
			index: true,
		},
		university: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "University",
			required: true,
			index: true,
		},
		country: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Country",
			required: true,
			index: true,
		},
		level: {
			type: String,
			enum: ["bachelor", "master", "phd", "diploma", "certificate"],
			required: true,
			index: true,
		},
		durationMonths: {
			type: Number,
			default: 12,
		},
		tuitionFee: {
			type: Number,
			default: 0,
		},
		currency: {
			type: String,
			default: "USD",
		},
		intake: {
			type: [String],
			default: [],
		},
		description: {
			type: String,
			default: "",
		},
		isActive: {
			type: Boolean,
			default: true,
			index: true,
		},
		isFeatured: {
			type: Boolean,
			default: false,
			index: true,
		},
	},
	{
		timestamps: true,
	}
);

courseSchema.index({ name: "text", description: "text" });
courseSchema.index({ createdAt: -1 });

const Course = mongoose.model("Course", courseSchema);

module.exports = Course;
