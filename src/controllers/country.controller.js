const Country = require("../models/Country.js");
const Visa = require("../models/Visa.js");
const asyncHandler = require("../utils/asyncHandler.js");
const ApiError = require("../utils/ApiError.js");
const { sendSuccess } = require("../utils/ApiResponse.js");
const { getPagination, getPaginationMeta } = require("../utils/pagination.js");

const listCountries = asyncHandler(async (req, res) => {
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
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { code: { $regex: search, $options: "i" } },
    ];
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

const getCountryById = asyncHandler(async (req, res) => {
  const country = await Country.findById(req.params.countryId);
  if (!country) {
    throw new ApiError(404, "COUNTRY_NOT_FOUND", "Country not found");
  }
  return sendSuccess(res, 200, country);
});

const getCountryVisas = asyncHandler(async (req, res) => {
  const country = await Country.findById(req.params.countryId).select("_id");
  if (!country) {
    throw new ApiError(404, "COUNTRY_NOT_FOUND", "Country not found");
  }

  const { page, limit, skip } = getPagination(req.query);
  const filter = {
    country: country._id,
  };

  if (req.query.visaType) {
    filter.visaType = req.query.visaType;
  }
  if (req.query.active === "true") {
    filter.isActive = true;
  }

  const [items, total] = await Promise.all([
    Visa.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Visa.countDocuments(filter),
  ]);

  return sendSuccess(res, 200, {
    items,
    pagination: getPaginationMeta(page, limit, total),
  });
});

module.exports = { listCountries, getCountryById, getCountryVisas };
