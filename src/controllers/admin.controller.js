const BlogPost = require("../models/BlogPost.js");
const Consultation = require("../models/Consultation.js");
const Country = require("../models/Country.js");
const Job = require("../models/Job.js");
const User = require("../models/User.js");
const asyncHandler = require("../utils/asyncHandler.js");
const ApiError = require("../utils/ApiError.js");
const { sendSuccess } = require("../utils/ApiResponse.js");
const { getPagination, getPaginationMeta } = require("../utils/pagination.js");

const toSlug = (value) =>
  String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

const getAdminStats = asyncHandler(async (_req, res) => {
  const [users, consultations, jobs, countries, posts] = await Promise.all([
    User.countDocuments({}),
    Consultation.countDocuments({}),
    Job.countDocuments({}),
    Country.countDocuments({}),
    BlogPost.countDocuments({}),
  ]);

  return sendSuccess(res, 200, {
    users,
    consultations,
    jobs,
    countries,
    blogPosts: posts,
  });
});

const listUsers = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const { search, role, sortBy, sortOrder } = req.query;

  const allowedSortFields = new Set([
    "createdAt",
    "firstName",
    "lastName",
    "email",
    "role",
    "isActive",
  ]);
  const sortField = allowedSortFields.has(sortBy) ? sortBy : "createdAt";
  const sortDirection = sortOrder === "asc" ? 1 : -1;

  const filter = {};
  if (role) {
    filter.role = role;
  }
  if (search) {
    filter.$or = [
      { firstName: { $regex: search, $options: "i" } },
      { lastName: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  }

  const [items, total] = await Promise.all([
    User.find(filter)
      .select("-password")
      .sort({ [sortField]: sortDirection })
      .skip(skip)
      .limit(limit),
    User.countDocuments(filter),
  ]);

  return sendSuccess(res, 200, {
    items,
    pagination: getPaginationMeta(page, limit, total),
  });
});

const updateUser = asyncHandler(async (req, res) => {
  const existingUser = await User.findById(req.params.userId).select("-password");

  if (!existingUser) {
    throw new ApiError(404, "USER_NOT_FOUND", "User not found");
  }

  if (existingUser.role === "super_admin" && req.user.role !== "super_admin") {
    throw new ApiError(403, "FORBIDDEN", "Only super admin can manage super admin accounts");
  }

  if (req.body.role === "super_admin" && req.user.role !== "super_admin") {
    throw new ApiError(403, "FORBIDDEN", "Only super admin can assign super admin role");
  }

  const updates = {};

  if (typeof req.body.role !== "undefined") {
    updates.role = req.body.role;
  }
  if (typeof req.body.isActive !== "undefined") {
    updates.isActive = req.body.isActive;
  }

  const user = await User.findByIdAndUpdate(req.params.userId, updates, {
    new: true,
    runValidators: true,
  }).select("-password");

  if (!user) {
    throw new ApiError(404, "USER_NOT_FOUND", "User not found");
  }

  return sendSuccess(res, 200, user);
});

const deleteUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (String(req.user._id) === String(userId)) {
    throw new ApiError(400, "INVALID_OPERATION", "You cannot delete your own account");
  }

  const existingUser = await User.findById(userId).select("-password");

  if (!existingUser) {
    throw new ApiError(404, "USER_NOT_FOUND", "User not found");
  }

  if (existingUser.role === "super_admin" && req.user.role !== "super_admin") {
    throw new ApiError(403, "FORBIDDEN", "Only super admin can delete super admin accounts");
  }

  await User.findByIdAndDelete(userId);

  return sendSuccess(res, 200, {
    deleted: true,
    userId,
  });
});

const listConsultations = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const { type, status, search } = req.query;

  const filter = {};

  if (type) {
    filter.type = type;
  }
  if (status) {
    filter.status = status;
  }
  if (search) {
    filter.$or = [
      { fullName: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { countryOfInterest: { $regex: search, $options: "i" } },
    ];
  }

  const [items, total] = await Promise.all([
    Consultation.find(filter)
      .populate("user", "firstName lastName email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Consultation.countDocuments(filter),
  ]);

  return sendSuccess(res, 200, {
    items,
    pagination: getPaginationMeta(page, limit, total),
  });
});

const updateConsultationStatus = asyncHandler(async (req, res) => {
  const consultation = await Consultation.findByIdAndUpdate(
    req.params.consultationId,
    {
      status: req.body.status,
      assignedAdviser: req.body.assignedAdviser,
    },
    { new: true, runValidators: true }
  ).populate("user", "firstName lastName email");

  if (!consultation) {
    throw new ApiError(404, "CONSULTATION_NOT_FOUND", "Consultation not found");
  }

  return sendSuccess(res, 200, consultation);
});

const listCountriesAdmin = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const { search } = req.query;

  const filter = {};
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { code: { $regex: search, $options: "i" } },
      { region: { $regex: search, $options: "i" } },
    ];
  }

  const [items, total] = await Promise.all([
    Country.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Country.countDocuments(filter),
  ]);

  return sendSuccess(res, 200, {
    items,
    pagination: getPaginationMeta(page, limit, total),
  });
});

const createCountry = asyncHandler(async (req, res) => {
  const payload = {
    name: req.body.name,
    slug: req.body.slug || toSlug(req.body.name),
    code: String(req.body.code || "").toUpperCase(),
    region: req.body.region || "",
    description: req.body.description || "",
    imageUrl: req.body.imageUrl || "",
    isFeatured: Boolean(req.body.isFeatured),
    ranking: Number(req.body.ranking) || 0,
  };

  const country = await Country.create(payload);
  return sendSuccess(res, 201, country);
});

const updateCountry = asyncHandler(async (req, res) => {
  const payload = {
    ...req.body,
  };

  if (typeof payload.name !== "undefined" && typeof payload.slug === "undefined") {
    payload.slug = toSlug(payload.name);
  }
  if (typeof payload.code !== "undefined") {
    payload.code = String(payload.code).toUpperCase();
  }

  const country = await Country.findByIdAndUpdate(req.params.countryId, payload, {
    new: true,
    runValidators: true,
  });

  if (!country) {
    throw new ApiError(404, "COUNTRY_NOT_FOUND", "Country not found");
  }

  return sendSuccess(res, 200, country);
});

const deleteCountry = asyncHandler(async (req, res) => {
  const country = await Country.findByIdAndDelete(req.params.countryId);
  if (!country) {
    throw new ApiError(404, "COUNTRY_NOT_FOUND", "Country not found");
  }

  return sendSuccess(res, 200, { deleted: true });
});

const listJobsAdmin = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const { search, country } = req.query;

  const filter = {};
  if (country) {
    filter.country = country;
  }
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: "i" } },
      { company: { $regex: search, $options: "i" } },
      { location: { $regex: search, $options: "i" } },
    ];
  }

  const [items, total] = await Promise.all([
    Job.find(filter)
      .populate("country", "name code")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Job.countDocuments(filter),
  ]);

  return sendSuccess(res, 200, {
    items,
    pagination: getPaginationMeta(page, limit, total),
  });
});

const createJob = asyncHandler(async (req, res) => {
  const payload = {
    title: req.body.title,
    company: req.body.company,
    country: req.body.country,
    location: req.body.location || "",
    employmentType: req.body.employmentType || "full-time",
    experienceLevel: req.body.experienceLevel || "entry",
    salaryMin: Number(req.body.salaryMin) || 0,
    salaryMax: Number(req.body.salaryMax) || 0,
    currency: req.body.currency || "USD",
    description: req.body.description,
    requirements: Array.isArray(req.body.requirements) ? req.body.requirements : [],
    isActive: typeof req.body.isActive === "boolean" ? req.body.isActive : true,
    isFeatured: Boolean(req.body.isFeatured),
  };

  const job = await Job.create(payload);
  return sendSuccess(res, 201, job);
});

const updateJob = asyncHandler(async (req, res) => {
  const payload = {
    ...req.body,
  };

  if (typeof payload.salaryMin !== "undefined") {
    payload.salaryMin = Number(payload.salaryMin) || 0;
  }
  if (typeof payload.salaryMax !== "undefined") {
    payload.salaryMax = Number(payload.salaryMax) || 0;
  }

  const job = await Job.findByIdAndUpdate(req.params.jobId, payload, {
    new: true,
    runValidators: true,
  }).populate("country", "name code");

  if (!job) {
    throw new ApiError(404, "JOB_NOT_FOUND", "Job not found");
  }

  return sendSuccess(res, 200, job);
});

const deleteJob = asyncHandler(async (req, res) => {
  const job = await Job.findByIdAndDelete(req.params.jobId);
  if (!job) {
    throw new ApiError(404, "JOB_NOT_FOUND", "Job not found");
  }

  return sendSuccess(res, 200, { deleted: true });
});

const listBlogPostsAdmin = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const { search, category } = req.query;

  const filter = {};
  if (category) {
    filter.category = category;
  }
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: "i" } },
      { summary: { $regex: search, $options: "i" } },
    ];
  }

  const [items, total] = await Promise.all([
    BlogPost.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    BlogPost.countDocuments(filter),
  ]);

  return sendSuccess(res, 200, {
    items,
    pagination: getPaginationMeta(page, limit, total),
  });
});

const createBlogPost = asyncHandler(async (req, res) => {
  const payload = {
    title: req.body.title,
    slug: req.body.slug || toSlug(req.body.title),
    summary: req.body.summary || "",
    content: req.body.content,
    category: req.body.category || "general",
    tags: Array.isArray(req.body.tags) ? req.body.tags : [],
    coverImageUrl: req.body.coverImageUrl || "",
    isPublished: typeof req.body.isPublished === "boolean" ? req.body.isPublished : true,
    publishedAt: req.body.publishedAt || new Date(),
  };

  const post = await BlogPost.create(payload);
  return sendSuccess(res, 201, post);
});

const updateBlogPost = asyncHandler(async (req, res) => {
  const payload = {
    ...req.body,
  };

  if (typeof payload.title !== "undefined" && typeof payload.slug === "undefined") {
    payload.slug = toSlug(payload.title);
  }

  const post = await BlogPost.findByIdAndUpdate(req.params.postId, payload, {
    new: true,
    runValidators: true,
  });

  if (!post) {
    throw new ApiError(404, "POST_NOT_FOUND", "Blog post not found");
  }

  return sendSuccess(res, 200, post);
});

const deleteBlogPost = asyncHandler(async (req, res) => {
  const post = await BlogPost.findByIdAndDelete(req.params.postId);
  if (!post) {
    throw new ApiError(404, "POST_NOT_FOUND", "Blog post not found");
  }

  return sendSuccess(res, 200, { deleted: true });
});

module.exports = {
  getAdminStats,
  listUsers,
  updateUser,
  deleteUser,
  listConsultations,
  updateConsultationStatus,
  listCountriesAdmin,
  createCountry,
  updateCountry,
  deleteCountry,
  listJobsAdmin,
  createJob,
  updateJob,
  deleteJob,
  listBlogPostsAdmin,
  createBlogPost,
  updateBlogPost,
  deleteBlogPost,
};
