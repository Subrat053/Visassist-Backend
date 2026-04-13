const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
	{
		firstName: {
			type: String,
			required: true,
			trim: true,
			minlength: 2,
			maxlength: 50,
		},
		lastName: {
			type: String,
			required: true,
			trim: true,
			minlength: 2,
			maxlength: 50,
		},
		email: {
			type: String,
			required: true,
			trim: true,
			lowercase: true,
			unique: true,
			index: true,
		},
		phone: {
			type: String,
			trim: true,
			default: "",
		},
		password: {
			type: String,
			required: true,
			minlength: 8,
			select: false,
		},
		role: {
			type: String,
			enum: [
				"customer",
				"user",
				"admin",
				"adviser",
				"support",
				"super_admin",
				"documentation_executive",
				"support_executive",
				"destination_specialist",
			],
			default: "customer",
			index: true,
		},
		fullName: {
			type: String,
			trim: true,
		},
		avatarUrl: {
			type: String,
			default: "",
		},
		country: {
			type: String,
			default: "",
		},
		profile: {
			dateOfBirth: Date,
			educationLevel: String,
			yearsOfExperience: Number,
			currentCountry: String,
			targetCountry: String,
		},
		isEmailVerified: {
			type: Boolean,
			default: false,
		},
		passwordResetTokenHash: {
			type: String,
			default: "",
		},
		refreshTokenHash: {
			type: String,
			default: "",
		},
		passwordResetExpiresAt: Date,
		isActive: {
			type: Boolean,
			default: true,
		},
		isDeleted: {
			type: Boolean,
			default: false,
			index: true,
		},
		deletedAt: {
			type: Date,
			default: null,
		},
		lastLoginAt: Date,
	},
	{
		timestamps: true,
	}
);

userSchema.index({ createdAt: -1 });

userSchema.pre("save", async function hashPassword() {
	if (this.isModified("firstName") || this.isModified("lastName") || !this.fullName) {
		this.fullName = `${this.firstName || ""} ${this.lastName || ""}`.trim();
	}

	if (!this.isModified("password")) {
		return;
	}
	this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = function comparePassword(plainPassword) {
	return bcrypt.compare(plainPassword, this.password);
};

const User = mongoose.model("User", userSchema);

module.exports = User;
