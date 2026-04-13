const mongoose = require("mongoose");

const slugify = (value) =>
	String(value || "")
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9\s-]/g, "")
		.replace(/\s+/g, "-")
		.replace(/-+/g, "-")
		.replace(/^-+|-+$/g, "");

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
			lowercase: true,
			trim: true,
			index: true,
		},
		code: {
			type: String,
			default: "",
			uppercase: true,
			trim: true,
			index: true,
		},
		flagImage: {
			type: String,
			default: "",
		},
		heroImage: {
			type: String,
			default: "",
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
		isActive: {
			type: Boolean,
			default: true,
			index: true,
		},
		ranking: {
			type: Number,
			default: 0,
		},
		sortOrder: {
			type: Number,
			default: 0,
			index: true,
		},
		createdBy: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			default: null,
		},
		updatedBy: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			default: null,
		},
	},
	{
		timestamps: true,
	}
);

countrySchema.pre("validate", function normalizeCountry() {
	if (!this.slug && this.name) {
		this.slug = slugify(this.name);
	}

	if (this.slug) {
		this.slug = slugify(this.slug);
	}

	if (!this.imageUrl && this.heroImage) {
		this.imageUrl = this.heroImage;
	}

	if (!this.heroImage && this.imageUrl) {
		this.heroImage = this.imageUrl;
	}

	if (typeof this.ranking === "number" && (this.sortOrder === undefined || this.sortOrder === null)) {
		this.sortOrder = this.ranking;
	}

	if (typeof this.sortOrder === "number" && (this.ranking === undefined || this.ranking === null)) {
		this.ranking = this.sortOrder;
	}
});

countrySchema.index({ createdAt: -1 });
countrySchema.index({ isActive: 1, sortOrder: 1, name: 1 });

const Country = mongoose.model("Country", countrySchema);

module.exports = Country;
