const mongoose = require("mongoose");

const refreshTokenSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    tokenHash: {
      type: String,
      required: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    revokedAt: Date,
    ipAddress: String,
    userAgent: String,
  },
  {
    timestamps: true,
  }
);

refreshTokenSchema.index({ user: 1, createdAt: -1 });

const RefreshToken = mongoose.model("RefreshToken", refreshTokenSchema);

module.exports = RefreshToken;
