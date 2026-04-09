const Country = require("../models/Country.js");
const Course = require("../models/Course.js");
const University = require("../models/University.js");
const asyncHandler = require("../utils/asyncHandler.js");
const ApiError = require("../utils/ApiError.js");
const { sendSuccess } = require("../utils/ApiResponse.js");
const { getPagination, getPaginationMeta } = require("../utils/pagination.js");

const getStudyDestinations = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const { region, featured, search } = req.query;

  const filter = {};
  if (region) {
    filter.region = region;
  }
  if (featured === "true") {
    filter.isFeatured = true;
  }
  if (search) {
    filter.name = { $regex: search, $options: "i" };
  }

  const [items, total] = await Promise.all([
    Country.find(filter).sort({ ranking: -1, name: 1 }).skip(skip).limit(limit),
    Country.countDocuments(filter),
  ]);

  return sendSuccess(res, 200, {
    items,
    pagination: getPaginationMeta(page, limit, total),
  });
});

const getStudyCourses = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const { country, level, university, featured, search } = req.query;

  const filter = {
    isActive: true,
  };
  if (country) {
    filter.country = country;
  }
  if (level) {
    filter.level = level;
  }
  if (university) {
    filter.university = university;
  }
  if (featured === "true") {
    filter.isFeatured = true;
  }
  if (search) {
    filter.$text = { $search: search };
  }

  const [items, total] = await Promise.all([
    Course.find(filter)
      .populate("country", "name code")
      .populate("university", "name city")
      .sort({ isFeatured: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Course.countDocuments(filter),
  ]);

  return sendSuccess(res, 200, {
    items,
    pagination: getPaginationMeta(page, limit, total),
  });
});

const getUniversityById = asyncHandler(async (req, res) => {
  const university = await University.findById(req.params.universityId).populate("country", "name code");

  if (!university || !university.isActive) {
    throw new ApiError(404, "UNIVERSITY_NOT_FOUND", "University not found");
  }

  const courses = await Course.find({ university: university._id, isActive: true })
    .select("name level durationMonths tuitionFee currency")
    .sort({ isFeatured: -1, name: 1 });

  return sendSuccess(res, 200, {
    university,
    courses,
  });
});

module.exports = { getStudyDestinations, getStudyCourses, getUniversityById };
