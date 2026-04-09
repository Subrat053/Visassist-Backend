const BlogPost = require("../models/BlogPost.js");
const SuccessStory = require("../models/SuccessStory.js");
const asyncHandler = require("../utils/asyncHandler.js");
const ApiError = require("../utils/ApiError.js");
const { sendSuccess } = require("../utils/ApiResponse.js");
const { getPagination, getPaginationMeta } = require("../utils/pagination.js");

const listBlogPosts = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const { category, tag, search } = req.query;

  const filter = {
    isPublished: true,
  };

  if (category) {
    filter.category = category;
  }
  if (tag) {
    filter.tags = tag;
  }
  if (search) {
    filter.$text = { $search: search };
  }

  const [items, total] = await Promise.all([
    BlogPost.find(filter)
      .sort({ publishedAt: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit),
    BlogPost.countDocuments(filter),
  ]);

  return sendSuccess(res, 200, {
    items,
    pagination: getPaginationMeta(page, limit, total),
  });
});

const getBlogPostById = asyncHandler(async (req, res) => {
  const post = await BlogPost.findOne({ _id: req.params.postId, isPublished: true });

  if (!post) {
    throw new ApiError(404, "POST_NOT_FOUND", "Blog post not found");
  }

  return sendSuccess(res, 200, post);
});

const listSuccessStories = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const { country, visaType, featured } = req.query;

  const filter = {
    isPublished: true,
  };

  if (country) {
    filter.country = country;
  }
  if (visaType) {
    filter.visaType = visaType;
  }
  if (featured === "true") {
    filter.isFeatured = true;
  }

  const [items, total] = await Promise.all([
    SuccessStory.find(filter)
      .populate("country", "name code")
      .sort({ isFeatured: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit),
    SuccessStory.countDocuments(filter),
  ]);

  return sendSuccess(res, 200, {
    items,
    pagination: getPaginationMeta(page, limit, total),
  });
});

module.exports = { listBlogPosts, getBlogPostById, listSuccessStories };
