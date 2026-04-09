const mongoose = require("mongoose");

const successStorySchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    country: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Country",
      required: true,
      index: true,
    },
    visaType: {
      type: String,
      enum: ["work", "study", "permanent", "business", "other"],
      default: "other",
      index: true,
    },
    story: {
      type: String,
      required: true,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: 5,
    },
    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },
    isPublished: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

successStorySchema.index({ createdAt: -1 });

const SuccessStory = mongoose.model("SuccessStory", successStorySchema);

module.exports = SuccessStory;
