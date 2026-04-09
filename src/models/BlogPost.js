const mongoose = require("mongoose");

const blogPostSchema = new mongoose.Schema(
  {
    title: {
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
    summary: {
      type: String,
      default: "",
    },
    content: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      default: "general",
      index: true,
    },
    tags: {
      type: [String],
      default: [],
      index: true,
    },
    coverImageUrl: {
      type: String,
      default: "",
    },
    isPublished: {
      type: Boolean,
      default: true,
      index: true,
    },
    publishedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

blogPostSchema.index({ title: "text", content: "text", summary: "text" });

const BlogPost = mongoose.model("BlogPost", blogPostSchema);

module.exports = BlogPost;
